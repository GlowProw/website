<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {Item, Ship} from "glow-prow-data";

const props = defineProps<{ data: Item | Ship, id: string, class?: string }>(),
    {perk} = useI18nReadName()

/**
 * 获取词条描述内容
 */
const getDescription = (): any => {
  // id -> 词条id
  return perk(props.id).description(<any>props.data).find((i: any) => i.id == props.id)
}

defineOptions({
  name: "PerkDescription"
})
</script>

<template>
  <p class="opacity-80 text-pre-wrap mt-3 pl-5 pr-5" v-for="(pPkey, pIndex) in getDescription().value" :key="pIndex">
    {{ pPkey }}
  </p>
</template>

<style scoped lang="less">

</style>
