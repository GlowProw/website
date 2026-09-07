<script setup lang="ts">
import {computed} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const props = withDefaults(defineProps<{
  tag?: any;
  data?: any;
  modelValue?: any;
  color?: string;
  locale?: string;
}>(), {
  tag: '',
  data: '',
  modelValue: '',
  color: undefined,
  locale: undefined
});

const {asString} = useI18nUtils(computed(() => props.locale));

const currentTag = computed(() => {
  return props.tag || props.data || props.modelValue || '';
});

const title = computed(() => {
  const val = currentTag.value;
  if (!val) return '';
  const str = val.toString();
  const parts = str.split('_');
  return asString([
    `${val}`,
    `assembly.tags.teamFormationMethods.${parts[1]}`,
    `assembly.tags.modes.${parts[0]}`,
    `assembly.tags.damageTypes.${parts[1]}`,
    `assembly.tags.difficultyOfAcquisitions.${parts[1]}`,
    `codex.ships.archetypes.${parts[1]}.name`,
    `snb.seasons.${parts[1]}`,
  ], {
    backRawKey: true
  });
});

defineOptions({name: 'AssemblyTagChip'});
</script>

<template>
  <v-chip v-bind="$attrs" :color="color">
    <slot>{{ title }}</slot>
  </v-chip>
</template>
