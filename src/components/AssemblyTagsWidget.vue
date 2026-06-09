<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, onMounted, ref, toRaw, watch} from "vue";

import {Seasons} from "glow-prow-data";
import DamageIconWidget from "@/components/snbWidget/damageIconWidget.vue";

const poops = withDefaults(defineProps<{ modelValue: any[], readonly?: boolean, class?: string }>(), {
      modelValue: () => [],
      readonly: false,
      class: ''
    }),
    {t} = useI18n()

const tagsConfig = {
  seasons: Object.keys(Seasons),
  archeTypes: ['dps', 'tank', 'support'],
  difficultyOfAcquisitions: ['simple', 'medium', 'difficulties'],
  damageTypes: [
    'explosive',
    'flooding',
    'fire',
    'tearing',
    'piercing',
    'electric',
    'lifesteal',
    'toxic',
    'repair',
  ]
};

const knownTagPrefixes = [
  'teamFormationMethod_',
  'season_',
  'damageType_',
  'archetype_',
  'difficultyOfAcquisition_'
];
const knownStandaloneTags = ['pvp', 'pve'];

const emit = defineEmits(['change', 'update:modelValue'])

const isKnownTag = (tag: any) => {
  if (typeof tag !== 'string') return false;
  return knownStandaloneTags.includes(tag) || knownTagPrefixes.some(p => tag.startsWith(p));
};

const internalTags = computed({
  get: () => poops.modelValue?.filter(isKnownTag) || [],
  set: (val) => {
    const others = poops.modelValue?.filter(tag => !isKnownTag(tag)) || [];
    const newTags = [...others, ...val];
    emit('update:modelValue', newTags);
    emit('change', newTags);
  }
});

defineOptions({name: 'AssemblyTagsWidget'})
</script>

<template>
  <v-chip-group
      v-model="internalTags"
      :class="poops.class"
      column
      multiple>
    <div class="mt-3 w-100">
      <p class="title-long-flavor bg-black ml-n1 pl-3 pt-2 pb-2 w-100">{{ t('assembly.tags.titles.applicableModes') }}</p>
      <div class="mt-3 d-flex ga-2" :class="[readonly ? 'readonly' : '']">
        <v-chip filter size="small"
                color="var(--main-color)"
                v-for="(i, index) in ['pvp', 'pve']"
                :key="index"
                :value="i">{{ t('assembly.tags.modes.' + i) }}
        </v-chip>
      </div>
    </div>

    <div class="mt-3 w-100">
      <p class="title-long-flavor bg-black ml-n1 pl-3 pt-2 pb-2 w-100">{{ t('assembly.tags.titles.teamFormation') }}</p>
      <div class="mt-3 d-flex ga-2" :class="[readonly ? 'readonly' : '']">
        <v-chip size="small" color="var(--main-color)"
                v-for="(i, index) in ['singlePlayer', 'multiPlayer']"
                :key="index"
                :value="`teamFormationMethod_${i}`">
          {{ t(`assembly.tags.teamFormationMethods.${i}`) }}
        </v-chip>
      </div>
    </div>

    <div class="mt-3 w-100">
      <p class="title-long-flavor bg-black ml-n1 pl-3 pt-2 pb-2 w-100">{{ t('assembly.tags.titles.seasons') }}</p>
      <div class="mt-3 ga-2" :class="[readonly ? 'readonly' : '']">
        <v-chip filter size="small"
                color="var(--main-color)"
                v-for="(i, index) in tagsConfig.seasons"
                :key="index"
                :value="`season_${i}`">{{ t(`snb.seasons.${i}`) }}
        </v-chip>
      </div>
    </div>

    <div class="mt-3">
      <p class="title-long-flavor bg-black ml-n1 pl-3 pt-2 pb-2 w-100">{{ t('assembly.tags.titles.damageTypes') }}</p>
      <div class="mt-3 ga-2" :class="[readonly ? 'readonly' : '']">
        <v-chip filter
                size="small"
                color="var(--main-color)"
                v-for="(i, index) in tagsConfig.damageTypes"
                :key="index"
                :value="`damageType_${i}`">
          <DamageIconWidget :id="i" size="20px" class="mr-1" iconType="aggressivity" :is-border="false"></DamageIconWidget>
          {{ t(`assembly.tags.damageTypes.${i}`) }}
        </v-chip>
      </div>
    </div>

    <div class="mt-3 w-100">
      <p class="title-long-flavor bg-black ml-n1 pl-3 pt-2 pb-2 w-100">{{ t('assembly.tags.titles.archetypes') }}</p>
      <div class="mt-3 d-flex ga-2" :class="[readonly ? 'readonly' : '']">
        <v-chip filter size="small"
                color="var(--main-color)"
                v-for="(i, index) in tagsConfig.archeTypes"
                :key="index"
                :value="`archetype_${i}`">{{ t(`codex.ships.archetypes.${i}.name`) }}
        </v-chip>
      </div>
    </div>

    <div class="mt-3 w-100">
      <p class="title-long-flavor bg-black ml-n1 pl-3 pt-2 pb-2 w-100">{{ t('assembly.tags.titles.difficultyOfAcquisition') }}</p>
      <div class="mt-3 d-flex ga-2" :class="[readonly ? 'readonly' : '']">
        <v-chip filter size="small"
                color="var(--main-color)"
                v-for="(i, index) in tagsConfig.difficultyOfAcquisitions"
                :key="index"
                :value="`difficultyOfAcquisition_${i}`">
          {{ t(`assembly.tags.difficultyOfAcquisitions.${i}`) }}
        </v-chip>
      </div>
    </div>
  </v-chip-group>
</template>

<style scoped lang="less">
.readonly {
  position: relative;

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    z-index: 100;
    width: 100%;
    height: 100%;
  }
}
</style>
