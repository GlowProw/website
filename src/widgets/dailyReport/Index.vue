<script setup lang="ts">
import { useRoute } from "vue-router";
import DailyReportWidget from "@/components/DailyReportWidget.vue";

const route = useRoute();
const seasonId = (route.params.seasonId as string) || "";
</script>

<template>
  <div class="daily-report-widget-container">
    <DailyReportWidget
      :season-id="seasonId"
      :is-widget="true"
    />
  </div>
</template>

<style scoped lang="less">
.daily-report-widget-container {
  background-color: transparent;
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
  padding: 12px;
}
</style>
