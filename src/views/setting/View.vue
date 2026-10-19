<script setup lang="ts">
/**
 * 设置视图主入口
 * 采用一级分类选项卡与二级垂直选项卡联动的层级布局架构（对齐账户中心设计规范）
 */
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify/framework";
import { useI18n } from "vue-i18n";
import { useTooltipFollow } from "@/assets/sripts/use_tooltip_follow";

import Silk from "@/components/Silk.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import VerticalScrollList from "@/components/VerticalScrollList.vue";

import { useAuthStore } from "~/stores/userAccountStore";

const route = useRoute(),
    router = useRouter(),
    { mobile } = useDisplay(),
    { t } = useI18n(),
    { tooltipPos, onMouseMove, onMouseEnter } = useTooltipFollow(),
    authStore = useAuthStore()

interface SubTabItem {
  name: string
  value: string
  icon: string
  isExternal?: boolean
  href?: string
}

/**
 * 常规设置大类：常规设置、进阶设置、快捷键
 */
const generalTabs: SubTabItem[] = [
  {
    name: 'setting.routine.title',
    value: 'PortalSettingRoutine',
    icon: 'mdi-cog'
  },
  {
    name: 'setting.advanced.title',
    value: 'PortalSettingAdvanced',
    icon: 'mdi-application-cog-outline'
  },
  {
    name: 'setting.hotkeys.title',
    value: 'PortalSettingHotkeys',
    icon: 'mdi-keyboard-outline'
  },
]

/**
 * 数据大类：日志、数据报告、愿望清单
 */
const dataTabs: SubTabItem[] = [
  {
    name: 'setting.log.title',
    value: 'PortalSettingLog',
    icon: 'mdi-text-box-multiple-outline'
  },
  {
    name: 'setting.storage.title',
    value: 'PortalSettingStorage',
    icon: 'mdi-database'
  },
  {
    name: 'setting.wishlist.title',
    value: 'PortalSettingWishlist',
    icon: 'mdi-playlist-star'
  },
]

/**
 * 赞助与商业大类：赞助订阅、广告推广（订阅及赞助特权用户自动隐藏广告入口）
 */
const subscriptionTabs = computed<SubTabItem[]>(() => {
  const tabs: SubTabItem[] = [
    {
      name: 'subscription.title',
      value: 'PortalSettingSubscriptions',
      icon: 'mdi-treasure-chest'
    }
  ]
  if (!authStore.isSubscriber && !authStore.isDonorOrPrivileged) {
    tabs.push({
      name: 'setting.ad.title',
      value: 'PortalSettingAds',
      icon: 'mdi-advertisements'
    })
  }
  return tabs
})

/**
 * 关于大类：关于闪耀船首、隐私协议、服务协议
 */
const aboutTabs: SubTabItem[] = [
  {
    name: 'about.title',
    value: 'PortalSettingAbout',
    icon: 'mdi-information'
  },
  {
    name: 'footer.col3.privacy',
    value: 'SettingPrivacyPolicy',
    icon: 'mdi-shield-lock-outline',
    isExternal: true,
    href: 'https://blog.glow-prow.top/privacy'
  },
  {
    name: 'footer.col3.terms',
    value: 'SettingTermsOfService',
    icon: 'mdi-file-document-outline',
    isExternal: true,
    href: 'https://blog.glow-prow.top/terms'
  },
]

// 路由归属判定
const isGeneralRoute = (name: string) => generalTabs.some(i => i.value === name)
const isDataRoute = (name: string) => dataTabs.some(i => i.value === name)
const isSubscriptionRoute = (name: string) => subscriptionTabs.value.some(i => i.value === name)
const isAboutRoute = (name: string) => aboutTabs.some(i => i.value === name)

// 订阅或特权用户访问广告设置时自动重定向至赞助订阅页
watch([() => route.name, () => authStore.isSubscriber, () => authStore.isDonorOrPrivileged], ([name, sub, donor]) => {
  if (name === 'PortalSettingAds' && (sub || donor)) {
    router.replace({ name: 'PortalSettingSubscriptions', params: { lang: route.params.lang } })
  }
}, { immediate: true })

/**
 * 依据当前路由动态计算激活的一级 Tab
 */
const primaryNavMenu = computed<'SettingGeneral' | 'SettingData' | 'SettingSubscriptions' | 'SettingAbout'>(() => {
  const currentName = (route.name as string) || ''
  if (isDataRoute(currentName)) return 'SettingData'
  if (isSubscriptionRoute(currentName)) return 'SettingSubscriptions'
  if (isAboutRoute(currentName)) return 'SettingAbout'
  if (isGeneralRoute(currentName)) return 'SettingGeneral'
  return 'SettingGeneral'
})

/**
 * 依据当前激活的一级分类动态展示二级垂直 Tab 列表
 */
const currentSubTabs = computed<SubTabItem[]>(() => {
  if (primaryNavMenu.value === 'SettingData') return dataTabs
  if (primaryNavMenu.value === 'SettingSubscriptions') return subscriptionTabs.value
  if (primaryNavMenu.value === 'SettingAbout') return aboutTabs
  return generalTabs
})

/**
 * 当前二级激活 Tab
 */
