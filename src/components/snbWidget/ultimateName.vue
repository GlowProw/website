<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {use_local_locale} from "@/assets/sripts/use_local_locale";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import UltimateCardDetail from "@/components/snbWidget/ultimateCardDetail.vue";

const {localLocale} = use_local_locale()
const props = defineProps<{id: string, locale?: string, isShowTooltip?: boolean}>(),
    i18nReadName = useI18nReadName()

defineOptions({
  name: 'UltimateName'
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false || !props.id">
    <template v-slot:activator="{ props: activatorProps }">
      <span v-bind="activatorProps">{{ i18nReadName.ultimate(props.id).name(props.locale || localLocale) }}</span>
    </template>
    <UltimateCardDetail v-if="props.id" :id="props.id" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">

</style>
