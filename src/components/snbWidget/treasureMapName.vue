<script setup lang="ts">
import {TreasureMap} from "glow-prow-data";
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import TreasureMapCardDetail from "@/components/snbWidget/treasureMapCardDetail.vue";

const props = defineProps<{ data?: TreasureMap; id?: string; isShowTooltip?: boolean }>(),
    {treasureMap} = useI18nReadName()

let getTitle = computed(() => {
  const mapId = props.id || props.data?.id
  return `${treasureMap(mapId).name(props.data?.category) || '-'}`
})

/**
 * 悬浮卡片使用的藏宝图标识
 */
const cardId = computed(() => props.id || props.data?.id || '')

defineOptions({
  name: "TreasureMapName"
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false || !cardId">
    <template v-slot:activator="{ props: activatorProps }">
      <span :title="getTitle" v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <TreasureMapCardDetail v-if="cardId" :id="cardId" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">

</style>
