<script setup lang="ts">

import Footer from "@/components/Footer.vue";
import Header from "@/components/Header.vue";
</script>

<template>
  <v-app id="assembly" class="position-relative overflow-hidden">
    <Header></Header>
    <v-main>
      <router-view></router-view>
    </v-main>
    <Footer></Footer>
  </v-app>
</template>

<style scoped lang="less">

</style>
