<script setup lang="ts">

import {onMounted, Ref, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";
import {useI18n} from "vue-i18n";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";

import Silk from "@/components/Silk.vue";

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
        name: 'pwa.title',
        value: 'PortalSettingPwa',
        icon: 'mdi-cellphone-arrow-down'
      },
      {
        name: 'about.title',
        value: 'PortalSettingAbout',
        icon: 'mdi-information'
      },
      // {
      //   name: t('setting.notification.title'),
      //   value: 'notification',
      //   icon: 'mdi-bell-badge'
      // },
    ]),
    tab = ref(tabs.value[0].value)

watch(() => tab.value, (value) => {
  router.push({name: value})
})

onMounted(() => {
  const currentRouterName = tabs.value.find(i => i.value == router.resolve(route).name)
  if (currentRouterName)
    tab.value = currentRouterName.value
})
</script>

<template>
  <v-app>
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
      <template v-slot:append>
        <v-container class="position-relative">
          <div class="position-absolute top-0 right-0 opacity-10 d-flex pt-10 ga-2">
            <v-icon icon="mdi-cog" size="200"></v-icon>
          </div>
        </v-container>
      </template>
      <template v-slot:default>
      </template>
    </v-card>

    <v-divider></v-divider>

    <v-container>
      <div :class="{'d-flex flex-row ': !mobile}">
        <v-tabs
            stacked
            border
            hide-slider
            v-model="tab"
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

        <v-main min-height="80vh" class="pl-lg-5">
          <router-view></router-view>
        </v-main>
      </div>
    </v-container>
  </v-app>
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
}
</style>
