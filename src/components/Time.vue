<script lang="ts">
export default { name: 'Time' }
</script>

<script setup lang="ts">
const props = defineProps<{ time: string | number | Date | undefined | unknown | null }>()
</script>

<template>
<span>{{ new Date(time as any).toLocaleString() }}</span>
</template>

<style scoped lang="less">

</style>
