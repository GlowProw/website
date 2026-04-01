<script setup lang="ts">
import {useRoute} from "vue-router";
import UltimateCardDetail from "@/components/snbWidget/ultimateCardDetail.vue";

const route = useRoute();
const id = (route.params.id as string) || '';
</script>

<template>
  <div class="ultimate-widget d-flex justify-center">
    <UltimateCardDetail
        :id="id"
        :is-widget="true"
        :is-show-open-detail="false"
    />
  </div>
</template>

<style scoped>
.ultimate-widget {
  background-color: transparent;
}
.ultimate-widget > :first-child {
  min-width: 800px;
  max-width: 800px;
  width: 100%;
}
</style>
