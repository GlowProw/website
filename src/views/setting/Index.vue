<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";
import {useUserApi} from "@/assets/sripts/api";
import {useNoticeStore} from "~/stores/noticeStore";
import {useI18n} from "vue-i18n";

import Silk from "@/components/Silk.vue";

const route = useRoute(),
    router = useRouter(),
    notice = useNoticeStore(),
    {mobile} = useDisplay(),
    {t} = useI18n(),
    api = useUserApi()

let tabs = ref([
      {
        name: t('setting.routine.title'),
        value: 'PortalSettingRoutine',
        icon: 'mdi-cog'
      },
      {
        name: t('setting.ad.title'),
        value: 'PortalSettingAds',
        icon: 'mdi-advertisements'
      },
      {
        name: t('setting.storage.title'),
        value: 'PortalSettingStorage',
        icon: 'mdi-database'
      },
      {
        name: t('about.title'),
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
  const currentRouterName = tabs.value.findLast(i => i.value == router.resolve(route).name)
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
            height="80"
            :class="{'mb-10': mobile}"
            :fixed="mobile"
            :direction="!mobile ? 'vertical' : 'horizontal'">
          <v-tab :value="i.value"
                 v-for="(i, index) in tabs"
                 :key="index"
                 :class="{'mb-5': !mobile, 'mr-5': mobile}"
                 selected-class="bg-amber"
                 class="mb-5 d-flex align-center justify-center"
                 min-width="80"
                 width="80"
                 height="80"
                 border
                 replaceb ripple slim>
            <template v-slot:default>
              <div>
                <v-icon size="30">{{ i.icon }}</v-icon>
                <p class="mt-2 singe-line">{{ i.name }}</p>
              </div>
            </template>
          </v-tab>
        </v-tabs>

        <v-main min-height="80vh" class="pl-lg-5">
          <router-view></router-view>
        </v-main>
      </div>
    </v-container>
  </v-app>
</template>

<style scoped lang="less">

</style>
