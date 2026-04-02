<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {ref} from "vue";
import {Materials} from "glow-prow-data";
import {useCalculatorStore, MaterialTreeNode} from "~/stores/calculatorStore";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import MaterialNameRarity from "@/components/snbWidget/materialNameRarity.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import HtmlLink from "@/components/HtmlLink.vue";
import TreeNodeItem from "./TreeNodeItem.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t} = useI18n()
const store = useCalculatorStore()
const materials: Record<string, any> = Materials

// 控制展开的节点
const expandedNodes = ref<Set<string>>(new Set())

function toggleNode(nodeKey: string) {
  // 创建新 Set 触发响应性
  const next = new Set(expandedNodes.value)
  if (next.has(nodeKey)) {
    next.delete(nodeKey)
  } else {
    next.add(nodeKey)
  }
  expandedNodes.value = next
}

function expandAll() {
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

function collapseAll() {
  expandedNodes.value = new Set()
}
</script>

<template>
  <div class="result-list-view">
    <!-- 汇总面板 -->
    <AffixBoxHasTitleView>
      <v-row no-gutters align="center">
        <v-col cols="auto">
          <v-icon icon="mdi-sigma" color="amber" class="mb-2"/>
        </v-col>
        <v-col>
          <v-divider :thickness="4" class="mt-n1"></v-divider>
        </v-col>
        <v-col cols="auto">
          <v-menu>
            <template v-slot:activator="{props}">
              <v-btn variant="text" icon="mdi-filter" v-bind="props"/>
            </template>
            <v-card min-width="200">
              <v-card-text class="pa-2">
                <p class="text-caption font-weight-bold mb-1">{{ t('calculator.results.columns.name') }}</p>
                <v-checkbox
                    v-model="store.displaySettings.listColumns.name"
                    :label="t('calculator.results.columns.name')"
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
            <th class="text-left" v-if="store.displaySettings.listColumns.name">
              {{ t('calculator.results.columns.name') }}
            </th>
            <th class="text-right" v-if="store.displaySettings.listColumns.quantity">
              {{ t('calculator.results.columns.quantity') }}
            </th>
            <th class="text-center" v-if="store.displaySettings.listColumns.link" style="width: 50px;">
              {{ t('calculator.results.columns.link') }}
            </th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="mat in store.flatMaterials" :key="mat.id">
            <td>
              <ItemSlotBase size="30px" :padding="0">
                <MaterialIconWidget :id="mat.id" :padding="0" :margin="0"/>
              </ItemSlotBase>
            </td>
            <td v-if="store.displaySettings.listColumns.name">
              <MaterialNameRarity :id="mat.id">
                <MaterialName :id="mat.id"/>
              </MaterialNameRarity>
            </td>
            <td class="text-right font-weight-bold text-amber" v-if="store.displaySettings.listColumns.quantity">
              {{ mat.totalQuantity }}
            </td>
            <td class="text-center" v-if="store.displaySettings.listColumns.link">
              <HtmlLink :is-icon="false" :is-iframe-show="false" :href="`/codex/material/${mat.id}`" target="_blank">
                <v-icon size="14" icon="mdi-open-in-new"/>
              </HtmlLink>
            </td>
          </tr>
          </tbody>
        </v-table>
      </v-card>

      <template v-slot:title>
        <span>材料汇总 ({{ store.flatMaterials.length }})</span>
      </template>
    </AffixBoxHasTitleView>

    <!-- 树状展开 -->
    <AffixBoxHasTitleView>
      <v-card variant="text" class="tree-card" v-if="store.materialTrees.length > 0">
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
                <v-btn size="small" @click="expandAll">
                  <v-icon icon="mdi-unfold-more-horizontal" size="16" class="mr-1"/>
                  展开全部
                </v-btn>
                <v-btn size="small" @click="collapseAll">
                  <v-icon icon="mdi-unfold-less-horizontal" size="16" class="mr-1"/>
                  折叠全部
                </v-btn>
              </v-btn-group>
            </v-col>
          </v-col>
        </v-row>

        <TreeNodeItem
            v-for="(node, index) in store.materialTrees"
            :key="`root-${node.id}-${index}`"
            :node="node"
            :depth="0"
            :node-key="`${node.id}-${index}`"
            :expanded-nodes="expandedNodes"
            @toggle="toggleNode"
        />
      </v-card>

      <template v-slot:title>
        <span>材料树</span>
      </template>
    </AffixBoxHasTitleView>

    <!-- 空状态 -->
    <v-card border v-if="store.materialTrees.length === 0" class="d-flex align-center justify-center py-10 opacity-40 h-screen">
      <div class="text-center">
        <v-icon icon="mdi-tree" size="160" class="mb-3"/>
        <p class="text-body-1">添加目标以查看材料树</p>
      </div>
    </v-card>
  </div>
</template>

<style scoped lang="less">
.result-list-view {
  .summary-card {
    border-color: rgba(255, 193, 7, 0.15);
  }

  .tree-card {
    border-color: rgba(0, 188, 212, 0.15);
  }
}
</style>
