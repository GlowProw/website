<script setup lang="ts">
import {useRoute} from "vue-router";
import EmpireSkillCardDetail from "@/components/snbWidget/empireSkillCardDetail.vue";

const route = useRoute();
const id = (route.params.id as string) || '';
</script>

<template>
  <div class="empire-skill-widget d-flex justify-center">
    <EmpireSkillCardDetail
        :id="id"
        :is-widget="true"
        :is-show-description="true"
        :is-show-open-detail="false"
    />
  </div>
</template>

<style scoped>
.empire-skill-widget {
  background-color: transparent;
}
.empire-skill-widget > :first-child {
  min-width: 600px;
  max-width: 800px;
  width: 100%;
}
</style>
