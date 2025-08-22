<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";

const props = defineProps<{id: string, grade: string}>(),
    route = useRoute(),
    {t} = useI18n()
</script>

<template>
  <span :class="`grade-${grade}-title`">{{ t(`snb.cosmetics.${id}.name`) }}</span>
</template>

<style scoped lang="less">

</style>
