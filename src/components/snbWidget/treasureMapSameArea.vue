<script setup lang="ts">
import {TreasureMap, TreasureMaps} from "glow-prow-data";
import {computed} from "vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import TreasureMapName from "@/components/snbWidget/treasureMapName.vue";

const props = defineProps<{ data: TreasureMap }>(),
    treasureMaps = computed(() => Object.values(TreasureMaps)
        .filter((i: TreasureMap) => hasIntersection(i.obtainable, props.data.obtainable))
    )

/**
 * 判断交集
 * @param arr1
 * @param arr2
 */
const hasIntersection = (arr1: string[], arr2: string[]): boolean => {
  const set2 = new Set(arr2);
  return arr1.some(item => set2.has(item));
};
</script>

<template>
  <div class="mb-10">
    <slot></slot>
  </div>
  <v-row class="ga-6 mb-2"justify="center">
    <v-card v-for="(i, index) in treasureMaps" :key="index" class="bg-transparent" width="80">
      <ItemSlotBase size="80px" class="mx-auto">
        <TreasureMapIconWidget :id="i.id"></TreasureMapIconWidget>
      </ItemSlotBase>
      <div class="mt-1 text-center">
        <TreasureMapName :data="i"></TreasureMapName>
      </div>
    </v-card>
  </v-row>
</template>

<style scoped lang="less">

</style>
