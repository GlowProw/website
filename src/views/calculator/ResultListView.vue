<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, ref} from "vue";
import {MaterialTreeNode, useCalculatorStore} from "~/stores/calculatorStore";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import MaterialNameRarity from "@/components/snbWidget/materialNameRarity.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import HtmlLink from "@/components/HtmlLink.vue";
import TreeNodeItem from "./TreeNodeItem.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {useDisplay} from "vuetify/framework";

const {t} = useI18n()
const {mobile} = useDisplay()
const store = useCalculatorStore()

type SortField = 'name' | 'id' | 'quantity'
type SortOrder = 'asc' | 'desc'

const sortField = ref<SortField>('quantity')
const sortOrder = ref<SortOrder>('desc')

// 获取排序后的材料列表
const sortedMaterials = computed(() => {
  const materials = [...store.flatMaterials]

  if (materials.length === 0) return materials

  return materials.sort((a: any, b: any) => {
    let comparison = 0

    switch (sortField.value) {
      case 'name':
        // 假设 MaterialName 组件能通过 id 获取名称，这里简化处理
        // 实际项目中可能需要从 store 或 i18n 获取真实名称
        comparison = (a.name || a.id).localeCompare(b.name || b.id, undefined, {numeric: true})
        break
      case 'id':
        comparison = String(a.id).localeCompare(String(b.id), undefined, {numeric: true})
        break
      case 'quantity':
        comparison = a.totalQuantity - b.totalQuantity
        break
    }

    return sortOrder.value === 'asc' ? comparison : -comparison
  })
})
const expandedNodes = ref<Set<string>>(new Set())

const toggleSort = (field: SortField) => {
  if (sortField.value === field) {
    // 同一字段：切换排序方向
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // 不同字段：设置为该字段并默认降序（数量）或升序（名称/ID）
    sortField.value = field
    sortOrder.value = (field === 'quantity') ? 'desc' : 'asc'
  }
}

const toggleNode = (nodeKey: string) => {
  // 创建新 Set 触发响应性
  const next = new Set(expandedNodes.value)
  if (next.has(nodeKey)) {
    next.delete(nodeKey)
  } else {
    next.add(nodeKey)
  }
  expandedNodes.value = next
}

const excludedNode = (nodeId: string) => {
  store.addExcludedMaterial(nodeId)
}

const expandAll = () => {
  const next = new Set<string>()

  function collectKeys(nodes: MaterialTreeNode[], prefix: string = '') {
    nodes.forEach((node, index) => {
      const key = `${prefix}${node.id}-${index}`
      if (node.children.length > 0) {
        next.add(key)
        collectKeys(node.children, `${key}/`)
      }
    })
  }

  collectKeys(store.materialTrees)
  expandedNodes.value = next
}

const collapseAll = () => {
  expandedNodes.value = new Set()
}

/**
 * 获取排序指示器图标
 * @param field
 */
const getSortIcon = (field: SortField) => {
  if (sortField.value !== field) return 'mdi-arrow-up-down'
  return sortOrder.value === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
}
</script>

