<script lang="ts">
export default { name: 'AppMessageWidget' }
</script>

<script setup lang="ts">
import {useNoticeStore} from "~/stores/noticeStore";

const noticeStore = useNoticeStore()

defineOptions({
  name: 'AppMessageWidget',
})
</script>

<template>
  <v-snackbar-queue v-model="noticeStore.messages"></v-snackbar-queue>
</template>

<style scoped lang="less">

</style>