const tab = computed(() => {
  const currentName = route.name as string
  const match = currentSubTabs.value.find(i => i.value === currentName && !i.isExternal)
  return match ? match.value : (currentSubTabs.value.find(i => !i.isExternal)?.value || '')
})

/**
 * 用户点击二级 Tab 时触发路由切换或外链打开
 */
const onTabChange = (targetRouteName: any) => {
  const item = currentSubTabs.value.find(i => i.value === targetRouteName)
  if (item?.isExternal && item?.href) {
    window.open(item.href, '_blank', 'noopener,noreferrer')
    return
  }
  if (targetRouteName && targetRouteName !== route.name) {
    router.push({ name: targetRouteName, params: { lang: route.params.lang } })
  }
}

defineOptions({
  name: 'SettingView'
})
</script>

<template>
  <v-card min-height="200px" class="d-flex flex-column justify-space-between">
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
          <v-breadcrumbs-item>{{ t('setting.title') }}</v-breadcrumbs-item>
        </v-container>
      </v-breadcrumbs>
      <v-divider opacity=".01"></v-divider>

      <v-container class="pa-2 position-relative">
        <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
          <v-icon icon="mdi-cog" size="200"></v-icon>
        </div>
      </v-container>

      <!-- 一级导航栏 (参考 Index.vue:L159-L200) -->
      <v-container class="pa-0 px-2 mt-auto d-flex align-end">
        <v-row density="compact" align="end">
          <v-col cols="12">
            <v-tabs
                :model-value="primaryNavMenu"
                color="amber"
                stacked
                align-tabs="start"
                density="comfortable"
                class="primary-tabs setting-tabs-primary">
              <v-tab value="SettingGeneral"
                     class="font-weight-bold text-subtitle-1 px-8"
                     :class="{'v-tab--route-active': primaryNavMenu === 'SettingGeneral'}"
                     :to="{ name: generalTabs[0].value, params: { lang: route.params.lang } }">
                {{ t('setting.title') }}
              </v-tab>
              <v-tab value="SettingData"
                     class="font-weight-bold text-subtitle-1 px-8"
                     :class="{'v-tab--route-active': primaryNavMenu === 'SettingData'}"
                     :to="{ name: dataTabs[0].value, params: { lang: route.params.lang } }">
                {{ t('setting.data.title') }}
              </v-tab>
              <v-tab value="SettingSubscriptions"
                     class="font-weight-bold text-subtitle-1 px-8"
                     :class="{'v-tab--route-active': primaryNavMenu === 'SettingSubscriptions'}"
                     :to="{ name: subscriptionTabs[0]?.value, params: { lang: route.params.lang } }">
                {{ t('subscription.title') }}
              </v-tab>
              <v-tab value="SettingAbout"
                     class="font-weight-bold text-subtitle-1 px-8"
                     :class="{'v-tab--route-active': primaryNavMenu === 'SettingAbout'}"
                     :to="{ name: aboutTabs[0].value, params: { lang: route.params.lang } }">
                {{ t('about.title') }}
              </v-tab>
            </v-tabs>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </v-card>
  <v-divider opacity=".06"></v-divider>

  <div class="setting-root">
    <div class="setting-page-root">
      <v-container>
        <div :class="{'d-flex flex-row': !mobile}">
          <div :class="{'mb-10 setting-tabs-box-mobile': mobile, 'setting-tabs-box-desktop': !mobile}">
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
                    :model-value="tab"
                    class="w-100 secondary-tabs setting-tabs-secondary"
                    density="default"
                    @update:model-value="onTabChange"
                    :fixed="mobile"
                    :direction="!mobile ? 'vertical' : 'horizontal'">
                  <template v-for="(i, index) in currentSubTabs" :key="index">
                    <v-tooltip content-class="pa-0" :target="[tooltipPos.x, tooltipPos.y]">
                      <template v-slot:default>
                        <v-card border class="py-3 px-10">
                          {{ t(i.name) }}
                        </v-card>
                      </template>
                      <template v-slot:activator="{props}">
                        <div :class="{'mb-2': !mobile, 'mr-5': mobile}">
                          <v-tab :value="i.value"
                                 selected-class="bg-amber"
                                 class="d-flex align-center justify-center"
                                 min-width="80"
                                 width="80"
                                 height="80"
                                 border
                                 @mousemove="onMouseMove"
                                 @mouseenter="onMouseEnter"
                                 v-bind="props"
                                 replace
                                 ripple
                                 slim>
                            <div>
                              <v-icon size="40">{{ i.icon }}</v-icon>
                            </div>
                          </v-tab>
                          <p class="mt-1 mb-3 text-center singe-line w-100 setting-tab-item" :title="t(i.name)">
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

          <div class="setting-content flex-grow-1 flex-shrink-1 w-100 pl-lg-5">
            <router-view></router-view>
          </div>
        </div>
      </v-container>
    </div>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/tabs-nav.less";

.tabs-nav-control();

.setting-root {
  .setting-tabs-primary {
    border-bottom: none;
  }

  .setting-page-root {
    .setting-tabs-box-mobile {
      height: auto;

      .setting-tab-item {
        max-width: 80px;
      }
    }

    .setting-tabs-box-desktop {
      width: 80px;
      min-width: 80px;
      flex-shrink: 0;
    }

    .setting-content {
      min-width: 0;
      width: 100%;
      min-height: 80vh;
    }
  }
}
</style>
