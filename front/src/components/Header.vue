<script setup lang="ts">
import {useAuthStore} from "~/stores/userAccountStore";
import Logo from "./Logo.vue";
import {ref} from "vue";
import HeaderAccount from "@/components/HeaderAccount.vue";
import HeaderMuenFunWidget from "@/components/HeaderMuenFunWidget.vue";
import {appFuns, appNavs} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import GlobalSearch from "@/components/GlobalSearch.vue";

const authStore = useAuthStore(),
    {t} = useI18n()

let drawer = ref(false)
</script>

<template>
  <header>
    <v-app-bar
        class="header"
        density="compact"
        translate="yes"
        :absolute="false"
        flat>
      <v-app-bar-nav-icon @click="drawer = !drawer" class="hidden-md hidden-lg hidden-xl hidden-xxl"></v-app-bar-nav-icon>

      <Logo class="ml-sm-1 ml-md-1 ml-lg-2 mr-5"></Logo>
      <v-btn size="x-small" class="ml-n3 mr-3" variant="tonal">BETA</v-btn>

      <v-btn
          class="hidden-sm hidden-xs"
          variant="text"
          density="comfortable" :href="nav.href" target="_blank"
          v-for="(nav, navIndex) in appNavs.list" :key="navIndex">
        {{ t(nav.title) }}
        <template v-slot:append>
          <v-icon icon="mdi-open-in-new" size="15"></v-icon>
        </template>
      </v-btn>

      <v-spacer></v-spacer>

      <HeaderAccount type="header"></HeaderAccount>

      <GlobalSearch>
        <v-icon>mdi-magnify</v-icon>
      </GlobalSearch>

      <HeaderMuenFunWidget></HeaderMuenFunWidget>
    </v-app-bar>

    <v-navigation-drawer
        class="header-drawer"
        v-model="drawer"
        temporary>
      <v-sheet class="pt-3">
        <div class="mb-3 pl-3 pr-3">
          <HeaderAccount type="header-drawer"></HeaderAccount>
        </div>
        <v-divider></v-divider>

        <v-list-item link :to="nav.to" :href="nav.href" target="_blank"
                     @click="drawer = !drawer"
                     v-for="(nav, navIndex) in appFuns.list" :key="navIndex">
          {{ t(nav.title) }}
          <template v-slot:prepend>
            <ItemSlotBase size="20" class="mr-2">
              <v-icon :icon="nav.icon"></v-icon>
            </ItemSlotBase>
          </template>
        </v-list-item>
        <v-divider></v-divider>

        <v-list-item link :href="nav.href" target="_blank"
                     v-for="(nav, navIndex) in appNavs.list" :key="navIndex">
          {{ t(nav.title) }}
          <template v-slot:append>
            <v-icon icon="mdi-open-in-new" size="15"></v-icon>
          </template>
        </v-list-item>
      </v-sheet>
    </v-navigation-drawer>
  </header>
</template>

<style scoped>
@import "@/assets/styles/header.less";
</style>
