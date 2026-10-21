<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {apis} from "@/assets/sripts";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";
import AffixContainerView from "@/components/AffixContainerView.vue";
import type {BotCommandInfo, BotGroupDetail, BotGroupItem, BotGroupSettings} from "@/assets/types/Bot";

const {t} = useI18n(),
    notice = useNoticeStore(),
    loading = ref(false),
    groups = ref<BotGroupItem[]>([]),
    dialog = ref(false),
    dialogTab = ref('base'),
    detailLoading = ref(false),
    refreshing = ref(false),
    pushingType = ref(''),
    saving = ref(false),
    detail = ref<BotGroupDetail | null>(null),
    activeGroup = ref<BotGroupItem | null>(null),
    pushCooldown = ref(0),
    commands = ref<BotCommandInfo[]>([]),
    commandsLoading = ref(false),
    commandInput = ref(''),
    commandSending = ref(false),
    commandResult = ref(''),
    form = ref<BotGroupSettings>({
      pushEnabled: false,
      welcome: {enabled: false, content: ''},
      dailyReport: {enabled: false, times: ['09:00']},
      teamup: {enabled: true, intervalMinutes: 10},
      drop: {enabled: false}
    })

// 主动推送冷却倒计时定时器
let cooldownTimer: ReturnType<typeof setInterval> | null = null

defineOptions({
  name: 'AccountBotManage'
})

const groupName = computed(() => activeGroup.value?.groupName || activeGroup.value?.groupNumber || activeGroup.value?.groupOpenid || '')

/**
 * 群主展示文案，优先名称，其次 OpenID
 */
const ownerText = computed(() => {
  const owner = detail.value?.info?.owner
  if (!owner) return '-'
  if (owner.username && owner.openid) return `${owner.username} (${owner.openid})`
  return owner.username || owner.openid || '-'
})

/**
 * 启动或刷新推送冷却倒计时
 * @param seconds 剩余秒数
 */
