<script setup lang="ts">
import {useRoute} from "vue-router";
import DailyReportWidget from "@/components/DailyReportWidget.vue";

const route = useRoute();
const seasonId = (route.params.seasonId as string) || "";
</script>

<template>
  <v-container class="daily-report-widget-container">
    <DailyReportWidget
        :season-id="seasonId"
        :is-widget="true"
    />
  </v-container>
</template>

<style scoped lang="less">
</style>
