<script setup lang="ts">

import Footer from "@/components/Footer.vue";
import Header from "@/components/Header.vue";
</script>

<template>
  <v-app>
    <Header></Header>
    <div class="map pt-2 fill-height">
      <iframe class="mt-10" src="https://mapgenie.io/skull-and-bones/maps/indian-ocean"></iframe>
    </div>
    <Footer></Footer>
  </v-app>
</template>

<style scoped lang="less">
.map {
  iframe {
    border: none;
    outline: none;
    width: 100%;
    height: 100%;
    min-height: 100vh;
  }
}
</style>
