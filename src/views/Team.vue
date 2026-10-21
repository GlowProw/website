<script setup lang="ts">
import {useAuthStore} from "~/stores/userAccountStore";
import {computed, onMounted, onUnmounted, type Ref, ref, triggerRef, type UnwrapRef} from "vue";
import EmptyView from "@/components/EmptyView.vue";
import {apis, getBrowserFingerprint, storage} from "@/assets/sripts";
import TimeView from "@/components/TimeView.vue";
import {useI18n} from "vue-i18n";
import type {VForm} from "vuetify/components";
import Loading from "@/components/Loading.vue";
import Textarea from "@/components/textarea/index.vue";
import {useNoticeStore} from "~/stores/noticeStore";
import AdsWidget from "@/components/ads/google/index.vue";
import {handleApiError} from "@/assets/sripts/error_handler";
import Silk from "@/components/Silk.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import {getTeamsType} from "@/assets/types/views";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const authStore = useAuthStore(),
    notice = useNoticeStore(),
    {t} = useI18n()

let teams: Ref<any[]> = ref([]),
    page = ref(1),
    limit = ref(20),
    total = ref(0),
    totalPages = ref(1),

    // 发布
    pushForm = ref<VForm | null>(null),
    pushConfig = {
      rules: {
        player: [
          (v: any) => !!v || t('teamUp.rules.playerRequired'),
        ],
        description: [
          (v: any) => !!v || t('teamUp.rules.descriptionRequired'),
          (v: string | any[]) => (v && v.length >= 3 && v.length <= 300) || t('teamUp.rules.descriptionLength'),
        ]
      },
      tags: [
        {label: t('teamUp.tags.pve'), value: 'pve'},
        {label: t('teamUp.tags.pvp'), value: 'pvp'},
        {label: t('teamUp.tags.timeWander'), value: 'timeWander'},
        {label: t('teamUp.tags.plotTask'), value: 'plotTask'},
        {label: t('teamUp.tags.sideQuest'), value: 'sideQuest'},
        {label: t('teamUp.tags.reward'), value: 'reward'},
        {label: t('teamUp.tags.fortressRaiding'), value: 'fortressRaiding'},
        {label: t('teamUp.tags.transaction'), value: 'transaction'},
        {label: t('teamUp.tags.other'), value: 'other'}
      ],
      time: [
        {value: 10, label: t('teamUp.time.minutes', {count: 10})},
        {value: 30, label: t('teamUp.time.minutes', {count: 30})},
        {value: 60, label: t('teamUp.time.minutes', {count: 60})},
        {value: 120, label: t('teamUp.time.minutes', {count: 120})},
        {value: 60 * 24, label: t('teamUp.time.day', {count: 1})},
        {value: 3 * 60 * 24, label: t('teamUp.time.day', {count: 3})},
        {value: 7 * 60 * 24, label: t('teamUp.time.day', {count: 7})}
      ]
    },
    pushModel = ref(false),
    pushLoading = ref(false),
    player = ref(''),
    description = ref(''),
    tags: Ref<UnwrapRef<any[]>, UnwrapRef<any[]> | any[]> = ref([]),
    expiresMinutesAt: Ref<UnwrapRef<number>, UnwrapRef<number> | number> = ref(60),
    descriptionEditor = ref<any>(null),
    pushTargetPlatform = ref('qq'),
    pushBotIds: Ref<number[]> = ref([]),
    pushSyncEnabled = ref(true),
    pushTargetsLoading = ref(false),
    pushTargets = ref<any[]>([]),
    pushAccess = ref({
      checked: false,
      allowed: false
    }),

    // 检索
    teamsLoading = ref(false),
    filtering = ref({
      sortBy: 'recent',
      keyword: ''
    })

/**
 * 转换 Unix 时间戳为毫秒
 */
const formatTimestamp = (ts: number) => {
  if (!ts) return 0;
  return ts < 1e11 ? ts * 1000 : ts;
}

