<script setup lang="ts">

import Footer from "../components/Footer.vue";
</script>

<template>
  <div class="map pt-2 fill-height">
    <iframe class="mt-10" src="https://mapgenie.io/skull-and-bones/maps/indian-ocean"></iframe>
  </div>
  <Footer></Footer>
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
