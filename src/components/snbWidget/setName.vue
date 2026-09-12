<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";
import {useI18n} from "vue-i18n";

const props = defineProps<{ id: string, grade?: string }>(),
    {set} = useI18nReadName()

let getTitle = computed(() => {
  return `${set(props.id).name() || '-'}`
})

defineOptions({
  name: "SetName"
})
</script>

<template>
  <span :class="`grade-${grade}-title`" :title="getTitle">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
