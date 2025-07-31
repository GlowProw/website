<script setup lang="ts">

import {useAuthStore} from "~/stores";

const authStore = useAuthStore();
</script>

<template>
  <v-container class="mt-10">
    <template v-if="authStore.isLogin">
      <h1>Hi, {{ authStore.currentUser || 'none'}}</h1>
      <p>这里还很空，之后再来探索</p>
      <v-divider></v-divider>
      <v-btn @click="authStore.logout()">登出</v-btn>
    </template>
    <template v-else>
      未登陆
    </template>
  </v-container>
</template>

<style scoped>

</style>
