<script setup lang="ts">

import Footer from "../../components/Footer.vue";
</script>

<template>
  <v-app class="background-flavor">
    <v-main class="mt-10">
      <router-view></router-view>
      <Footer></Footer>
    </v-main>
  </v-app>
</template>

<style scoped lang="less">

</style>
