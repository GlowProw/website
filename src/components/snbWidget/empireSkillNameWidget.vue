<script setup lang="ts">
import EmpireSkillName from "./empireSkillName.vue";

defineOptions({
  name: "EmpireSkillNameWidget"
});
</script>

<template>
  <EmpireSkillName v-bind="($attrs as any)" />
</template>
