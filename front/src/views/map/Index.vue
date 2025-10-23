<template>
  <v-app>
    <Header></Header>
    <v-main class="">
      <router-view></router-view>
    </v-main>
    <Footer></Footer>
  </v-app>
</template>

<script setup lang="ts">
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";
</script>