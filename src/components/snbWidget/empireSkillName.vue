<script setup lang="ts">
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import EmpireSkillCardDetail from "@/components/snbWidget/empireSkillCardDetail.vue";

const props = defineProps<{ id: string, isShowTooltip?: boolean }>(),
    {locale: localLocale} = useI18nUtils(),
    {empireSkill} = useI18nReadName()

let getTitle = computed(() => {
  return `${empireSkill(props.id).name(localLocale.value) || '-'}`
})

defineOptions({
  name: "EmpireSkillName"
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false">
    <template v-slot:activator="{ props: activatorProps }">
      <span v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <EmpireSkillCardDetail :id="props.id" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">
</style>
