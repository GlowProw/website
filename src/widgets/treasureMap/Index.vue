<script setup lang="ts">
import {useRoute} from "vue-router";
import TreasureMapCardDetail from "@/components/snbWidget/treasureMapCardDetail.vue";

const route = useRoute();
const id = (route.params.id as string) || '';
</script>

<template>
  <div class="treasureMap-widget d-flex justify-center">
    <TreasureMapCardDetail
        :id="id"
        :is-widget="true"
        :is-show-open-detail="false"
    />
  </div>
</template>

<style scoped>
.treasureMap-widget {
  background-color: transparent;
}
.treasureMap-widget > :first-child {
  min-width: 600px;
  max-width: 800px;
  width: 100%;
}
</style>
