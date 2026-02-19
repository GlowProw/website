<script setup lang="ts">
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {computed} from "vue";

const props = defineProps<{ id: string }>(),
    {sanitizeString, asArray} = useI18nUtils()

let getDescription = computed(() => {
      return asArray([
        `snb.commodities.${props.id}.description`,
        `snb.commodities.${props.id}.description.general`,
      ])
    }),
    isHasDescription = computed(() => getDescription.value.length > 0)

defineExpose({
  isHasDescription
})
</script>

<template>
<span v-for="(i ,index) in getDescription" :key="index">
  {{ i }}
</span>
</template>

<style scoped lang="less">

</style>
