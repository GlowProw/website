<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, ref} from "vue";
import {Materials} from "glow-prow-data";
import {useCalculatorStore, MaterialTreeNode} from "~/stores/calculatorStore";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import MaterialNameRarity from "@/components/snbWidget/materialNameRarity.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import HtmlLink from "@/components/HtmlLink.vue";

const {t} = useI18n()
const store = useCalculatorStore()
const materials: Record<string, any> = Materials

// 控制展开的节点
const expandedNodes = ref<Set<string>>(new Set())

function toggleNode(nodeKey: string) {
  if (expandedNodes.value.has(nodeKey)) {
    expandedNodes.value.delete(nodeKey)
  } else {
    expandedNodes.value.add(nodeKey)
  }
}

function isExpanded(nodeKey: string): boolean {
  return expandedNodes.value.has(nodeKey)
}

function expandAll() {
  function collectKeys(nodes: MaterialTreeNode[], prefix: string = '') {
    nodes.forEach((node, index) => {
      const key = `${prefix}${node.id}-${index}`
      if (node.children.length > 0) {
        expandedNodes.value.add(key)
        collectKeys(node.children, `${key}/`)
      }
    })
  }

  collectKeys(store.materialTrees)
}

function collapseAll() {
  expandedNodes.value.clear()
}
</script>

<template>
  <div class="result-list-view">
    <!-- 列设置 & 操作 -->
    <v-row dense class="mb-2" align="center">
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
      <v-spacer/>
      <v-col cols="auto">
        <v-menu>
          <template v-slot:activator="{props}">
            <v-btn density="compact" variant="text" icon="mdi-cog" v-bind="props" size="small"/>
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

    <!-- 汇总面板 -->
    <v-card variant="text" class="mb-4 summary-card" v-if="store.flatMaterials.length > 0">
      <v-card-title class="text-body-1 d-flex align-center ga-2">
        <v-icon icon="mdi-sigma" size="20" color="amber"/>
        材料汇总 ({{ store.flatMaterials.length }})
      </v-card-title>
      <v-card-text>
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
              <ItemSlotBase size="25px" :padding="0">
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
      </v-card-text>
    </v-card>

    <!-- 树状展开 -->
    <v-card variant="text" class="tree-card" v-if="store.materialTrees.length > 0">
      <v-card-title class="text-body-1 d-flex align-center ga-2">
        <v-icon icon="mdi-file-tree" size="20" color="cyan"/>
        材料树
      </v-card-title>
      <v-card-text>
        <template v-for="(node, index) in store.materialTrees" :key="`root-${node.id}-${index}`">
          <TreeNode
              :node="node"
              :depth="0"
              :node-key="`${node.id}-${index}`"
              :expanded-nodes="expandedNodes"
              @toggle="toggleNode"
          />
        </template>
      </v-card-text>
    </v-card>

    <!-- 空状态 -->
    <div v-if="store.materialTrees.length === 0" class="text-center py-10 opacity-40">
      <v-icon icon="mdi-tree" size="60" class="mb-3"/>
      <p class="text-body-1">添加目标以查看材料树</p>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue'
import type {MaterialTreeNode as TreeNodeType} from '~/stores/calculatorStore'

/**
 * 递归树节点组件
 */
const TreeNode = defineComponent({
  name: 'TreeNode',
  props: {
    node: {type: Object as PropType<TreeNodeType>, required: true},
    depth: {type: Number, default: 0},
    nodeKey: {type: String, required: true},
    expandedNodes: {type: Object as PropType<Set<string>>, required: true}
  },
  emits: ['toggle'],
  setup(props, {emit}) {
    const isExpanded = () => props.expandedNodes.has(props.nodeKey)
    const toggle = () => emit('toggle', props.nodeKey)

    return {isExpanded, toggle}
  },
  template: `
    <div class="tree-node" :style="{ paddingLeft: depth * 24 + 'px' }">
      <div class="tree-node-row d-flex align-center ga-2 py-1"
           :class="{'tree-node-excluded': node.isExcluded}"
           @click="toggle">
        <v-icon
            v-if="node.children.length > 0 && !node.isExcluded"
            :icon="isExpanded() ? 'mdi-chevron-down' : 'mdi-chevron-right'"
            size="16"
            class="cursor-pointer flex-shrink-0"
        />
        <div v-else style="width: 16px;" class="flex-shrink-0"/>
        <span class="text-body-2 flex-grow-1 d-flex align-center ga-1">
          {{ node.id }}
          <v-chip v-if="node.isExcluded" size="x-small" color="orange" variant="tonal">排除</v-chip>
        </span>
        <span class="text-body-2 font-weight-bold text-amber">×{{ node.quantity }}</span>
      </div>
      <template v-if="isExpanded() && node.children.length > 0">
        <TreeNode
            v-for="(child, cIndex) in node.children"
            :key="nodeKey + '/' + child.id + '-' + cIndex"
            :node="child"
            :depth="depth + 1"
            :node-key="nodeKey + '/' + child.id + '-' + cIndex"
            :expanded-nodes="expandedNodes"
            @toggle="$emit('toggle', $event)"
        />
      </template>
    </div>
  `
})

export default {
  components: {TreeNode}
}
</script>

<style scoped lang="less">
.result-list-view {
  .summary-card {
    border-color: rgba(255, 193, 7, 0.15);
  }

  .tree-card {
    border-color: rgba(0, 188, 212, 0.15);
  }
}

:deep(.tree-node) {
  .tree-node-row {
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
    transition: background-color 0.15s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.04);
    }

    &.tree-node-excluded {
      opacity: 0.6;
    }
  }
}
</style>
