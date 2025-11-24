<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const props = defineProps<{id: string}>(),
    {t} = useI18n(),
    i18nReadName = useI18nReadName()
</script>

<template>
  {{ i18nReadName.ultimate.name(props.id) }}
</template>

<style scoped lang="less">

</style>
