<script setup lang="ts">

import SearchView from "@/components/SearchView.vue";
import AdsWidget from "@/components/ads/google/index.vue";
</script>

<template>
  <v-main class="background-flavor">
    <div class="background-img-flavor">
      <v-container>
        <AdsWidget class="my-5" id="none"></AdsWidget>

        <SearchView></SearchView>

        <AdsWidget class="my-5" id="none"></AdsWidget>
      </v-container>
    </div>
  </v-main>
</template>

<style scoped lang="less">

</style>
