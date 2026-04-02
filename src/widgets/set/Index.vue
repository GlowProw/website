<script setup lang="ts">
import {useRoute} from "vue-router";
import SetCardDetail from "@/components/snbWidget/setCardDetail.vue";

const route = useRoute();
const id = (route.params.id as string) || '';
</script>

<template>
  <div class="set-widget d-flex justify-center">
    <SetCardDetail
        :id="id"
        :is-widget="true"
        :is-show-open-detail="false"
    />
  </div>
</template>

<style scoped>
.set-widget {
  background-color: transparent;
}
.set-widget > :first-child {
  min-width: 600px;
  max-width: 800px;
  width: 100%;
}
</style>
