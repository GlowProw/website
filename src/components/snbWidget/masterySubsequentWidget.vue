<script setup lang="ts">
import {computed} from "vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import MasteryIconWidget from "@/components/snbWidget/masteryIconWidget.vue";
import MasteryName from "@/components/snbWidget/masteryName.vue";
import {Mastery, Masterys} from "glow-prow-data";

const props = defineProps<{
  id?: string;
  data?: Mastery | null;
}>();

/**
 * 查找专精节点：优先匹配 id / skill，其次兜底匹配 key
 */
const findMasteryNode = (idOrKey: string): Mastery | null => {
  if (!idOrKey) return null;
  // id / skill 匹配
  for (const tree of Object.values(Masterys)) {
    if (tree && (tree as any).nodes) {
      for (const node of Object.values((tree as any).nodes) as Mastery[]) {
        if (node.id === idOrKey || (node as any).skill === idOrKey) {
          return node;
        }
      }
    }
  }
  // key 匹配
  for (const tree of Object.values(Masterys)) {
    if (tree && (tree as any).nodes) {
      if ((tree as any).nodes[idOrKey]) {
        return (tree as any).nodes[idOrKey];
      }
      for (const node of Object.values((tree as any).nodes) as Mastery[]) {
        if (node.key === idOrKey) {
          return node;
        }
      }
    }
  }
  return null;
};

const currentMastery = computed<Mastery | null>(() => {
  if (props.data) return props.data;
  if (props.id) return findMasteryNode(props.id);
  return null;
});

const subsequentNodes = computed<Mastery[]>(() => {
  if (!currentMastery.value) return [];
  const currentKey = currentMastery.value.key;
  const currentId = currentMastery.value.id;
  const result: Mastery[] = [];
  const seen = new Set<string>();

  for (const tree of Object.values(Masterys)) {
    if (tree && (tree as any).nodes) {
      for (const node of Object.values((tree as any).nodes) as Mastery[]) {
        if (node.requisite && ((currentKey && node.requisite.includes(currentKey)) || (currentId && node.requisite.includes(currentId)))) {
          if (!seen.has(node.id)) {
            seen.add(node.id);
            result.push(node);
          }
        }
      }
    }
  }
  return result;
});

defineOptions({
  name: 'MasterySubsequentWidget'
});
</script>

<template>
  <div v-if="subsequentNodes.length > 0" class="my-5">
    <div>
      <slot></slot>
    </div>
    <v-row class="ga-6 mb-2" justify="center">
      <v-card v-for="(item, index) in subsequentNodes" :key="index" class="bg-transparent" width="80">
        <ItemSlotBase :id="item.id" size="80px" class="mx-auto">
          <MasteryIconWidget :id="item.id"></MasteryIconWidget>
        </ItemSlotBase>
        <div class="mt-1 text-center singe-line">
          <MasteryName :id="item.id"></MasteryName>
        </div>
      </v-card>
    </v-row>
  </div>
</template>

<style scoped lang="less">
</style>
