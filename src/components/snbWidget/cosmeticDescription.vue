<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const props = defineProps<{ id: string | undefined }>(),
    {cosmetic} = useI18nReadName()

let getDescription = computed(() => cosmetic(props.id).description()),
    isHasDescription = computed(() => !!getDescription.value)

defineExpose({
  isHasDescription
})

defineOptions({
  name: "CosmeticDescription"
})
</script>

<template>
  <span :title="getDescription">{{ getDescription }}</span>
</template>

<style scoped lang="less">

</style>
