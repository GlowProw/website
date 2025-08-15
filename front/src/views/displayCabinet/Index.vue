<script setup lang="ts">
import Footer from "@/components/Footer";
import Header from "@/components/Header";
</script>

<template>
  <v-app id="display-cabinet" class="background-flavor">
    <Header></Header>
    <v-main class="background-img-flavor">
      <router-view></router-view>
    </v-main>
    <Footer></Footer>
  </v-app>
</template>

<style scoped lang="less">

</style>
