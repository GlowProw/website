<script setup lang="ts">
import {Ship} from "glow-prow-data";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import ShipCardDetail from "@/components/snbWidget/shipCardDetail.vue";

const props = defineProps<{ data?: Ship, id?: string, locale?: string, isShowTooltip?: boolean }>(),
    {ship} = useI18nReadName()

let getTitle = computed(() => {
  return `${ship(props.id || props.data?.id).name(props.locale) || '-'}`
})

/**
 * 悬浮卡片使用的船只标识
 */
const cardId = computed(() => props.id || props.data?.id || '')

defineOptions({
  name: "ShipName"
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false || !cardId">
    <template v-slot:activator="{ props: activatorProps }">
      <span :title="getTitle" v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <ShipCardDetail v-if="cardId" :id="cardId" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">

</style>
