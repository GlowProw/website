<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";
import {useI18n} from "vue-i18n";
import {useAuthStore} from "~/stores/userAccountStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import {apis} from "@/assets/sripts";
import {primaryNavItems} from "@/assets/sripts/nav_menu";

import Silk from "@/components/Silk.vue";
import EmptyView from "@/components/EmptyView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import VerticalScrollList from "@/components/VerticalScrollList.vue";

const route = useRoute(),
    router = useRouter(),
    {mobile} = useDisplay(),
    {t} = useI18n(),
    authStore = useAuthStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow()
const accountTabs = [
  {
    name: 'account.information.title',
    value: 'AccountInformation',
    icon: 'mdi-card-account-details-outline'
  },
  {
    name: 'account.profile-picture.title',
    value: 'AccountProfilePicture',
    icon: 'mdi-face-man-profile'
  },
  {
    name: 'account.achievements.title',
    value: 'AccountAchievements',
    icon: 'mdi-trophy-outline'
  },
  {
    name: 'account.collectionStats.title',
    value: 'AccountCollectionStats',
    icon: 'mdi-chart-donut'
  },
  {
    name: 'account.signin.title',
    value: 'AccountCheckin',
    icon: 'mdi-calendar-check'
  },
  {
    name: 'account.media.title',
    value: 'AccountMedia',
    icon: 'mdi-image-multiple-outline'
  },
  {
    name: 'account.orders.title',
    value: 'AccountOrders',
    icon: 'mdi-receipt-text-outline'
  },
]

// 安全中心：平台绑定 + 登录设备 + 两步验证
const securityTabs = [
  {
    name: 'account.bindings.title',
    value: 'AccountBindings',
    icon: 'mdi-link-variant'
  },
  {
    name: 'account.sessions.title',
    value: 'AccountSessions',
    icon: 'mdi-devices'
  },
  {
    name: 'account.twoFactor.title',
    value: 'AccountTwoFactor',
    icon: 'mdi-shield-lock-outline'
  },
]

// 创作中心：概览 + 配装/评论/组队/地图/举报/回收站
const dataCenterTabs = [
  {
    name: 'account.dataCenter.overview.title',
    value: 'AccountDataCenter',
    icon: 'mdi-chart-line'
  },
  {
    name: 'account.myAssembly',
    value: 'AccountAssemblys',
    icon: 'mdi-package-variant-closed'
  },
  {
    name: 'account.myRankingDesigned',
    value: 'AccountRankingDesigned',
    icon: 'mdi-format-list-numbered'
  },
  {
    name: 'account.myComment',
    value: 'AccountComments',
    icon: 'mdi-comment-text-multiple-outline'
  },
  {
    name: 'account.myTeamup',
    value: 'AccountTeamUps',
    icon: 'mdi-account-group-outline'
  },
  {
    name: 'account.myMap',
    value: 'AccountMaps',
    icon: 'mdi-map-marker-multiple-outline'
  },
  {
    name: 'account.mySmugglersReport',
    value: 'AccountSmugglersReport',
    icon: 'mdi-file-document-outline'
  },
  {
    name: 'account.trash',
    value: 'AccountTrash',
    icon: 'mdi-delete-empty-outline'
  },
]

// 消息中心：消息 + 设置（通知开关在这里）
const messageCenterTabs = [
  {
    name: 'account.messages.title',
    value: 'AccountMessages',
    icon: 'mdi-message-text-outline'
  },
  {
    name: 'account.messages.settings.title',
    value: 'AccountMessagesSettings',
    icon: 'mdi-cog-outline'
  },
]

// 机器人：概览 + 群管理（首次使用只显示引导）
const botTabs = [
  {
    name: 'account.bot.guide.title',
    value: 'AccountBotGuide',
    icon: 'mdi-compass-outline'
  },
  {
    name: 'account.bot.overview.title',
    value: 'AccountBotOverview',
    icon: 'mdi-chart-donut'
  },
  {
    name: 'account.bot.manage.title',
    value: 'AccountBotManage',
    icon: 'mdi-robot-outline'
  },
]

// 判断路由是否属于创作中心大类
const isDataCenterRoute = (routeName: string) => dataCenterTabs.some(i => i.value === routeName)

// 判断路由是否属于消息中心大类
const isMessageCenterRoute = (routeName: string) => messageCenterTabs.some(i => i.value === routeName)

