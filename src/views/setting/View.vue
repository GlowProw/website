<script setup lang="ts">

import {Ref, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";
import {useI18n} from "vue-i18n";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";

import Silk from "@/components/Silk.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const route = useRoute(),
    router = useRouter(),
    {mobile} = useDisplay(),
    {t} = useI18n(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow()

let tabs: Ref<any[]> = ref([
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
      // {
      //  name: 'subscription.title',
      //  value: 'PortalSettingSubscriptions',
      //  icon: 'mdi-treasure-chest'
      // },
      {
        name: 'setting.ad.title',
        value: 'PortalSettingAds',
        icon: 'mdi-advertisements'
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
      {
        name: 'setting.log.title',
        value: 'PortalSettingLog',
        icon: 'mdi-text-box-multiple-outline'
      },
      {
        name: 'about.title',
        value: 'PortalSettingAbout',
        icon: 'mdi-information'
      },
    ])

const getActiveTab = () => {
  const currentName = route.name as string
  const match = tabs.value.find(i => i.value === currentName)
  return match ? match.value : tabs.value[0].value
}

const tab = ref(getActiveTab())

// 监听路由变化，同步高亮选中的 Tab
watch(() => route.name, (newName) => {
  if (newName && tabs.value.some(i => i.value === newName)) {
    tab.value = newName as string
  }
})

// 用户点击 Tab 时触发路由切换，显式传递 route.params（保留 lang 参数）
const onTabChange = (targetRouteName: any) => {
  if (targetRouteName && targetRouteName !== route.name) {
    router.push({ name: targetRouteName, params: route.params })
  }
}
</script>

<template>
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
          <v-breadcrumbs-item>{{ t('setting.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>

        <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
          <v-icon icon="mdi-cog" size="200"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>

  <v-divider></v-divider>

  <div class="setting-page-root">
    <v-container>
      <div :class="{'d-flex flex-row': !mobile}">
        <div :class="{'mb-10 tabs-box-mobile': mobile, 'tabs-box-desktop': !mobile}">
          <AffixContainerView>
            <v-tabs
                stacked
                border
                hide-slider
                v-model="tab"
                @update:model-value="onTabChange"
                :class="{'mb-10 tabs-box-mobile': mobile, 'tabs-box-desktop': !mobile}"
                :fixed="mobile"
                :direction="!mobile ? 'vertical' : 'horizontal'">
              <template v-for="(i, index) in tabs"
                        :key="index">
                <v-tooltip content-class="pa-0"
                           :target="[tooltipPos.x, tooltipPos.y]">
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
                             replaceb
                             ripple
                             slim>
                        <div>
                          <v-icon size="40">{{ i.icon }}</v-icon>
                        </div>
                      </v-tab>
                      <p class="mt-1 mb-3 text-center singe-line w-100 tab-item" :title="t(i.name)">{{ t(i.name) }}</p>
                    </div>
                  </template>
                </v-tooltip>
              </template>
            </v-tabs>
          </AffixContainerView>
        </div>

        <div class="setting-content flex-grow-1 flex-shrink-1 w-100 pl-lg-5">
          <router-view></router-view>
        </div>
      </div>
    </v-container>
  </div>
</template>

<style scoped lang="less">
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
  min-height: 80vh;
}
</style>
