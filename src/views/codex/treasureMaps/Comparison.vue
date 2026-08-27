<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import TreasureMapImageSimilarity from "@/components/TreasureMapImageSimilarity.vue";

const {t} = useI18n(),
    route = useRoute(),
    router = useRouter();
</script>

<template>
  <v-container class="pa-5">
    <v-row class="mb-4" align="center" justify="center">
      <v-col cols="auto">
        <v-btn variant="text" icon to="/codex/treasureMaps" density="compact">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
      </v-col>
      <v-col>
        <v-divider opacity=".2" thickness="2"></v-divider>
      </v-col>
      <v-col cols="auto">
        <h1 class="text-h5 font-weight-bold text-amber">{{ t('codex.treasureMaps.comparison.title') }}</h1>
      </v-col>
    </v-row>

    <TreasureMapImageSimilarity :page-mode="true" />
  </v-container>
</template>

<style scoped lang="less">
</style>
