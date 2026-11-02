<template>
  <v-row>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <I18nWidget></I18nWidget>

        <div class="my-10 opacity-60">
          <p class="text-caption mb-1">{{ t('setting.routine.translationHelp') }}</p>
          <p class="text-caption d-flex align-center">{{ t('setting.routine.translationService') }}<img class="mx-3" src="@/assets/images/logos/crowdin.png" height="15"/></p>

          <div class="text-caption mt-3">
            <p>
              <HtmlLink href="https://zh.crowdin.com/project/glow-prow"></HtmlLink>
            </p>
            <p>
              <HtmlLink href="https://crowdin.com/project/glow-prow"></HtmlLink>
            </p>
          </div>
        </div>
        <template v-slot:title>
          {{ t('setting.routine.languageTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <div class="mb-5 opacity-60">
          <p class="text-caption">{{ t('setting.routine.featureDesc') }}</p>
          <p class="text-caption text-grey">{{ t('setting.routine.featureHint') }}</p>
        </div>

        <div class="d-flex align-center justify-space-between mb-4">
          <div class="text-caption opacity-80">
            <span>{{ t('setting.routine.activeFunctionsCount', { count: activeFunctions.length }) }}</span>
          </div>
          <v-btn
              color="amber"
              variant="tonal"
              size="small"
              prepend-icon="mdi-cog-outline"
              @click="isManageFunctionsOpen = true">
            {{ t('basic.button.manage') || '管理' }}
          </v-btn>
        </div>

        <!-- 激活列表预览 -->
        <div class="d-flex flex-wrap ga-2">
          <v-chip
              v-for="func in activeFunctions"
              :key="func.key"
              size="x-small"
              variant="tonal"
              color="amber">
            {{ t(func.key) }}
          </v-chip>
          <span v-if="activeFunctions.length === 0" class="text-caption opacity-50">
            {{ t('setting.routine.noActiveFunctions') }}
          </span>
        </div>

        <template v-slot:title>
          {{ t('setting.routine.featuresTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <ItemIconManager></ItemIconManager>
        <template v-slot:title>
          {{ t('setting.routine.itemConfigTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="8">
      <AffixBoxHasTitleView>
        <div>
          <div class="mb-10">
            <v-row align="center" class="mb-1">
              <v-col>
                <v-progress-linear
                    color="var(--main-color)"
                    :model-value="estimateCapacity?.used"
                    :max="estimateCapacity?.estimatedMax"
                    striped
                    height="25">
                  {{ estimateCapacity?.percentage || '0%' }}
                </v-progress-linear>
              </v-col>
              <v-col cols="auto">{{ estimateCapacity?.usedFormatted }} / {{ estimateCapacity?.estimatedMaxFormatted }}</v-col>
            </v-row>

            <p class="text-caption opacity-60">{{ t('setting.routine.storageReportDesc') }}</p>
          </div>

          <v-row>
            <v-col cols="auto">
              <v-row class="mb-2">
                <v-col>
                  <v-btn @click="clearStorage" :disabled="estimateCapacity.used == 0">{{ t('setting.routine.clearStorage') }}</v-btn>
                </v-col>
              </v-row>

              <p class="text-caption opacity-60">{{ t('setting.routine.storageReportLinkHint') }}</p>
            </v-col>

            <v-col>
              <v-row class="mb-2">
                <v-col>
                  <v-btn :to="{ name: 'PortalSettingStorage' }">{{ t('setting.routine.storageReportBtn') }}</v-btn>
                </v-col>
              </v-row>

              <p class="text-caption opacity-60">{{ t('setting.routine.storagePrivacyHint') }}</p>
            </v-col>
          </v-row>
        </div>
        <template v-slot:title>
          {{ t('setting.routine.recordsTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <ItemIconCdnAssets></ItemIconCdnAssets>
        <template v-slot:title>
          {{ t('setting.routine.cdnTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <ItemModelCdnAssets></ItemModelCdnAssets>
        <template v-slot:title>
          {{ t('setting.routine.modelCdnTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <ItemLangCdnAssets></ItemLangCdnAssets>
        <template v-slot:title>
          {{ t('setting.routine.langCdnTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-5">{{ t('setting.routine.posterDesc') }}</p>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.posterAutoSave') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset v-model="posterSwitch" @update:modelValue="onPosterSwitch"></v-switch>
          </v-col>
        </v-row>

        <p class="text-caption opacity-60 mt-1">{{ t('setting.routine.posterHint') }}</p>
        <template v-slot:title>
          {{ t('setting.routine.posterTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-5">{{ t('setting.routine.searchDesc') }}</p>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.searchHeaderSwitch') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="headerSearchSwitch" @update:modelValue="onHeaderSearchSwitch"></v-switch>
          </v-col>
        </v-row>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.searchIsLogs') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="searchIsLogs" @update:modelValue="onSearchIsLogs"></v-switch>
          </v-col>
        </v-row>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.searchHotkey') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="searchHotkey" @update:modelValue="onSearchHotkey"></v-switch>
          </v-col>
        </v-row>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.searchHint') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="searchHint" @update:modelValue="onSearchHint"></v-switch>
          </v-col>
        </v-row>

        <v-divider class="mt-2 mb-3"></v-divider>

        <div class="text-caption text-grey mb-1">{{ t('setting.routine.searchOpenMode') }}</div>
        <v-select
            v-model="searchOpenNewWindow"
            :items="[
              { title: t('search.openNewWindow'), value: true },
              { title: t('search.openCurrentWindow'), value: false }
            ]"
            item-title="title"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            @update:modelValue="onSearchOpenNewWindow"
        ></v-select>

        <template v-slot:title>
          {{ t('setting.routine.searchTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-5">{{ t('setting.routine.commentDesc') }}</p>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.commentGlobalSwitch') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="commentGlobalSwitch" @update:modelValue="onCommentGlobalSwitch"></v-switch>
          </v-col>
        </v-row>

        <v-divider class="my-2"></v-divider>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.commentCodexSwitch') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="commentCodexSwitch" :disabled="!commentGlobalSwitch" @update:modelValue="onCommentCodexSwitch"></v-switch>
          </v-col>
        </v-row>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.commentAssemblySwitch') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="commentAssemblySwitch" :disabled="!commentGlobalSwitch" @update:modelValue="onCommentAssemblySwitch"></v-switch>
          </v-col>
        </v-row>

        <template v-slot:title>
          {{ t('setting.routine.commentTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-5">{{ t('setting.routine.assemblyDesc') }}</p>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.assemblyViewModel') }}</v-col>
          <v-col cols="auto">
            <v-select
                hide-details
                inset
                density="compact"
                :items="assemblyViewModelItems"
                item-title="title"
                item-value="value"
                v-model="assemblyViewModel"
                @update:modelValue="onAssemblyViewModel">
              <template v-slot:item="{props}">
                <v-list-item v-bind="props"></v-list-item>
              </template>
            </v-select>
          </v-col>
        </v-row>

        <p class="mt-3 text-caption opacity-60">{{ t(`setting.routine.assemblyViewModelOptions.${assemblyViewModel}.description`) }}</p>

        <template v-slot:title>
          {{ t('setting.routine.assemblyTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
  </v-row>

  <!-- 功能管理弹窗 S -->
  <v-dialog v-model="isManageFunctionsOpen" max-width="720">
    <v-card border class="bg-grey-darken-4 pa-2">
      <v-card-title class="py-6 border rounded-lg text-center bg-black mb-4">
        <v-icon size="48" class="mb-2 text-amber">mdi-view-dashboard-edit-outline</v-icon>
        <p class="text-h6 font-weight-bold">{{ t('setting.routine.manageFunctions') }}</p>
        <p class="text-caption opacity-60 mt-1">{{ t('setting.routine.featureDesc') }}</p>
        <p class="text-caption text-grey">{{ t('setting.routine.featureHint') }}</p>
      </v-card-title>

      <v-card-text class="px-2">
        <v-row>
          <!-- 激活区域（支持拖拽排序与上下移动） -->
          <v-col cols="12" md="7">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="font-weight-bold text-body-2 d-flex align-center ga-1">
                <v-icon size="small" color="amber">mdi-check-circle-outline</v-icon>
                <span>{{ t('setting.routine.activeArea') }} ({{ activeFunctions.length }})</span>
              </div>
              <span class="text-caption opacity-50">{{ t('setting.routine.dragHint') }}</span>
            </div>

            <div
                class="active-drop-zone pa-2 rounded-lg border"
                :class="{ 'drop-active': isDraggingOverActive }"
                @dragover.prevent="onDragOverActiveZone"
                @dragleave="onDragLeaveActiveZone"
                @drop="onDropToActiveZone">
              <div v-if="activeFunctions.length === 0" class="text-center py-8 opacity-40 text-caption">
                {{ t('setting.routine.noActiveFunctions') }}
              </div>

              <div
                  v-for="(func, index) in activeFunctions"
                  :key="func.key"
                  class="active-item-row d-flex align-center justify-space-between px-3 py-2 mb-2 rounded-lg border bg-black cursor-move"
                  :class="{ 'dragging': draggedActiveIndex === index, 'drag-target': dragOverActiveIndex === index }"
                  draggable="true"
                  @dragstart="onActiveDragStart($event, index)"
                  @dragover.prevent.stop="onActiveDragOverItem($event, index)"
                  @dragleave="onActiveDragLeaveItem"
                  @drop.stop="onActiveDropItem($event, index)"
                  @dragend="onDragEnd">
                <div class="d-flex align-center ga-2 text-truncate mr-2">
                  <v-icon size="small" class="opacity-40">mdi-drag-vertical</v-icon>
                  <span class="text-caption font-weight-bold text-truncate">{{ t(func.key) }}</span>
                </div>

                <div class="d-flex align-center ga-1">
                  <v-btn
                      icon="mdi-chevron-up"
                      variant="text"
                      size="x-small"
                      density="compact"
                      :disabled="index === 0"
                      @click="moveActiveItem(index, -1)"></v-btn>
                  <v-btn
                      icon="mdi-chevron-down"
                      variant="text"
                      size="x-small"
                      density="compact"
                      :disabled="index === activeFunctions.length - 1"
                      @click="moveActiveItem(index, 1)"></v-btn>
                  <v-btn
                      icon="mdi-close"
                      variant="text"
                      color="error"
                      size="x-small"
                      density="compact"
                      @click="deactivateFunction(func.key)"></v-btn>
                </div>
              </div>
            </div>
          </v-col>

          <!-- 未激活区域（支持拖拽激活与下拉激活） -->
          <v-col cols="12" md="5">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="font-weight-bold text-body-2 d-flex align-center ga-1">
                <v-icon size="small" class="opacity-60">mdi-minus-circle-outline</v-icon>
                <span>{{ t('setting.routine.inactiveArea') }} ({{ inactiveFunctions.length }})</span>
              </div>
            </div>

            <!-- 下拉快捷激活 -->
            <v-select
                v-model="selectedToActivate"
                :items="inactiveFunctions"
                item-title="title"
                item-value="key"
                :label="t('setting.routine.inactiveFunctions', { count: inactiveFunctions.length })"
                multiple
                chips
                variant="outlined"
                density="compact"
                hide-details
                class="mb-3"
                @update:model-value="onActivateFunctions">
              <template v-slot:chip="{ props, item }">
                <v-chip v-bind="props" size="x-small" color="info">
                  {{ t((item.raw ?? item).key) }}
                </v-chip>
              </template>
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:title>
                    {{ t((item.raw ?? item).key) }}
                  </template>
                </v-list-item>
              </template>
              <template v-slot:no-data>
                <EmptyView></EmptyView>
              </template>
            </v-select>

            <div
                class="inactive-drop-zone pa-2 rounded-lg border"
                :class="{ 'drop-active': isDraggingOverInactive }"
                @dragover.prevent="onDragOverInactiveZone"
                @dragleave="onDragLeaveInactiveZone"
                @drop="onDropToInactiveZone">
              <div v-if="inactiveFunctions.length === 0" class="text-center py-6 opacity-40 text-caption">
                {{ t('setting.routine.allActivated') }}
              </div>

              <div class="d-flex flex-wrap ga-2">
                <v-chip
                    v-for="func in inactiveFunctions"
                    :key="func.key"
                    size="small"
                    variant="outlined"
                    class="cursor-move"
                    draggable="true"
                    append-icon="mdi-plus"
                    @dragstart="onInactiveDragStart($event, func)"
                    @dragend="onDragEnd"
                    @click="activateFunction(func.key)">
                  {{ t(func.key) }}
                </v-chip>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer></v-spacer>
        <v-btn variant="tonal" color="amber" @click="isManageFunctionsOpen = false">
          {{ t('basic.button.close') || '关闭' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- 功能管理弹窗 E -->
</template>

<script setup lang="ts">
import I18nWidget from "@/components/i18nWidget.vue";
import ItemIconManager from "@/components/ItemIconManager.vue";
import HtmlLink from "@/components/HtmlLink.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {appFuns, storage_account, storage_capacity_monitor} from "@/assets/sripts/index";
import {onMounted, Ref, ref, computed} from "vue";
import {useI18n} from "vue-i18n";
import ItemIconCdnAssets from "@/components/ItemIconCdnAssets.vue";
import ItemModelCdnAssets from "@/components/ItemModelCdnAssets.vue";
import ItemLangCdnAssets from "@/components/ItemLangCdnAssets.vue";
import EmptyView from "@/components/EmptyView.vue";

const {t} = useI18n()

let estimateCapacity: Ref<any> = ref({}),
    appFunConfig = ref<any[]>([]),

    // 管理功能弹窗展开状态
    isManageFunctionsOpen = ref(false),

    // 当前正在拖拽的激活项索引
    draggedActiveIndex = ref<number | null>(null),

    // 当前正在拖拽的未激活项标识
    draggedInactiveKey = ref<string | null>(null),

    // 激活区域拖拽悬浮状态
    isDraggingOverActive = ref(false),

    // 未激活区域拖拽悬浮状态
    isDraggingOverInactive = ref(false),

    // 激活列表中当前悬浮插入目标的索引
    dragOverActiveIndex = ref<number | null>(null),

    // 下拉框选中的待激活功能
    selectedToActivate = ref<string[]>([]),

    clearLoading = ref(false),
    headerSearchSwitch = ref(false),

    searchIsLogs = ref(false),
    searchHotkey = ref(false),
    searchHint = ref(false),
    searchOpenNewWindow = ref(true),

    commentGlobalSwitch = ref(true),
    commentCodexSwitch = ref(true),
    commentAssemblySwitch = ref(true),
    posterSwitch = ref(false),

    assemblyViewModel = ref('lock-window')

/**
 * 配装视图模式选项列表
 */
const assemblyViewModelItems = computed(() => [
  {
    title: t('setting.routine.assemblyViewModelOptions.full-extension.name'),
    value: 'full-extension',
  },
  {
    title: t('setting.routine.assemblyViewModelOptions.lock-window.name'),
    value: 'lock-window',
  },
])

// 计算属性：已激活的功能列表 (value === true)
const activeFunctions = computed(() => {
  return appFunConfig.value.filter(item => item.value === true)
})

// 计算属性：未激活的功能列表 (value === false)
const inactiveFunctions = computed(() => {
  return appFunConfig.value.filter(item => item.value === false)
})

// 激活功能：从下拉框选择后，将选中的功能设置为激活状态
const onActivateFunctions = (selectedKeys: string[]) => {
  if (!selectedKeys || selectedKeys.length === 0) return

  appFunConfig.value.forEach(item => {
    if (selectedKeys.includes(item.key) && !item.value) {
      item.value = true
    }
  })

  // 保存配置
  onUpdateAppFunConfig()

  // 清空下拉框选中状态
  selectedToActivate.value = []
}

/**
 * 反激活功能：将指定功能设置为未激活
 *
 * @param key 功能唯一标识
 */
const deactivateFunction = (key: string) => {
  const target = appFunConfig.value.find(item => item.key === key)
  if (target && target.value) {
    target.value = false
    onUpdateAppFunConfig()
  }
}

/**
 * 激活功能：将指定功能设置为激活
 *
 * @param key 功能唯一标识
 */
const activateFunction = (key: string) => {
  const target = appFunConfig.value.find(item => item.key === key)
  if (target && !target.value) {
    target.value = true
    onUpdateAppFunConfig()
  }
}

/**
 * 移动已激活项顺序
 *
 * @param index 当前激活项索引
 * @param delta 偏移量（-1 上移，1 下移）
 */
const moveActiveItem = (index: number, delta: number) => {
  const targetIndex = index + delta
  const actives = [...activeFunctions.value]
  if (targetIndex < 0 || targetIndex >= actives.length) return

  const itemToMove = actives[index]
  actives.splice(index, 1)
  actives.splice(targetIndex, 0, itemToMove)

  const inactives = appFunConfig.value.filter(item => !item.value)
  appFunConfig.value = [...actives, ...inactives]
  onUpdateAppFunConfig()
}

/**
 * 激活项开始拖拽
 *
 * @param e 拖拽事件
 * @param index 激活项索引
 */
const onActiveDragStart = (e: DragEvent, index: number) => {
  draggedActiveIndex.value = index
  draggedInactiveKey.value = null
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
}

/**
 * 未激活项开始拖拽
 *
 * @param e 拖拽事件
 * @param func 功能对象
 */
const onInactiveDragStart = (e: DragEvent, func: any) => {
  draggedInactiveKey.value = func.key
  draggedActiveIndex.value = null
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', func.key)
  }
}

/**
 * 拖拽悬浮于特定激活项上方
 *
 * @param e 拖拽事件
 * @param index 目标激活项索引
 */
const onActiveDragOverItem = (e: DragEvent, index: number) => {
  e.preventDefault()
  dragOverActiveIndex.value = index
}

/**
 * 拖拽离开激活项
 */
const onActiveDragLeaveItem = () => {
  dragOverActiveIndex.value = null
}

/**
 * 放置到特定激活项位置
 *
 * @param e 拖拽事件
 * @param dropIndex 放置目标索引
 */
const onActiveDropItem = (e: DragEvent, dropIndex: number) => {
  e.preventDefault()
  dragOverActiveIndex.value = null
  isDraggingOverActive.value = false

  const actives = [...activeFunctions.value]
  const inactives = appFunConfig.value.filter(item => !item.value)

  if (draggedActiveIndex.value !== null) {
    const fromIdx = draggedActiveIndex.value
    if (fromIdx !== dropIndex) {
      const moved = actives.splice(fromIdx, 1)[0]
      actives.splice(dropIndex, 0, moved)
      appFunConfig.value = [...actives, ...inactives]
      onUpdateAppFunConfig()
    }
  } else if (draggedInactiveKey.value !== null) {
    const key = draggedInactiveKey.value
    const target = appFunConfig.value.find(item => item.key === key)
    if (target) {
      target.value = true
      const remainingActives = actives.filter(item => item.key !== key)
      remainingActives.splice(dropIndex, 0, target)
      const remainingInactives = inactives.filter(item => item.key !== key)
      appFunConfig.value = [...remainingActives, ...remainingInactives]
      onUpdateAppFunConfig()
    }
  }

  draggedActiveIndex.value = null
  draggedInactiveKey.value = null
}

/**
 * 拖拽悬浮于激活主区域
 *
 * @param e 拖拽事件
 */
const onDragOverActiveZone = (e: DragEvent) => {
  e.preventDefault()
  isDraggingOverActive.value = true
}

/**
 * 拖拽离开激活主区域
 */
const onDragLeaveActiveZone = () => {
  isDraggingOverActive.value = false
}

/**
 * 放置到激活主区域末尾
 *
 * @param e 拖拽事件
 */
const onDropToActiveZone = (e: DragEvent) => {
  e.preventDefault()
  isDraggingOverActive.value = false
  if (draggedInactiveKey.value !== null) {
    activateFunction(draggedInactiveKey.value)
  }
  draggedActiveIndex.value = null
  draggedInactiveKey.value = null
}

/**
 * 拖拽悬浮于未激活主区域
 *
 * @param e 拖拽事件
 */
const onDragOverInactiveZone = (e: DragEvent) => {
  e.preventDefault()
  isDraggingOverInactive.value = true
}

/**
 * 拖拽离开未激活主区域
 */
const onDragLeaveInactiveZone = () => {
  isDraggingOverInactive.value = false
}

/**
 * 放置到未激活区域（将激活项取消激活）
 *
 * @param e 拖拽事件
 */
const onDropToInactiveZone = (e: DragEvent) => {
  e.preventDefault()
  isDraggingOverInactive.value = false
  if (draggedActiveIndex.value !== null) {
    const item = activeFunctions.value[draggedActiveIndex.value]
    if (item) {
      deactivateFunction(item.key)
    }
  }
  draggedActiveIndex.value = null
  draggedInactiveKey.value = null
}

/**
 * 拖拽操作结束重置临时状态
 */
const onDragEnd = () => {
  draggedActiveIndex.value = null
  draggedInactiveKey.value = null
  dragOverActiveIndex.value = null
  isDraggingOverActive.value = false
  isDraggingOverInactive.value = false
}

onMounted(() => {
  getConfig()
})

/**
 * 格式化应用列表
 */
const appFunFormatting = () => {
  return appFuns.original.map(i => ({
    key: i.title,
    description: i.title,
    value: true
  }))
}

const getConfig = () => {
  estimateCapacity.value = storage_capacity_monitor.estimateCapacity()

  appFunConfig.value = storage_account.getConfigurationItem('appFun', 'config', {defaultValue: appFunFormatting()})
  headerSearchSwitch.value = storage_account.getConfigurationItem('search', 'header.switch')

  searchIsLogs.value = storage_account.getConfigurationItem('search', 'log.switch')
  searchHotkey.value = storage_account.getConfigurationItem('search', 'hotkey.switch')
  searchHint.value = storage_account.getConfigurationItem('search', 'hint.switch')
  searchOpenNewWindow.value = storage_account.getConfigurationItem('search', 'open.newWindow', {defaultValue: true})

  commentGlobalSwitch.value = storage_account.getConfigurationItem('comment', 'global.switch', {defaultValue: true})
  commentCodexSwitch.value = storage_account.getConfigurationItem('comment', 'codex.switch', {defaultValue: true})
  commentAssemblySwitch.value = storage_account.getConfigurationItem('comment', 'assembly.switch', {defaultValue: true})

  posterSwitch.value = storage_account.getConfigurationItem('poster', 'poster.switch')

  assemblyViewModel.value = storage_account.getConfigurationItem('assembly', 'viewModel', {defaultValue: assemblyViewModel.value})
}

const onUpdateAppFunConfig = () => {
  storage_account.updateConfiguration('appFun', 'config', appFunConfig.value)
}

/**
 * 处理搜索设置
 */
const onHeaderSearchSwitch = async () => {
  storage_account.updateConfiguration('search', 'header.switch', headerSearchSwitch.value)
}

const onSearchIsLogs = () => {
  storage_account.updateConfiguration('search', 'log.switch', searchIsLogs.value)
}

const onSearchHotkey = () => {
  storage_account.updateConfiguration('search', 'hotkey.switch', searchHotkey.value)
}

const onSearchHint = () => {
  storage_account.updateConfiguration('search', 'hint.switch', searchHint.value)
}

const onSearchOpenNewWindow = () => {
  storage_account.updateConfiguration('search', 'open.newWindow', searchOpenNewWindow.value)
}

const onCommentGlobalSwitch = () => {
  storage_account.updateConfiguration('comment', 'global.switch', commentGlobalSwitch.value)
}

const onCommentCodexSwitch = () => {
  storage_account.updateConfiguration('comment', 'codex.switch', commentCodexSwitch.value)
}

const onCommentAssemblySwitch = () => {
  storage_account.updateConfiguration('comment', 'assembly.switch', commentAssemblySwitch.value)
}

const onPosterSwitch = () => {
  storage_account.updateConfiguration('poster', 'poster.switch', posterSwitch.value)
}

const onAssemblyViewModel = () => {
  storage_account.updateConfiguration('assembly', 'viewModel', assemblyViewModel.value)
}

/**
 * 擦除数据
 */
const clearStorage = () => {
  clearLoading.value = true

  storage_capacity_monitor.clearStorage(localStorage)
  storage_capacity_monitor.clearStorage(sessionStorage)

  getConfig()

  clearLoading.value = false
}
</script>

<style scoped lang="less">
.active-drop-zone,
.inactive-drop-zone {
  min-height: 280px;
  max-height: 460px;
  overflow-y: auto;
  transition: border-color .2s ease, background-color .2s ease;
  background-color: rgba(0, 0, 0, 0.2);

  &.drop-active {
    border-color: #ffb300 !important;
    background-color: rgba(255, 179, 0, 0.05);
  }
}

.active-item-row {
  transition: all .2s ease;

  &:hover {
    border-color: rgba(255, 179, 0, 0.4) !important;
  }

  &.dragging {
    opacity: 0.35;
  }

  &.drag-target {
    border-color: #ffb300 !important;
    box-shadow: 0 0 8px rgba(255, 179, 0, 0.3);
  }
}

.cursor-move {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}
</style>
