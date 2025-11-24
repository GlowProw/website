<script setup lang="ts">
import {useI18n} from "vue-i18n";

const props = defineProps<{ id: string }>(), {t} = useI18n()
</script>

<template>
  {{ t(`snb.ships.${id}.description.general`) }}
</template>

<style scoped lang="less">

</style>
