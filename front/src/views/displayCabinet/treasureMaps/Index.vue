<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {TreasureMaps} from "glow-prow-data";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import TreasureMapName from "@/components/snbWidget/treasureMapName.vue";

const {t} = useI18n(),
    treasureMaps = TreasureMaps
</script>

<template>
  <v-container class="pa-5">
    <v-row class="treasure-map-list ga-4">
      <template v-for="(i, index) in treasureMaps" :key="index">
        <v-card variant="text" width="99">
          <ItemSlotBase size="99px">
            <TreasureMapIconWidget :id="i.id"></TreasureMapIconWidget>
          </ItemSlotBase>
          <div class="d-flex justify-center mx-auto mt-1 w-100 singe-line">
            <TreasureMapName :id="i.id" class="text-center"></TreasureMapName>
          </div>
        </v-card>
      </template>
    </v-row>
  </v-container>
</template>

<style scoped lang="less">
.treasure-map-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(99px, 1fr));
}
</style>
