<script setup lang="ts">

import {useI18n} from "vue-i18n";
import CodexViewData from "@/components/CodexViewData.vue";

const {t} = useI18n()
</script>

<template>
  <v-container class="pa-5">
    <CodexViewData load-data-type="treasureMaps"></CodexViewData>
  </v-container>
</template>

<style scoped lang="less">
</style>
