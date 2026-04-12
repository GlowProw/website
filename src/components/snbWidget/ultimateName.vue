<script lang="ts">
export default { name: 'UltimateName' }
</script>

<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {use_local_locale} from "@/assets/sripts/use_local_locale";

const {localLocale} = use_local_locale()
const props = defineProps<{id: string, locale?: string}>(),
    i18nReadName = useI18nReadName()
</script>

<template>
  {{ i18nReadName.ultimate(props.id).name(props.locale || localLocale) }}
</template>

<style scoped lang="less">

</style>
