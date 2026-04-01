<script setup lang="ts">
import {useRoute} from "vue-router";
import MaterialCardDetail from "@/components/snbWidget/materialCardDetail.vue";

const route = useRoute();
const id = (route.params.id as string) || 'iron_ore';
</script>

<template>
  <div class="material-widget d-flex justify-center">
    <MaterialCardDetail
        :id="id"
        :is-widget="true"
        :is-show-description="true"
        :is-show-open-detail="false"
    />
  </div>
</template>

<style scoped>
.material-widget {
  background-color: transparent;
}
.material-widget > :first-child {
  min-width: 800px;
  max-width: 800px;
  width: 100%;
}
</style>
