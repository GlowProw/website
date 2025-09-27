<script setup lang="ts">
import {useI18n} from "vue-i18n";

const {t} = useI18n(),
    props = defineProps<{id: string}>()
</script>

<template>
  <span :title="t(`snb.materials.${id}.name`)">{{ t(`snb.materials.${id}.name`) }}</span>
</template>

<style scoped lang="less">

</style>
