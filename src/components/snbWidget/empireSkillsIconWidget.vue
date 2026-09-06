<script setup lang="ts">
import EmpireSkillIconWidget from "./empireSkillIconWidget.vue";

defineOptions({
  name: "EmpireSkillsIconWidget"
});
</script>

<template>
  <EmpireSkillIconWidget v-bind="($attrs as any)" />
</template>
