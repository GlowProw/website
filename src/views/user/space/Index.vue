<template>
  <div class="space-page-root">
    <!-- 空间未公开 S -->
    <v-card v-if="spaceBlocked" min-height="300" class="d-flex flex-column justify-center align-center mt-13 rounded-0 pa-10">
      <v-icon icon="mdi-lock-outline" size="64" color="amber" class="mb-4"></v-icon>
      <EmptyView>
        <template v-slot:title>{{ t('space.disabled') }}</template>
        <template v-slot:description>{{ t('space.disabledHint') }}</template>
      </EmptyView>
    </v-card>
    <!-- 空间未公开 E -->

    <template v-else>
      <v-card min-height="200px" class="d-flex flex-column justify-space-between mt-13">
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
              <v-breadcrumbs-item>{{ t('space.title') }}</v-breadcrumbs-item>
            </v-container>
          </v-breadcrumbs>
          <v-divider opacity=".01"></v-divider>

          <v-container class="pa-2 position-relative">
            <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
              <v-icon icon="mdi-account" size="200"></v-icon>
            </div>
          </v-container>

          <v-container class="pa-0 px-2 mt-auto d-flex align-end">
            <v-row density="compact" align="end">
              <v-col cols="9">
                <v-tabs
                    :model-value="primaryNavMenu"
                    color="amber"
                    stacked
                    align-tabs="start"
                    density="comfortable"
                    class="primary-tabs"
                    v-if="isSelf">
                  <v-tab v-for="item in primaryNavItems"
                         :key="item.value"
                         :value="item.value"
                         class="font-weight-bold text-subtitle-1 px-8"
                         :class="{'v-tab--route-active': primaryNavMenu === item.value}"
                         :to="{ name: item.route }">
                    {{ t(item.name) }}
                  </v-tab>
                </v-tabs>

                <template v-if="!isSelf">
                  <v-tabs stacked
                          align-tabs="start"
                          density="comfortable"
                          class="primary-tabs">
                    <div class="d-flex ga-2 align-center flex-wrap">
                      <RolesTagWidget :data="userData.role || []"></RolesTagWidget>
                      <v-chip v-if="userData.lastOnlineTime">
                        {{ t('space.lastOnlineTime') }}：
                        <Time :time="userData.lastOnlineTime"/>
                      </v-chip>
                      <v-chip v-if="userData.joinTime">
                        {{ t('space.joinTime') }}：
                        <Time :time="userData.joinTime"/>
                      </v-chip>
                      <!-- 发私信入口 S -->
                      <template v-if="authStore.isLogin && (userData.attr?.dmEnabled !== false)">
                        <v-divider vertical inset></v-divider>
                        <v-chip
                            color="amber"
                            variant="tonal"
                            class="rounded-xl"
                            :to="`/account/messages?peerId=${targetUserId}`">
                          <v-icon size="16" class="mr-1">mdi-message-outline</v-icon>
                          {{ t('space.sendMessage') }}
                        </v-chip>
                      </template>
                      <!-- 发私信入口 E -->
                    </div>
                  </v-tabs>
                </template>
              </v-col>
              <v-col cols="3" class="d-flex align-center justify-end">
                <div class="d-flex align-center">
                  <template v-if="!isSelf">
                    <h2 class="singe-line text-h4 font-weight-bold d-flex align-center">
                      <u class="u">{{ userData.username || 'Captain' }}</u>
                    </h2>
                  </template>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </template>
      </v-card>
      <v-divider opacity=".06"></v-divider>

      <!-- 下方内容区域 S -->
      <div class="account-root">
        <div class="setting-page-root">
          <v-container>
            <div :class="{'d-flex flex-row': !mobile}">
              <div :class="{'mb-10 tabs-box-mobile': mobile, 'tabs-box-desktop': !mobile}">
                <AffixContainerView :scrollable="!mobile ? false : true">
                  <VerticalScrollList
                      :disabled="mobile"
                      :is-indicator="false"
                      :show-controls="false"
                      :force-draggable="false"
                      :wheel-scroll="true"
                      height="100%">
                    <v-tabs
                        stacked
                        border
                        hide-slider
                        :show-arrows="false"
                        :model-value="currentSubTab"
                        class="w-100 h-100 secondary-tabs"
                        :fixed="mobile"
                        :direction="!mobile ? 'vertical' : 'horizontal'">
                      <template v-for="(tabItem, index) in spaceSubTabs" :key="index">
                        <v-tooltip content-class="pa-0" :target="[tooltipPos.x, tooltipPos.y]">
                          <template v-slot:default>
                            <v-card border class="py-3 px-10">
                              {{ t(tabItem.name) }}
                            </v-card>
                          </template>
                          <template v-slot:activator="{props: tooltipProps}">
                            <div :class="{'mb-2': !mobile, 'mr-5': mobile}">
                              <v-tab
                                  :value="tabItem.value"
                                  :to="tabItem.to"
                                  selected-class="bg-amber"
                                  class="d-flex align-center justify-center"
                                  min-width="80"
                                  width="80"
                                  height="80"
                                  border
                                  @mousemove="onMouseMove"
                                  @mouseenter="onMouseEnter"
                                  v-bind="tooltipProps"
                                  ripple
                                  slim>
                                <div>
                                  <v-icon size="40">{{ tabItem.icon }}</v-icon>
                                </div>
                              </v-tab>
                              <p class="mt-1 mb-3 text-center singe-line w-100 tab-item" :title="t(tabItem.name)">
                                {{ t(tabItem.name) }}
                              </p>
                            </div>
                          </template>
                        </v-tooltip>
                      </template>
                    </v-tabs>
                  </VerticalScrollList>
                </AffixContainerView>
              </div>

              <!-- 右侧视窗内容 S -->
              <div class="setting-content flex-grow-1 flex-shrink-1 w-100 pl-lg-5">
                <router-view></router-view>
              </div>
              <!-- 右侧视窗内容 E -->
            </div>
          </v-container>
        </div>
      </div>
      <!-- 下方内容区域 E -->
    </template>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, provide, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useDisplay} from 'vuetify/framework';