// 判断路由是否属于账户设置大类
const isAccountRoute = (routeName: string) => accountTabs.some(i => i.value === routeName)

// 判断路由是否属于安全中心大类
const isSecurityRoute = (routeName: string) => securityTabs.some(i => i.value === routeName)

// 判断路由是否属于机器人模块
const isBotRoute = (routeName: string) => botTabs.some(i => i.value === routeName)

// 机器人模块是否尚未绑定任何群
const botFirstUse = ref(true)
const botChecked = ref(false)
const botStatusLoading = ref(false)

/**
 * 读取机器人模块准入与绑定状态，决定二级菜单是否只保留引导
 */
const loadBotStatus = async () => {
  if (!authStore.isLogin || botStatusLoading.value) return
  botStatusLoading.value = true
  try {
    const result = await apis.botApi().getStatus()
    botFirstUse.value = Boolean(result.data?.data?.firstUse)
  } catch {
    botFirstUse.value = true
  } finally {
    botChecked.value = true
    botStatusLoading.value = false
  }
}

// 依据当前路由动态计算激活的一级 Tab
const primaryNavMenu = computed<'MeAccount' | 'MeSecurity' | 'MeDataCenter' | 'MeMessageCenter' | 'MeBot' | 'MeSpace'>(() => {
  const routeName = (route.name as string) || ''
  if (isDataCenterRoute(routeName)) return 'MeDataCenter'
  if (isMessageCenterRoute(routeName)) return 'MeMessageCenter'
  if (isSecurityRoute(routeName)) return 'MeSecurity'
  if (isBotRoute(routeName)) return 'MeBot'
  if (isAccountRoute(routeName)) return 'MeAccount'
  return 'MeAccount'
})

// 依据当前路由动态计算激活的二级 Tab 项
const tab = computed(() => (route.name as string) || accountTabs[0].value)

// 当前大类下显示的二级 Tab 列表
const currentSubTabs = computed(() => {
  if (primaryNavMenu.value === 'MeAccount') return accountTabs
  if (primaryNavMenu.value === 'MeSecurity') return securityTabs
  if (primaryNavMenu.value === 'MeDataCenter') return dataCenterTabs
  if (primaryNavMenu.value === 'MeMessageCenter') return messageCenterTabs
  if (primaryNavMenu.value === 'MeBot') {
    // 已绑定群后引导从二级菜单移除，仍可通过「概览」右上角按钮进入
    return botFirstUse.value ? [botTabs[0]] : botTabs.filter(t => t.value !== 'AccountBotGuide')
  }
  return accountTabs
})

// 进入机器人模块时读取最新状态（绑定完成后无需手动刷新页面）
watch(() => route.name, (name) => {
  if (!isBotRoute(String(name || ''))) return
  loadBotStatus()
}, {immediate: true})

// 首次使用且状态已确认时，其余机器人页面统一回落到引导
watch([botChecked, botFirstUse, botStatusLoading, () => route.name], () => {
  if (!botChecked.value || botStatusLoading.value || !botFirstUse.value) return
  if (!isBotRoute(String(route.name || ''))) return
  if (route.name !== 'AccountBotGuide') {
    router.replace({name: 'AccountBotGuide'})
  }
})

defineOptions({
  name: 'AccountIndex'
})
</script>

