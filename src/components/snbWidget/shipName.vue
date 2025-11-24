<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {Ship} from "glow-prow-data";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const
    props = defineProps<{ data?: Ship, id?: string }>(),
    {t} = useI18n(),
    i18nReadName = useI18nReadName()

</script>

<template>
  {{ i18nReadName.ship(id || data.id).name() || '-'}}
</template>

<style scoped lang="less">

</style>
