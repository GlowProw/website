<script setup lang="ts">
import {TreasureMaps} from "glow-prow-data";
import {computed} from "vue";
import {Item} from "glow-prow-data/src/entity/Items.ts";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import EmptyView from "@/components/EmptyView.vue";

const props = defineProps<{ id: string }>(),
    treasureMaps = computed(() =>
        Object.values(TreasureMaps)
            .filter((i: Item) => i.obtainable.indexOf(props.id) >= 0) || []
    )
</script>

<template>
  <div class="d-inline-flex ga-4" v-if="treasureMaps && treasureMaps.length > 0">
    <template v-for="(i, index) in treasureMaps" :key="index">
      <v-card class="bg-transparent" width="100%">
        <ItemSlotBase size="120px" :padding="0">
          <TreasureMapIconWidget :id="i.id"></TreasureMapIconWidget>
        </ItemSlotBase>
      </v-card>
    </template>
  </div>
  <EmptyView v-else></EmptyView>
</template>

<style scoped lang="less">

</style>
