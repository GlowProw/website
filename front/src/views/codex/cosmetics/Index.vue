<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

import CodexViewData from "@/components/CodexViewData.vue";

const route = useRoute(),
    {t} = useI18n(),
    {asString, sanitizeString} = useI18nUtils()

</script>

<template>
  <v-container class="pa-5">
    <CodexViewData :load-data-type="['cosmetic']"></CodexViewData>
  </v-container>
</template>

<style scoped lang="less">
</style>
