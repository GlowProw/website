<script setup lang="ts">
import {useI18n} from "vue-i18n";

const {t} = useI18n(),
    props = defineProps<{ id: string | undefined }>()
</script>

<template>
  <span :title="t(`snb.cosmetics.${id}.description`)">{{ t(`snb.cosmetics.${id}.description.general`) }}</span>
</template>

<style scoped lang="less">

</style>
