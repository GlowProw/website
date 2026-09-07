<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {Modifications} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import ItemSlotBase from "./ItemSlotBase.vue";
import router from "~/router";
import {useRoute} from "vue-router";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import ModName from "@/components/snbWidget/modName.vue";
import ModDescription from "@/components/snbWidget/modDescription.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import HtmlLink from "@/components/HtmlLink.vue";
import {useDisplay} from "vuetify/framework";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import {useAppStore} from "~/stores/appStore";

const modImages = import.meta.glob('@/assets/images/snb/modTypeIcons/*.*', {eager: true})
const props = withDefaults(defineProps<{ id: string, type: string | null }>(), {
      id: null,
      type: null
    }),
    appStore = useAppStore(),
    route = useRoute(),
    {mobile} = useDisplay(),
    {t, locale} = useI18n(),
    modSlotBackgroundColor = {'basic': '#101e06', 'advanced': 'rgb(7 27 53)', 'special': '#231536', 'mythic': 'rgb(68 44 13)'},
    modIndex = {'basic': 1, 'advanced': 2, 'special': 3, 'mythic': 4}

let modData = ref({}),
    // 模组图标
    modIcons = ref({}),
    // 模式显示类型
    displayMode = ref(0),
    // 搜索关键词
    searchKeyword = ref(''),
    // 筛选等级
    filterGrades = ref([]),
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
    // 筛选后的模组数据 (按 modIndex 排序)
    filteredModData = computed(() => {
      const result = {};

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
    // 是否有筛选条件
    hasActiveFilters = computed(() => {
      return searchKeyword.value || filterGrades.value.length > 0;
    })

watch(() => locale.value, () => {
  modData.value = onCategorizeByGrade(Modifications)
  onReady()
})

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
 * 初始化分类表
 * 以grade创建，并根据 modIndex 排序
 * @param data
 */
const onCategorizeByGrade = (data): {} => {
  const result = {};

  // 首先收集所有匹配的模组
  const allMods = [];
  Object.values(data).forEach((item: any) => {
    if (props.type) {
      const hasMatchingVariant = item.variants?.some((variant: any) =>
          variant.itemType?.includes(props.type))


      if (!hasMatchingVariant) return; // 不匹配则跳过
    }
    allMods.push(item)
  })

  // 排序 a-z
  allMods.sort((a, b) => a.id[0].localeCompare(b.id[0]))

  allMods.forEach(item => {
    if (!result[item.grade]) {
      result[item.grade] = [];
    }
    result[item.grade].push(item)
  })

  // 按 modIndex 建立有顺序的 result 对象
  const sortedResult = {};
  Object.keys(result)
    .sort((a, b) => (modIndex[a] || 99) - (modIndex[b] || 99))
    .forEach(grade => {
      sortedResult[grade] = result[grade];
    });

  return sortedResult;
}

const getModGrade = (mod: any) => mod.grade
const getModId = (mod: any) => mod.id
const getModVariants = (mod: any) => mod.variants
/**
 * 重置所有筛选条件
 */
const resetFilters = () => {
  searchKeyword.value = '';
  filterGrades.value = [];
}

defineOptions({
  name: 'itemModificationWidget',
})
</script>

<template>
  <template v-if="isHasMod">
    <!-- 搜索和筛选栏 S -->
    <v-row class="pb-2" align="end">
      <v-col>
        <slot name="title" v-if="isHasMod"></slot>
      </v-col>
      <v-col>
        <v-row align="center">
          <v-col>
            <v-text-field
                :placeholder="t('basic.button.search')"
                variant="filled"
                density="compact"
                hide-details
                clearable
                v-model="searchKeyword"
                prepend-inner-icon="mdi-magnify"
            ></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-menu open-on-click :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <div v-bind="props">
                  <v-icon>{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
                  <v-icon>mdi-dots-vertical</v-icon>
                </div>
              </template>

              <v-card border class="pa-5" :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 580">
                <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
                  <v-icon size="80">{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
                </v-card-title>

                <v-row>
                  <v-col cols="12">
                    <v-select
                        variant="filled"
                        density="compact"
                        hide-details
                        multiple
                        chips
                        clearable
                        v-model="filterGrades"
                        item-title="text"
                        :items="availableGrades.map(grade => ({
              value: grade,
              text: t(`assembly.tags.grade.${grade}`)
            }))"
                    ></v-select>
                  </v-col>

                  <v-col cols="12">
                    <v-btn
                        variant="text"
                        block
                        color="error"
                        :disabled="!hasActiveFilters"
                        @click="resetFilters"
                        prepend-icon="mdi-refresh">
                      {{ t('basic.button.reset') }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card>
            </v-menu>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <!-- 搜索和筛选栏 E -->

    <HorizontalScrollList>
      <v-row class="mod d-flex flex-nowrap mod-list-flex">
        <template v-if="Object.keys(filteredModData).length > 0">
          <template v-for="(mods, grade) in filteredModData" :key="grade">
            <v-col style="min-width: 180px; display: flex; flex-direction: column">
              <v-row no-gutters class="px-4 py-2 title-long-flavor" style="min-height:50px; max-height: 50px;" :style="`background: ${modSlotBackgroundColor[grade]}`" align="center">
                <v-col cols="auto">
                  <v-img :src="modIcons[grade]" class="mt-1" width="25px" height="25px"/>
                </v-col>
                <v-col class="ml-2">
                  {{ t(`assembly.tags.grade.${grade}`) }}
                </v-col>
              </v-row>

              <v-row class="pb-5 mod-list">
                <v-col v-for="(mod, itemIdx) in mods"
                       class="mod-item"
                       :class="`grade-${getModGrade(mod)}`"
                       :key="itemIdx"
                       :cols="{0: '12', 1: '1'}[displayMode]">
                  <template v-if="appStore.isDebug">{{ mod }}</template>
                  <template v-else-if="displayMode == 0">
                    <v-row align="center" no-gutters>
                      <v-col cols="auto">
                        <ItemSlotBase size="40px">
                          <ModIconWidget :id="getModId(mod)" :padding="0" :margin="0">
                            <template v-slot:description>
                              <ModDescription :id="getModId(mod)" :variants="getModVariants(mod)" :grade="getModGrade(mod)" :type="type"></ModDescription>
                            </template>
                          </ModIconWidget>
                        </ItemSlotBase>
                      </v-col>
                      <v-col class="pl-2">
                        <HtmlLink :href="`/codex/modification/${getModId(mod)}`" :is-icon="false" :is-iframe-show="false">
                          <ModName :id="getModId(mod)" :variants="getModVariants(mod)" :grade="getModGrade(mod)" :type="type"></ModName>
                        </HtmlLink>
                      </v-col>
                    </v-row>
                  </template>
                </v-col>
              </v-row>
            </v-col>
            <v-divider vertical class="mt-15 m-10"></v-divider>
          </template>
        </template>

        <!-- 无结果提示 -->
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
      </v-row>
    </HorizontalScrollList>
  </template>
</template>

<style scoped lang="less">
.mod {
  .mod-list {
    max-height: 500px;
    overflow-y: auto;
    mask-image: linear-gradient(to bottom, black 96%, transparent 100%);

    .mod-item:last-child {
      margin-bottom: 50px;
    }
  }


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
