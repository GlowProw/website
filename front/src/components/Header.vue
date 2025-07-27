<script setup lang="ts">
import {useAuthStore} from "../../stores";
import Logo from "./Logo.vue";

const authStore = useAuthStore()
</script>

<template>
  <header>
    <v-layout>
      <v-app-bar
          class="header"
          density="compact"
          translate="yes"
          :absolute="true"
          flat>

        <Logo></Logo>
        <div class="mr-5">BETA</div>
        <v-divider vertical></v-divider>

        <v-btn variant="text" tile href="https://www.ubisoft.com/en-us/game/skull-and-bones">
          官网
          <v-icon icon="mdi-open-in-new"></v-icon>
        </v-btn>
<!--        <v-btn variant="text" tile href="https://www.ubisoft.com/en-us/game/skull-and-bones">-->
<!--          Wiki-->
<!--          <v-icon icon="mdi-open-in-new"></v-icon>-->
<!--        </v-btn>-->

        <v-spacer></v-spacer>

        <v-btn to="/account/home" v-if="authStore.isLogin">
          <v-avatar
              class="hidden-sm-and-down"
              color="grey-darken-2"
              size="32">
            {{ authStore.currentUser[0] || 'U' }}
          </v-avatar>
        </v-btn>
        <v-btn variant="text" to="/account/login" v-else>
          登陆
        </v-btn>

      </v-app-bar>
    </v-layout>
  </header>
</template>

<style scoped>
@import "../assets/styles/header.less";
</style>
