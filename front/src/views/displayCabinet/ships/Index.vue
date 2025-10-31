<script setup lang="ts">
import {Ships} from "glow-prow-data";
import {Ship} from "glow-prow-data/src/entity/Ships.ts";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ShipName from "@/components/snbWidget/shipName.vue";

const shipsData: Ship[] = Ships,
    {t} = useI18n()

let shipsFilter = ref({
      type: 'index',
      key: ''
    });

/**
 * 处理数据
 */
const onProcessedData = () => {
  switch (shipsFilter.value.type) {
    case 'time':
      const sortedEntries = Object.entries(shipsData).sort((a, b) => a[1].dateAdded - b[1].dateAdded);
      return Object.fromEntries(sortedEntries);
    case 'index':
    default:
      return shipsData
  }
}
</script>

<template>
  <v-container class="pa-5">
    <v-row class="ships-list ga-4">
      <template v-for="(i,index) in onProcessedData()" :key="index">
        <v-card width="99" class="bg-transparent">
          <ItemSlotBase size="99px">
            <ShipIconWidget :id="i.id" class="pa-2"></ShipIconWidget>
          </ItemSlotBase>
          <div class="d-flex justify-center mx-auto mt-1 w-100 singe-line">
            <ShipName :id="i.id"></ShipName>
          </div>
        </v-card>
      </template>
    </v-row>
  </v-container>
</template>

<style scoped lang="less">
.ships-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(99px, 1fr));
}
</style>
