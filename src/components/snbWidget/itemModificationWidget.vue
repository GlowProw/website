<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {Items, Modifications} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import ItemSlotBase from "./ItemSlotBase.vue";
import router from "~/router";
import {useRoute} from "vue-router";
import ModName from "@/components/snbWidget/modName.vue";
import ModDescription from "@/components/snbWidget/modDescription.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import HtmlLink from "@/components/HtmlLink.vue";
import {useDisplay} from "vuetify/framework";
import {useAppStore} from "~/stores/appStore";
import {filterAvailableModifications, getWeaponExpectedSlotTypes} from "@/assets/sripts/modification_util";
import AffixContainerView from "@/components/AffixContainerView.vue";
import RhombusWidget from "@/components/snbWidget/rhombusWidget.vue";
import DamageIconWidget from "@/components/snbWidget/damageIconWidget.vue";
import type {ModRarity} from "@/assets/types/Codex";

const modImages = import.meta.glob('@/assets/images/snb/modTypeIcons/*.*', {eager: true})
const props = withDefaults(defineProps<{ id: string, type: string | null, data?: any }>(), {
      id: null,
      type: null,
      data: null,
    }),
    appStore = useAppStore(),
    route = useRoute(),
    {mobile} = useDisplay(),
    {t, locale} = useI18n(),
    modSlotBackgroundColor = {'basic': '#101e06', 'advanced': 'rgb(7 27 53)', 'special': '#231536', 'mythic': 'rgb(68 44 13)'},
    modIndex = {'basic': 1, 'advanced': 2, 'special': 3, 'mythic': 4}

let modData = ref<Record<string, any[]>>({}),
    // 模组图标
    modIcons = ref<Record<string, string>>({}),
    // 模式显示类型
    displayMode = ref(0),
    // 搜索关键词
    searchKeyword = ref(''),
    // 筛选等级
    filterGrades = ref<string[]>([]),
    // 筛选伤害类型
    filterDamageType = ref<string>(''),
    // 目标物品引用
    itemTarget = computed(() => {
      return props.data || (props.id ? (Items as any)[props.id] : null) || {
        id: props.id,
        type: props.type,
      };
    }),
    // 是否含模组
    isHasMod = computed(() => {
      return Object.keys(modData.value).length > 0
    }),
    // 所有可用等级 (按 modIndex 排序)
    availableGrades = computed(() => {
      return Object.keys(modData.value).sort(
          (a, b) => (modIndex[a] || 99) - (modIndex[b] || 99)
      )
    }),
    // 武器支持的改装卡槽列表
    weaponSlots = computed(() => {
      const rarity = itemTarget.value?.rarity || 'common';
      const slotTypes = getWeaponExpectedSlotTypes(rarity);
      return slotTypes.map((grade, index) => ({
        index: index + 1,
        grade: grade as ModRarity,
        name: t(`assembly.tags.grade.${grade}`),
      }));
    }),
    // 可用模组中包含的所有伤害类型
    availableDamageTypes = computed(() => {
      const types = new Set<string>();
      Object.values(modData.value).forEach((mods: any) => {
        (mods || []).forEach((m: any) => {
          if (m.damageType && m.damageType !== 'base' && m.damageType !== 'overall') {
            types.add(m.damageType);
          }
          if (m.requiredDamageType) {
            types.add(m.requiredDamageType);
          }
        });
      });
      return Array.from(types).sort();
    }),
    // 筛选后的模组数据 (按 modIndex 排序)
    filteredModData = computed(() => {
      const result: Record<string, any[]> = {};

      const sortedGrades = Object.keys(modData.value).sort(
          (a, b) => (modIndex[a] || 99) - (modIndex[b] || 99)
      );

      sortedGrades.forEach(grade => {
        const mods = modData.value[grade];
        if (!mods) return;

        // 等级筛选
        if (filterGrades.value.length > 0 && !filterGrades.value.includes(grade)) {
          return;
        }

        const filteredMods = (mods as any[]).filter(mod => {
          // 伤害类型筛选
          if (filterDamageType.value) {
            const matchesDamage = mod.damageType === filterDamageType.value ||
                mod.requiredDamageType === filterDamageType.value;
            if (!matchesDamage) return false;
          }

          // 关键词搜索
          if (searchKeyword.value) {
            const keyword = searchKeyword.value.toLowerCase()
            const nameMatch = t(`snb.modifications.${mod.id}.name`).toLowerCase().includes(keyword)
            const descMatch = t(`snb.modifications.${mod.id}.description`).toLowerCase().includes(keyword)
            const idMatch = mod.id.toLowerCase().includes(keyword)

            return nameMatch || descMatch || idMatch;
          }
          return true;
        })

        if (filteredMods.length > 0) {
          result[grade] = filteredMods;
        }
      })

      return result;
    }),
    // 模组总数
    totalModsCount = computed(() => {
      return Object.values(modData.value).reduce((acc: number, list: any) => acc + (list?.length || 0), 0);
    }),
    // 过滤后的模组总数
    totalFilteredCount = computed(() => {
      return Object.values(filteredModData.value).reduce((acc: number, list: any) => acc + (list?.length || 0), 0);
    }),
    // 是否有筛选条件
    hasActiveFilters = computed(() => {
      return !!searchKeyword.value || filterGrades.value.length > 0 || !!filterDamageType.value;
    })

