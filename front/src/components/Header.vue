<script setup lang="ts">
import {useAuthStore} from "@/../stores";
import Logo from "./Logo.vue";
import {ref} from "vue";
import HeaderAccount from "@/components/HeaderAccount.vue";

const authStore = useAuthStore()

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

      <Logo></Logo>
      <v-btn size="x-small" class="ml-n3 mr-3" variant="outlined">BETA</v-btn>

      <v-spacer></v-spacer>

      <HeaderAccount type="header"></HeaderAccount>
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

        <v-list-item link href="https://glow-prow-blog.cabbagelol.net/blog" target="_blank">
          博客
          <template v-slot:append>
            <v-icon icon="mdi-open-in-new" size="15"></v-icon>
          </template>
        </v-list-item>
        <v-list-item href="https://www.ubisoft.com/en-us/game/skull-and-bones" target="_blank">
          官网
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
