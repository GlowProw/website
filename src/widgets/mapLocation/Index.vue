<script setup lang="ts">
import {useRoute} from "vue-router";
import MapLocationCardDetail from "@/components/snbWidget/mapLocationCardDetail.vue";

const route = useRoute();
const id = (route.params.id as string) || '';
</script>

<template>
  <div class="mapLocation-widget d-flex justify-center">
    <MapLocationCardDetail
        :id="id"
        :is-widget="true"
        :is-show-open-detail="false"
    />
  </div>
</template>

<style scoped>
.mapLocation-widget {
  background-color: transparent;
}
.mapLocation-widget > :first-child {
  min-width: 600px;
  max-width: 800px;
  width: 100%;
}
</style>
