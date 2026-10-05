<script setup lang="ts">
const props = defineProps<{ time: string | number | Date | undefined | unknown | null }>()

defineOptions({
  name: 'Time'
})
</script>

<template>
<span>{{ new Date(time as any).toLocaleString() }}</span>
</template>

<style scoped lang="less">

</style>
