<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {MapLocations} from "glow-prow-data";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import MapLocationIconWidget from "@/components/snbWidget/mapLocationIconWidget.vue";
import MapLocationNameWidget from "@/components/snbWidget/mapLocationNameWidget.vue";

const {t} = useI18n(),
    mapLocations: MapLocations = MapLocations
</script>

<template>
  <v-container class="pa-5">
    <v-row class="treasure-map-list ga-4">
      <template v-for="(i, index) in mapLocations" :key="index">
        <v-card variant="text" width="99">
          <ItemSlotBase size="99px">
            <MapLocationIconWidget :id="i.id"></MapLocationIconWidget>
          </ItemSlotBase>
          <div class="d-flex justify-center mx-auto mt-1 w-100 singe-line">
            <MapLocationNameWidget :id="i.id" class="text-center"></MapLocationNameWidget>
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