watch(() => locale.value, () => {
  modData.value = onCategorizeByGrade(Modifications)
  onReady()
})

watch(() => [props.id, props.type, props.data], () => {
  modData.value = onCategorizeByGrade(Modifications)
  onReady()
}, {deep: true})

onMounted(() => {
  modData.value = onCategorizeByGrade(Modifications)
  onReady()
})

const onReady = () => {
  const imageMap = {};
  for (const path in modImages) {
    const key = path.split('/').pop()
        ?.toString()
        .replace('.webp', '')
        .replace('.png', '')
    imageMap[key] = modImages[path];
  }

  displayMode.value = Number(route.query.modeShowType) || 0;

  // 滚动
  if (route.query.scrollTop) {
    nextTick(() => {
      window.scrollTo(0, 0)
      router.replace({
        name: 'CodexModification',
        query: {...route.query, 'modeShowType': displayMode.value, 'scrollTop': undefined} as any,
      })
    })
  }

  // 插槽图标
  for (let key in modData.value) {
    if (imageMap[key]) {
      modIcons.value[key] = imageMap[key].default;
    }
  }
}

/**
 * 根据武器稀有度与效果规则初始化分类模组表
 *
 * @param data 全部模组数据
 */
const onCategorizeByGrade = (data: any): Record<string, any[]> => {
  const itemTarget = props.data || (props.id ? (Items as any)[props.id] : null) || {
    id: props.id,
    type: props.type,
  };

  const filtered = filterAvailableModifications(itemTarget, data, {
    filterByAllowedGrades: true,
  });

  const sortedResult: Record<string, any[]> = {};
  const grades = Object.keys(filtered).sort(
      (a, b) => (modIndex[a] || 99) - (modIndex[b] || 99)
  );

  grades.forEach((grade) => {
    const list = filtered[grade as keyof typeof filtered];
    if (list && list.length > 0) {
      list.sort((a, b) => a.id.localeCompare(b.id));
      sortedResult[grade] = list;
    }
  });

  return sortedResult;
}

const getModGrade = (mod: any) => mod.grade
const getModId = (mod: any) => mod.id
const getModVariants = (mod: any) => mod.variants

/**
 * 切换卡槽对应品质的筛选
 *
 * @param slotGrade 品质标识
 */
const onSlotClick = (slotGrade: string) => {
  if (filterGrades.value.length === 1 && filterGrades.value[0] === slotGrade) {
    filterGrades.value = [];
  } else {
    filterGrades.value = [slotGrade];
  }
};

/**
 * 切换伤害类型筛选
 *
 * @param dtype 伤害类型标识
 */
const onDamageTypeClick = (dtype: string) => {
  if (filterDamageType.value === dtype) {
    filterDamageType.value = '';
  } else {
    filterDamageType.value = dtype;
  }
};

/**
 * 重置所有筛选条件
 */
const resetFilters = () => {
  searchKeyword.value = '';
  filterGrades.value = [];
  filterDamageType.value = '';
};

defineOptions({
  name: 'itemModificationWidget',
})
</script>

