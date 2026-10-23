<script setup lang="ts">

import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import ModCardDetail from "@/components/snbWidget/modCardDetail.vue";

const props = defineProps<{ id: string, grade?: string, isShowTooltip?: boolean }>(),
    {locale: localLocale} = useI18nUtils(),
    {modification} = useI18nReadName()

let getTitle = computed(() => {
  return `${modification(props.id).name(localLocale.value) || '-'}`
})

defineOptions({
  name:"ModName"
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false">
    <template v-slot:activator="{ props: activatorProps }">
      <span :class="`grade-${grade}-title`" v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <ModCardDetail :id="props.id" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">

</style>
