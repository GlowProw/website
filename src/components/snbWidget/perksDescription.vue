<script setup lang="ts">
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {Item, Ship} from "glow-prow-data";

const props = defineProps<{ data: Item | Ship, class?: string }>(),
    {t, te, tm, sanitizeString, asArray} = useI18nUtils(),
    {perk} = useI18nReadName()

/**
 * 获取词条描述内容
 */
const getDescription = () => {
  return perk().description(<any>props.data)
}

defineOptions({
  name: "PerkDescription"
})
</script>

<template>
  <p class="opacity-80 text-pre-wrap mt-3 pl-5 pr-5" v-for="(pPkey, pIndex) in getDescription()" :key="pIndex">
    {{ pPkey }}
  </p>
</template>

<style scoped lang="less">

</style>
