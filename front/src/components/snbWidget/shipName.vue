<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {Ship} from "glow-prow-data";

const
    props = defineProps<{ data?: Ship, id?: string }>(),
    {t} = useI18n()
</script>

<template>
  {{ t(`snb.ships.${id || data.id}.name`) }}
</template>

<style scoped lang="less">

</style>
