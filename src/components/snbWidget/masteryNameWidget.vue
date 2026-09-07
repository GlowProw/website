<script setup lang="ts">
import MasteryName from "./masteryName.vue";

defineOptions({
  name: "MasteryNameWidget"
});
</script>

<template>
  <MasteryName v-bind="($attrs as any)" />
</template>
