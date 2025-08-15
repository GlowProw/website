<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name"
import {Item} from "glow-prow-data";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const props = defineProps<{ data: Item, id?: string, tier?: number }>(),
    {asString, sanitizeString} = useI18nUtils(),
    {item} = useI18nReadName()

let getTitle = computed(() => {
  return `${item(props.id || props.data.id).name()}`
})
</script>

<template>
  {{ getTitle }}
</template>

<style scoped lang="less">

</style>
