<script setup lang="ts">
import {computed} from "vue";
import type {MaterialTreeNode} from "~/stores/calculatorStore";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n()

const props = defineProps<{
  node: MaterialTreeNode
  depth: number
  nodeKey: string
  expandedNodes: Set<string>
}>()

const emit = defineEmits<{
  toggle: [key: string]
  excluded: [key: any]
}>()

const isExpanded = computed(() => props.expandedNodes.has(props.nodeKey))

function onToggle() {
  emit('toggle', props.nodeKey)
}

function onChildToggle(key: string) {
  emit('toggle', key)
}

function onAddExcluded (key: string) {
  emit('excluded', key);
}
</script>

<template>
  <div class="tree-node" :style="{ paddingLeft: depth * 24 + 'px' }">
    <div
        class="tree-node-row d-flex align-center ga-2 py-1"
        :class="{'tree-node-excluded': node.isExcluded}"
        @click="onToggle">
      <v-icon
          v-if="node.children.length > 0 && !node.isExcluded"
          :icon="isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          size="16"
          class="cursor-pointer flex-shrink-0"/>
      <div v-else style="width: 16px;" class="flex-shrink-0"/>

      <ItemSlotBase size="30px"  class="flex-shrink-0">
        <MaterialIconWidget :id="node.id" :padding="0" :margin="0"/>
      </ItemSlotBase>

      <span class="text-body-2 flex-grow-1 d-flex align-center ga-1">
        <MaterialName :id="node.id"/>
        <v-chip v-if="node.isExcluded" size="x-small" color="orange" variant="tonal">{{ t('calculator.ui.excluded') }}</v-chip>
      </span>

      <v-chip v-if="!node.isExcluded" @click="onAddExcluded(node.id)" size="x-small" color="orange" variant="tonal">{{ t('calculator.ui.addToExclude') }}</v-chip>

      <span class="text-body-2 font-weight-bold text-amber">×{{ node.quantity }}</span>
    </div>

    <template v-if="isExpanded && node.children.length > 0">
      <TreeNodeItem
          v-for="(child, cIndex) in node.children"
          :key="nodeKey + '/' + child.id + '-' + cIndex"
          :node="child"
          :depth="depth + 1"
          :node-key="nodeKey + '/' + child.id + '-' + cIndex"
          :expanded-nodes="expandedNodes"
          @toggle="onChildToggle"
          @excluded="onAddExcluded"
      />
    </template>
  </div>
</template>

<style scoped lang="less">
.tree-node {
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
