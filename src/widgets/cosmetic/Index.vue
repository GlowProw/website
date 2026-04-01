<script setup lang="ts">
import {useRoute} from "vue-router";
import CosmeticCardDetail from "@/components/snbWidget/cosmeticCardDetail.vue";

const route = useRoute();
const id = (route.params.id as string) || '';
</script>

<template>
  <div class="cosmetic-widget d-flex justify-center">
    <CosmeticCardDetail
        :id="id"
        :is-widget="true"
        :is-show-description="true"
        :is-show-open-detail="true"
    />
  </div>
</template>

<style scoped>
.cosmetic-widget {
  background-color: transparent;
}
.cosmetic-widget > :first-child {
  min-width: 500px;
  max-width: 550px;
  width: 100%;
}
</style>