/**
 * 计算剩余喇叭时间格式化字符串
 */
const getRemainingHornTime = (expiresAt: number) => {
  if (!expiresAt) return '';
  const expiresMs = formatTimestamp(expiresAt);
  const diffMs = expiresMs - Date.now();
  if (diffMs <= 0) return t('teamUp.expired') || '已到期';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  if (totalMinutes < 60) {
    return `${totalMinutes}分钟`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${mins}分钟`;
}

/**
 * 组队信息来源展示文案
 * @param item 组队条目
 */
const onSourceLabel = (item: any) => {
  const source = item?.source;
  if (!source || source.platform === 'web') return t('teamUp.source.web');
  return t('teamUp.source.bot', {name: source.name || ''});
}

/**
 * 定时刷新配置
 * 支持 10/15/30/60/120 秒预设或自定义秒数
 */
const refreshConfig = ref({
  enabled: false,
  interval: 30,
  customInterval: 30
})

const refreshIntervalOptions = [10, 15, 30, 60, 120]

let refreshTickHandle: ReturnType<typeof setInterval> | null = null

/**
 * 读取生效的刷新间隔（秒）
 */
const resolvedRefreshInterval = computed(() => {
  if (refreshConfig.value.interval === 0) {
    return Math.max(5, Math.min(3600, Number(refreshConfig.value.customInterval) || 30))
  }
  return refreshConfig.value.interval
})

/**
 * 清理刷新定时器
 */
const clearRefreshTimers = () => {
  if (refreshTickHandle) clearInterval(refreshTickHandle)
  refreshTickHandle = null
}

/**
 * 开始轮询刷新
 */
const beginRefresh = () => {
  if (refreshTickHandle) return
  refreshConfig.value.enabled = true
  getTeams(getTeamsType.none)
  refreshTickHandle = setInterval(() => {
    if (document.hidden) return
    getTeams(getTeamsType.none)
  }, resolvedRefreshInterval.value * 1000)
}

/**
 * 停止轮询刷新
 */
const stopRefresh = () => {
  refreshConfig.value.enabled = false
  clearRefreshTimers()
}

/**
 * 启动或停止定时刷新
 */
const onToggleRefresh = () => {
  if (refreshConfig.value.enabled) {
    stopRefresh()
    notice.info(t('teamUp.refresh.stopped'))
    return
  }
  clearRefreshTimers()
  beginRefresh()
}

/**
 * 页面隐藏时跳过轮询，回到前台立即补拉一次
 */
const onVisibilityChange = () => {
  if (!refreshConfig.value.enabled) return
  if (!document.hidden) {
    getTeams(getTeamsType.none)
  }
}

/**
 * 页面挂载：加载列表、读取储存的发布与推送目标选项
 */
onMounted(async () => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  await getTeams(getTeamsType.none)
  readStoragePlayer()
  readStoragePushTargets()
})

/**
 * 页面卸载：清理监听与定时器
 */
onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  clearRefreshTimers()
})

/**
 * 获取组队列表
 */
const getTeams = async (type: getTeamsType = getTeamsType.none) => {
  try {
    teamsLoading.value = true;

    if (type === getTeamsType.none) {
      page.value = 1;
    }

    const result = await apis.teamupApi().getTeamups({
      keyword: filtering.value.keyword,
      sortBy: filtering.value.sortBy,
      page: page.value,
      limit: limit.value
    });

    const d = result.data;
    const list = d.data || [];

    if (d.pagination) {
      total.value = d.pagination.total || 0;
      totalPages.value = d.pagination.totalPages || 1;
    }

    if (type === getTeamsType.none) {
      teams.value = list;
    } else if (type === getTeamsType.load) {
      teams.value.push(...list);
    }
    return teams.value;
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Team'});
  } finally {
    teamsLoading.value = false;
    triggerRef(teams);
  }
}

/**
 * 虚拟列表加载
 */
const onTeamLoad = async ({done}: any) => {
  if (page.value >= totalPages.value) {
    done('empty');
    return;
  }
  page.value++;
  await getTeams(getTeamsType.load);
  done('ok');
}

/**
 * 打开发布面板并读取可用的推送平台与机器人
 */
const onOpenPush = async () => {
  pushModel.value = true;
  if (!authStore.isLogin) return;

  pushTargetsLoading.value = true;
  try {
    const result = await apis.botApi().getPushTargets();
    pushTargets.value = result.data?.data || [];
    pushAccess.value = {checked: true, allowed: true};

    // 优先恢复上次选择的平台，其次选第一个已绑定且有机器人的平台
    const bound = pushTargets.value.filter((p: any) => p.bound && (p.bots || []).length > 0);
    const saved = storage.local.get('teamUp.pushTargets');
    const savedPlatform = saved.code === 0 ? saved.data.value?.platform : '';
    pushSyncEnabled.value = saved.code === 0 ? saved.data.value?.enabled !== false : true;
    const target = bound.find((p: any) => p.value === savedPlatform) || bound[0];
    if (target) {
      pushTargetPlatform.value = target.value;
      const validIds = new Set((target.bots || []).map((b: any) => b.id));
      pushBotIds.value = (saved.code === 0 ? (saved.data.value?.botIds || []) : [])
          .filter((id: number) => validIds.has(id));
    }
  } catch {
    pushAccess.value = {checked: true, allowed: false};
  } finally {
    pushTargetsLoading.value = false;
  }
}

/**
 * 机器人下拉项展示名称
 * @param item 机器人记录
 */
const onPushBotTitle = (item: any) => item.displayId
    ? `${item.name} (${t('account.bot.display.qq')}: ${item.displayId})`
    : `${item.name} (${t('account.bot.display.appid')}: ${item.platformBotId})`

/**
 * 当前平台下可选的机器人
 */
const currentPushBots = computed(() => {
  const platform = pushTargets.value.find((p: any) => p.value === pushTargetPlatform.value);
  return platform?.bots || [];
})

/**
 * 当前平台是否已完成账户绑定
 */
const currentPlatformBound = computed(() => {
  const platform = pushTargets.value.find((p: any) => p.value === pushTargetPlatform.value);
  return Boolean(platform?.bound);
})

/**
 * 切换平台时清空不属于该平台的机器人选择
 */
const onPushPlatformChange = () => {
  const validIds = new Set(currentPushBots.value.map((b: any) => b.id));
  pushBotIds.value = pushBotIds.value.filter(id => validIds.has(id));
  onStoragePushTargets();
}

/**
 * 记住推送目标选择
 */
const onStoragePushTargets = () => {
  storage.local.set('teamUp.pushTargets', {
    enabled: pushSyncEnabled.value,
    platform: pushTargetPlatform.value,
    botIds: pushBotIds.value
  });
}

/**
 * 读取已记住的推送目标（页面挂载时恢复平台，机器人列表在打开发布面板时校验）
 */
const readStoragePushTargets = () => {
  const saved = storage.local.get('teamUp.pushTargets');
  if (saved.code === 0 && saved.data.value) {
    pushSyncEnabled.value = saved.data.value.enabled !== false;
    pushTargetPlatform.value = saved.data.value.platform || 'qq';
    pushBotIds.value = Array.isArray(saved.data.value.botIds) ? saved.data.value.botIds : [];
  }
}

/**
 * 外部平台推送状态对应的颜色
 * @param status 推送状态
 */
const getPushColor = (status: string) => {
  if (status === 'sent') return 'green';
  if (status === 'failed') return 'red';
  return 'orange';
}

/**
 * 外部平台推送状态提示文案
 * @param push 推送状态对象
 */
const getPushTooltip = (push: any) => {
  const platform = String(push?.platform || 'qq').toUpperCase();
  const status = t(`teamUp.push.status.${push?.status || 'pending'}`);
  const error = push?.error ? ` · ${push.error}` : '';
  return `${platform}: ${status}${error}`;
}

/**
 * 手动重试一次外部平台推送
 * @param item 组队信息
 */
const onRetryPush = async (item: any) => {
  if (!item?.push?.canRetry) return;
  try {
    await apis.teamupApi().retryTeamupPush(item.id, item.push.platform || 'qq');
    notice.success(t('teamUp.push.retryQueued'));
    await getTeams(getTeamsType.none);
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Team'});
  }
}

/**
 * 发布
 */
const pushTeamInfo = async () => {
  try {
    if (!pushForm.value) return;
    const {valid} = await pushForm.value.validate();
    if (!valid) return;

    pushLoading.value = true;
    const selectedTags = tags.value.map((i: any) => typeof i === 'object' ? i.value : i);
    const fingerprint = getBrowserFingerprint();
    const descriptionText = descriptionEditor.value?.getText?.(true) || description.value;
    const selectedPushBotIds = pushSyncEnabled.value && pushAccess.value.allowed ? [...pushBotIds.value] : [];

    const result = await apis.teamupApi().createTeamup({
      player: player.value,
      description: description.value,
      descriptionText,
      pushBotIds: selectedPushBotIds,
      tags: selectedTags,
      expiresMinutesAt: expiresMinutesAt.value,
      fingerprint
    } as any);

    const push = result?.data?.data?.push;
    if (push?.results?.length) {
      const failed = push.results.filter((i: any) => i.status === 'failed');
      if (failed.length > 0) {
        notice.warning(t('teamUp.push.queuedWithFailure'));
      } else {
        notice.success(t('teamUp.push.queued'));
      }
    } else {
      notice.success(t('basic.tips.teamUp.pushSuccess'));
    }

    onCleanPushInfo();
    await getTeams(getTeamsType.none);
    pushLoading.value = false;
    pushModel.value = false;
  } catch (e: any) {
    pushLoading.value = false;
    // 发布频率限制需要把剩余等待时间换算成分钟/小时后提示
    const remainingMs = Number(e?.response?.data?.remainingTime || 0);
    if (e?.code === 'teamUp.account.rateLimit') {
      notice.error(t('basic.tips.teamUp.account.rateLimit', {
        remainingTime: Math.max(1, Math.ceil(remainingMs / 60000))
      }));
      return;
    }
    if (e?.code === 'teamUp.anonymous.rateLimit') {
      notice.error(t('basic.tips.teamUp.anonymous.rateLimit', {
        remainingTime: Math.max(1, Math.ceil(remainingMs / 3600000))
      }));
      return;
    }
    handleApiError(e, notice, t, {component: 'Team'});
  }
}

/**
 * 取消发布
 */
const onDeleteTeamUp = async (id: string | number) => {
  try {
    if (!id) return;
    await apis.teamupApi().deleteTeamup(id);
    notice.success(t('teamUp.deleteSuccess'));
    teams.value = teams.value.filter(item => item.id !== id);
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Team'});
  }
}

/**
 * 清理发布信息
 */
const onCleanPushInfo = () => {
  player.value = '';
  description.value = '';
  tags.value = [];
}

/**
 * 检索
 */
const onSearch = async () => {
  await getTeams(getTeamsType.none);
}

/**
 * 切换排序方式
 */
const onTeamSortBy = async () => {
  await getTeams(getTeamsType.none);
}

/**
 * 发布信息 - 储存配置
 */
const onStoragePlayer = () => {
  storage.local.set('teamUp.pushForm', {
    player: player.value,
    expiresMinutesAt: expiresMinutesAt.value,
    tags: tags.value,
    description: description.value
  });
}

/**
 * 发布信息 - 读取配置
 */
const readStoragePlayer = () => {
  const pushForm = storage.local.get('teamUp.pushForm');

  if (pushForm.code == 0 && pushForm.data.value) {
    player.value = pushForm.data.value.player || '';
    expiresMinutesAt.value = pushForm.data.value.expiresMinutesAt || 60;
    tags.value = pushForm.data.value.tags || [];
    description.value = pushForm.data.value.description || '';
  }
}

/**
 * 复制文本
 */
const copyToClipboard = async (content: string) => {
  if (!content) return;

  try {
    await navigator.clipboard.writeText(content);
    notice.success(t(`teamUp.copyPlayerSuccess`));
  } catch (err) {
    console.error('复制失败:', err);
  }
}

</script>

<template>
  <v-main>
    <v-card height="200px">
      <template v-slot:image>
        <Silk
            :speed="3"
            :scale=".7"
            :color="'#1c1c1c'"
            :noise-intensity="0.1"
            :rotation="-.6"
            class="bg-black">
        </Silk>
      </template>
      <template v-slot:default>
        <v-breadcrumbs density="compact" class="ma-0 pa-0">
          <v-container>
            <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
            <v-breadcrumbs-divider></v-breadcrumbs-divider>
            <v-breadcrumbs-item>{{ t('teamUp.title') }}</v-breadcrumbs-item>
          </v-container>
        </v-breadcrumbs>
        <v-divider opacity=".01"></v-divider>

        <v-container class="position-relative">
          <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
            <v-icon icon="mdi-account-heart" size="120"></v-icon>
            <v-icon icon="mdi-assistant" size="120"></v-icon>
            <v-icon icon="mdi-ship-wheel" size="120"></v-icon>
          </div>
        </v-container>
      </template>
    </v-card>
    <v-divider opacity=".06"></v-divider>

    <AffixContainerView :offsetTop="55">
      <div class="bg-black">
        <v-container>
          <v-row>
            <v-col cols="12" sm="12" md="6" lg xl>
              <v-btn @click="onOpenPush" class="h-100 mr-1" variant="elevated">
                <v-icon icon="mdi-plus"></v-icon>
                {{ t('teamUp.pushBtn') }}
              </v-btn>

              <v-btn @click="getTeams(getTeamsType.none)" class="h-100" variant="elevated">
                <v-icon :class="[teamsLoading ?  'spin-icon-load' : '']" icon="mdi-refresh" size="20"/>
              </v-btn>
            </v-col>
            <v-col cols="12" sm="12" md="6" lg="auto" xl="auto" class="d-flex justify-md-end align-center ga-2 flex-wrap">
              <v-select
                  v-model="refreshConfig.interval"
                  :items="[
                    {title: '10s', value: 10},
                    {title: '15s', value: 15},
                    {title: '30s', value: 30},
                    {title: '60s', value: 60},
                    {title: '120s', value: 120},
                    {title: t('teamUp.refresh.custom'), value: 0}
                  ]"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="refreshConfig.enabled"
                  style="max-width: 120px;"></v-select>

              <v-text-field
                  v-if="refreshConfig.interval === 0"
                  v-model.number="refreshConfig.customInterval"
                  type="number"
                  min="5"
                  max="3600"
                  suffix="s"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="refreshConfig.enabled"
                  style="max-width: 110px;"></v-text-field>

              <v-btn
                  :color="refreshConfig.enabled ? 'error' : 'primary'"
                  variant="tonal"
                  @click="onToggleRefresh">
                <v-icon :icon="refreshConfig.enabled ? 'mdi-stop' : 'mdi-timer-play'" class="mr-1"></v-icon>
                {{ refreshConfig.enabled ? t('teamUp.refresh.stop') : t('teamUp.refresh.startBtn') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </div>
    </AffixContainerView>

    <v-container class="team">
      <AdsWidget id="none"></AdsWidget>

      <v-row>
        <v-col cols="12" lg="4">
          <AffixBoxHasTitleView>
            <template v-slot:title>{{ t('team.filter') }}</template>

            <v-col cols="12">
              <v-select v-model="filtering.sortBy"
                        @update:modelValue="onTeamSortBy"
                        :label="t('teamUp.filter.sortLabel')"
                        item-title="label"
                        item-value="value"
                        :items="[{value: 'recent', label: t('teamUp.filter.sortByRecent')},{value: 'expires', label: t('teamUp.filter.sortByExpires')}]">
              </v-select>
            </v-col>
            <v-col cols="12">
              <v-text-field :placeholder="t('basic.button.search')"
                            v-model="filtering.keyword">
                <template v-slot:append-inner>
                  <v-icon-btn :disabled="!filtering.keyword" @click="onSearch">
                    <v-icon icon="mdi-search-web"></v-icon>
                  </v-icon-btn>
                </template>
              </v-text-field>
            </v-col>
          </AffixBoxHasTitleView>
        </v-col>

        <v-col cols="12" lg="8" class="fill-height">
          <template v-if="teams.length > 0">
            <v-list class="bg-transparent">
              <v-infinite-scroll :items="teams"
                                 mode="manual"
                                 @load="onTeamLoad">
                <template v-for="(i, index) in teams" :key="index">
                  <v-list-item class="bg-transparent">
<!--                    <template v-slot:prepend>-->
<!--                      <v-card class="team-icon pa-4">-->
<!--                        <v-icon icon="mdi-access-point" size="30"></v-icon>-->
<!--                      </v-card>-->
<!--                    </template>-->

                    <template v-slot:title>
                      <v-row align="start">
                        <v-col cols="8">
                          <div class="description font-weight-bold text-amber text-h5">
                                <Textarea
                                    :min-height="'auto'"
                                    :value="i.description || t('teamUp.emptyDescription')"
                                    :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                                    readonly>
                                  </Textarea>
                          </div>
                        </v-col>
                        <v-col cols="auto" align="right" class="d-flex ga-1">
                          <v-badge
                              class="badge-flavor teamUp-tag-badge"
                              color="transparent"
                              v-for="(tag,tagIndex) in i.tags"
                              :key="tagIndex"
                              :content="t(`teamUp.tags.${tag}`)"
                              inline
                          ></v-badge>
                        </v-col>
                      </v-row>
                    </template>

                    <template v-slot:subtitle>
                      <v-row class="mt-4 font-weight-light" align="center">
                        <v-col cols="auto">
                          <v-icon icon="mdi-account" class="mr-1" size="17"></v-icon>
                          <template v-if="i.username">
                            {{ i.username || t('teamUp.emptyUsername') }}
                          </template>
                          <template v-else>
                            {{ t('teamUp.emptyUsername') }}
                          </template>
                        </v-col>
                        <v-col cols="auto">
                          <v-icon icon="mdi-calendar-range" class="mr-1" size="17"></v-icon>
                          <TimeView :time="formatTimestamp(i.createdAt)"></TimeView>
                        </v-col>
                        <v-col cols="auto">
                          <v-icon :icon="i.source?.platform && i.source.platform !== 'web' ? 'mdi-robot' : 'mdi-web'"
                                  class="mr-1" size="17"></v-icon>
                          {{ onSourceLabel(i) }}
                        </v-col>
                        <v-col cols="auto" v-tooltip="`${t('teamUp.hornValidTimeTooltip')}: ${new Date(formatTimestamp(i.expiresAt)).toLocaleString()}`">
                          <v-icon icon="mdi-update" class="mr-1" size="17"></v-icon>
                          {{ t('teamUp.expiresLabel') }}：{{ getRemainingHornTime(i.expiresAt) }}
                        </v-col>
                      </v-row>
                    </template>

                    <v-row align="start" class="mt-4">
                      <v-col>
                        <div class="d-flex align-center ga-2">
                          {{ t('teamUp.form.player') }}
                          <v-code class="py-0">
                            {{ i.player || t('teamUp.emptyPlayer') }}
                          </v-code>
                        </div>
                        <p class="text-caption opacity-60">{{ t('teamUp.copyPlayerHint', {player: i.player}) }}</p>
                      </v-col>
                      <v-col cols="auto" class="d-flex ga-2">
                        <v-btn variant="tonal" @click="copyToClipboard(i.player)">{{ t('teamUp.copyPlayerBtn') }}</v-btn>

                        <v-icon-btn
                            v-if="authStore.isLogin && authStore.user.userId == i.userId && i.push"
                            :color="getPushColor(i.push.status)"
                            :disabled="!i.push.canRetry"
                            v-tooltip="getPushTooltip(i.push)"
                            @click="onRetryPush(i)">
                          <v-icon icon="mdi-qqchat" size="20"></v-icon>
                        </v-icon-btn>

                        <v-btn
                            variant="tonal"
                            color="red"
                            @click="onDeleteTeamUp(i.id)"
                            v-if="authStore.isLogin && authStore.user.userId == i.userId">
                          {{ t('teamUp.deleteBtn') }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-list-item>
                </template>
                <template v-slot:loading>
                  <v-btn density="comfortable" icon>
                    <Loading :size="42"></Loading>
                  </v-btn>
                </template>
                <template v-slot:load-more="{ props }">
                  <v-btn
                      icon="mdi-refresh"
                      size="small"
                      variant="text"
                      v-bind="props"
                  ></v-btn>
                </template>
              </v-infinite-scroll>
            </v-list>
          </template>
          <template v-else-if="teams.length <= 0">
            <v-card variant="text" class="mt-5 pt-5 pb-5">
              <EmptyView>
                <div class="mt-5">
                  <v-btn @click="getTeams(getTeamsType.none)" class=" btn-flavor" variant="elevated">
                    <v-icon :class="[
                teamsLoading ?  'spin-icon-load' : ''
            ]" icon="mdi-refresh" size="20"/>
                  </v-btn>
                </div>
              </EmptyView>
            </v-card>
          </template>

          <!-- 会话重连 S -->
          <v-dialog max-width="500">
            <template v-slot:default="{ isActive }">
              <v-card title="Dialog">
                <v-card-text>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </v-card-text>

                <v-card-actions>
                  <v-spacer></v-spacer>

                  <v-btn
                      block
                      text="Close Dialog"
                      @click="isActive.value = false"
                  ></v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>

          <v-fab
              :app="true"
              :color="`var(--main-color)`"
              location="right bottom"
              size="large"
              @click="onOpenPush"
              icon>
            <v-icon>mdi-plus</v-icon>

            <v-dialog
                location="bottom"
                v-model="pushModel"
                width="100%">
              <v-container>
                <v-card border class="team pa-5 mt-10">
                  <v-form ref="pushForm">
                    <v-row class="bg-black mx-n5 my-n5 px-5 py-4">
                      <v-col>
                        <div v-if="authStore.isLogin">
                          <p v-html="t('teamUp.pushLoginInfo', {
                      username: `<u class='text-emphasis'>${authStore.currentUser}</u>`
                      })"></p>
                        </div>
                        <div v-else>
                          <p v-html='t("teamUp.pushLoginInfo", {
                      username: `<u class="text-emphasis">${t("teamUp.emptyUsername")}</u>`
                      })'></p>
                        </div>
                      </v-col>
                    </v-row>

                    <v-row class="mt-8">
                      <v-col cols="12" lg="3">
                        <v-text-field v-model="player"
                                      variant="filled"
                                      density="comfortable"
                                      @update:model-value="onStoragePlayer()"
                                      :rules="pushConfig.rules.player"
                                      :placeholder="t('teamUp.form.player')"></v-text-field>
                      </v-col>
                      <v-col cols="12" lg="3">
                        <v-select density="comfortable"
                                  v-model="expiresMinutesAt"
                                  :label="t('teamUp.form.time')"
                                  item-title="label"
                                  item-value="value"
                                  :items="pushConfig.time">
                        </v-select>
                      </v-col>
                      <v-col cols="12" lg="6">
                        <v-combobox
                            :label="t('teamUp.form.tagsLabel')"
                            chips
                            multiple
                            density="comfortable"
                            v-model="tags"
                            clearable
                            @update:modelValue="onStoragePlayer"
                            item-title="label"
                            item-value="value"
                            :hide-no-data="true"
                            :items="pushConfig.tags"></v-combobox>
                      </v-col>
                      <v-col cols="12" lg="12" v-if="authStore.isLogin">
                        <div class="d-flex flex-wrap ga-3 align-center">
                          <v-checkbox
                              v-model="pushSyncEnabled"
                              :label="t('teamUp.form.pushSync')"
                              color="amber"
                              density="comfortable"
                              hide-details
                              class="flex-grow-0"
                              @update:model-value="onStoragePushTargets"></v-checkbox>

                          <v-select
                              v-model="pushTargetPlatform"
                              :items="pushTargets.filter((p) => p.bound)"
                              item-title="label"
                              item-value="value"
                              :label="t('teamUp.form.pushPlatform')"
                              density="comfortable"
                              variant="filled"
                              hide-details
                              :loading="pushTargetsLoading"
                              :disabled="!pushSyncEnabled || !pushAccess.allowed"
                              style="max-width: 180px;"
                              @update:model-value="onPushPlatformChange"></v-select>

                          <v-select
                              v-model="pushBotIds"
                              :items="currentPushBots"
                              :item-title="onPushBotTitle"
                              item-value="id"
                              :label="t('teamUp.form.pushRobots')"
                              multiple
                              chips
                              closable-chips
                              density="comfortable"
                              variant="filled"
                              hide-details
                              :disabled="!pushSyncEnabled || !pushAccess.allowed || !currentPlatformBound"
                              style="min-width: 280px; flex: 1;"
                              @update:model-value="onStoragePushTargets"></v-select>
                        </div>
                        <template v-if="pushSyncEnabled">
                          <p class="text-caption opacity-60 mt-1" v-if="pushAccess.checked && !pushAccess.allowed">
                            {{ t('teamUp.form.syncToQqSubscriptionRequired') }}
                          </p>
                          <p class="text-caption opacity-60 mt-1" v-else-if="!pushTargets.some((p) => p.bound)">
                            {{ t('teamUp.form.syncToQqBindingRequired') }}
                          </p>
                          <p class="text-caption opacity-60 mt-1" v-else>
                            {{ t('teamUp.form.syncToQqHint') }}
                          </p>
                        </template>
                      </v-col>
                      <v-spacer></v-spacer>
                    </v-row>
                    <Textarea
                        ref="descriptionEditor"
                        v-model="description"
                        :placeholder="t('teamUp.form.descriptionPlaceholder')"
                        :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                        :height="'300px'"
                        @focused="onStoragePlayer"
                        @blur="onStoragePlayer"></Textarea>

                    <v-row class="mt-4 pa-2">
                      <v-spacer></v-spacer>
                      <v-btn-group border>
                        <v-btn variant="text" width="80" @click="pushModel = false">{{ t('basic.button.cancel') }}</v-btn>
                        <v-btn @click="pushTeamInfo" color="#000" width="200" :loading="pushLoading">{{ t('teamUp.form.publishBtn') }}</v-btn>
                      </v-btn-group>
                    </v-row>
                  </v-form>
                </v-card>
              </v-container>
            </v-dialog>
          </v-fab>

          <AdsWidget class="my-5" id="none"></AdsWidget>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<style scoped lang="less">
.team {
  .team-icon {
    background-color: var(--main-color) !important;
  }

  .teamUp-tag-badge {
    color: hsl(from var(--main-color) h s calc(l * 0.3));
  }

  .description {
    line-height: 1.1rem;
    overflow: auto;
    max-height: 80px;
  }

  .text-emphasis {
    color: var(--main-color) !important;
    font-size: 20px;
  }
}
</style>

<style>
.team .text-emphasis {
  color: var(--main-color) !important;
}
</style>
