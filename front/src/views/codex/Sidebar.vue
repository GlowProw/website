<script setup lang="ts">

import {useI18n} from "vue-i18n";
import AppCodexNav from "@/assets/sripts/app_codex_nav";

const {t} = useI18n(),
    appCodexNav = new AppCodexNav()
</script>

<template>
  <v-list nav class="bg-transparent pa-0 my-4"
          active-class="bg-amber">
    <v-list-item :to="`${i.to}`" prepend-icon="mdi-format-list-bulleted-type"
                 v-for="(i, index) in appCodexNav.nav" :key="index">
      {{ t(i.title) }}
    </v-list-item>
    <v-divider class="my-2"></v-divider>
    <v-list-item to="/codex/treasureMaps" prepend-icon="mdi-format-list-bulleted-type">
      {{ t('codex.treasureMaps.title') }}
    </v-list-item>
    <v-list-item to="/codex/mapLocations" prepend-icon="mdi-format-list-bulleted-type">
      {{ t('codex.mapLocations.title') }}
    </v-list-item>
  </v-list>
</template>

<style scoped lang="less">

</style>
