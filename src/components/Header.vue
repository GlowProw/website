<script setup lang="ts">
import Logo from "./Logo.vue";
import {storeToRefs} from "pinia";
import {appFuns, appNavs} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import {useAppStore} from "~/stores/appStore";

import HeaderAccount from "@/components/HeaderAccount.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import GlobalSearchDrawer from "@/components/GlobalSearchDrawer.vue";
import CodexHistoryDrawer from "@/components/CodexHistoryDrawer.vue";
import MessagesDrawer from "@/components/messages/MessagesDrawer.vue";
import SwipeDrawer from "@/components/SwipeDrawer.vue";

const {t} = useI18n(),
    route = useRoute(),
    appStore = useAppStore()

// 导航抽屉状态放在 store 中，便于其他组件（如私信入口）联动收起
const {headerDrawer: drawer} = storeToRefs(appStore);

defineOptions({
  name: "Header",
})
</script>

<template>
  <header>
    <v-app-bar
        class="header header-filter"
        density="comfortable"
        translate="yes"
        :absolute="false"
        flat>
      <v-app-bar-nav-icon tile @click="drawer = !drawer"></v-app-bar-nav-icon>

      <div class="d-flex mr-5 text-no-wrap">
        <Logo size="32" ></Logo>

        <template v-if="route.query.isShowSnBIcon">
          <v-divider vertical inset class="mx-3"></v-divider>

          <img
              height="34"
              src="@/assets/images/logo-snb.png"/>
        </template>
      </div>

      <v-spacer></v-spacer>

      <div class="mr-3 d-flex align-center">
        <HeaderAccount type="header"></HeaderAccount>

        <v-divider class="mx-2" inset vertical></v-divider>

        <CodexHistoryDrawer>
          <v-btn icon="mdi-history"></v-btn>
        </CodexHistoryDrawer>

        <GlobalSearchDrawer>
          <v-btn icon="mdi-magnify"></v-btn>
        </GlobalSearchDrawer>

        <v-btn :to="{ name: 'PortalSettingRoutine' }" icon="mdi-cog"></v-btn>
      </div>
    </v-app-bar>

    <!-- 左侧导航抽屉：与全局搜索、私信等保持一致，使用统一滑入式抽屉 -->
    <SwipeDrawer v-model="drawer" side="left" width="100%" max-width="100vw">
      <div class="header-drawer h-100 d-flex flex-column">
        <div class="d-flex align-center px-4 py-1">
          <span class="text-h6 ml-3">{{ t('header.menu') }}</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="drawer = false"></v-btn>
        </div>
        <v-divider></v-divider>

        <v-row class="flex-grow-1 overflow-y-auto" no-gutters>
          <v-col cols="12" sm="12" md="2" lg="2" class="d-flex justify-center">
            <div class="mt-16">
              <v-icon icon="mdi-apps" size="70" class="mx-auto"></v-icon>
              <p class="text-center text-h6">{{ t('header.menu') }}</p>
            </div>
          </v-col>
          <v-divider vertical></v-divider>
          <v-col cols="12" sm="12" md="5" lg="3">
            <v-list rounded nav class="bg-transparent">
              <v-list-item link :to="nav.to" :href="nav.href" target="_blank"
                           @click="drawer = false"
                           v-for="(nav, navIndex) in appFuns.list" :key="navIndex">
                {{ t(nav.title) }}
                <template v-slot:prepend>
                  <ItemSlotBase size="40px" class="mr-2 d-flex align-center justify-center">
                    <v-icon :icon="nav.icon"></v-icon>
                  </ItemSlotBase>
                </template>
              </v-list-item>
            </v-list>
          </v-col>
          <v-divider vertical></v-divider>
          <v-col cols="12" sm="12" md="5" lg="3">
            <v-list rounded nav class="bg-transparent">
              <HeaderAccount type="header-drawer"></HeaderAccount>

              <v-divider class="my-1"></v-divider>

              <v-list-item link :href="nav.href" target="_blank"
                           v-for="(nav, navIndex) in appNavs.list" :key="navIndex">
                {{ t(nav.title) }}
                <template v-slot:prepend>
                  <ItemSlotBase size="40px" class="mr-2 d-flex align-center justify-center">
                    <v-icon icon="mdi-open-in-new" size="25"></v-icon>
                  </ItemSlotBase>
                </template>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </div>
    </SwipeDrawer>

    <!-- 全局私信侧边抽屉 -->
    <MessagesDrawer></MessagesDrawer>
  </header>
</template>

<style scoped>
@import "@/assets/styles/header.less";

.header-drawer {
  background: rgb(0 0 0 / 60%);
}
</style>
