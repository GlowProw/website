<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";
import {useUserApi} from "@/assets/sripts/api";
import {useNoticeStore} from "~/stores/noticeStore";
import {useI18n} from "vue-i18n";

import Silk from "@/components/Silk.vue";
import AdManageBtn from "@/components/ads/AdManageBtn.vue";
import AdViewListWidget from "@/components/ads/AdViewListWidget.vue";
import StorageView from "@/views/setting/Storage.vue";
import RoutineView from "@/views/setting/Routine.vue";

const route = useRoute(),
    router = useRouter(),
    notice = useNoticeStore(),
    {mobile} = useDisplay(),
    {t} = useI18n(),
    api = useUserApi()

let tabs = ref([
      {
        name: t('setting.routine.title'),
        value: 'routine',
        icon: 'mdi-cog'
      },
      {
        name: t('setting.ad.title'),
        value: 'ads',
        icon: 'mdi-advertisements'
      },
      {
        name: t('setting.storage.title'),
        value: 'storage',
        icon: 'mdi-database-outline'
      },
      {
        name: t('setting.notification.title'),
        value: 'notification',
        icon: 'mdi-bell-badge'
      },
    ]),
    tab = ref(tabs.value[0].value)

watch(() => tab.value, (value) => {
  router.push({
    name: route.name,
    query: {
      ...route.query,
      tab: value
    }
  })
})

watch(() => route.query, (value) => {
  if (value)
    tab.value = value.tab
}, {deep: true})

onMounted(() => {
  const {tab: tabValue} = route.query
  if (tabValue)
    tab.value = tabValue;
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
          <v-tabs-window v-model="tab" direction="vertical" :vertical-arrows="false">
            <v-tabs-window-item value="routine" class="position-relative">
              <RoutineView></RoutineView>
            </v-tabs-window-item>
            <v-tabs-window-item value="ads" class="position-relative">
              <v-row>
                <v-col cols="4">
                  <h1 class="text-h5 mb-3 text-amber">广告</h1>
                  <p class="text-caption">网站为热爱发电，我们向玩家提供公益服务，并开源项目；为了持续性提供服务，需要玩家们对投入广告进行触发</p>

                  <ul>
                    <li>
                      <p class="text-caption mt-3">当然我们提供广告管理以及一键关闭功能，减少网站阅读困难</p>
                    </li>
                    <li>
                      <p class="text-caption mt-3">广告使用第三方，你可以前往第三方广告管理cookie隐私问题</p>
                    </li>
                  </ul>

                  <v-row align="center" class="mt-2" no-gutters>
                    <v-col>
                      总开关
                    </v-col>
                    <v-col cols="auto">
                      <AdManageBtn></AdManageBtn>
                    </v-col>
                  </v-row>
                </v-col>
                <v-col>
                  <AdViewListWidget></AdViewListWidget>
                </v-col>
              </v-row>
            </v-tabs-window-item>
            <v-tabs-window-item value="storage">
              <StorageView></StorageView>
            </v-tabs-window-item>
            <v-tabs-window-item value="notification" class="position-relative">
              <v-row>
                <v-col cols="4">
                  <h1 class="text-h5 mb-3 text-amber">通知</h1>
                  <p class="text-caption">管理网站通知事件</p>
                </v-col>
              </v-row>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-main>
      </div>
    </v-container>
  </v-app>
</template>

<style scoped lang="less">

</style>
