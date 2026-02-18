<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
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

const modImages = import.meta.glob('@/assets/images/snb/modTypeIcons/*.*', {eager: true})
const props = withDefaults(defineProps<{ id: string, type: string | null }>(), {
      id: null,
      type: null
    }),
    route = useRoute(),
    {mobile} = useDisplay(),
    {t, locale} = useI18n(),
    {asString} = useI18nUtils(),
    modSlotBackgroundColor = {'basic': '#101e06', 'advanced': 'rgb(7 27 53)', 'special': '#231536'}

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
    // 所有可用等级
    availableGrades = computed(() => {
      return Object.keys(modData.value)
    }),
    // 筛选后的模组数据
    filteredModData = computed(() => {
      const result = {};

      Object.entries(modData.value).forEach(([grade, mods]) => {
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

  if (route.query.modeShowType)
    displayMode.value = route.query.modeShowType as string;

  // 插槽图标
  for (let key in modData.value) {
    if (imageMap[key]) {
      modIcons.value[key] = imageMap[key].default;
    }
  }
}

/**
 * 初始化分类表
 * 以grade创建
 * @param data
 */
const onCategorizeByGrade = (data): {} => {
  const result = {};

  // 首先收集所有匹配的模组
  const allMods = [];
  Object.values(data).forEach(item => {
    if (props.type) {
      const hasMatchingVariant = item.variants?.some(variant =>
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

  return result;
}

/**
 * 模组展示方式切换
 */
const onSwitchModShow = () => {
  router.push({
    name: route.name,
    query: {...route.query, 'modeShowType': displayMode.value, 'scrollTop': false},
    params: {...route.params}
  })
}

/**
 * 重置所有筛选条件
 */
const resetFilters = () => {
  searchKeyword.value = '';
  filterGrades.value = [];
}
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

    <v-row class="mod d-flex">
      <template v-if="Object.keys(filteredModData).length > 0">
        <template v-for="(key, value) in filteredModData" :key="key">
          <v-col cols="3">
            <v-row no-gutters class="px-4 py-2 title-long-flavor" :style="`background: ${modSlotBackgroundColor[value]}`" align="center">
              <v-col cols="auto">
                <v-img :src="modIcons[value]" class="mt-1" width="25px" height="25px"/>
              </v-col>
              <v-col class="ml-2">
                {{ t(`assembly.tags.grade.${value}`) }}
              </v-col>
            </v-row>

            <v-row class="pb-5 mod-list">
              <v-col v-for="(mod, modIndex) in key"
                     class="mod-item"
                     :class="`grade-${mod.grade}`"
                     :key="modIndex"
                     :cols="{0: '12', 1: '1'}[displayMode]">
                <template v-if="route.query.debug">{{ mod }}</template>
                <template v-else-if="displayMode == 0">
                  <v-row align="center" no-gutters>
                    <v-col cols="auto">
                      <ItemSlotBase size="40px">
                        <ModIconWidget :id="mod.id" :padding="0" :margin="0">
                          <template v-slot:description>
                            <ModDescription :id="mod.id" :variants="mod.variants" :grade="mod.grade" :type="type"></ModDescription>
                          </template>
                        </ModIconWidget>
                      </ItemSlotBase>
                    </v-col>
                    <v-col class="pl-2">
                      <HtmlLink :href="`/codex/mod/${mod.id}`" :is-icon="false" :is-iframe-show="false">
                        <ModName :id="mod.id" :variants="mod.variants" :grade="mod.grade" :type="type"></ModName>
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
  </template>
</template>

<style scoped lang="less">
.mod {
  .mod-list {
    max-height: 500px;
    overflow-y: auto;
    mask-image: linear-gradient(to bottom, black 90%, transparent 100%);

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
