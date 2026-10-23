<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name"
import {Commodity} from "glow-prow-data";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import CommoditieCardDetail from "@/components/snbWidget/commoditieCardDetail.vue";

const props = defineProps<{ data?: Commodity, id?: string, tier?: number, isShowTooltip?: boolean }>(),
    {commoditie} = useI18nReadName()

let getTitle = computed(() => {
  return `${commoditie(props.id || props.data?.id).name() || '-'}`
})

/**
 * 悬浮卡片使用的商品标识
 */
const cardId = computed(() => props.id || props.data?.id || '')

defineOptions({
  name: "CommoditieName"
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false || !cardId">
    <template v-slot:activator="{ props: activatorProps }">
      <span :title="getTitle" v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <CommoditieCardDetail v-if="cardId" :id="cardId" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">

</style>