import {useI18n} from 'vue-i18n';
import {apis} from '@/assets/sripts';
import {ApiError} from '@/assets/types/Api';
import {useNoticeStore} from '~/stores/noticeStore';
import {useAuthStore} from '~/stores/userAccountStore';
import {handleApiError} from '@/assets/sripts/error_handler';
import {useTooltipFollow} from '@/assets/sripts/use_tooltip_follow';
import {primaryNavItems} from '@/assets/sripts/nav_menu';
import {SpaceUserResult} from '@/assets/types/User';

import Silk from '@/components/Silk.vue';
import EmptyView from '@/components/EmptyView.vue';
import RolesTagWidget from '@/components/RolesTagWidget.vue';
import Time from '@/components/Time.vue';
import AffixContainerView from '@/components/AffixContainerView.vue';
import VerticalScrollList from '@/components/VerticalScrollList.vue';

const route = useRoute();
const router = useRouter();
const notice = useNoticeStore();
const authStore = useAuthStore();
const {mobile} = useDisplay();
const {t} = useI18n();
const {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow();

const spaceBlocked = ref(false);
const loadingUser = ref(true);
const userData = ref<Partial<SpaceUserResult>>({});

// 目标用户 ID：优先 route.params.id，缺省时使用当前登录用户 ID
const targetUserId = computed(() => {
  return (route.params.id as string) || (authStore.user?.userId ? String(authStore.user.userId) : '');
});

// 是否为登录用户自己的空间
const isSelf = computed(() => {
  if (!authStore.isLogin) return false;
  const currentUid = authStore.user?.userId;
  return !!currentUid && String(currentUid) === String(targetUserId.value);
});

// 一级导航菜单固定激活为空间
const primaryNavMenu = computed<string>(() => 'MeSpace');

// 子 Tab 路由基础路径
const basePath = computed(() => {
  return route.params.id ? `/space/${route.params.id}` : '/space';
});

const assemblysRoute = computed(() => `${basePath.value}/assemblys`);
const teamupsRoute = computed(() => `${basePath.value}/teamups`);
const rankingsRoute = computed(() => `${basePath.value}/rankings`);

const currentSubTab = computed(() => {
  if (route.name === 'SpaceRankings' || route.name === 'SpaceUserRankings' || route.path.endsWith('/rankings')) {
    return 'ranking';
  }
  if (route.name === 'SpaceTeamups' || route.name === 'SpaceUserTeamups' || route.path.endsWith('/teamups')) {
    return 'teamUp';
  }
  return 'assembly';
});

const spaceSubTabs = computed(() => [
  {
    name: 'assembly.title',
    value: 'assembly',
    icon: 'mdi-palette-outline',
    to: assemblysRoute.value,
  },
  {
    name: 'teamUp.title',
    value: 'teamUp',
    icon: 'mdi-bullhorn-outline',
    to: teamupsRoute.value,
  },
  {
    name: 'rankingDesignedItems.title',
    value: 'ranking',
    icon: 'mdi-format-list-numbered',
    to: rankingsRoute.value,
  },
]);

const getUserInfo = async () => {
  const uid = targetUserId.value;
  if (!uid) return;

  try {
    loadingUser.value = true;
    spaceBlocked.value = false;

    const result = await apis.userApi().getSpaceUserInfo(uid);
    userData.value = result.data?.data || {};
  } catch (e) {
    if (e instanceof ApiError && (e.code === 'user.spaceDisabled' || e.code === 'user.notFound')) {
      spaceBlocked.value = true;
      userData.value = {};
    } else {
      handleApiError(e, notice, t, {component: 'UserSpace'});
    }
  } finally {
    loadingUser.value = false;
  }
};

watch(() => route.params.id, () => {
  getUserInfo();
});

onMounted(() => {
  getUserInfo();
});

provide('spaceContext', {
  targetUserId,
  isSelf,
  userData,
  loadingUser,
  spaceBlocked,
});

defineOptions({
  name: 'SpaceIndex',
});
</script>

<style scoped lang="less">
@import "@/assets/styles/tabs-nav";

.tabs-nav-control();

.space-page-root {
  min-height: calc(100vh - 64px);

  .primary-tabs {
    border-bottom: none;
  }
}

.secondary-tabs {
  :deep(.v-tab.bg-amber),
  :deep(.v-tab.v-tab--selected),
  :deep(.v-tab--selected) {
    color: #000000 !important;

    .v-icon,
    i {
      color: #000000 !important;
    }
  }
}

.primary-tabs :deep(.v-tab--route-active) {
  color: #ffc107 !important;
}

.tabs-box-desktop {
  width: 80px;
}

.tabs-box-mobile {
  width: 100%;
}

.tab-item {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
