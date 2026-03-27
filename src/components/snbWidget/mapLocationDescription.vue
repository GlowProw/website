<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const props = defineProps<{ id: string }>(),
    {mapLocation} = useI18nReadName()

let getDescription = computed(() => {
      return mapLocation(props.id as string).description()
    }),
    isHasDescription = computed(() => getDescription.value.length > 0)

defineExpose({
  isHasDescription
})

defineOptions({
  name: "mapLocationDescription"
})
</script>

<template>
<span v-for="(i ,index) in getDescription" :key="index">
  {{ i }}
</span>
</template>

<style scoped lang="less">

</style>
