<template>
  <v-app>
    <Header></Header>
    <View class="mastery-main-layout" :masterys="Masterys"></View>
    <Footer></Footer>
  </v-app>
</template>

<script setup lang="ts">
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";
import View from "./View.vue";
import {Masterys} from "glow-prow-data";
</script>

<style scoped>
.mastery-main-layout {
  position: relative;
  height: calc(100vh - 20px);
  overflow: hidden;
}
</style>
