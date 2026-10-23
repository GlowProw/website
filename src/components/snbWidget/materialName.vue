<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import MaterialCardDetail from "@/components/snbWidget/materialCardDetail.vue";

const props = defineProps<{ id: string | undefined, isShowTooltip?: boolean }>(),
    {material} = useI18nReadName()

let getTitle = computed(() => {
  return `${material(props.id).name() || '-'}`
})

defineOptions({
  name: "MaterialName"
})
</script>

<template>
  <ItemCardTooltip v-if="props.id" :disabled="props.isShowTooltip === false">
    <template v-slot:activator="{ props: activatorProps }">
      <span :title="getTitle" v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <MaterialCardDetail :id="props.id" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">

</style>
