<script setup lang="ts">
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import type {Mastery} from 'glow-prow-data';
import type {AggregatedEffect} from '@/assets/sripts/use_mastery_controller';
import ItemSlotBase from '@/components/snbWidget/ItemSlotBase.vue';
import MasteryIconWidget from '@/components/snbWidget/masteryIconWidget.vue';
import VerticalScrollList from "@/components/VerticalScrollList.vue";

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
      :width="mobile ? '100%' : 610">

    <VerticalScrollList :is-indicator="false">
      <div>
        <!-- 赛季选择卡片 -->
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
          </v-select>
        </v-card>

        <!-- 专精点数统计与重置卡片 -->
        <v-card
            tile
            elevation="0"
            class="bg-transparent">
          <div class="d-flex align-center py-4 px-7">
            <v-row align="center">
              <v-col cols="auto" class="d-flex align-center">
                <div class="mr-2">
                  <MasteryIconWidget id="masteryPoint" :size="24"></MasteryIconWidget>
                </div>
                <span class="font-weight-bold">{{ t('mastery.pointsTitle') }}</span>
              </v-col>
              <v-col class="text-amber">
                <v-divider opacity=".2" thickness="2"></v-divider>
              </v-col>
              <v-col cols="auto" class="d-flex align-center ga-2">
                <div
                    :style="`font-color: ${regularPointsSpent > maxPoints ? 'error' : 'amber'}`"
                    class="font-monospace mr-1">
                  <b class="u font-weight-bold text-amber">{{ regularPointsSpent }}</b> / <u class="u">{{ maxPoints }}</u>
                </div>
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

        <!-- 专精面板与效果展示卡片 -->
        <v-card
            tile
            elevation="0"
            class="bg-transparent"
            width="100%">
          <v-card-text class="pa-0 pb-6">
            <v-expansion-panels
                variant="default"
                class="bg-transparent"
                multiple
                :hide-actions="true"
                :tile="true"
                :model-value="panelExpanded"
                @update:model-value="emit('update:panelExpanded', $event as string[])">

              <!-- 已激活赛季效果 S -->
              <v-expansion-panel
                  value="seasonal"
                  class="bg-transparent"
                  elevation="0">
                <v-expansion-panel-title class="pa-0 px-8">
                  <div class="d-flex align-center w-100">
                    <div class="font-weight-bold d-flex align-center">
                      {{ t('mastery.seasonalPerksTitle') }}
                    </div>
                    <v-spacer></v-spacer>
                    <v-badge
                        :content="activeSeasonalPerks.length"
                        inline
                        class="mr-2"></v-badge>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="">
                  <div v-if="activeSeasonalPerks.length === 0" class="text-center py-4 text-caption opacity-60">
                    {{ t('mastery.seasonalPerksEmpty') }}
                  </div>
                  <v-row v-else density="compact" class="bg-transparent">
                    <v-col cols="12" v-for="perk in activeSeasonalPerks" :key="perk.key || perk.id">
                      <v-card variant="text">
                        <div class="d-flex align-start">
                          <ItemSlotBase size="44px" :padding="2" class="mr-3 flex-shrink-0 d-flex align-center justify-center">
                            <MasteryIconWidget
                                :id="perk.id"
                                :name="perk.id"
                                :category="perk.category"
                                :role="perk.role"
                                :with-background="true"
                                :size="36"
                            ></MasteryIconWidget>
                          </ItemSlotBase>
                          <div class="flex-grow-1">
                            <div class="d-flex align-center justify-space-between mb-1">
                              <span class="font-weight-bold text-amber text-body-2 u">{{ getSkillName(perk.id, perk.key) }}</span>
                              <v-chip size="x-small" color="amber" variant="outlined">
                                {{ t('mastery.perkRequirement', {cost: perk.cost}) }}
                              </v-chip>
                            </div>
                            <div class="text-caption opacity-80 text-pre-line">
                              {{ getSkillDesc(perk.id, perk.key) }}
                            </div>
                          </div>
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
              <!-- 已激活赛季效果 E -->

              <!-- 聚合效果统计 S -->
              <v-expansion-panel
                  value="aggregated"
                  class="bg-transparent"
                  elevation="0">
                <v-expansion-panel-title class="pa-0 px-8">
                  <div class="d-flex align-center w-100">
                    <div class="font-weight-bold d-flex align-center">
                      {{ t('mastery.aggregatedTitle') }}
                    </div>
                    <v-spacer></v-spacer>
                    <v-btn
                        variant="tonal"
                        size="small"
                        @click="emit('toggle-all-effects-expand')">
                      <span>{{ isAllEffectsExpanded ? t('mastery.collapseAll') : t('mastery.expandAll') }}</span>
                    </v-btn>
                    <v-badge
                        :content="totalEffectsCount"
                        inline
                        class="mx-2"></v-badge>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="py-2">
                  <!-- 筛选输入框 -->
                  <v-text-field
                      v-if="filteredAggregatedEffects.length > 0"
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
                          class="mb-2 rounded border border-opacity-10 overflow-hidden">
                        <!-- 汇总行 -->
                        <div
                            class="d-flex align-center justify-space-between px-3 py-2 cursor-pointer effect-header-row"
                            @click="emit('toggle-effect-expand', eff.id)">
                          <div class="d-flex align-center flex-grow-1 pr-2">
                            <v-icon size="14" class="mr-2 opacity-60">
                              {{ expandedEffectIds.has(eff.id) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                            </v-icon>
                            <span class="text-caption font-weight-bold">{{ eff.renderedDescription }}</span>
                          </div>
                          <v-chip size="x-small" variant="text" class="opacity-60">
                            {{ t('mastery.sourcesCount', {count: eff.contributors.length}) }}
                          </v-chip>
                        </div>

                        <!-- 贡献明细展开行 -->
                        <v-expand-transition>
                          <div v-if="expandedEffectIds.has(eff.id)" class="px-3 py-2 bg-surface-darken-1 border-t border-opacity-10">
                            <div class="text-caption opacity-50 mb-1 font-weight-bold">{{ t('mastery.sourcesTitle') }}</div>
                            <v-divider class="mb-2"></v-divider>
                            <template v-for="c in eff.contributors"
                                      :key="c.skillKey">
                              <v-row>
                                <v-col cols="auto">
                                  <MasteryIconWidget
                                      :id="c.skillKey"
                                      :category="c.skillCategory"
                                      :with-background="true"
                                      :size="40"
                                      class="mr-2"
                                  ></MasteryIconWidget>
                                </v-col>
                                <v-col>
                                  <div class="d-flex align-center justify-space-between">
                                    <p class="font-weight-bold u">{{ c.skillName }} x{{ c.buffCount }}</p>
                                    <v-chip size="x-small" :color="getCategoryColor(c.skillCategory)" variant="tonal">
                                      {{ c.skillCategory }}
                                    </v-chip>
                                  </div>
                                  <p class="text-caption opacity-60">
                                    {{ c.contributionText }}
                                  </p>
                                </v-col>
                              </v-row>
                            </template>
                          </div>
                        </v-expand-transition>
                      </div>
                    </v-list>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
              <!-- 聚合效果统计 E -->

            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </div>
    </VerticalScrollList>
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
  height: calc(100vh - 20px) !important;
  overflow-y: auto;
  z-index: 30 !important;

  .bg-surface-blur {
    background-color: rgba(26, 34, 44, 0.75) !important;
  }

  .effects-table-wrap {
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
