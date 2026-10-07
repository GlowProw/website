<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";
import {appApps} from "@/assets/sripts/index";

import Silk from "@/components/Silk.vue";
import EmptyView from "@/components/EmptyView.vue";
import type {SortField, SortOrder} from "@/assets/types/views";

const {t} = useI18n()
const route = useRoute()
const router = useRouter()
const {mobile} = useDisplay()

// 筛选数据
const filterData = ref({
  keyValue: '',
  inputWidgetKeyValue: '',
  tags: [],
  tagTags: [],
  sortField: 'name' as SortField,
  sortOrder: 'asc' as SortOrder
})

// 原始数据
const originalData = computed(() => {
  return Object.values(appApps.list)
})

// 标签筛选可选选项
const tagFilterAvailableOptions = computed(() => [
  ...filterData.value.tagTags.map(tag => ({
    value: tag,
    text: tag
  }))
])

// 检查是否有活跃的筛选条件
const hasActiveFilters = computed(() => {
  return filterData.value.tags.length > 0 ||
      filterData.value.keyValue !== '' ||
      filterData.value.inputWidgetKeyValue !== ''
})

// 处理后的数据（筛选+排序）
const processedData = computed(() => {
  let d = originalData.value
  const searchValue = filterData.value.keyValue.toLowerCase()
  const filterTags = filterData.value.tags

  // 关键词筛选
  if (searchValue) {
    d = d.filter(app => {
      const nameMatch = t(`apps.${app.id}.name`).toLowerCase().includes(searchValue)
      const descMatch = t(`apps.${app.id}.description`).toLowerCase().includes(searchValue)
      const idMatch = app.id.toLowerCase().includes(searchValue)
      const tagMatch = app.tags?.some(tag => tag.toLowerCase().includes(searchValue))

      return nameMatch || descMatch || idMatch || tagMatch
    })
  }

  // 标签筛选
  if (filterTags.length > 0) {
    d = d.filter(app => {
      return app.tags?.some(tag => filterTags.includes(tag))
    })
  }

  // 排序
  d = d.sort((a, b) => {
    const field = filterData.value.sortField
    const order = filterData.value.sortOrder

    let aValue = field === 'name' ? t(`apps.${a.id}.name`) : a.id
    let bValue = field === 'name' ? t(`apps.${b.id}.name`) : b.id

    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })

  return d
})

/** 页面挂载时初始化标签选项 */
onMounted(() => {
  initTagLoad()
})

/**
 * 初始化标签选项
 */
const initTagLoad = () => {
  const allTags = new Set<string>()
  originalData.value.forEach(app => {
    app.tags?.forEach(tag => allTags.add(tag))
  })
  filterData.value.tagTags = [...allTags].sort()
}

/**
 * 更新URL查询参数
 */
const updateQueryParams = () => {
  const query: any = {}

  if (filterData.value.keyValue) {
    query.key = filterData.value.keyValue
  }
  if (filterData.value.tags.length > 0) {
    query.tag = filterData.value.tags.join(',')
  }
  if (filterData.value.sortField !== 'name') {
    query.sortField = filterData.value.sortField
  }
  if (filterData.value.sortOrder !== 'asc') {
    query.sortOrder = filterData.value.sortOrder
  }

  router.replace({
    query: Object.keys(query).length > 0 ? query : undefined
  })
}

/**
 * 从URL加载筛选条件
 */
watch(() => route.query, (newQuery) => {
  if (newQuery.key) {
    filterData.value.inputWidgetKeyValue = newQuery.key as string
    filterData.value.keyValue = newQuery.key as string
  }
  if (newQuery.tag) {
    filterData.value.tags = Array.isArray(newQuery.tag) ? newQuery.tag : newQuery.tag.split(',')
  }
  if (newQuery.sortField) {
    filterData.value.sortField = newQuery.sortField as SortField
  }
  if (newQuery.sortOrder) {
    filterData.value.sortOrder = newQuery.sortOrder as SortOrder
  }
}, {immediate: true})

/**
 * 搜索
 */
const onSearch = () => {
  filterData.value.keyValue = filterData.value.inputWidgetKeyValue
  updateQueryParams()
}

/**
 * 筛选标签
 */
const onFilterTag = (value) => {
  filterData.value.tags = value
  updateQueryParams()
}

/**
 * 排序
 */
const onSort = (field: SortField, order: SortOrder) => {
  filterData.value.sortField = field
  filterData.value.sortOrder = order
  updateQueryParams()
}

/**
 * 重置所有筛选
 */
const resetAllFilters = () => {
  filterData.value.keyValue = ''
  filterData.value.inputWidgetKeyValue = ''
  filterData.value.tags = []
  filterData.value.sortField = 'name'
  filterData.value.sortOrder = 'asc'
  updateQueryParams()
}

defineOptions({
  name: 'AppsView'
})
</script>

