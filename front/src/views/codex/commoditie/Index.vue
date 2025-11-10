<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useDisplay} from "vuetify/framework";

import CodexViewData from "@/components/CodexViewData.vue";

const route = useRoute(),
    router = useRouter(),
    {t} = useI18n(),
    {mobile} = useDisplay(),
    {asString, sanitizeString} = useI18nUtils()
</script>

<template>
  <v-container class="pa-5">
    <CodexViewData :load-data-type="['commoditie']"></CodexViewData>
  </v-container>
</template>

<style scoped lang="less">
</style>
