<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import CosmeticCardDetail from "@/components/snbWidget/cosmeticCardDetail.vue";

const props = defineProps<{ id: string, grade?: string, isShowTooltip?: boolean }>(),
    {cosmetic} = useI18nReadName()

let getTitle = computed(() => {
  return `${cosmetic(props.id).name() || '-'}`
})

defineOptions({
  name: "CosmeticName",
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false">
    <template v-slot:activator="{ props: activatorProps }">
      <span :class="`grade-${grade}-title`" v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <CosmeticCardDetail :id="props.id" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">

</style>
