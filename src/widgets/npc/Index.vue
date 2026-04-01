<script setup lang="ts">
import {useRoute} from "vue-router";
import NpcCardDetail from "@/components/snbWidget/npcCardDetail.vue";

const route = useRoute();
const id = (route.params.id as string) || '';
</script>

<template>
  <div class="npc-widget d-flex justify-center">
    <NpcCardDetail
        :id="id"
        :is-widget="true"
        :is-show-open-detail="true"
    />
  </div>
</template>

<style scoped>
.npc-widget {
  background-color: transparent;
}
.npc-widget > :first-child {
  min-width: 500px;
  max-width: 550px;
  width: 100%;
}
</style>
