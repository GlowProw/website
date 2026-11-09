<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, onMounted, ref, toRaw, watch} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

import {Seasons} from "glow-prow-data";
import DamageIconWidget from "@/components/snbWidget/damageIconWidget.vue";

const poops = withDefaults(defineProps<{ modelValue: any[], readonly?: boolean, class?: string }>(), {
      modelValue: () => [],
      readonly: false,
      class: ''
    }),
    {t} = useI18n(),
    {season: readSeason} = useI18nReadName()

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

const allPanelKeys = ['modes', 'teamFormation', 'seasons', 'damageTypes', 'archetypes', 'difficulty'];

const categoryTags: Record<string, string[]> = {
  modes: ['pvp', 'pve'],
  teamFormation: ['teamFormationMethod_singlePlayer', 'teamFormationMethod_multiPlayer'],
  seasons: tagsConfig.seasons.map(i => `season_${i}`),
  damageTypes: tagsConfig.damageTypes.map(i => `damageType_${i}`),
  archetypes: tagsConfig.archeTypes.map(i => `archetype_${i}`),
  difficulty: tagsConfig.difficultyOfAcquisitions.map(i => `difficultyOfAcquisition_${i}`),
};

const getCategorySelectedCount = (cat: string) => {
  const tags = categoryTags[cat] || [];
  return internalTags.value.filter(t => tags.includes(t)).length;
};

const activePanels = ref<string[]>([...allPanelKeys]);

let hasAutoExpanded = false;
watch(() => poops.modelValue, (newVal) => {
  if (poops.readonly && !hasAutoExpanded && newVal && newVal.length > 0) {
    const selectedCats = allPanelKeys.filter(cat => getCategorySelectedCount(cat) > 0);
    if (selectedCats.length > 0) {
      activePanels.value = selectedCats;
      hasAutoExpanded = true;
    }
  }
}, { immediate: true });

defineOptions({name: 'AssemblyTagsWidget'})
</script>

<template>
  <v-chip-group
      v-model="internalTags"
      :class="poops.class"
      column
      multiple>
    <v-expansion-panels
        v-model="activePanels"
        multiple
        variant="accordion"
        gap="10">
      <!-- 适用模式 -->
      <v-expansion-panel rounded="30" eager value="modes">
        <v-expansion-panel-title class="text-body-1 font-weight-bold">
          <div class="d-flex align-center justify-space-between w-100 pr-2">
            <span>{{ t('assembly.tags.titles.applicableModes') }}</span>
            <v-chip v-if="getCategorySelectedCount('modes') > 0"
                    size="x-small"
                    color="amber"
                    variant="tonal"
                    class="font-weight-bold">
              {{ getCategorySelectedCount('modes') }}
            </v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="text-body-2">
          <div class="d-flex flex-wrap ga-2" :class="[readonly ? 'readonly' : '']">
            <v-chip filter size="small"
                    color="var(--main-color)"
                    v-for="(i, index) in ['pvp', 'pve']"
                    :key="index"
                    :value="i">{{ t('assembly.tags.modes.' + i) }}
            </v-chip>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- 组队方式 -->
      <v-expansion-panel rounded="30" eager value="teamFormation">
        <v-expansion-panel-title class="text-body-1 font-weight-bold">
          <div class="d-flex align-center justify-space-between w-100 pr-2">
            <span>{{ t('assembly.tags.titles.teamFormation') }}</span>
            <v-chip v-if="getCategorySelectedCount('teamFormation') > 0"
                    size="x-small"
                    color="amber"
                    variant="tonal"
                    class="font-weight-bold">
              {{ getCategorySelectedCount('teamFormation') }}
            </v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="text-body-2">
          <div class="d-flex flex-wrap ga-2" :class="[readonly ? 'readonly' : '']">
            <v-chip filter size="small"
                    color="var(--main-color)"
                    v-for="(i, index) in ['singlePlayer', 'multiPlayer']"
                    :key="index"
                    :value="`teamFormationMethod_${i}`">
              {{ t(`assembly.tags.teamFormationMethods.${i}`) }}
            </v-chip>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- 赛季 -->
      <v-expansion-panel rounded="30" eager value="seasons">
        <v-expansion-panel-title class="text-body-1 font-weight-bold">
          <div class="d-flex align-center justify-space-between w-100 pr-2">
            <span>{{ t('assembly.tags.titles.seasons') }}</span>
            <v-chip v-if="getCategorySelectedCount('seasons') > 0"
                    size="x-small"
                    color="amber"
                    variant="tonal"
                    class="font-weight-bold">
              {{ getCategorySelectedCount('seasons') }}
            </v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="text-body-2">
          <div class="d-flex flex-wrap ga-2" :class="[readonly ? 'readonly' : '']">
            <v-chip filter size="small"
                    color="var(--main-color)"
                    v-for="(i, index) in tagsConfig.seasons"
                    :key="index"
                    :value="`season_${i}`">{{ readSeason(i).name() }}
            </v-chip>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- 伤害类型 -->
      <v-expansion-panel rounded="30" eager value="damageTypes">
        <v-expansion-panel-title class="text-body-1 font-weight-bold">
          <div class="d-flex align-center justify-space-between w-100 pr-2">
            <span>{{ t('assembly.tags.titles.damageTypes') }}</span>
            <v-chip v-if="getCategorySelectedCount('damageTypes') > 0"
                    size="x-small"
                    color="amber"
                    variant="tonal"
                    class="font-weight-bold">
              {{ getCategorySelectedCount('damageTypes') }}
            </v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="text-body-2">
          <div class="d-flex flex-wrap ga-2" :class="[readonly ? 'readonly' : '']">
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
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- 战舰定位 -->
      <v-expansion-panel rounded="30" eager value="archetypes">
        <v-expansion-panel-title class="text-body-1 font-weight-bold">
          <div class="d-flex align-center justify-space-between w-100 pr-2">
            <span>{{ t('assembly.tags.titles.archetypes') }}</span>
            <v-chip v-if="getCategorySelectedCount('archetypes') > 0"
                    size="x-small"
                    color="amber"
                    variant="tonal"
                    class="font-weight-bold">
              {{ getCategorySelectedCount('archetypes') }}
            </v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="text-body-2">
          <div class="d-flex flex-wrap ga-2" :class="[readonly ? 'readonly' : '']">
            <v-chip filter size="small"
                    color="var(--main-color)"
                    v-for="(i, index) in tagsConfig.archeTypes"
                    :key="index"
                    :value="`archetype_${i}`">{{ t(`codex.ships.archetypes.${i}.name`) }}
            </v-chip>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- 获取难度 -->
      <v-expansion-panel rounded="30" eager value="difficulty">
        <v-expansion-panel-title class="text-body-1 font-weight-bold">
          <div class="d-flex align-center justify-space-between w-100 pr-2">
            <span>{{ t('assembly.tags.titles.difficultyOfAcquisition') }}</span>
            <v-chip v-if="getCategorySelectedCount('difficulty') > 0"
                    size="x-small"
                    color="amber"
                    variant="tonal"
                    class="font-weight-bold">
              {{ getCategorySelectedCount('difficulty') }}
            </v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="text-body-2">
          <div class="d-flex flex-wrap ga-2" :class="[readonly ? 'readonly' : '']">
            <v-chip filter size="small"
                    color="var(--main-color)"
                    v-for="(i, index) in tagsConfig.difficultyOfAcquisitions"
                    :key="index"
                    :value="`difficultyOfAcquisition_${i}`">
              {{ t(`assembly.tags.difficultyOfAcquisitions.${i}`) }}
            </v-chip>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
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
