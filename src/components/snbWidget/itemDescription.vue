<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {use_local_locale} from "@/assets/sripts/use_local_locale";

const props = defineProps<{ id: string }>(),
    {item} = useI18nReadName(),
    {localLocale} = use_local_locale()

let getDescription = computed(() => {
  return item(props.id).description(localLocale.value)
}),
isHasDescription = computed(() => getDescription.value.length > 0)

defineExpose({
  isHasDescription
})

defineOptions({
  name: "ItemDescription"
})
</script>

<template>
<span v-for="(i ,index) in getDescription" :key="index">
  {{ i }}
</span>
</template>

<style scoped lang="less">

</style>
