<script setup lang="ts">
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import MasteryCardDetail from "@/components/snbWidget/masteryCardDetail.vue";

const props = defineProps<{ id?: string, name?: string, isShowTooltip?: boolean }>(),
    {locale: localLocale} = useI18nUtils(),
    {mastery} = useI18nReadName()

let getTitle = computed(() => {
  const key = props.id || props.name || ''
  return mastery(key).name(localLocale.value) || key || '-'
})

/**
 * 悬浮卡片使用的精通标识，仅有 id 时可查详情
 */
const cardId = computed(() => props.id || '')

defineOptions({
  name: "MasteryName"
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false || !cardId">
    <template v-slot:activator="{ props: activatorProps }">
      <span v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <MasteryCardDetail v-if="cardId" :id="cardId" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">
</style>
