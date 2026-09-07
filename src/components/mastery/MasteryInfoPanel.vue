<script setup lang="ts">
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import type {Mastery} from 'glow-prow-data';
import type {AggregatedEffect} from '@/assets/sripts/use_mastery_controller';
import AdsWidget from '@/components/ads/google/index.vue';
import ItemSlotBase from '@/components/snbWidget/ItemSlotBase.vue';
import MasteryIconWidget from '@/components/snbWidget/masteryIconWidget.vue';

const {t} = useI18n();

const props = withDefaults(defineProps<{
  modelValue?: boolean;
  isOpen?: boolean;
  mobile?: boolean;
  panelExpanded: string[];
  regularPointsSpent: number;
  maxPoints: number;
  activeSeasonalPerks: Mastery[];
  filteredAggregatedEffects: AggregatedEffect[];
  totalEffectsCount: number;
  effectsFilter: string;
  expandedEffectIds: Set<string>;
  isAllEffectsExpanded: boolean;
  getSkillName: (key: string, id?: string) => string;
  getSkillDesc: (key: string, id?: string) => string;
  getCategoryColor: (category?: string) => string;
  selectedSeasonId?: string;
  seasonOptions?: Array<{ id: string; title: string; maxPoints: number }>;
}>(), {
  modelValue: undefined,
  isOpen: undefined,
  mobile: false,
  selectedSeasonId: '',
  seasonOptions: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'update:isOpen', val: boolean): void;
  (e: 'update:selectedSeasonId', val: string): void;
  (e: 'update:panelExpanded', val: string[]): void;
  (e: 'update:effectsFilter', val: string): void;
  (e: 'reset-points'): void;
  (e: 'toggle-effect-expand', id: string): void;
  (e: 'toggle-all-effects-expand'): void;
}>();

const openModel = computed({
  get: () => props.modelValue !== undefined ? props.modelValue : (props.isOpen ?? false),
  set: (val: boolean) => {
    emit('update:modelValue', val);
    emit('update:isOpen', val);
  }
});

defineOptions({name: 'MasteryInfoPanel'});
</script>

