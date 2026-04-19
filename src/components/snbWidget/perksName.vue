<script setup lang="ts">

import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const props = defineProps<{ id: string }>(),
    {perk} = useI18nReadName()


let getTitle = computed(() => {
      return `${perk(props.id).name() || ''}`
    }),
    isTitleEmpty = computed(() => getTitle.value === '')

defineExpose({
  isTitleEmpty
})

defineOptions({
  name: "PerksName"
})
</script>

<template>
  <span :title="getTitle">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
