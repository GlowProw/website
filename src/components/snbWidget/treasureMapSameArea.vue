<script setup lang="ts">
import {MapLocation, TreasureMap, TreasureMaps} from "glow-prow-data";
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
const hasIntersection = (
    arr1: string | MapLocation | Array<string | MapLocation> | Array<Array<string | MapLocation> | MapLocation | string>,
    arr2: string | MapLocation | Array<string | MapLocation> | Array<Array<string | MapLocation> | MapLocation | string>
): boolean => {
  // 处理 arr1 为对象且包含 id 属性的情况
  let targetArr: any[];

  if (typeof arr1 === 'object' && arr1 !== null && 'id' in arr1) {
    // 如果 arr1 是包含 id 属性的对象，提取 id 值作为单一元素数组
    targetArr = [arr1.id];
  } else if (Array.isArray(arr1)) {
    targetArr = arr1.map(i => i.id);
  } else {
    // 如果是字符串或其他类型，转为数组
    targetArr = [arr1];
  }

  // 处理 arr2，确保是数组
  let searchArr: any[];
  if (Array.isArray(arr2)) {
    searchArr = arr2.map(i => i.id);
  } else {
    searchArr = [arr2];
  }

  const set2 = new Set(searchArr);
  return targetArr.some(item => set2.has(item));
};
</script>

<template>
  <div class="mb-10">
    <slot></slot>
  </div>
  <v-row class="ga-6 mb-2" justify="center">
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