<template>
  <v-navigation-drawer
      :model-value="openModel"
      @update:model-value="openModel = $event"
      temporary
      absolute
      class="mastery-info-drawer"
      :scrim="false"
      :style="mobile ? openModel ? 'min-width: 100%' : 'width: 0' : ''"
      :width="mobile ? '100%' : 510">

    <AdsWidget id="none" class="my-5 w-100" tile></AdsWidget>

    <div>
      <!-- 0. 赛季选择 Card (参考 LayerControl 集合选择) -->
      <v-card
          tile
          elevation="0"
          class="bg-transparent"
          v-if="seasonOptions && seasonOptions.length > 0">
        <div class="d-flex align-center py-4 px-7">
          <v-row align="center">
            <v-col cols="auto" class="d-flex align-center">
              <v-icon icon="mdi-calendar-range" class="mr-2 text-amber"></v-icon>
              <span class="font-weight-bold">{{ t('mastery.shareDialog.currentSeason') }}</span>
            </v-col>
            <v-col class="text-amber">
              <v-divider opacity=".2" thickness="2"></v-divider>
            </v-col>
          </v-row>
        </div>

        <v-select
            :model-value="selectedSeasonId"
            @update:model-value="emit('update:selectedSeasonId', $event)"
            :items="seasonOptions"
            item-title="title"
            item-value="id"
            density="compact"
            variant="outlined"
            hide-details
            class="season-selector mx-7 mb-2">
          <template v-slot:prepend-inner>
            <v-icon size="18" class="text-amber mr-1">mdi-compass</v-icon>
          </template>
        </v-select>
      </v-card>

      <!-- 1. 专精点数统计与重置 Card (参考 LayerControl header) -->
      <v-card
          tile
          elevation="0"
          class="bg-transparent">
        <div class="d-flex align-center py-4 px-7">
          <v-row align="center">
            <v-col cols="auto" class="d-flex align-center">
              <MasteryIconWidget name="masteryPoint" size="24" class="mr-2"></MasteryIconWidget>
              <span class="font-weight-bold">{{ t('mastery.pointsTitle') }}</span>
            </v-col>
            <v-col class="text-amber">
              <v-divider opacity=".2" thickness="2"></v-divider>
            </v-col>
            <v-col cols="auto" class="d-flex align-center ga-2">
              <v-chip
                  :color="regularPointsSpent > maxPoints ? 'error' : 'amber'"
                  variant="outlined"
                  class="font-weight-bold font-monospace"
                  size="small">
                {{ regularPointsSpent }} / {{ maxPoints }}
              </v-chip>
              <v-btn
                  variant="tonal"
                  size="small"
                  color="amber"
                  prepend-icon="mdi-refresh"
                  :disabled="regularPointsSpent === 0"
                  @click="emit('reset-points')">
                <span>{{ t('mastery.reset') }}</span>
              </v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card>

      <!-- 2. 专精面板与效果展示 Card (参考 LayerControl main card) -->
      <v-card
          tile
          elevation="0"
          class="bg-transparent"
          width="100%"
          height="100%">
        <div class="d-flex align-center py-4 px-7">
          <v-row align="center">
            <v-col cols="auto" class="d-flex align-center">
              <v-icon icon="mdi-layers" class="mr-2 text-amber"></v-icon>
              <span class="font-weight-bold">{{ t('mastery.panelTitle') }}</span>
            </v-col>
            <v-col class="text-amber">
              <v-divider opacity=".2" thickness="2"></v-divider>
            </v-col>
            <v-col cols="auto" class="d-flex ga-2">
              <v-btn
                  variant="tonal"
                  size="small"
                  @click="emit('toggle-all-effects-expand')">
                <span>{{ isAllEffectsExpanded ? t('mastery.collapseAll') : t('mastery.expandAll') }}</span>
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <v-card-text class="pa-0 pb-6">
          <v-expansion-panels
              variant="default"
              class="bg-transparent"
              multiple
              :tile="true"
              :model-value="panelExpanded"
              @update:model-value="emit('update:panelExpanded', $event as string[])">

            <!-- 1. 已激活赛季效果 (Active Seasonal Perks) -->
            <v-expansion-panel
                value="seasonal"
                class="bg-transparent"
                elevation="0">
              <v-expansion-panel-title class="pa-0 px-8">
                <div class="d-flex align-center w-100">
                  <div class="font-weight-bold d-flex align-center">
                    <v-icon class="mr-2 text-amber" size="20">mdi-diamond-stone</v-icon>
                    {{ t('mastery.seasonalPerksTitle') }}
                  </div>
                  <v-spacer></v-spacer>
                  <v-badge
                      :content="activeSeasonalPerks.length"
                      color="amber"
                      inline
                      class="mr-2"></v-badge>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text class="px-7 py-2">
                <div v-if="activeSeasonalPerks.length === 0" class="text-center py-4 text-caption opacity-60">
                  {{ t('mastery.seasonalPerksEmpty') }}
                </div>
                <v-row v-else density="compact" class="bg-transparent py-1">
                  <v-col cols="12" v-for="perk in activeSeasonalPerks" :key="perk.id">
                    <v-card border class="pa-3 bg-surface-blur">
                      <div class="d-flex align-start">
                        <ItemSlotBase size="44px" :padding="2" class="mr-3 flex-shrink-0">
                          <MasteryIconWidget :name="perk.skill" size="36"></MasteryIconWidget>
                        </ItemSlotBase>
                        <div class="flex-grow-1">
                          <div class="d-flex align-center justify-space-between mb-1">
                            <span class="font-weight-bold text-amber text-body-2">{{ getSkillName(perk.skill, perk.id) }}</span>
                            <v-chip size="x-small" color="amber" variant="outlined">
                              {{ t('mastery.perkRequirement', { cost: perk.cost }) }}
                            </v-chip>
                          </div>
                          <div class="text-caption opacity-80 text-pre-line">
                            {{ getSkillDesc(perk.skill, perk.id) }}
                          </div>
                        </div>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- 2. 聚合效果统计 (Aggregated Effects) -->
            <v-expansion-panel
                value="aggregated"
                class="bg-transparent"
                elevation="0">
              <v-expansion-panel-title class="pa-0 px-8">
                <div class="d-flex align-center w-100">
                  <div class="font-weight-bold d-flex align-center">
                    <v-icon class="mr-2 text-amber" size="20">mdi-chart-bar</v-icon>
                    {{ t('mastery.aggregatedTitle') }}
                  </div>
                  <v-spacer></v-spacer>
                  <v-badge
                      :content="totalEffectsCount"
                      color="amber"
                      inline
                      class="mr-2"></v-badge>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text class="py-2">
                <!-- 筛选输入框 -->
                <v-text-field
                    :model-value="effectsFilter"
                    @update:model-value="emit('update:effectsFilter', $event)"
                    :placeholder="t('mastery.filterEffectsPlaceholder')"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    prepend-inner-icon="mdi-filter-variant"
                    class="mb-3">
                </v-text-field>

                <div v-if="filteredAggregatedEffects.length === 0" class="text-center py-4 text-caption opacity-60">
                  {{ t('mastery.noAggregatedEffects') }}
                </div>
                <div v-else class="effects-table-wrap">
                  <v-list density="compact" class="bg-transparent pa-0">
                    <div
                        v-for="eff in filteredAggregatedEffects"
                        :key="eff.id"
                        class="mb-2 rounded border border-opacity-10 overflow-hidden bg-surface-blur">
                      <!-- 汇总行 -->
                      <div
                          class="d-flex align-center justify-space-between px-3 py-2 cursor-pointer effect-header-row"
                          @click="emit('toggle-effect-expand', eff.id)">
                        <div class="d-flex align-center flex-grow-1 pr-2">
                          <v-icon size="14" class="mr-2 opacity-60">
                            {{ expandedEffectIds.has(eff.id) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                          </v-icon>
                          <span class="text-caption font-weight-bold text-amber-lighten-2">{{ eff.renderedDescription }}</span>
                        </div>
                        <v-chip size="x-small" variant="text" class="opacity-60">
                          {{ t('mastery.sourcesCount', { count: eff.contributors.length }) }}
                        </v-chip>
                      </div>

                      <!-- 贡献明细展开行 -->
                      <v-expand-transition>
                        <div v-if="expandedEffectIds.has(eff.id)" class="px-3 py-2 bg-surface-darken-1 border-t border-opacity-10">
                          <div class="text-caption opacity-50 mb-1 font-weight-bold">{{ t('mastery.sourcesTitle') }}</div>
                          <div
                              v-for="c in eff.contributors"
                              :key="c.skillKey"
                              class="d-flex align-center justify-space-between py-1 text-caption">
                            <div class="d-flex align-center">
                              <MasteryIconWidget :name="c.skillKey" size="18" class="mr-2"></MasteryIconWidget>
                              <span>{{ c.buffCount }}x {{ c.skillName }}</span>
                              <v-chip size="x-small" :color="getCategoryColor(c.skillCategory)" variant="tonal" class="ml-2">
                                {{ c.skillCategory }}
                              </v-chip>
                            </div>
                            <span class="text-amber font-monospace">{{ c.contributionText }}</span>
                          </div>
                        </div>
                      </v-expand-transition>
                    </div>
                  </v-list>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </v-card>
    </div>
  </v-navigation-drawer>
</template>

<style scoped lang="less">
.mastery-info-drawer {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.2) !important;
  backdrop-filter: blur(70px);
  top: 0 !important;
  left: 0;
  padding-top: 136px;
  height: calc(100vh) !important;
  overflow-y: auto;
  z-index: 30 !important;

  .bg-surface-blur {
    background-color: rgba(26, 34, 44, 0.75) !important;
  }

  .effects-table-wrap {
    max-height: 420px;
    overflow-y: auto;
  }

  .effect-header-row {
    background: rgba(255, 255, 255, 0.02);
    transition: background 0.2s;
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
}
</style>
