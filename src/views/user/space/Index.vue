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
      <!-- Banner S -->
      <v-card min-height="200" class="d-flex flex-column justify-space-between mt-13 rounded-0">
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
            <v-breadcrumbs class="pa-0 mb-3">
              <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
              <v-breadcrumbs-divider></v-breadcrumbs-divider>
              <v-breadcrumbs-item>{{ t('space.title') }}</v-breadcrumbs-item>
            </v-breadcrumbs>

            <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
              <v-icon icon="mdi-account" size="200"></v-icon>
            </div>
          </v-container>

          <v-container class="pa-0 px-2 mt-auto d-flex align-end">
            <v-row dense>
              <v-col cols="9">
                <v-tabs
                    model-value="MeSpace"
                    color="amber"
                    stacked
                    align-tabs="start"
                    density="comfortable"
                    class="primary-tabs"
                    v-if="isSelf">
                  <v-tab value="MeAccount" class="font-weight-bold text-subtitle-1 px-8" :to="{ name: 'AccountInformation' }">
                    {{ t('account.title') }}
                  </v-tab>
                  <v-tab value="MeDataCenter" class="font-weight-bold text-subtitle-1 px-8" :to="{ name: 'AccountDataCenter' }">
                    {{ t('account.dataCenter.title') }}
                  </v-tab>
                  <v-tab value="MeMessageCenter" class="font-weight-bold text-subtitle-1 px-8" :to="{ name: 'AccountMessages' }">
                    {{ t('account.messages.messageCenterTitle') }}
                  </v-tab>
                  <v-tab value="MeSpace"
                         class="font-weight-bold text-subtitle-1 px-8 v-tab--route-active"
                         :to="assemblysRoute">
                    {{ t('space.title') }}
                  </v-tab>
                </v-tabs>

                <template v-if="!isSelf">
                  <div class="mb-5 d-flex ga-2 align-center flex-wrap">
                    <RolesTagWidget :data="userData.role || []"></RolesTagWidget>
                    <v-chip v-if="userData.lastOnlineTime">
                      {{ t('space.lastOnlineTime') }}：
                      <Time :time="userData.lastOnlineTime"/>
                    </v-chip>
                    <v-chip v-if="userData.joinTime">
                      {{ t('space.joinTime') }}：
                      <Time :time="userData.joinTime"/>
                    </v-chip>
                    <!-- 发私信入口（登录用户且对方未禁用 DM） -->
                    <v-btn
                        v-if="authStore.isLogin && (userData.attr?.dmEnabled !== false)"
                        color="amber" variant="tonal" size="small"
                        :to="`/account/messages?peerId=${targetUserId}`">
                      <v-icon size="16" class="mr-1">mdi-message-outline</v-icon>
                      {{ t('space.sendMessage') }}
                    </v-btn>
                  </div>
                </template>
              </v-col>
              <v-col cols="3" class="d-flex align-center justify-end">
                <div class="d-flex align-center">
                  <template v-if="isSelf">
                    <h2 class="text-h4 font-weight-bold d-flex align-center">
                      <u class="u">{{ authStore.currentUser || 'Captain' }}</u>
                    </h2>
                  </template>
                  <template v-else>
                    <h2 class="text-h4 font-weight-bold d-flex align-center">
                      <v-card border class="mr-4">
                        <UserAvatar :src="userData.userAvatar" v-if="userData.userAvatar" size="36"></UserAvatar>
                        <v-avatar size="44" v-else>
                          <v-icon icon="mdi-account" size="24"></v-icon>
                        </v-avatar>
                      </v-card>
                      <u class="u">{{ userData.username || 'Captain' }}</u>
                    </h2>
                  </template>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </template>
      </v-card>
      <!-- Banner E -->

      <v-divider></v-divider>

      <!-- 下方内容区域 S -->
      <div class="account-root">
        <div class="setting-page-root">
          <v-container>
            <div :class="{'d-flex flex-row': !mobile}">
              <div :class="{'mb-10 tabs-box-mobile': mobile, 'tabs-box-desktop': !mobile}">
                <AffixContainerView>
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
import {SpaceUserResult} from '@/assets/types/User';

import Silk from '@/components/Silk.vue';
import EmptyView from '@/components/EmptyView.vue';
import RolesTagWidget from '@/components/RolesTagWidget.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import Time from '@/components/Time.vue';
import AffixContainerView from '@/components/AffixContainerView.vue';

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

// 子 Tab 路由基础路径
const basePath = computed(() => {
  return route.params.id ? `/space/${route.params.id}` : '/space';
});

const assemblysRoute = computed(() => `${basePath.value}/assemblys`);
const teamupsRoute = computed(() => `${basePath.value}/teamups`);

const currentSubTab = computed(() => {
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
.space-page-root {
  min-height: calc(100vh - 64px);
}

// 与账户页一致：强制隐藏 slide-group 箭头，一级 Tab 激活色不依赖内部 selected
.primary-tabs :deep(.v-slide-group__prev),
.primary-tabs :deep(.v-slide-group__next),
.secondary-tabs :deep(.v-slide-group__prev),
.secondary-tabs :deep(.v-slide-group__next) {
  display: none !important;
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
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
