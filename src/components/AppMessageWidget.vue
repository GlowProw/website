<script setup lang="ts">
import {useNoticeStore} from "~/stores/noticeStore";

const noticeStore = useNoticeStore()
</script>

<template>
  <v-snackbar-queue v-model="noticeStore.messages"></v-snackbar-queue>
</template>

<style scoped lang="less">

</style>
