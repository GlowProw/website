<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const props = defineProps<{ id: string | undefined }>(),
    {material} = useI18nReadName()

let getTitle = computed(() => {
  return `${material(props.id).name() || '-'}`
})

defineOptions({
  name: "MaterialName"
})
</script>

<template>
  <span :title="getTitle" v-if="id">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
