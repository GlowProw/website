<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name"
import {use_local_locale} from "@/assets/sripts/use_local_locale";
import type {EitherDataOrIdAndTier} from "@/assets/types/Codex";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import ItemCardDetail from "@/components/snbWidget/itemCardDetail.vue";

const {localLocale} = use_local_locale()
const props = defineProps<EitherDataOrIdAndTier & { locale?: string, isShowTooltip?: boolean }>()
const {item} = useI18nReadName()

let getTitle = computed(() => {
  return `${item(props.id || props.data?.id || '').name(props.locale || localLocale.value) || '-'}`
})

/**
 * 悬浮卡片使用的物品标识
 */
const cardId = computed(() => props.id || props.data?.id || '')

defineExpose({ name: getTitle })

defineOptions({
  name: "ItemName"
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false || !cardId">
    <template v-slot:activator="{ props: activatorProps }">
      <span :title="getTitle" v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <ItemCardDetail v-if="cardId" :id="cardId" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">

</style>
