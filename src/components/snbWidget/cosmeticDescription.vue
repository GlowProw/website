<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed} from "vue";

const {t} = useI18n(),
    props = defineProps<{ id: string | undefined }>()

let getDescription = computed(() => t(`snb.cosmetics.${props.id}.description.general`)),
    isHasDescription = computed(() => !!getDescription.value)

defineExpose({
  isHasDescription
})
</script>

<template>
  <span :title="getDescription">{{ getDescription }}</span>
</template>

<style scoped lang="less">

</style>
