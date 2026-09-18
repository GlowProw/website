<script setup lang="ts">
import StateOfWarView from "@/views/stateOfWar/View.vue";
</script>

<template>
  <div class="state-of-war-widget">
    <StateOfWarView :is-widget="true" />
  </div>
</template>

<style scoped lang="less">
.state-of-war-widget {
  background-color: transparent;
  width: 100%;
  min-width: 1000px;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