<template>
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
          <v-breadcrumbs-item>{{ t('account.title') }}</v-breadcrumbs-item>
        </v-container>
      </v-breadcrumbs>
      <v-divider opacity=".01"></v-divider>

      <v-container class="pa-2 position-relative">
        <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
          <v-icon icon="mdi-account" size="200"></v-icon>
        </div>
      </v-container>

      <v-container class="pa-0 px-2 mt-auto d-flex align-end" v-if="authStore.isLogin">
        <v-row density="compact" align="end">
          <v-col cols="9">
            <v-tabs
                :model-value="primaryNavMenu"
                color="amber"
                stacked
                align-tabs="start"
                density="comfortable"
                class="primary-tabs">
              <v-tab v-for="item in primaryNavItems"
                     :key="item.value"
                     :value="item.value"
                     class="font-weight-bold text-subtitle-1 px-8"
                     :class="{'v-tab--route-active': primaryNavMenu === item.value}"
                     :to="{ name: item.route }">
                {{ t(item.name) }}
              </v-tab>
            </v-tabs>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </v-card>
  <v-divider opacity=".06"></v-divider>

  <div class="account-root">
    <div class="setting-page-root" v-if="authStore.isLogin">
      <v-container class="pt-5 pt-lg-0">
        <div :class="{'d-flex flex-row': !mobile}">
          <div :class="{'mb-lg-10 tabs-box-mobile': mobile, 'tabs-box-desktop pt-5': !mobile}">
            <AffixContainerView :scrollable="!mobile ? false : true">
              <VerticalScrollList
                  :disabled="mobile"
                  :is-indicator="false"
                  :show-controls="false"
                  :force-draggable="false"
                  :wheel-scroll="true"
                  height="100%">
                <!-- 二级菜单 -->
                <v-tabs
                    stacked
                    border
                    hide-slider
                    :show-arrows="false"
                    :model-value="tab"
                    class="w-100 secondary-tabs"
                    density="default"
                    :fixed="mobile"
                    :direction="!mobile ? 'vertical' : 'horizontal'">
                  <template v-for="(i, index) in currentSubTabs" :key="index">
                    <v-tooltip content-class="pa-0 tooltip-follow-plain" :target="[tooltipPos.x, tooltipPos.y]">
                      <template v-slot:default>
                        <v-card border class="py-3 px-10">
                          {{ t(i.name) }}
                        </v-card>
                      </template>
                      <template v-slot:activator="{props}">
                        <div :class="{'mb-2': !mobile, 'mr-5': mobile}" v-bind="props">
                          <v-tab
                              :value="i.value"
                              :to="{ name: i.value }"
                              selected-class="bg-amber"
                              class="d-flex align-center justify-center"
                              min-width="80"
                              width="80"
                              height="80"
                              border
                              @mousemove="onMouseMove"
                              @mouseenter="onMouseEnter"
                              ripple
                              slim>
                            <div>
                              <v-icon size="40">{{ i.icon }}</v-icon>
                            </div>
                          </v-tab>
                          <p class="mt-1 mb-3 text-center singe-line w-100 tab-item" :title="t(i.name)">
                            {{ t(i.name) }}
                          </p>
                        </div>
                      </template>
                    </v-tooltip>
                  </template>
                </v-tabs>
              </VerticalScrollList>
            </AffixContainerView>
          </div>

          <div class="setting-content flex-grow-1 flex-shrink-1 w-100 pl-lg-5 pt-5">
            <router-view></router-view>
          </div>
        </div>
      </v-container>
    </div>

    <!-- 未登录提示 S -->
    <div v-else class="setting-page-root">
      <v-container class="py-16 text-center">
        <EmptyView>
          <template v-slot:title>
            <h3 class="text-h5 font-weight-bold mb-2">{{ t('account.needLogin') }}</h3>
          </template>
          <template v-slot:description>
            <p class="opacity-60 mb-6">{{ t('account.needLoginDesc') }}</p>
            <v-btn color="amber" variant="tonal" to="/account/signin" class="px-8 font-weight-bold">
              {{ t('signin.title') }}
            </v-btn>
          </template>
        </EmptyView>
      </v-container>
    </div>
    <!-- 未登录提示 E -->
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/tabs-nav.less";

.tabs-nav-control();

.account-root {
  .primary-tabs {
    border-bottom: none;
  }

  .secondary-tabs {
    height: auto !important;
    min-height: min-content;

    :deep(.v-slide-group) {
      height: auto !important;
      overflow: visible !important;
    }

    :deep(.v-slide-group__container) {
      height: auto !important;
      overflow: visible !important;
    }

    :deep(.v-slide-group__content) {
      height: auto !important;
      overflow: visible !important;
    }

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

  .tabs-box-mobile {
    height: auto;

    .tab-item {
      max-width: 80px;
    }
  }

  .tabs-box-desktop {
    width: 80px;
    min-width: 80px;
    flex-shrink: 0;
  }

  .setting-content {
    min-width: 0;
    width: 100%;
  }

  .border-amber {
    border: 2px solid rgba(255, 193, 7, 0.5);
  }
}
</style>

<style lang="less">
// 跟随鼠标的纯展示提示卡不接收指针事件，避免悬停时卡片挡住下方图标的点击
.tooltip-follow-plain {
  pointer-events: none;
}
</style>
