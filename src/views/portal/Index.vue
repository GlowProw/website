<template>
  <v-app id="portal">
    <Header></Header>
    <router-view></router-view>
    <Footer></Footer>
  </v-app>
</template>

<style scoped>

</style>

<script setup lang="ts">
import Footer from "@/components/Footer.vue";
import Header from "@/components/Header.vue";
</script>
