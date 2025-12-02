<script setup lang="ts">
import Footer from "@/components/Footer";
import Header from "@/components/Header";
</script>

<template>
  <v-app id="calendar">
    <Header></Header>
    <v-main>
      <router-view></router-view>
    </v-main>
    <Footer></Footer>
  </v-app>
</template>

<style scoped lang="less">

</style>
