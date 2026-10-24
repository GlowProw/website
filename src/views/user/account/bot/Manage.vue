<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {apis} from "@/assets/sripts";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";
import AffixContainerView from "@/components/AffixContainerView.vue";
import type {
  BotBlocklistItem,
  BotGroupDetail,
  BotGroupItem,
  BotGroupMember,
  BotGroupMuteState,
  BotGroupSettings,
  BotJoinRequest
} from "@/assets/types/Bot";
import TimeView from "@/components/TimeView.vue";

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
    blocklist = ref<BotBlocklistItem[]>([]),
    blocklistLoading = ref(false),
    blockOpenid = ref(''),
    blockName = ref(''),
    blockAdding = ref(false),
    joinRequests = ref<BotJoinRequest[]>([]),
    joinLoading = ref(false),
    muteState = ref<BotGroupMuteState | null>(null),
    muteLoading = ref(false),
    muteOpenid = ref(''),
    muteMinutes = ref(60),
    muteSaving = ref(false),
    members = ref<BotGroupMember[]>([]),
    membersLoading = ref(false),
    membersAvailable = ref(true),
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

// 机器人是群主或管理员时才会展示入群申请与禁言管理
const isBotAdmin = computed(() => {
  const role = String(detail.value?.state?.botRole || activeGroup.value?.botRole || '').toLowerCase()
  return role === 'admin' || role === 'owner'
})

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
  members.value = []
  membersAvailable.value = true
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
    if (activeGroup.value?.settings?.pushEnabled !== undefined) {
      form.value.pushEnabled = Boolean(activeGroup.value.settings.pushEnabled)
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
 * 切换设置标签页
 * @param value 标签标识
 */
const onTabChange = (value: string) => {
  if (value === 'management') {
    onLoadBlocklist()
    onLoadMembers()
    if (isBotAdmin.value) {
      onLoadJoinRequests()
      onLoadMuteState()
    }
  }
}

/**
 * 拉取群成员列表，用于黑名单与禁言时按昵称挑选 OpenID
 */
const onLoadMembers = async () => {
  if (!activeGroup.value || membersLoading.value || members.value.length > 0) return
  membersLoading.value = true
  try {
    const list: BotGroupMember[] = []
    let cursor = ''
    let available = true
    // 大群按游标翻页，最多取 5 页足够覆盖日常管理
    for (let page = 0; page < 5; page++) {
      const result = await apis.botApi().getGroupMembers(activeGroup.value.id, cursor)
      const data = result.data?.data
      if (!data) break
      available = data.available !== false
      list.push(...(data.members || []))
      cursor = data.nextCursor || ''
      if (!cursor) break
    }
    members.value = list
    membersAvailable.value = available
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    membersLoading.value = false
  }
}

/**
 * 成员下拉的展示文案，优先昵称并附带 OpenID
 * @param member 群成员
 */
const memberTitle = (member: BotGroupMember) =>
    member.username ? `${member.username} (${member.openid})` : member.openid

/**
 * 选中黑名单成员时顺带回填昵称
 * @param value 下拉选中的 OpenID
 */
const onPickBlockMember = (value: unknown) => {
  const member = members.value.find(item => item.openid === value)
  if (member?.username) blockName.value = member.username
}

/**
 * 拉取入群申请列表
 */
const onLoadJoinRequests = async () => {
  if (!activeGroup.value) return
  joinLoading.value = true
  try {
    const result = await apis.botApi().getGroupJoinRequests(activeGroup.value.id)
    joinRequests.value = result.data?.data?.items || []
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    joinLoading.value = false
  }
}

/**
 * 审批入群申请
 * @param item 申请记录
 * @param action approve 或 decline
 */
const onApproveJoinRequest = async (item: BotJoinRequest, action: 'approve' | 'decline') => {
  if (!activeGroup.value) return
  try {
    await apis.botApi().approveGroupJoinRequest(activeGroup.value.id, item.member_openid, {
      action,
      joinRequestId: item.join_request_id
    })
    notice.success(t(`account.bot.manage.management.join.${action === 'approve' ? 'approved' : 'declined'}`))
    await onLoadJoinRequests()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  }
}

/**
 * 拉取群禁言状态
 */
const onLoadMuteState = async () => {
  if (!activeGroup.value) return
  muteLoading.value = true
  try {
    const result = await apis.botApi().getGroupMuteState(activeGroup.value.id)
    muteState.value = result.data?.data || null
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    muteLoading.value = false
  }
}

/**
 * 设置或解除成员禁言
 * @param memberOpenid 成员 OpenID
 * @param minutes 禁言分钟数，0 表示解除
 */
const onSetMemberMute = async (memberOpenid: string, minutes: number) => {
  if (!activeGroup.value || !memberOpenid.trim() || muteSaving.value) return
  muteSaving.value = true
  try {
    await apis.botApi().setGroupMemberMute(activeGroup.value.id, {memberOpenid: memberOpenid.trim(), minutes})
    notice.success(t('account.bot.manage.management.mute.saved'))
    if (minutes > 0) muteOpenid.value = ''
    await onLoadMuteState()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    muteSaving.value = false
  }
}

/**
 * 拉取群黑名单
 */
const onLoadBlocklist = async () => {
  if (!activeGroup.value) return
  blocklistLoading.value = true
  try {
    const result = await apis.botApi().getGroupBlocklist(activeGroup.value.id)
    blocklist.value = result.data?.data?.items || []
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    blocklistLoading.value = false
  }
}

/**
 * 添加黑名单成员
 */
const onAddBlocklist = async () => {
  if (!activeGroup.value || !blockOpenid.value.trim() || blockAdding.value) return
  blockAdding.value = true
  try {
    await apis.botApi().addGroupBlocklist(activeGroup.value.id, {
      memberOpenid: blockOpenid.value.trim(),
      memberName: blockName.value.trim() || undefined
    })
    notice.success(t('account.bot.manage.management.added'))
    blockOpenid.value = ''
    blockName.value = ''
    await onLoadBlocklist()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
  } finally {
    blockAdding.value = false
  }
}

/**
 * 移除黑名单成员
 * @param memberOpenid 成员 OpenID
 */
const onRemoveBlocklist = async (memberOpenid: string) => {
  if (!activeGroup.value) return
  try {
    await apis.botApi().removeGroupBlocklist(activeGroup.value.id, memberOpenid)
    notice.success(t('account.bot.manage.management.removed'))
    await onLoadBlocklist()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotManage'})
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
      pushEnabled: Boolean(form.value.pushEnabled),
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
        <p class="opacity-60 mb-0">{{ t('account.bot.manage.subtitle') }}</p>
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
                <v-tab value="quota">{{ t('account.bot.manage.tabs.quota') }}</v-tab>
                <v-tab value="signin">{{ t('account.bot.manage.tabs.signin') }}</v-tab>
                <v-tab value="management">{{ t('account.bot.manage.tabs.management') }}</v-tab>
              </v-tabs>
            </v-card-item>

            <v-divider opacity=".08"></v-divider>

            <v-card-text style="max-height: 80vh;">
              <div v-if="detailLoading" class="d-flex justify-center py-16">
                <Loading size="60"></Loading>
              </div>

              <template v-else>
                <div v-if="dialogTab === 'base'">
                  <v-row density="comfortable">
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.name') }}</p>
                      <p class="mb-3">{{ detail?.info?.groupName || groupName }}</p>
                    </v-col>
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.groupNumber') }}</p>
                      <p class="mb-3">{{ activeGroup?.groupNumber || detail?.info?.groupNumber || '-' }}</p>
                    </v-col>
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.owner') }}</p>
                      <p class="mb-3">{{ ownerText }}</p>
                    </v-col>
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.members') }}</p>
                      <p class="mb-3">{{ detail?.info?.memberCount ?? activeGroup?.memberCount ?? '-' }}</p>
                    </v-col>
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.description') }}</p>
                      <p class="mb-3">{{ detail?.info?.description || activeGroup?.groupDesc || '-' }}</p>
                    </v-col>
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.class') }}</p>
                      <p class="mb-3">{{ detail?.info?.groupClass || activeGroup?.groupClass || '-' }}</p>
                    </v-col>
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.addedBy') }}</p>
                      <p class="mb-3 text-caption">{{ activeGroup?.addedByOpenid || '-' }}</p>
                    </v-col>
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.botRole') }}</p>
                      <p class="mb-3">{{ activeGroup?.botRole || detail?.state?.botRole || '-' }}</p>
                    </v-col>
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.msgRange') }}</p>
                      <p class="mb-3">
                        {{
                          detail?.state?.recvMsgSetting
                              ? t(`account.bot.manage.msgRange.${detail.state.recvMsgSetting}`)
                              : (activeGroup?.recvMsgSetting ? t(`account.bot.manage.msgRange.${activeGroup.recvMsgSetting}`) : '-')
                        }}
                      </p>
                    </v-col>
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.joinedAt') }}</p>
                      <p class="mb-3">{{ activeGroup?.joinedAt || detail?.state?.joinedAt || '-' }}</p>
                    </v-col>
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.syncTime') }}</p>
                      <p class="mb-3">{{ activeGroup?.lastSyncTime || '-' }}</p>
                    </v-col>
                    <v-col cols="12">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.tags') }}</p>
                      <div class="mb-3">
                        <v-chip v-for="tag in (detail?.info?.tags || [])" :key="tag" size="small" class="mr-1" variant="tonal">
                          {{ tag }}
                        </v-chip>
                        <span v-if="!(detail?.info?.tags || []).length">-</span>
                      </div>
                    </v-col>
                    <v-col cols="12">
                      <p class="text-caption text-medium-emphasis mb-1">{{ t('account.bot.manage.info.openid') }}</p>
                      <p class="mb-3 text-caption">{{ activeGroup?.groupOpenid }}</p>
                    </v-col>
                    <v-col v-if="detail && detail.info.available === false" cols="12">
                      <v-alert variant="tonal" color="orange" density="compact" class="mt-1">
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
                      <p class="text-caption opacity-60 mb-0">{{ t('account.bot.manage.pushSwitchHint') }}</p>
                    </div>
                    <div class="d-flex align-center ga-2">
                      <v-switch v-model="form.pushEnabled" color="amber" hide-details inset></v-switch>
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

                <div v-else-if="dialogTab === 'management'">
                  <p class="text-subtitle-2 font-weight-bold mb-1">{{ t('account.bot.manage.management.blacklistTitle') }}</p>
                  <p class="text-caption opacity-60 mb-3">{{ t('account.bot.manage.management.blacklistDesc') }}</p>

                  <div class="d-flex flex-wrap ga-2 mb-4">
                    <v-combobox
                        v-model="blockOpenid"
                        :items="members"
                        item-value="openid"
                        :item-title="memberTitle"
                        :label="t('account.bot.manage.management.memberSearch')"
                        :no-data-text="membersAvailable ? t('account.bot.manage.management.memberEmpty') : t('account.bot.manage.management.memberUnavailable')"
                        :loading="membersLoading"
                        density="compact"
                        variant="outlined"
                        hide-details
                        style="max-width: 320px;"
                        @update:model-value="onPickBlockMember"></v-combobox>
                    <v-text-field
                        v-model="blockName"
                        :label="t('account.bot.manage.management.memberName')"
                        density="compact"
                        variant="outlined"
                        hide-details
                        maxlength="128"
                        style="max-width: 220px;"></v-text-field>
                    <v-btn color="amber" variant="flat" :loading="blockAdding"
                           :disabled="!blockOpenid.trim()" @click="onAddBlocklist">
                      {{ t('account.bot.manage.management.add') }}
                    </v-btn>
                  </div>

                  <v-table density="compact" hover>
                    <thead>
                    <tr>
                      <th>{{ t('account.bot.manage.management.memberName') }}</th>
                      <th>{{ t('account.bot.manage.management.memberOpenid') }}</th>
                      <th>{{ t('account.bot.manage.management.addedAt') }}</th>
                      <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="item in blocklist" :key="item.id">
                      <td>{{ item.memberName || '-' }}</td>
                      <td class="text-caption">{{ item.memberOpenid }}</td>
                      <td class="text-caption"><TimeView :time="item.createdTime"></TimeView></td>
                      <td class="text-right">
                        <v-btn size="small" variant="text" color="error"
                               @click="onRemoveBlocklist(item.memberOpenid)">
                          {{ t('account.bot.manage.management.remove') }}
                        </v-btn>
                      </td>
                    </tr>
                    <tr v-if="!blocklistLoading && blocklist.length === 0">
                      <td colspan="4" class="text-center py-8 opacity-60">
                        {{ t('account.bot.manage.management.empty') }}
                      </td>
                    </tr>
                    </tbody>
                  </v-table>

                  <template v-if="isBotAdmin">
                    <v-divider class="my-6" opacity=".08"></v-divider>

                    <div class="d-flex align-center justify-space-between mb-1">
                      <div>
                        <p class="text-subtitle-2 font-weight-bold mb-1">{{ t('account.bot.manage.management.join.title') }}</p>
                        <p class="text-caption opacity-60 mb-0">{{ t('account.bot.manage.management.join.desc') }}</p>
                      </div>
                      <v-icon-btn variant="tonal" rounded="10" icon="mdi-refresh"
                                  :title="t('account.bot.manage.refresh')"
                                  :loading="joinLoading" @click="onLoadJoinRequests"></v-icon-btn>
                    </div>

                    <v-table density="compact" hover class="mt-3">
                      <thead>
                      <tr>
                        <th>{{ t('account.bot.manage.management.join.member') }}</th>
                        <th>{{ t('account.bot.manage.management.join.verify') }}</th>
                        <th>{{ t('account.bot.manage.management.join.appliedAt') }}</th>
                        <th></th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr v-for="item in joinRequests" :key="item.join_request_id || item.member_openid">
                        <td>{{ item.username || item.member_openid }}</td>
                        <td class="text-caption">{{ item.verify_info?.verify_message || '-' }}</td>
                        <td class="text-caption">{{ item.apply_at || '-' }}</td>
                        <td class="text-right">
                          <v-btn size="small" variant="text" color="success"
                                 @click="onApproveJoinRequest(item, 'approve')">
                            {{ t('account.bot.manage.management.join.approve') }}
                          </v-btn>
                          <v-btn size="small" variant="text" color="error"
                                 @click="onApproveJoinRequest(item, 'decline')">
                            {{ t('account.bot.manage.management.join.decline') }}
                          </v-btn>
                        </td>
                      </tr>
                      <tr v-if="!joinLoading && joinRequests.length === 0">
                        <td colspan="4" class="text-center py-6 opacity-60">
                          {{ t('account.bot.manage.management.join.empty') }}
                        </td>
                      </tr>
                      </tbody>
                    </v-table>

                    <v-divider class="my-6" opacity=".08"></v-divider>

                    <div class="d-flex align-center justify-space-between mb-1">
                      <div>
                        <p class="text-subtitle-2 font-weight-bold mb-1">{{ t('account.bot.manage.management.mute.title') }}</p>
                        <p class="text-caption opacity-60 mb-0">
                          {{ t('account.bot.manage.management.mute.desc', {
                            mode: t(`account.bot.manage.management.mute.mode.${muteState?.globalRule?.mode || 'none'}`)
                          }) }}
                        </p>
                      </div>
                      <v-icon-btn variant="tonal" rounded="10" icon="mdi-refresh"
                                  :title="t('account.bot.manage.refresh')"
                                  :loading="muteLoading" @click="onLoadMuteState"></v-icon-btn>
                    </div>

                    <div class="d-flex flex-wrap ga-2 mt-3 mb-3">
                      <v-combobox v-model="muteOpenid"
                                  :items="members"
                                  item-value="openid"
                                  :item-title="memberTitle"
                                  :label="t('account.bot.manage.management.memberSearch')"
                                  :no-data-text="membersAvailable ? t('account.bot.manage.management.memberEmpty') : t('account.bot.manage.management.memberUnavailable')"
                                  :loading="membersLoading"
                                  density="compact" variant="outlined" hide-details
                                  style="max-width: 320px;"></v-combobox>
                      <v-text-field v-model.number="muteMinutes" type="number"
                                    min="1"
                                    max="43200"
                                    :label="t('account.bot.manage.management.mute.minutes')"
                                    density="compact" variant="outlined" hide-details
                                    style="max-width: 180px;"></v-text-field>
                      <v-btn color="amber" variant="flat" :loading="muteSaving"
                             :disabled="!muteOpenid.trim()" @click="onSetMemberMute(muteOpenid, muteMinutes)">
                        {{ t('account.bot.manage.management.mute.apply') }}
                      </v-btn>
                    </div>

                    <v-table density="compact" hover>
                      <thead>
                      <tr>
                        <th>{{ t('account.bot.manage.management.join.member') }}</th>
                        <th>{{ t('account.bot.manage.management.mute.expireAt') }}</th>
                        <th></th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr v-for="item in muteState?.members || []" :key="item.member_openid">
                        <td>{{ item.username || item.member_openid }}</td>
                        <td class="text-caption">{{ item.mute_expire_at }}</td>
                        <td class="text-right">
                          <v-btn size="small" variant="text" color="success"
                                 :loading="muteSaving" @click="onSetMemberMute(item.member_openid, 0)">
                            {{ t('account.bot.manage.management.mute.unmute') }}
                          </v-btn>
                        </td>
                      </tr>
                      <tr v-if="!muteLoading && (muteState?.members || []).length === 0">
                        <td colspan="3" class="text-center py-6 opacity-60">
                          {{ t('account.bot.manage.management.mute.empty') }}
                        </td>
                      </tr>
                      </tbody>
                    </v-table>
                  </template>
                </div>
              </template>
            </v-card-text>

            <v-divider opacity=".08"></v-divider>
            <v-card-actions class="px-4 py-3">
              <v-icon-btn variant="tonal"
                          rounded="10"
                          icon="mdi-refresh"
                          :title="t('account.bot.manage.refresh')"
                          :loading="refreshing" @click="onRefresh">
              </v-icon-btn>

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
</style>
