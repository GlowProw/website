<script setup lang="ts">
import CodexViewData from "@/components/CodexViewData.vue";

defineOptions({
  name: "QuestListPage"
});
</script>

<template>
  <v-container class="pa-5">
    <CodexViewData :load-data-type="['quest']"></CodexViewData>
  </v-container>
</template>

<style scoped lang="less">
</style>