<template>
  <div class="result-list-view">
    <!-- 汇总面板 S -->
    <AffixBoxHasTitleView>
      <v-row no-gutters align="center">
        <v-col cols="auto">
          <v-icon icon="mdi-sigma" color="amber" class="mb-2"/>
        </v-col>
        <v-col>
          <v-divider :thickness="4" class="mt-n1"></v-divider>
        </v-col>
        <v-col cols="auto">
          <v-menu :close-on-content-click="false">
            <template v-slot:activator="{props}">
              <v-btn variant="text" icon="mdi-filter" v-bind="props"/>
            </template>
            <v-card border class="pa-5" :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 580">
              <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
                <v-icon size="80">mdi-filter</v-icon>
              </v-card-title>
              <v-card-text class="pa-2">
                <v-checkbox
                    v-model="store.displaySettings.listColumns.name"
                    :label="t('calculator.results.columns.name')"
                    density="compact"
                    hide-details
                />
                <v-checkbox
                    v-model="store.displaySettings.listColumns.id"
                    :label="t('calculator.results.columns.id')"
                    density="compact"
                    hide-details
                />
                <v-checkbox
                    v-model="store.displaySettings.listColumns.quantity"
                    :label="t('calculator.results.columns.quantity')"
                    density="compact"
                    hide-details
                />
                <v-checkbox
                    v-model="store.displaySettings.listColumns.link"
                    :label="t('calculator.results.columns.link')"
                    density="compact"
                    hide-details
                />
              </v-card-text>
            </v-card>
          </v-menu>
        </v-col>
      </v-row>
      <v-card variant="text" class="mb-4 summary-card" v-if="store.flatMaterials.length > 0">
        <v-table density="compact" class="bg-transparent">
          <thead>
          <tr>
            <th class="text-left" style="width: 40px;"></th>
            <th
                v-if="store.displaySettings.listColumns.name"
                class="text-left sortable-header"
                @click="toggleSort('name')">
              <div class="d-flex align-center">
                {{ t('calculator.results.columns.name') }}
                <v-icon :icon="getSortIcon('name')" size="16" class="ml-1 sort-icon"/>
              </div>
            </th>
            <th
                v-if="store.displaySettings.listColumns.id"
                class="text-left sortable-header"
                @click="toggleSort('id')">
              <div class="d-flex align-center">
                {{ t('calculator.results.columns.id') }}
                <v-icon :icon="getSortIcon('id')" size="16" class="ml-1 sort-icon"/>
              </div>
            </th>
            <th
                v-if="store.displaySettings.listColumns.quantity"
                class="text-right sortable-header"
                @click="toggleSort('quantity')">
              <div class="d-flex align-center justify-end">
                {{ t('calculator.results.columns.quantity') }}
                <v-icon :icon="getSortIcon('quantity')" size="16" class="ml-1 sort-icon"/>
              </div>
            </th>
            <th class="text-center singe-line" v-if="store.displaySettings.listColumns.link" width="10">
              {{ t('calculator.results.columns.link') }}
            </th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="mat in sortedMaterials" :key="mat.id">
            <td>
              <ItemSlotBase size="30px">
                <MaterialIconWidget :id="mat.id" :padding="0" :margin="0"/>
              </ItemSlotBase>
            </td>
            <td v-if="store.displaySettings.listColumns.name">
              <MaterialNameRarity :id="mat.id">
                <MaterialName :id="mat.id"/>
              </MaterialNameRarity>
            </td>
            <td v-if="store.displaySettings.listColumns.id">
              <u class="u">
                {{ mat.id }}
              </u>
            </td>
            <td class="text-right font-weight-bold text-amber" v-if="store.displaySettings.listColumns.quantity">
              <u class="u">
                {{ mat.totalQuantity }}
              </u>
            </td>
            <td class="text-center" v-if="store.displaySettings.listColumns.link">
              <a :href="`/codex/material/${mat.id}`" target="_blank">
                <v-icon size="14" icon="mdi-open-in-new"/>
              </a>
            </td>
          </tr>
          </tbody>
        </v-table>
      </v-card>

      <!-- 空状态 -->
      <v-card border v-if="store.flatMaterials.length === 0" class="d-flex align-center justify-center py-10 opacity-40 mb-10">
        <div class="text-center">
          <v-icon icon="mdi-database-off-outline" size="160" class="mb-3"/>
          <p class="text-body-1">{{ t('calculator.ui.emptyFlatMaterials') }}</p>
        </div>
      </v-card>

      <template v-slot:title>
        <span>{{ t('calculator.ui.summary') }} ({{ store.flatMaterials.length }})</span>
      </template>
    </AffixBoxHasTitleView>
    <!-- 汇总面板 E -->

    <!-- 树状展开 S -->
    <AffixBoxHasTitleView>
      <v-row no-gutters align="center">
        <v-col cols="auto">
          <v-icon icon="mdi-file-tree" color="cyan" class="mb-2"/>
        </v-col>
        <v-col>
          <v-divider :thickness="4" class="mt-n1"></v-divider>
        </v-col>
        <v-col cols="auto">
          <v-col cols="auto">
            <v-btn-group density="compact" variant="outlined">
              <v-btn :disabled="store.materialTrees.length === 0" size="small" @click="expandAll">
                <v-icon icon="mdi-unfold-more-horizontal" size="16" class="mr-1"/>
                {{ t('calculator.ui.expandAll') }}
              </v-btn>
              <v-btn :disabled="store.materialTrees.length === 0" size="small" @click="collapseAll">
                <v-icon icon="mdi-unfold-less-horizontal" size="16" class="mr-1"/>
                {{ t('calculator.ui.collapseAll') }}
              </v-btn>
            </v-btn-group>
          </v-col>
        </v-col>
      </v-row>

      <v-card variant="text" class="tree-card" v-if="store.materialTrees.length > 0">
        <TreeNodeItem
            v-for="(node, index) in store.materialTrees"
            :key="`root-${node.id}-${index}`"
            :node="node"
            :depth="0"
            :node-key="`${node.id}-${index}`"
            :expanded-nodes="expandedNodes"
            @toggle="toggleNode"
            @excluded="excludedNode"
        />
      </v-card>

      <!-- 空状态 -->
      <v-card border v-if="store.materialTrees.length === 0" class="d-flex align-center justify-center py-10 opacity-40 mb-10">
        <div class="text-center">
          <v-icon icon="mdi-database-off-outline" size="160" class="mb-3"/>
          <p class="text-body-1">{{ t('calculator.ui.emptyTree') }}</p>
        </div>
      </v-card>

      <template v-slot:title>
        <span>{{ t('calculator.ui.tree') }}</span>
      </template>
    </AffixBoxHasTitleView>
    <!-- 树状展开 E -->
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.result-list-view {
  .summary-card {
    border-color: rgba(255, 193, 7, 0.15);
  }

  .tree-card {
    border-color: rgba(0, 188, 212, 0.15);
  }

  .sortable-header {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }

    .sort-icon {
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    &:hover .sort-icon {
      opacity: 1;
    }
  }
}
</style>
