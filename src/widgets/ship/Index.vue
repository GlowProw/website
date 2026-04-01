<script setup lang="ts">
import {useRoute} from "vue-router";
import ShipCardDetail from "@/components/snbWidget/shipCardDetail.vue";

const route = useRoute();
const id = (route.params.id as string) || 'dhow';
</script>

<template>
  <div class="ship-widget d-flex justify-center">
    <ShipCardDetail
        :id="id"
        :is-widget="true"
        :is-show-description="true"
        :is-show-open-detail="false"
    />
  </div>
</template>

<style scoped>
.ship-widget {
  background-color: transparent;
}
.ship-widget > :first-child {
  min-width: 800px;
  max-width: 800px;
  width: 100%;
}
</style>
