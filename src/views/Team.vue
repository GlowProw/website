<script setup lang="ts">
import {useAuthStore} from "~/stores/userAccountStore";
import {onMounted, onUnmounted, type Ref, ref, triggerRef, type UnwrapRef} from "vue";
import {useRouter} from "vue-router";
import EmptyView from "@/components/EmptyView.vue";
import {apis, http, storage, ws, getBrowserFingerprint} from "@/assets/sripts";
import TimeView from "@/components/TimeView.vue";
import {useI18n} from "vue-i18n";
import type {VForm} from "vuetify/components";
import Banner from "@/components/Banner.vue";
import Loading from "@/components/Loading.vue";
import Textarea from "@/components/textarea/index.vue";
import {useNoticeStore} from "~/stores/noticeStore";
import AdsWidget from "@/components/ads/google/index.vue";
import {ApiError} from "@/assets/types/Api";
import {handleApiError} from "@/assets/sripts/error_handler";
import Silk from "@/components/Silk.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const authStore = useAuthStore(),
    notice = useNoticeStore(),
    {t} = useI18n()

interface Teams {
  id: string | number
  username: string
  expiresAt: number
  createdAt: number
  description: string
  player: string
  tags: string[]
  userId?: string
}

enum getTeamsType {
  none,
  load
}

const MAX_WS_DURATION = 20 * 60 * 1000; // 最长 20 分钟 WebSocket 连接
let wsAutoDisconnectTimer: ReturnType<typeof setTimeout> | null = null;

let teams: Ref<any[]> = ref([]),
    page = ref(1),
    limit = ref(20),
    total = ref(0),
    totalPages = ref(1),

    // 服务
    service = ref({
      status: 0,
      loading: false,
    }),

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

// 清理定时器
const clearWsTimer = () => {
  if (wsAutoDisconnectTimer) {
    clearTimeout(wsAutoDisconnectTimer);
    wsAutoDisconnectTimer = null;
  }
}

// 开启 20 分钟倒计时断开
const startWsTimer = () => {
  clearWsTimer();
  wsAutoDisconnectTimer = setTimeout(() => {
    if (ws.connected) {
      ws.close();
      service.value.status = -1;
      notice.info(t('teamUp.wsTimeoutTip'));
    }
  }, MAX_WS_DURATION);
}

// 监听浏览器 Tab 标签离开 / 隐藏
const handleVisibilityChange = () => {
  if (document.hidden) {
    clearWsTimer();
    if (ws.connected) {
      ws.close();
      service.value.status = -1;
    }
  }
}

onMounted(async () => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
  initWss();
  await getTeams(getTeamsType.none);
  readStoragePlayer();
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  clearWsTimer();
  ws.close();
})

/**
 * 获取组队列表
 */
