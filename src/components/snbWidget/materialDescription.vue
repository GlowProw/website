<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const props = defineProps<{ id: string | undefined }>(),
    {material} = useI18nReadName()

const getDescription = computed(() => material(props.id).description()),
    isHasDescription = computed(() => !!getDescription.value)

defineExpose({
  isHasDescription
})

defineOptions({
  name: "MaterialDescription",
})
</script>

<template>
  <span :title="getDescription">{{ getDescription }}</span>
</template>

<style scoped lang="less">

</style>