const onStartCooldown = (seconds: number) => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
  pushCooldown.value = Math.max(0, Number(seconds) || 0)
  if (pushCooldown.value <= 0) return
  cooldownTimer = setInterval(() => {
    pushCooldown.value = Math.max(0, pushCooldown.value - 1)
    if (pushCooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

/**
 * 载入用户绑定的群列表
 */
const onLoad = async () => {
  loading.value = true
  try {
    const result = await apis.botApi().getGroups()
    groups.value = result.data?.data || []
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    loading.value = false
  }
}

/**
 * 打开设置面板并载入群详情
 * @param group 群记录
 */
const onOpenSettings = async (group: BotGroupItem) => {
  activeGroup.value = group
  form.value = JSON.parse(JSON.stringify(group.settings))
  form.value.pushEnabled = group.pushEnabled === 1
  dialogTab.value = 'base'
  commandResult.value = ''
  commandInput.value = '/帮助'
  commands.value = []
  dialog.value = true
  await onLoadDetail()
}

/**
 * 载入当前群的实时详情
 */
const onLoadDetail = async () => {
  if (!activeGroup.value) return
  detailLoading.value = true
  try {
    const result = await apis.botApi().getGroupDetail(activeGroup.value.id)
    detail.value = result.data?.data || null
    if (detail.value?.state?.available) {
      form.value.pushEnabled = Boolean(detail.value.state.pushEnabled)
    }
    onStartCooldown(detail.value?.pushNowCooldown || 0)
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    detailLoading.value = false
  }
}

/**
 * 主动刷新群信息与 bot_state
 */
const onRefresh = async () => {
  if (!activeGroup.value) return
  refreshing.value = true
  try {
    await apis.botApi().refreshGroup(activeGroup.value.id)
    notice.success(t('account.bot.manage.refreshed'))
    await onLoadDetail()
    await onLoad()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    refreshing.value = false
  }
}

/**
 * 立即推送指定内容到本群
 * @param type daily / drop / teamup
 */
const onPushNow = async (type: 'daily' | 'drop' | 'teamup') => {
  if (!activeGroup.value || pushCooldown.value > 0) return
  pushingType.value = type
  try {
    await apis.botApi().pushNow(activeGroup.value.id, type)
    notice.success(t('account.bot.manage.pushNowSuccess'))
    // 推送成功后刷新额度并启动 5 分钟冷却
    await onLoadDetail()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    pushingType.value = ''
  }
}

/**
 * 拉取机器人指令目录
 */
const onLoadCommands = async () => {
  if (!activeGroup.value || commands.value.length > 0) return
  commandsLoading.value = true
  try {
    const result = await apis.botApi().getGroupCommands(activeGroup.value.id)
    commands.value = result.data?.data?.items || []
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    commandsLoading.value = false
  }
}

/**
 * 强制重新拉取指令目录
 */
const onReloadCommands = () => {
  commands.value = []
  onLoadCommands()
}

/**
 * 让机器人在群内执行指令并把结果发到群里
 */
const onSendCommand = async () => {
  if (!activeGroup.value || !commandInput.value.trim() || commandSending.value) return
  commandSending.value = true
  commandResult.value = ''
  try {
    const result = await apis.botApi().executeGroupCommand(activeGroup.value.id, commandInput.value.trim())
    const data = result.data?.data
    if (!data?.matched) {
      commandResult.value = t('account.bot.manage.commands.notFound')
      return
    }
    if (!data.reply) {
      commandResult.value = t('account.bot.manage.commands.helpOnly')
      return
    }
    commandResult.value = data.reply
    notice.success(data.sent ? t('account.bot.manage.commands.sent') : t('account.bot.manage.commands.sendFailed'))
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    commandSending.value = false
  }
}

/**
 * 命令帮助文本写入输入框
 * @param command 指令目录项
 */
const onUseCommand = (command: BotCommandInfo) => {
  commandInput.value = command.usage
}

/**
 * 切换设置标签页
 * @param value 标签标识
 */
const onTabChange = (value: string) => {
  if (value === 'commands') {
    onLoadCommands()
  }
}

/**
 * 保存群配置
 */
const onSave = async () => {
  if (!activeGroup.value) return
  saving.value = true
  try {
    const payload: any = {
      welcome: form.value.welcome,
      dailyReport: {
        enabled: form.value.dailyReport.enabled,
        times: (form.value.dailyReport.times || []).filter(Boolean)
      },
      teamup: {
        enabled: form.value.teamup.enabled,
        intervalMinutes: Number(form.value.teamup.intervalMinutes) || 10
      },
      drop: form.value.drop
    }
    await apis.botApi().updateGroup(activeGroup.value.id, payload)
    notice.success(t('basic.tips.updateSuccess'))
    dialog.value = false
    await onLoad()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    saving.value = false
  }
}

/**
 * 解除群绑定
 * @param group 群记录
 */
const onDelete = async (group: BotGroupItem) => {
  if (!confirm(t('account.bot.manage.deleteConfirm', {name: group.groupName || group.groupNumber}))) return
  try {
    await apis.botApi().deleteGroup(group.id)
    notice.success(t('basic.tips.deleteSuccess'))
    await onLoad()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  }
}

/**
 * 格式化冷却剩余时间
 * @param seconds 剩余秒数
 */
const formatCooldown = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

onMounted(onLoad)

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>

<template>
  <v-row>
    <v-col cols="12" lg="3">
      <AffixContainerView>
        <p class="mb-0">{{ t('account.bot.manage.subtitle') }}</p>
      </AffixContainerView>
    </v-col>
    <v-col cols="12" lg="9">
      <div class="position-relative">
        <!-- 操作头 S -->
        <AffixContainerView>
          <v-card class="d-flex align-center justify-space-between flex-wrap ga-2 pa-2">
            <v-btn color="amber" variant="flat" :to="{name: 'AccountBotGuide'}">
              {{ t('account.bot.manage.addGroup') }}
            </v-btn>

            <div class="d-flex align-center ga-2">


              <v-btn variant="flat" :loading="loading" @click="onLoad">
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </div>
          </v-card>
        </AffixContainerView>
        <!-- 操作头 E -->

        <!-- 群列表 S -->
        <div v-if="groups.length > 0">
          <v-list lines="three" variant="text" class="bg-transparent">
            <template v-for="(group, index) in groups" :key="group.id">
              <v-list-item>
                <template v-slot:prepend>
                  <v-avatar size="50" rounded="lg" color="surface-variant" class="mr-3 flex-shrink-0">
                    <v-icon size="26" color="amber">mdi-account-group</v-icon>
                  </v-avatar>
                </template>

                <template v-slot:title>
                  <div class="d-flex align-center flex-wrap ga-2 mt-2">
                    <p class="u cursor-pointer" @click="onOpenSettings(group)">
                      {{ group.groupName || `${t('account.bot.manage.groupFallback')} ${group.groupNumber || ''}` }}
                    </p>
                    <v-chip size="x-small" color="amber" variant="tonal" class="text-uppercase font-weight-bold">
                      {{ String(group.platform).toUpperCase() }}
                    </v-chip>
                    <v-chip size="x-small" :color="group.pushEnabled ? 'green' : 'grey'" variant="tonal">
                      {{ group.pushEnabled ? t('account.bot.manage.pushOn') : t('account.bot.manage.pushOff') }}
                    </v-chip>
                  </div>
                </template>

                <template v-slot:subtitle>
                  <div class="d-flex align-center flex-wrap ga-3 mt-2">
                    <span class="d-flex align-center">
                      <v-icon size="14" class="mr-1">mdi-robot-outline</v-icon>
                      {{ group.botName }}
                    </span>
                    <span>
                      {{
                        group.displayId
                            ? `${t('account.bot.display.qq')}: ${group.displayId}`
                            : `${t('account.bot.display.appid')}: ${group.platformBotId}`
                      }}
                    </span>
                    <span v-if="group.memberCount">{{ group.memberCount }} {{ t('account.bot.manage.info.members') }}</span>
                  </div>
                </template>

                <template v-slot:append>
                  <div class="d-flex align-center ga-2">
                    <v-menu location="bottom end">
                      <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" size="small" variant="text" icon="mdi-dots-vertical"></v-btn>
                      </template>
                      <v-list min-width="180" class="pa-1" border rounded="lg">
                        <v-list-item prepend-icon="mdi-cog-outline" @click="onOpenSettings(group)">
                          <v-list-item-title>{{ t('account.bot.manage.settings') }}</v-list-item-title>
                        </v-list-item>
                        <v-divider class="my-1"></v-divider>
                        <v-list-item prepend-icon="mdi-link-off" class="text-error" @click="onDelete(group)">
                          <v-list-item-title>{{ t('account.bot.manage.remove') }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                </template>
              </v-list-item>
              <v-divider inset v-if="index < groups.length - 1"></v-divider>
            </template>
          </v-list>
        </div>

        <div v-else-if="!loading" class="text-center py-12">
          <v-icon size="52" color="grey" class="opacity-40 mb-3">mdi-robot-off-outline</v-icon>
          <p class="opacity-60 mb-0">{{ t('account.bot.manage.empty') }}</p>
        </div>
        <!-- 群列表 E -->

        <v-dialog v-model="dialog" width="900" scrollable>
          <v-card border>
            <v-card-title class="py-10 text-center bg-black mx-n5 mt-n5">
              <v-img v-if="detail?.info?.avatar" :src="detail.info.avatar" width="80" height="80"></v-img>
              <v-icon v-else icon="mdi-account-group" size="80"></v-icon>

              <p>{{ t('account.bot.manage.panelTitle', {name: groupName}) }}</p>
            </v-card-title>

            <v-card-item class="pa-0">
              <v-tabs v-model="dialogTab" color="amber" density="comfortable" class="px-4" @update:model-value="onTabChange">
                <v-tab value="base">{{ t('account.bot.manage.tabs.base') }}</v-tab>
                <v-tab value="push">{{ t('account.bot.manage.tabs.push') }}</v-tab>
                <v-tab value="commands">{{ t('account.bot.manage.tabs.commands') }}</v-tab>
                <v-tab value="quota">{{ t('account.bot.manage.tabs.quota') }}</v-tab>
                <v-tab value="signin">{{ t('account.bot.manage.tabs.signin') }}</v-tab>
              </v-tabs>
            </v-card-item>

            <v-divider opacity=".08"></v-divider>

            <v-card-text style="max-height: 80vh;">

              <div v-if="detailLoading" class="d-flex justify-center py-16">
                <Loading size="60"></Loading>
              </div>

              <template v-else>
                <div v-if="dialogTab === 'base'">
                  <v-row>
                    <v-col>
                      <v-list class="bg-transparent pa-0">
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.name') }}</v-list-item-title>
                          <v-list-item-subtitle>{{ detail?.info?.groupName || groupName }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.groupNumber') }}</v-list-item-title>
                          <v-list-item-subtitle>{{ activeGroup?.groupNumber || detail?.info?.groupNumber || '-' }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.owner') }}</v-list-item-title>
                          <v-list-item-subtitle>{{ ownerText }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.members') }}</v-list-item-title>
                          <v-list-item-subtitle>{{ detail?.info?.memberCount ?? activeGroup?.memberCount ?? '-' }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.description') }}</v-list-item-title>
                          <v-list-item-subtitle>{{ detail?.info?.description || activeGroup?.groupDesc || '-' }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.class') }}</v-list-item-title>
                          <v-list-item-subtitle>{{ detail?.info?.groupClass || activeGroup?.groupClass || '-' }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.addedBy') }}</v-list-item-title>
                          <v-list-item-subtitle class="text-caption">{{ activeGroup?.addedByOpenid || '-' }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.botRole') }}</v-list-item-title>
                          <v-list-item-subtitle>{{ activeGroup?.botRole || detail?.state?.botRole || '-' }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.msgRange') }}</v-list-item-title>
                          <v-list-item-subtitle>
                            {{
                              detail?.state?.recvMsgSetting
                                  ? t(`account.bot.manage.msgRange.${detail.state.recvMsgSetting}`)
                                  : (activeGroup?.recvMsgSetting ? t(`account.bot.manage.msgRange.${activeGroup.recvMsgSetting}`) : '-')
                            }}
                          </v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.joinedAt') }}</v-list-item-title>
                          <v-list-item-subtitle>{{ activeGroup?.joinedAt || detail?.state?.joinedAt || '-' }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.syncTime') }}</v-list-item-title>
                          <v-list-item-subtitle>{{ activeGroup?.lastSyncTime || '-' }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.tags') }}</v-list-item-title>
                          <v-list-item-subtitle>
                            <v-chip v-for="tag in (detail?.info?.tags || [])" :key="tag" size="x-small" class="mr-1" variant="tonal">
                              {{ tag }}
                            </v-chip>
                            <span v-if="!(detail?.info?.tags || []).length">-</span>
                          </v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>{{ t('account.bot.manage.info.openid') }}</v-list-item-title>
                          <v-list-item-subtitle class="text-caption">{{ activeGroup?.groupOpenid }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                      <v-alert v-if="detail && detail.info.available === false" variant="tonal" color="orange" density="compact" class="mt-3">
                        {{ t('account.bot.manage.info.unavailable') }}
                      </v-alert>
                    </v-col>
                  </v-row>
                </div>

                <div v-else-if="dialogTab === 'push'">
                  <div class="switch-row">
                    <div>
                      <p class="mb-0">{{ t('account.bot.manage.activePush') }}</p>
                      <p class="text-caption opacity-60 mb-0">{{ t('account.bot.manage.activePushDesc') }}</p>
                      <p class="text-caption opacity-60 mb-0">{{ t('account.bot.manage.pushReadonlyHint') }}</p>
                    </div>
                    <div class="d-flex align-center ga-2">
                      <v-chip v-if="detail?.state?.available" :color="form.pushEnabled ? 'green' : 'grey'" variant="tonal">
                        {{ form.pushEnabled ? t('account.bot.manage.pushOn') : t('account.bot.manage.pushOff') }}
                      </v-chip>
                      <v-chip v-else color="grey" variant="tonal">{{ t('account.bot.manage.pushUnknown') }}</v-chip>
                      <v-icon-btn variant="tonal" icon="mdi-refresh"
                                  :title="t('account.bot.manage.refresh')" :loading="refreshing" @click="onRefresh">
                      </v-icon-btn>
                    </div>
                  </div>

                  <v-alert v-if="pushCooldown > 0" variant="tonal" color="orange" density="compact" class="my-3">
                    {{ t('account.bot.manage.pushCooldownHint', {time: formatCooldown(pushCooldown)}) }}
                  </v-alert>

                  <div class="switch-row">
                    <div>
                      <p class="mb-0">{{ t('account.bot.manage.dailyReport') }}</p>
                      <p class="text-caption opacity-60 mb-0">{{ t('account.bot.manage.dailyReportDesc') }}</p>
                    </div>
                    <div class="d-flex align-center ga-2">
                      <v-btn size="small" variant="tonal" color="amber"
                             :loading="pushingType === 'daily'" :disabled="!!pushingType || pushCooldown > 0"
                             @click="onPushNow('daily')">
                        {{ t('account.bot.manage.pushNow') }}
                      </v-btn>
                      <v-switch v-model="form.dailyReport.enabled" color="amber" hide-details inset></v-switch>
                    </div>
                  </div>
                  <v-combobox
                      v-if="form.dailyReport.enabled"
                      v-model="form.dailyReport.times"
                      multiple
                      chips
                      closable-chips
                      :label="t('account.bot.manage.dailyTimes')"
                      :hint="t('account.bot.manage.dailyTimesHint')"
                      persistent-hint
                      variant="filled"
                      class="mb-4"></v-combobox>

                  <div class="switch-row">
                    <div>
                      <p class="mb-0">{{ t('account.bot.manage.teamupPush') }}</p>
                      <p class="text-caption opacity-60 mb-0">{{ t('account.bot.manage.teamupPushDesc') }}</p>
                    </div>
                    <div class="d-flex align-center ga-2">
                      <v-btn size="small" variant="tonal" color="amber"
                             :loading="pushingType === 'teamup'" :disabled="!!pushingType || pushCooldown > 0"
                             @click="onPushNow('teamup')">
                        {{ t('account.bot.manage.pushTeamupList') }}
                      </v-btn>
                      <v-switch v-model="form.teamup.enabled" color="amber" hide-details inset></v-switch>
                    </div>
                  </div>

                  <div class="switch-row">
                    <div>
                      <p class="mb-0">{{ t('account.bot.manage.dropPush') }}</p>
                      <p class="text-caption opacity-60 mb-0">{{ t('account.bot.manage.dropPushDesc') }}</p>
                    </div>
                    <div class="d-flex align-center ga-2">
                      <v-btn size="small" variant="tonal" color="amber"
                             :loading="pushingType === 'drop'" :disabled="!!pushingType || pushCooldown > 0"
                             @click="onPushNow('drop')">
                        {{ t('account.bot.manage.pushNow') }}
                      </v-btn>
                      <v-switch v-model="form.drop.enabled" color="amber" hide-details inset></v-switch>
                    </div>
                  </div>

                  <div class="switch-row">
                    <div>
                      <p class="mb-0">{{ t('account.bot.manage.welcome') }}</p>
                      <p class="text-caption opacity-60 mb-0">{{ t('account.bot.manage.welcomeDesc') }}</p>
                    </div>
                    <v-switch v-model="form.welcome.enabled" color="amber" hide-details inset></v-switch>
                  </div>
                  <v-textarea
                      v-if="form.welcome.enabled"
                      v-model="form.welcome.content"
                      :label="t('account.bot.manage.welcomeContent')"
                      variant="filled"
                      density="comfortable"
                      rows="3"
                      maxlength="500"
                      counter></v-textarea>
                </div>

                <div v-else-if="dialogTab === 'commands'">
                  <v-alert variant="tonal" color="amber" density="compact" class="mb-4">
                    {{ t('account.bot.manage.commands.hint') }}
                  </v-alert>

                  <div class="d-flex align-center ga-2 mb-4">
                    <v-text-field
                        v-model="commandInput"
                        :label="t('account.bot.manage.commands.input')"
                        :placeholder="t('account.bot.manage.commands.placeholder')"
                        density="compact"
                        variant="outlined"
                        hide-details
                        @keydown.enter="onSendCommand"></v-text-field>
                    <v-btn color="amber" variant="flat" :loading="commandSending"
                           :disabled="!commandInput.trim()" @click="onSendCommand">
                      {{ t('account.bot.manage.commands.send') }}
                    </v-btn>
                  </div>

                  <v-card v-if="commandResult" variant="tonal" color="amber" class="pa-4 mb-4">
                    <pre class="command-result">{{ commandResult }}</pre>
                  </v-card>

                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-subtitle-2 font-weight-bold">{{ t('account.bot.manage.commands.title') }}</span>
                    <v-btn size="small" variant="text" prepend-icon="mdi-refresh"
                           :loading="commandsLoading" @click="onReloadCommands">
                      {{ t('account.bot.manage.refresh') }}
                    </v-btn>
                  </div>

                  <div v-if="commandsLoading" class="d-flex justify-center py-8">
                    <v-progress-circular indeterminate color="amber"></v-progress-circular>
                  </div>
                  <v-list v-else-if="commands.length > 0" density="compact" class="bg-transparent">
                    <v-list-item v-for="command in commands" :key="command.name" class="px-0">
                      <template v-slot:prepend>
                        <v-chip size="small" color="amber" variant="tonal" class="mr-3 font-monospace">
                          /{{ command.primary }}
                        </v-chip>
                      </template>
                      <v-list-item-title class="text-body-2">{{ command.description || '-' }}</v-list-item-title>
                      <v-list-item-subtitle class="text-caption">
                        {{ command.prefixes.map((p) => `/${p}`).join(' · ') }}
                      </v-list-item-subtitle>
                      <template v-slot:append>
                        <v-btn size="x-small" variant="text" color="amber"
                               :disabled="!command.hasHelp" @click="onUseCommand(command)">
                          {{ t('account.bot.manage.commands.use') }}
                        </v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                  <p v-else class="text-center py-8 opacity-60">{{ t('account.bot.manage.commands.empty') }}</p>
                </div>

                <div v-else-if="dialogTab === 'quota'">
                  <v-row>
                    <v-col cols="12" lg="4">
                      <p>
                        {{
                          t('account.bot.manage.quota.rateLimit', {
                            botQpm: detail?.quota?.rateLimit?.botQpm ?? 60,
                            relationQpm: detail?.quota?.rateLimit?.relationQpm ?? 20
                          })
                        }}
                      </p>
                    </v-col>
                    <v-col cols="12" lg="8">
                      <div class="quota-block">
                        <div class="d-flex justify-space-between mb-2">
                          <span>{{ t('account.bot.manage.quota.user') }}</span>
                          <span class="opacity-60">
                    {{ detail?.quota?.user?.usedCount ?? 0 }} / {{ detail?.quota?.user?.limitCount ?? 10 }}
                  </span>
                        </div>
                        <v-progress-linear
                            height="10"
                            rounded
                            color="amber"
                            :model-value="detail?.quota?.user?.limitCount ? Math.min(100, (detail.quota.user.usedCount / detail.quota.user.limitCount) * 100) : 0"></v-progress-linear>
                      </div>
                      <div class="quota-block">
                        <div class="d-flex justify-space-between mb-2">
                          <span>{{ t('account.bot.manage.quota.group') }}</span>
                          <span class="opacity-60">
                            {{ detail?.quota?.group?.usedCount ?? 0 }} / {{ detail?.quota?.group?.limitCount ?? 1000 }}
                          </span>
                        </div>

                        <v-progress-linear
                            height="10"
                            rounded
                            color="amber"
                            :model-value="detail?.quota?.group?.limitCount ? Math.min(100, (detail.quota.group.usedCount / detail.quota.group.limitCount) * 100) : 0"></v-progress-linear>
                      </div>

                      <div class="d-flex">
                        <v-spacer></v-spacer>

                        <v-icon-btn border variant="text" icon="mdi-refresh"
                                    rounded="5"
                                    :title="t('account.bot.manage.refresh')"
                                    :loading="refreshing" @click="onLoadDetail">
                        </v-icon-btn>
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <div v-else-if="dialogTab === 'signin'">
                  <p class="text-caption opacity-60 mb-3">{{ t('account.bot.manage.signin.monthHint') }}</p>
                  <v-table density="compact" hover>
                    <thead>
                    <tr>
                      <th>{{ t('account.bot.manage.signin.user') }}</th>
                      <th>{{ t('account.bot.manage.signin.days') }}</th>
                      <th>{{ t('account.bot.manage.signin.last') }}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="item in detail?.signIns || []" :key="item.openid">
                      <td>{{ item.username || item.openid }}</td>
                      <td>{{ item.points ?? 0 }}</td>
                      <td>{{ item.lastSignTime || '-' }}</td>
                    </tr>
                    <tr v-if="(detail?.signIns || []).length === 0">
                      <td colspan="3" class="text-center py-8 opacity-60">
                        {{ t('account.bot.manage.signin.empty') }}
                      </td>
                    </tr>
                    </tbody>
                  </v-table>
                </div>
              </template>
            </v-card-text>

            <v-divider opacity=".08"></v-divider>
            <v-card-actions class="px-4 py-3">
              <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="refreshing" @click="onRefresh">
                {{ t('account.bot.manage.refresh') }}
              </v-btn>

              <v-spacer></v-spacer>

              <v-btn variant="text" @click="dialog = false">{{ t('basic.button.cancel') }}</v-btn>
              <v-btn color="amber" variant="flat" :loading="saving" @click="onSave">
                {{ t('basic.button.save') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </v-col>
  </v-row>
</template>

<style scoped lang="less">
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.quota-block {
  padding: 12px 0 20px;
}

.command-result {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  margin: 0;
}
</style>
