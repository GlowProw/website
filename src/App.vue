<script setup lang="ts">
import AppMessageWidget from '@/components/AppMessageWidget'
import {onMounted} from "vue";

onMounted(() => {
  document.dispatchEvent(new Event('render-event'));
});
</script>

<template>
  <AppMessageWidget></AppMessageWidget>
  <router-view></router-view>
</template>

<style scoped>
</style>
