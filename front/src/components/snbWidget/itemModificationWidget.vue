<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {Modifications} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import ItemSlotBase from "./ItemSlotBase.vue";
import router from "~/router";
import {useRoute} from "vue-router";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import ModName from "@/components/snbWidget/modName.vue";
import ModDescription from "@/components/snbWidget/modDescription.vue";

const modImages = import.meta.glob('@glow-prow-assets/modifications/*.*', {eager: true});
const props = withDefaults(defineProps<{ id: string, type: string | null }>(), {
      id: null,
      type: null
    }),
    route = useRoute(),
    {t} = useI18n(),
    {asString} = useI18nUtils()

let modData = ref({}),
    // 模组图标
    modIcons = ref({}),
    // 模式显示类型
    displayMode = ref(1),
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
            const keyword = searchKeyword.value.toLowerCase();
            const nameMatch = t(`snb.modifications.${mod.id}.name`).toLowerCase().includes(keyword);
            const descMatch = t(`snb.modifications.${mod.id}.description`).toLowerCase().includes(keyword);
            const idMatch = mod.id.toLowerCase().includes(keyword);

            return nameMatch || descMatch || idMatch;
          }
          return true;
        });

        if (filteredMods.length > 0) {
          result[grade] = filteredMods;
        }
      });

      return result;
    }),
    // 是否有筛选条件
    hasActiveFilters = computed(() => {
      return searchKeyword.value || filterGrades.value.length > 0;
    })

onMounted(() => {
  modData.value = onCategorizeByGrade(Modifications)
  onReady();
})

const onReady = () => {
  const imageMap = {};
  for (const path in modImages) {
    const key = path.split('/').pop()
        ?.toString()
        .replace('.webp', '')
        .replace('.png', '');
    imageMap[key] = modImages[path];
  }

  if (route.query.modeShowType)
    displayMode.value = route.query.modeShowType as string;

  // mod图标
  for (let key in Modifications) {
    if (imageMap[key]) {
      modIcons.value[key] = imageMap[key].default;
    }
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
 * 以grade创建
 * @param data
 */
const onCategorizeByGrade = (data): {} => {
  const result = {};

  Object.values(data).forEach(item => {
    if (props.type) {
      const hasMatchingVariant = item.variants.some(variant =>
          variant.itemType.includes(props.type)
      );

      if (!hasMatchingVariant) return; // 不匹配则跳过
    }

    if (!result[item.grade]) {
      result[item.grade] = [];
    }
    result[item.grade].push(item);
  });

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
  <slot name="title" v-if="isHasMod"></slot>

  <template v-if="isHasMod" >
    <!-- 搜索和筛选栏 -->
    <v-row class="pb-4" align="center">
      <v-col cols="12" sm="6">
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

      <v-col cols="12" sm="4">
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

      <v-col cols="12" sm="2" class="text-right">
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

    <v-card border class="mod pt-3" variant="flat">
      <template v-if="Object.keys(filteredModData).length > 0">
        <template v-for="(key, value) in filteredModData" :key="key">
          <v-row class="px-5 title-long-flavor bg-black" align="center">
            <v-col cols="auto">
              <v-img :src="modIcons[value]" class="mt-1" width="25px" height="25px"/>
            </v-col>
            <v-col>
              {{ t(`assembly.tags.grade.${value}`) }}
            </v-col>
            <v-spacer></v-spacer>
            <v-col align="right">
              <v-btn-toggle v-model="displayMode"
                            style="height: 25px"
                            @update:model-value="onSwitchModShow"
                            density="compact"
                            mandatory
                            border
                            selected-class="bg-amber">
                <v-btn value="0">
                  <v-icon size="20">mdi-format-list-bulleted-type</v-icon>
                </v-btn>

                <v-btn value="1">
                  <v-icon>mdi-dots-grid</v-icon>
                </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>

          <v-row class="pl-5 pr-5 pb-5">
            <v-col v-for="(mod, modIndex) in key"
                   :class="`grade-${mod.grade}`"
                   :key="modIndex"
                   :cols="{0: '12', 1: '1'}[displayMode]">
              <template v-if="route.query.debug">{{ mod }}</template>
              <template v-if="displayMode == 1">
                <ItemSlotBase size="40px" class="d-flex justify-center align-center"
                              v-tooltip="t(`snb.modifications.${mod.id}.name`)">
                  <v-img :src="modIcons[mod.id]" width="100%" height="100%" v-if="modIcons[mod.id]"></v-img>
                  <template v-else>
                    <v-icon>mdi-help</v-icon>
                  </template>
                </ItemSlotBase>
              </template>
              <template v-else-if="displayMode == 0">
                <v-row class="pt-0 pl-3">
                  <ItemSlotBase size="50px" class="mt-3 d-flex justify-center align-center">
                    <v-img :src="modIcons[mod.id]" v-if="modIcons[mod.id]"></v-img>
                    <template v-else>
                      <v-icon>mdi-help</v-icon>
                    </template>
                  </ItemSlotBase>

                  <v-col cols="10">
                    <ModName :id="mod.id" :grade="mod.grade"></ModName>
                    <ModDescription :id="mod.id" :variants="mod.variants" :grade="mod.grade" :type="type"></ModDescription>
                  </v-col>
                </v-row>
              </template>
            </v-col>
          </v-row>
        </template>
      </template>

      <!-- 无结果提示 -->
      <template v-else>
        <v-row class="px-5 py-10">
          <v-col cols="12" class="text-center">
            <v-icon size="64" class="mb-4">mdi-magnify-close</v-icon>
            <h4 class="text-h6">{{ t('codex.noResults') }}</h4>
            <p class="text-body-2 text-medium-emphasis mt-2">
              {{ t('codex.noResultsDescription') }}
            </p>
            <v-btn
                variant="tonal"
                class="mt-4"
                @click="resetFilters"
                prepend-icon="mdi-refresh"
            >
              {{ t('basic.button.clearFilters') }}
            </v-btn>
          </v-col>
        </v-row>
      </template>
    </v-card>
  </template>
</template>

<style scoped lang="less">
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
