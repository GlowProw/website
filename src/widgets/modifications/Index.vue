<script setup lang="ts">
import {useRoute} from "vue-router";
import ModCardDetail from "@/components/snbWidget/modCardDetail.vue";

const route = useRoute();
const id = (route.params.id as string) || '';
</script>

<template>
  <div class="mod-widget d-flex justify-center">
    <ModCardDetail
        :id="id"
        :is-widget="true"
        :is-show-description="true"
        :is-show-open-detail="false"
    />
  </div>
</template>

<style scoped>
.mod-widget {
  background-color: transparent;
}
.mod-widget > :first-child {
  min-width: 800px;
  max-width: 800px;
  width: 100%;
}
</style>
