<script setup lang="ts">
import {useI18n} from "vue-i18n";

const props = defineProps<{id: string}>(),
    {t} = useI18n()
</script>

<template>
  {{ t(`snb.ultimates.${id}.name`) }}
</template>

<style scoped lang="less">

</style>
