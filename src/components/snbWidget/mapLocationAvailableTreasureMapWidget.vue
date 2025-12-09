<script setup lang="ts">
import {TreasureMaps} from "glow-prow-data";
import {computed} from "vue";
import {Item} from "glow-prow-data/src/entity/Items.ts";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import EmptyView from "@/components/EmptyView.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";

const props = defineProps<{ id: string }>(),
    treasureMaps = computed(() =>
        Object.values(TreasureMaps)
            .filter((i: Item) => {
              if (typeof i.obtainable == 'object')
                return (i.obtainable as any).indexOf(props.id) >= 0
              else if (typeof i.obtainable == 'string')
                return i.obtainable == props.id
            }) || []
    )

/**
 * 获取地点去重掉落地区
 */
const getTreasureMapSetObtainables = () => {
  let d = treasureMaps.value
  const allLocation = new Set<string>();

  d.forEach(i => {
    if (i.obtainable && Array.isArray(i.obtainable)) {
      i.obtainable.forEach(location => {
        if (location && typeof location === 'string') {
          allLocation.add(location);
        }
      });
    }
  });

  return [...allLocation].sort()
}

defineExpose({
  treasureMaps,
  getObtainables: getTreasureMapSetObtainables
})
</script>

<template>
  <HorizontalScrollList btn-size="30" :is-indicator="false" v-if="treasureMaps && treasureMaps.length > 0">
    <div class="d-inline-flex ga-4">
      <template v-for="(i, index) in treasureMaps" :key="index">
        <v-card class="bg-transparent" width="100%" variant="text" :class="{'ml-5': index == 0, 'mr-5': index == treasureMaps.length - 1}">
          <ItemSlotBase size="120px" :padding="0">
            <TreasureMapIconWidget :id="i.id"></TreasureMapIconWidget>
          </ItemSlotBase>
        </v-card>
      </template>
    </div>

  </HorizontalScrollList>
  <EmptyView v-else></EmptyView>
</template>

<style scoped lang="less">

</style>