<template>
  <v-card height="200px">
    <template v-slot:image>
      <Silk
          :speed="3"
          :scale=".7"
          :color="'#1c1c1c'"
          :noise-intensity="0.1"
          :rotation="-.6"
          class="bg-black">
      </Silk>
    </template>
    <template v-slot:default>
      <v-container class="mt-4 position-relative">
        <v-breadcrumbs>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/calendar">
            <b class="text-amber">{{ t('apps.title') }}</b>
          </v-breadcrumbs-item>
        </v-breadcrumbs>

        <v-row class="mx-2">
          <v-col>
            <p class="opacity-60">{{ t('apps.description') }}</p>
          </v-col>
        </v-row>

        <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
          <v-icon icon="mdi-application-outline" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider></v-divider>

  <!-- 筛选工具栏 S -->
  <v-container class="mt-4">
    <v-row align="center">
      <v-col cols="auto">
        <v-text-field
            :placeholder="t('basic.button.search')"
            hide-details
            min-width="300"
            variant="filled"
            density="comfortable"
            clearable
            @keydown.enter="onSearch"
            @click:clear="onSearch"
            v-model="filterData.inputWidgetKeyValue">
          <template v-slot:append-inner>
            <v-btn @click="onSearch" icon variant="text" density="comfortable">
              <v-icon icon="mdi-magnify"></v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </v-col>

      <v-col>
        <v-divider></v-divider>
      </v-col>

      <!-- 筛选菜单 S -->
      <v-col cols="auto">
        <v-menu open-on-click :close-on-content-click="false">
          <template v-slot:activator="{ props }">
            <div v-bind="props">
              <v-icon>{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
              <v-icon>mdi-dots-vertical</v-icon>
            </div>
          </template>

          <v-card border class="pa-5" :min-width="mobile ? '100%' : 550" :width="mobile ? '100%' : 400">
            <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
              <v-icon size="80">{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
            </v-card-title>

            <v-row>
              <!-- 标签筛选 -->
              <v-col cols="12">
                <div class="mb-2">{{ t('apps.filter.byTag') }} ({{ tagFilterAvailableOptions.length || 0 }})</div>
                <v-select
                    variant="filled"
                    @update:model-value="onFilterTag"
                    item-value="value"
                    item-title="text"
                    density="comfortable"
                    v-model="filterData.tags"
                    :disabled="tagFilterAvailableOptions.length == 0"
                    :placeholder="t('apps.filter.byTag')"
                    :counter="3"
                    :items="tagFilterAvailableOptions"
                    hide-details
                    multiple
                    chips
                    clearable>
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-checkbox
                            class="pa-0 ma-0"
                            density="compact"
                            hide-details
                            :model-value="filterData.tags.includes(item.value)"
                            @click.stop>
                        </v-checkbox>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>

              <!-- 排序 -->
              <v-col cols="12">
                <div class="mb-2">{{ t('codex.filter.sortBy') }}</div>
                <v-row>
                  <v-col cols="6">
                    <v-select
                        variant="filled"
                        @update:model-value="onSort(filterData.sortField, filterData.sortOrder)"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="filterData.sortField"
                        :items="[
                          { value: 'name', text: t('apps.filter.byName') },
                          { value: 'id', text: t('apps.filter.byId') }
                        ]"
                        hide-details>
                    </v-select>
                  </v-col>
                  <v-col cols="6">
                    <v-select
                        variant="filled"
                        @update:model-value="onSort(filterData.sortField, filterData.sortOrder)"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="filterData.sortOrder"
                        :items="[
                          { value: 'asc', text: t('codex.filter.ascending') },
                          { value: 'desc', text: t('codex.filter.descending') }
                        ]"
                        hide-details>
                    </v-select>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>

            <v-card-actions class="mx-n4 mt-4 px-4">
              <v-row>
                <v-spacer></v-spacer>
                <v-col cols="auto" class="text-right">
                  <v-btn
                      @click="resetAllFilters"
                      variant="outlined"
                      color="error"
                      :disabled="!hasActiveFilters"
                      prepend-icon="mdi-refresh">
                    {{ t('basic.button.reset') }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-col>
      <!-- 筛选菜单 E -->
    </v-row>
  </v-container>
  <!-- 筛选工具栏 E -->

  <!-- 应用列表 S -->
  <v-container class="mt-4 mb-4 position-relative">
    <v-row v-if="processedData.length > 0">
      <v-col cols="12" lg="6" v-for="(app, index) in processedData" :key="index">
        <v-card border>
          <v-row no-gutters>
            <v-col cols="3" class="bg-black d-flex align-center justify-center">
              <v-icon icon="mdi-file-outline" size="60"></v-icon>
            </v-col>
            <v-col>
              <v-card variant="text" :to="app.to" height="200">
                <v-card-text>
                  <div class="w-100">
                    <h2 class="text-h5">{{ t(`apps.${app.id}.name`) }}</h2>
                    <p class="mt-3 opacity-60 text-caption">
                      {{ t(`apps.${app.id}.description`) }}
                    </p>
                  </div>

                  <div class="d-flex ga-2 align-center mt-3 flex-wrap">
                    <v-chip
                        v-for="(tag, tagIndex) in app.tags"
                        :key="tagIndex"
                        size="small"
                        class="badge-flavor text-center bg-amber">
                      {{ tag }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- 空状态 -->
    <v-row v-else class="mt-8">
      <v-col cols="12">
        <EmptyView></EmptyView>
      </v-col>
    </v-row>
  </v-container>
  <!-- 应用列表 E -->
</template>

<style scoped lang="less">
.badge-flavor {
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.3);
}
</style>
