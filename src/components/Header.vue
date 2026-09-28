<script setup lang="ts">
import {useAuthStore} from "~/stores/userAccountStore";
import Logo from "./Logo.vue";
import {ref} from "vue";
import HeaderAccount from "@/components/HeaderAccount.vue";
import HeaderMuenFunWidget from "@/components/HeaderMuenFunWidget.vue";
import {appFuns, appNavs} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import GlobalSearchTopWindowWidget from "@/components/GlobalSearchTopWindowWidget.vue";
import {useDisplay} from "vuetify/framework";
import {useRoute} from "vue-router";

const authStore = useAuthStore(),
    {t} = useI18n(),
    route = useRoute(),
    {mobile, xs, width} = useDisplay()

let drawer = ref(false)

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
      <v-app-bar-nav-icon @click="drawer = !drawer" class="hidden-md hidden-lg hidden-xl hidden-xxl"></v-app-bar-nav-icon>

      <div class="d-flex ml-sm-1 ml-md-1 ml-lg-2 mr-5 text-no-wrap">
        <Logo size="32" class=""></Logo>

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

        <v-divider class="ml-3 mr-1" inset vertical></v-divider>

        <GlobalSearchTopWindowWidget>
          <v-btn icon="mdi-magnify"></v-btn>
        </GlobalSearchTopWindowWidget>

        <v-btn to="/setting" icon="mdi-cog"></v-btn>

        <HeaderMuenFunWidget></HeaderMuenFunWidget>
      </div>
    </v-app-bar>

    <v-navigation-drawer
        class="header-drawer header-filter"
        :width="width"
        v-model="drawer">
      <v-row class="pt-3">
        <v-col cols="12" sm="6" lg="4">
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
        </v-col>
        <v-divider vertical></v-divider>
        <v-col cols="12" sm="6" lg="4">
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
}
</style>
