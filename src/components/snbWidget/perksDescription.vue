<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {Item, Ship} from "glow-prow-data";

const props = defineProps<{ data: Item | Ship | any, id: string, class?: string }>(),
    {perk} = useI18nReadName()

/**
 * 获取词条描述内容
 */
const getDescription = (): any => {
  if (!props.data || !props.id) return { value: [] }
  const list = perk(props.id).description(<any>props.data)
  return list?.find((i: any) => i.id == props.id) || { value: [] }
}

defineOptions({
  name: "PerkDescription"
})
</script>

<template>
  <p :class="props.class || 'opacity-80 text-pre-wrap mt-3 pl-5 pr-5'" v-for="(pPkey, pIndex) in (getDescription()?.value || [])" :key="pIndex">
    {{ pPkey }}
  </p>
</template>

<style scoped lang="less">

</style>
