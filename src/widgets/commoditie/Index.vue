<script setup lang="ts">
import {useRoute} from "vue-router";
import CommoditieCardDetail from "@/components/snbWidget/commoditieCardDetail.vue";

const route = useRoute();
const id = (route.params.id as string) || '';
</script>

<template>
  <div class="commoditie-widget d-flex justify-center">
    <CommoditieCardDetail
        :id="id"
        :is-widget="true"
        :is-show-description="true"
        :is-show-open-detail="true"
    />
  </div>
</template>

<style scoped>
.commoditie-widget {
  background-color: transparent;
}
.commoditie-widget > :first-child {
  min-width: 500px;
  max-width: 550px;
  width: 100%;
}
</style>
