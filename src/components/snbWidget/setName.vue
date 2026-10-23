<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import SetCardDetail from "@/components/snbWidget/setCardDetail.vue";

const props = defineProps<{ id: string, grade?: string, isShowTooltip?: boolean }>(),
    {set} = useI18nReadName()

let getTitle = computed(() => {
  return `${set(props.id).name() || '-'}`
})

defineOptions({
  name: "SetName"
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false">
    <template v-slot:activator="{ props: activatorProps }">
      <span :class="`grade-${grade}-title`" :title="getTitle" v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <SetCardDetail :id="props.id" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">

</style>
