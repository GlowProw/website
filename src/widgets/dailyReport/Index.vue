<script setup lang="ts">
import {useRoute} from "vue-router";
import DailyReportWidget from "@/components/DailyReportWidget.vue";

const route = useRoute();
const seasonId = (route.params.seasonId as string) || "";
</script>

<template>
  <v-defaults-provider :defaults="{ VImg: { eager: true } }">
    <v-container class="daily-report-widget-container">
      <DailyReportWidget
          :season-id="seasonId"
          :is-widget="true" />
    </v-container>
  </v-defaults-provider>
</template>

<style scoped lang="less">
</style>
