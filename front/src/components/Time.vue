<script setup lang="ts">
const props = defineProps<{ time: string | Date }>()
</script>

<template>
<span>{{ new Date(props.time).toLocaleString() }}</span>
</template>

<style scoped lang="less">

</style>
