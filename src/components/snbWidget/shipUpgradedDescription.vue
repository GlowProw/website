<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {Item, Ship} from "glow-prow-data";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const props = defineProps<{ data: any }>(),
    {t} = useI18n(),
    {sanitizeString} = useI18nUtils()

defineOptions({
  name: "ShipUpgradedDescription"
})
</script>

<template>
  {{ t(`snb.items.${sanitizeString(props.data.id).cleaned}.description.${props.data.tier}`) }}
</template>

<style scoped lang="less">

</style>
