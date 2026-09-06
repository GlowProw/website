<script setup lang="ts">
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {EmpireSkills} from "glow-prow-data";
import {number} from "@/assets/sripts";

const props = withDefaults(defineProps<{
  id: string,
  stage?: number,
  class?: string
}>(), {
  class: ''
});

const {t} = useI18n();
const skill = computed(() => EmpireSkills[props.id]);

const factionName = computed(() => {
  if (!skill.value?.type) return '';
  return t(`snb.factions.${skill.value.type}.name`);
});

const interpolateParams = computed(() => {
  return {
    ...(skill.value?.attr || {}),
    faction: factionName.value
  };
});

defineOptions({
  name: "EmpireSkillDescription"
});
</script>

<template>
  <div v-if="skill" :class="props.class" class="empire-skill-description">
    <!-- 特定 stage -->
    <template v-if="props.stage">
      <div class="effect-item">
        {{ t(`snb.empireSkills.${skill.id}.effects.${props.stage}`, interpolateParams) || t(`snb.empireSkills.${skill.id}.effects.general`, interpolateParams) }}
      </div>
    </template>
    <!-- 多阶段预览 -->
    <template v-else-if="skill.stage && skill.stage > 1">
      <div v-for="to in skill.stage" :key="to" class="effect-item mb-1 opacity-80">
        <span class="font-weight-bold text-amber mr-1">{{ number.intToRoman(to) }}:</span>
        <span>{{ t(`snb.empireSkills.${skill.id}.effects.${to}`, interpolateParams) || t('empireSkillSimulation.effectsNotContent') }}</span>
      </div>
    </template>
    <!-- 单阶段 -->
    <template v-else>
      <div class="effect-item">
        {{ t(`snb.empireSkills.${skill.id}.effects.general`, interpolateParams) || t(`snb.empireSkills.${skill.id}.effects.1`, interpolateParams) || t('empireSkillSimulation.effectsNotContent') }}
      </div>
    </template>
  </div>
</template>

<style scoped lang="less">
.empire-skill-description {
  font-size: 0.95rem;
  line-height: 1.5;
  word-break: break-word;
}
</style>
