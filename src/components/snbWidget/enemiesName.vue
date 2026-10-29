<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {use_local_locale} from "@/assets/sripts/use_local_locale";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import EnemiesCardDetail from "@/components/snbWidget/enemiesCardDetail.vue";

const props = defineProps<{ id: string, locale?: string, isShowTooltip?: boolean }>(),
    {enemy} = useI18nReadName(),
    {localLocale} = use_local_locale()

const enemyId = computed(() => props.id || '')

const getTitle = computed(() => {
  return `${enemy(enemyId.value).name(props.locale || localLocale.value) || '-'}`
})

defineExpose({name: getTitle})

defineOptions({
  name: "EnemiesName"
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false || !enemyId">
    <template v-slot:activator="{ props: activatorProps }">
      <span :title="getTitle" v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <EnemiesCardDetail v-if="enemyId" :id="enemyId"/>
  </ItemCardTooltip>
</template>

<style scoped lang="less">

</style>
