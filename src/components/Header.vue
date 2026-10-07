<script setup lang="ts">
import Logo from "./Logo.vue";
import {ref} from "vue";
import {appFuns, appNavs} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {useRoute} from "vue-router";
import {useAppStore} from "~/stores/appStore";

import HeaderAccount from "@/components/HeaderAccount.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import GlobalSearchTopWindowWidget from "@/components/GlobalSearchTopWindowWidget.vue";

const {t} = useI18n(),
    route = useRoute(),
    {width} = useDisplay(),
    appStore = useAppStore()

let drawer = ref(appStore.headerDrawer);

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
        <Logo size="32" class=""></Logo>

        <template v-if="route.query.isShowSnBIcon">
          <v-divider vertical inset class="mx-3"></v-divider>

          <img
              height="34"
              src="@/assets/images/logo-snb.png"/>
        </template>
      </div>

      <v-spacer></v-spacer>

      <div class="mr-3 d-flex align-center" v-if="!drawer">
        <HeaderAccount type="header"></HeaderAccount>

        <v-divider class="ml-3 mr-1" inset vertical></v-divider>

        <GlobalSearchTopWindowWidget>
          <v-btn icon="mdi-magnify"></v-btn>
        </GlobalSearchTopWindowWidget>

        <v-btn :to="{ name: 'PortalSettingRoutine', params: $route.params }" icon="mdi-cog"></v-btn>
      </div>
    </v-app-bar>

    <v-navigation-drawer
        permanent
        class="header-drawer header-filter"
        density="comfortable"
        :width="width"
        v-model="drawer"
        tile
        temporary>
      <v-row class="pt-3">
        <v-col cols="12" sm="12" md="2" lg="2" class="d-flex justify-center">
          <div class="mt-16">
            <v-icon icon="mdi-apps" size="70" class="mx-auto"></v-icon>
            <p class="text-center text-h6">{{ t('header.menu') }}</p>
          </div>
        </v-col>
        <v-divider vertical></v-divider>
        <v-col cols="12" sm="12" md="5" lg="3">
          <v-list rounded nav>
            <v-list-item link :to="nav.to" :href="nav.href" target="_blank"
                         @click="drawer = !drawer"
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
          <v-list rounded nav>
            <HeaderAccount type="header-drawer"></HeaderAccount>

            <v-divider></v-divider>

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
    </v-navigation-drawer>
  </header>
</template>

<style scoped>
@import "@/assets/styles/header.less";

.header-drawer {
  background: rgb(0 0 0 / 60%);
  border-bottom: none !important;
  animation: none !important;
}
</style>
