<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import MapLocationCardDetail from "@/components/snbWidget/mapLocationCardDetail.vue";

const props = defineProps<{ id: string, isShowTooltip?: boolean }>(),
    {mapLocation} = useI18nReadName()

let getTitle = computed(() => {
  return `${mapLocation(props.id).name() || '-'}`
})

defineOptions({
  name: "MapLocationNameWidget"
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false">
    <template v-slot:activator="{ props: activatorProps }">
      <span v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <MapLocationCardDetail :id="props.id" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">

</style>