const getTeams = async (type: getTeamsType = getTeamsType.none) => {
  try {
    teamsLoading.value = true;

    if (type === getTeamsType.none) {
      page.value = 1;
      // 刷新列表时，若 WebSocket 未连接且页面可见，主动重连 WebSocket
      if (!ws.connected && !document.hidden) {
        initWss();
      }
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
    handleApiError(e, notice, t, { component: 'Team' });
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

    if (ws.connected) {
      const message = {
        type: 'publish_team_up',
        payload: {
          player: player.value,
          description: description.value,
          tags: selectedTags,
          expiresMinutesAt: expiresMinutesAt.value,
          fingerprint
        }
      };
      ws.send(JSON.stringify(message));
    } else {
      await apis.teamupApi().createTeamup({
        player: player.value,
        description: description.value,
        tags: selectedTags,
        expiresMinutesAt: expiresMinutesAt.value,
        fingerprint
      });
      notice.success(t('basic.tips.teamUp.pushSuccess'));
      onCleanPushInfo();
      await getTeams(getTeamsType.none);
      pushLoading.value = false;
      pushModel.value = false;
    }
  } catch (e) {
    pushLoading.value = false;
    handleApiError(e, notice, t, { component: 'Team' });
  }
}

/**
 * 取消发布
 */
const onDeleteTeamUp = async (id: string | number) => {
  try {
    if (!id) return;

    if (ws.connected) {
      const message = {
        type: 'cancel_team_up',
        payload: {id}
      };
      ws.send(JSON.stringify(message));
    } else {
      await apis.teamupApi().deleteTeamup(id);
      notice.success(t('teamUp.deleteSuccess'));
      teams.value = teams.value.filter(item => item.id !== id);
    }
  } catch (e) {
    handleApiError(e, notice, t, { component: 'Team' });
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

/**
 * WebSocket 初始化与事件监听
 */
const initWss = () => {
  if (document.hidden) return;

  ws.start();

  ws.on('open', () => {
    if (authStore.isLogin && ws.connected) {
      ws.send(
        JSON.stringify({
          type: 'authenticate', payload: {token: authStore.user?.token}
        })
      );
    }
    service.value.status = 1;
    startWsTimer();
  });

  ws.on('close', () => {
    service.value.status = -1;
    clearWsTimer();
  });

  ws.on('error', (error: any) => {
    service.value.status = -1;
    clearWsTimer();
  });

  ws.on('message', (event: MessageEvent) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (!data || !data.type) return;

      switch (data.type) {
        case 'new_team_up':
          notice.success(t('basic.tips.teamUp.pushSuccess'));
          onCleanPushInfo();
          getTeams(getTeamsType.none);
          pushLoading.value = false;
          pushModel.value = false;
          break;

        case 'cancel_team_up':
          const idToRemove = data.payload?.id;
          if (idToRemove) {
            teams.value = teams.value.filter(item => item.id !== idToRemove);
          }
          break;

        case 'team_up_expired':
          const idToExpire = data.payload?.id;
          if (idToExpire) {
            teams.value = teams.value.filter(item => item.id !== idToExpire);
          } else {
            getTeams(getTeamsType.none);
          }
          break;

        case 'publish_rate_limit':
          let _remainingTime = 1;
          if (data.code === 'teamUp.anonymous.rateLimit' || data.code === 'teamUp_anonymous_rateLimit') {
            _remainingTime = Math.ceil((data.remainingTime || 3600000) / 1000 / 60);
          } else if (data.code === 'teamUp.account.rateLimit' || data.code === 'teamUp_account_rateLimit') {
            _remainingTime = Math.ceil((data.remainingTime || 120000) / 1000 / 60);
          }

          notice.warning(t(`basic.tips.${data.code}`, {remainingTime: _remainingTime}) || `发布频繁，请${_remainingTime}分钟后再试`);
          pushLoading.value = false;
          pushModel.value = false;
          break;

        case 'auth_failed':
          notice.warning(t(`basic.tips.${data.code}`) || '认证失败');
          authStore.logout();
          break;

        case 'error':
          console.error('WS error message:', data);
          notice.error(t(`basic.tips.teamUp.error`, {
            context: data.message || '操作失败'
          }));
          pushLoading.value = false;
          break;
      }
    } catch (err) {
      console.error('解析 WS 消息失败:', err);
    }
  });
}

const onWsReconnect = () => {
  service.value.loading = true;
  ws.close();
  clearWsTimer();
  initWss();
  setTimeout(() => {
    service.value.loading = false;
  }, 1000);
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
        <v-container class="pa-2 mt-4 position-relative">
          <v-breadcrumbs>
            <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
            <v-breadcrumbs-divider></v-breadcrumbs-divider>
            <v-breadcrumbs-item>{{ t('teamUp.title') }}</v-breadcrumbs-item>
          </v-breadcrumbs>

          <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
            <v-icon icon="mdi-account-heart" size="120"></v-icon>
            <v-icon icon="mdi-assistant" size="120"></v-icon>
            <v-icon icon="mdi-ship-wheel" size="120"></v-icon>
          </div>
        </v-container>
      </template>
    </v-card>
    <v-divider></v-divider>
    <AffixContainerView :offsetTop="55">
      <div class="bg-black">
        <v-container>
          <v-row>
            <v-col cols="12" sm="12" md="6" lg="3" xl="6">
              <v-btn @click="pushModel = true" class="h-100 mr-1" variant="elevated">
                <v-icon icon="mdi-plus"></v-icon>
                {{ t('teamUp.pushBtn') }}
              </v-btn>

              <v-btn @click="getTeams(getTeamsType.none)" class="h-100" variant="elevated">
                <v-icon :class="[
                teamsLoading ?  'spin-icon-load' : ''
            ]" icon="mdi-refresh" size="20"/>
              </v-btn>

            </v-col>
            <v-col cols="12" sm="12" md="6" lg="3" xl="6" class="d-flex justify-md-end">
              <v-btn class="d-lg-block w-sm-100 w-lg-auto w-xl-auto h-100" variant="tonal">
                <template v-if="service.status == 1">
                  {{ t('teamUp.service.normal') }}
                </template>
                <template v-if="service.status == -1">
                  {{ t('teamUp.service.disconnected') }}
                  <v-btn class="ml-2" :loading="service.loading" :disabled="service.loading" density="compact" @click="onWsReconnect">
                    {{ t('teamUp.service.reconnect') }}
                  </v-btn>
                </template>
                <template v-if="service.status == 0">
                  {{ t('teamUp.service.unsubscribed') }}
                  <v-btn class="ml-2" :loading="service.loading" :disabled="service.loading" density="compact" @click="onWsReconnect">
                    {{ t('teamUp.service.connect') }}
                    <v-icon icon="mdi-rotate-right"></v-icon>
                  </v-btn>
                </template>
                <v-badge dot offset-x="-10" offset-y="-15" :color="service.status == 1 ? '#2ec70d' : 'red'"></v-badge>
                <v-divider class="mt-n2 mb-n2 ml-5 mr-3" vertical></v-divider>
                <v-icon icon="mdi-help-circle-outline" v-tooltip="t('teamUp.service.tooltip')"></v-icon>
              </v-btn>
            </v-col>
            <v-col cols="12" sm="6" md="12" lg="3" xl="3">
              <v-select v-model="filtering.sortBy"
                        @update:modelValue="onTeamSortBy"
                        density="comfortable"
                        variant="solo-filled"
                        :label="t('teamUp.filter.sortLabel')"
                        hide-details
                        item-title="label"
                        item-value="value"
                        :items="[{value: 'recent', label: t('teamUp.filter.sortByRecent')},{value: 'expires', label: t('teamUp.filter.sortByExpires')}]">
              </v-select>
            </v-col>
            <v-col cols="12" sm="6" md="12" lg="3" xl="3">
              <v-text-field :placeholder="t('basic.button.search')"
                            hide-details
                            variant="solo-filled"
                            density="comfortable" v-model="filtering.keyword">
                <template v-slot:append-inner>
                  <v-btn density="compact" :disabled="!filtering.keyword" icon @click="onSearch">
                    <v-icon icon="mdi-search-web"></v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </div>
      <v-divider></v-divider>
    </AffixContainerView>

    <v-container class="team">
      <div class="fill-height">
        <AdsWidget class="my-5" id="none"></AdsWidget>

        <template v-if="teams.length > 0">
          <div class="mt-5">
            <v-infinite-scroll :items="teams"
                               mode="manual"
                               @load="onTeamLoad">
              <template v-for="(i, index) in teams" :key="index">
                <v-card card border variant="flat" class="bg-black">
                  <v-row class="ma-5">
                    <v-col cols="3" sm="2" md="1" lg="1">
                      <v-avatar class="mr-2 team-icon" size="70">
                        <v-icon
                            icon="mdi-access-point"
                            size="50"
                        ></v-icon>
                      </v-avatar>
                    </v-col>
                    <v-col cols="9" sm="9" md="11" lg="11">
                      <div class="mb-2">
                        <v-row align="center">
                          <v-col cols="8">
                            <div class="description">
                              <b class="mr-3 text-emphasis">
                                <Textarea
                                    :min-height="'40px'"
                                    :value="i.description || t('teamUp.emptyDescription')"
                                    :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                                    :readonly="true">
                                </Textarea>
                              </b>
                            </div>
                          </v-col>
                          <v-spacer></v-spacer>
                          <v-col cols="3" align="right" class="mr-2">
                            <v-badge
                                class="badge-flavor teamUp-tag-badge mr-1"
                                color="transparent"
                                v-for="(tag,tagIndex) in i.tags"
                                :key="tagIndex"
                                :content="t(`teamUp.tags.${tag}`)"
                                inline
                            ></v-badge>
                          </v-col>
                        </v-row>
                      </div>
                      <v-row class="pl-2 mb-2 font-weight-light" justify="start" align="center">
                        <div class="mr-3">
                          <v-icon icon="mdi-account" class="mr-1" size="17"></v-icon>
                          <template v-if="i.username">
                            {{ i.username || t('teamUp.emptyUsername') }}
                          </template>
                          <template v-else>
                            {{ t('teamUp.emptyUsername') }}
                          </template>
                        </div>
                        <div class="mr-3">
                          <v-icon icon="mdi-calendar-range" class="mr-1" size="17"></v-icon>
                          <TimeView :time="formatTimestamp(i.createdAt)">
                          </TimeView>
                        </div>
                        <div v-tooltip="`${t('teamUp.hornValidTimeTooltip')}: ${new Date(formatTimestamp(i.expiresAt)).toLocaleString()}`">
                          <v-icon icon="mdi-update" class="mr-1" size="17"></v-icon>
                          {{ t('teamUp.expiresLabel') }}：{{ getRemainingHornTime(i.expiresAt) }}
                        </div>
                      </v-row>
                    </v-col>
                  </v-row>
                  <v-divider opacity=".08" class="mt-0 mb-0"></v-divider>
                  <v-row class="pl-10 pr-5" align="center">
                    <v-col>
                      <v-text-field langth="10"
                                    width="300"
                                    :label="t('teamUp.copyPlayerHint', { player: i.player })"
                                    variant="underlined"
                                    :placeholder="t('teamUp.form.player')"
                                    :value="i.player || t('teamUp.emptyPlayer')">
                        <template v-slot:append-inner>
                          <v-btn density="compact" @click="copyToClipboard(i.player)">{{ t('teamUp.copyPlayerBtn') }}</v-btn>
                        </template>
                      </v-text-field>
                    </v-col>
                    <v-spacer></v-spacer>
                    <v-col align="right">
                      <v-btn class="btn-flavor" @click="onDeleteTeamUp(i.id)" v-if="authStore.isLogin && authStore.user.userId == i.userId">
                        {{ t('teamUp.deleteBtn') }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card>
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
          </div>
        </template>
        <template v-else-if="teams.length <= 0">
          <v-card card border class="mt-5 pt-5 pb-5">
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
            @click="pushModel = true"
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
                    <v-spacer></v-spacer>
                  </v-row>
                  <Textarea
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
      </div>
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