<template>
  <template v-if="isHasMod">
    <v-row align="end">
      <v-col>
        <slot name="title" v-if="isHasMod"></slot>
      </v-col>
    </v-row>

    <v-row class="mt-lg-2">
      <v-col cols="12" md lg xl>
        <AffixContainerView>
          <!-- 筛选控制面板 S -->
          <div class="d-flex flex-column ga-4 filter-container">
            <!-- 标题栏与数量 S -->
            <div class="d-flex align-center justify-space-between">
              <span class="text-caption font-weight-bold text-medium-emphasis">
                {{ t('assembly.weaponModification.title') }}
              </span>
              <v-chip size="x-small" variant="tonal" color="amber">
                {{ totalFilteredCount }} / {{ totalModsCount }}
              </v-chip>
            </div>
            <!-- 标题栏与数量 E -->

            <!-- 搜索框 S -->
            <v-text-field
                :placeholder="t('basic.button.search')"
                variant="filled"
                density="compact"
                hide-details
                clearable
                v-model="searchKeyword"
                prepend-inner-icon="mdi-magnify"></v-text-field>
            <!-- 搜索框 E -->

            <!-- 卡槽列表 S -->
            <div v-if="weaponSlots.length > 0">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-bold text-medium-emphasis">
                  {{ t('assembly.weaponModification.title') }}
                </span>
                <span class="text-caption text-disabled">{{ weaponSlots.length }}</span>
              </div>

              <div class="d-flex flex-column ga-2">
                <div
                    v-for="slot in weaponSlots"
                    :key="slot.index"
                    class="slot-item-card cursor-pointer transition-swing"
                    :class="{
                      'slot-item-active': filterGrades.includes(slot.grade),
                      [`grade-border-${slot.grade}`]: true
                    }"
                    @click="onSlotClick(slot.grade)">
                  <v-row class="d-flex align-center justify-space-between w-100">
                    <!-- 左边：RhombusWidget -->
                    <v-col cols="auto" class="d-flex align-center ga-3">
                      <RhombusWidget
                          :size="26"
                          :border="true"
                          :border-activate="filterGrades.includes(slot.grade)"
                          :slot="true"
                          :slot-activate="filterGrades.includes(slot.grade)"
                          :glow="filterGrades.includes(slot.grade)"
                          :type="filterGrades.includes(slot.grade) ? 'normal' : 'none'"></RhombusWidget>
                      <div class="d-flex flex-column">
                        <span class="text-body-2 font-weight-bold">{{ slot.name }}</span>
                      </div>
                    </v-col>

                    <v-col>
                      <v-divider></v-divider>
                    </v-col>

                    <!-- 右边：模组品质图标与可用数量 -->
                    <v-col cols="auto" class="d-flex align-center ga-2">
                      <v-chip
                          size="x-small"
                          density="compact"
                          variant="tonal"
                          :color="filterGrades.includes(slot.grade) ? 'amber' : undefined">
                        {{ modData[slot.grade]?.length || 0 }}
                      </v-chip>
                      <v-img :src="modIcons[slot.grade]" width="34px" height="34px"></v-img>
                    </v-col>
                  </v-row>
                </div>
              </div>
            </div>
            <!-- 卡槽列表 E -->

            <!-- 伤害类型筛选 S -->
            <div v-if="availableDamageTypes.length > 0">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-bold text-medium-emphasis">
                  {{ t('assembly.tags.titles.damageTypes') }}
                </span>
                <v-btn
                    v-if="filterDamageType"
                    variant="text"
                    size="small"
                    color="amber"
                    @click="filterDamageType = ''">
                  {{ t('basic.button.reset') }}
                </v-btn>
              </div>
              <div class="d-flex flex-wrap ga-2 gap-2">
                <v-chip
                    v-for="dtype in availableDamageTypes"
                    :key="dtype"
                    size="small"
                    filter
                    :variant="filterDamageType === dtype ? 'flat' : 'tonal'"
                    :color="filterDamageType === dtype ? 'amber' : undefined"
                    @click="onDamageTypeClick(dtype)">
                  <template v-slot:prepend>
                    <DamageIconWidget :id="dtype" :size="16" class="mr-1"></DamageIconWidget>
                  </template>
                  {{ t(`assembly.tags.damageTypes.${dtype}`) }}
                </v-chip>
              </div>
            </div>
            <!-- 伤害类型筛选 E -->

            <!-- 品质筛选多选 S -->
            <div>
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-bold text-medium-emphasis">
                  {{ t('assembly.weaponModification.available') }}
                </span>
              </div>
              <div class="d-flex flex-wrap ga-1">
                <v-chip
                    v-for="grade in availableGrades"
                    :key="grade"
                    size="small"
                    filter
                    :variant="filterGrades.includes(grade) ? 'flat' : 'tonal'"
                    :color="filterGrades.includes(grade) ? 'amber' : undefined"
                    @click="onSlotClick(grade)">
                  <template v-slot:prepend>
                    <v-img :src="modIcons[grade]" width="16px" height="16px" class="mr-1"></v-img>
                  </template>
                  {{ t(`assembly.tags.grade.${grade}`) }}
                  <span class="ml-1 opacity-70">({{ modData[grade]?.length || 0 }})</span>
                </v-chip>
              </div>
            </div>
            <!-- 品质筛选多选 E -->

            <!-- 重置按钮 S -->
            <v-btn
                v-if="hasActiveFilters"
                block
                variant="tonal"
                class="mt-4"
                prepend-icon="mdi-refresh"
                @click="resetFilters">
              {{ t('basic.button.reset') }}
            </v-btn>
            <!-- 重置按钮 E -->
          </div>
          <!-- 筛选控制面板 E -->
        </AffixContainerView>
      </v-col>
      <v-col cols="12" lg>
        <v-row class="mod justify-sm-end justify-center mt-n10">
          <template v-if="Object.keys(filteredModData).length > 0">
            <template v-for="(mods, grade) in filteredModData" :key="grade">
              <v-col cols="auto" class="pl-5 border-l">
                <AffixContainerView class="py-4 title-long-flavor" align="center">
                  <template #default="{isAffix}">
                    <v-card :variant="isAffix ? 'flat' : 'plain'" class="py-1">
                      <v-img :src="modIcons[grade]" width="40px" height="40px"></v-img>
                    </v-card>
                  </template>
                </AffixContainerView>

                <div class="mod-list d-flex flex-column align-center ga-2 mt-2 pb-5">
                  <div
                      v-for="(mod, modIdx) in mods"
                      class="mod-item d-flex justify-center align-center"
                      :class="`grade-${getModGrade(mod)}`"
                      :key="modIdx">
                    <template v-if="appStore.isDebug">{{ mod }}</template>
                    <template v-else-if="displayMode == 0">
                      <ItemSlotBase size="60px">
                        <ModIconWidget :id="getModId(mod)" :padding="0" :margin="0"></ModIconWidget>
                      </ItemSlotBase>
                    </template>
                  </div>
                </div>
              </v-col>
            </template>
          </template>

          <!-- 无结果提示 S -->
          <template v-else>
            <v-row class="px-5 py-10">
              <v-col cols="12" class="text-center">
                <v-icon size="64" class="mb-4">mdi-magnify-close</v-icon>
                <h4 class="text-h6">{{ t('empty.title') }}</h4>
                <p class="text-body-2 text-medium-emphasis mt-2">
                  {{ t('empty.description') }}
                </p>
                <v-btn
                    variant="tonal"
                    class="mt-4"
                    @click="resetFilters"
                    prepend-icon="mdi-refresh">
                  {{ t('basic.button.reset') }}
                </v-btn>
              </v-col>
            </v-row>
          </template>
          <!-- 无结果提示 E -->
        </v-row>
      </v-col>
    </v-row>
  </template>
</template>

<style scoped lang="less">

.slot-item-card {
  transition: all 0.2s ease-in-out;

  &:hover {
  }

  &.slot-item-active {
  }

  &.grade-border-basic:hover {
    border-color: rgba(208, 255, 208, 0.4) !important;
  }

  &.grade-border-advanced:hover {
    border-color: rgba(187, 220, 255, 0.4) !important;
  }

  &.grade-border-special:hover {
    border-color: rgba(249, 235, 255, 0.4) !important;
  }

  &.grade-border-mythic:hover {
    border-color: rgba(255, 183, 77, 0.4) !important;
  }
}

.mod {
  .description {
    font-size: .9rem;
  }

  .grade-basic {
    .grade-basic-title {
      color: rgba(208, 255, 208, 0.8);
    }
  }

  .grade-advanced {
    .grade-advanced-title {
      color: #bbdcff;
    }
  }

  .grade-special {
    .grade-special-title {
      color: #f9ebff;
    }
  }
}
</style>
