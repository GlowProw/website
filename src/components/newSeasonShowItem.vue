<script setup lang="ts">

import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import NpcIconWidget from "@/components/snbWidget/npcIconWidget.vue";
import MapLocationIconWidget from "@/components/snbWidget/mapLocationIconWidget.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";

import {Items, Seasons, Ships} from "glow-prow-data";
import {computed} from "vue";
import {Season} from "glow-prow-data/src/entity/Seasons";
import ItemName from "@/components/snbWidget/itemName.vue";

const
    seasons = Seasons,
    all = []
    .concat(Object.values(Items))
    .concat(Object.values(Ships))

let newSeasonItem = computed(() => all.filter((i: any) => {
  return i.bySeason?.id == getCurrentSeason()?.id
}))

/**
 * 获取当前赛季
 * @returns {Season | null} 当前赛季，如果不在任何赛季范围内则返回 null
 */
const getCurrentSeason = (): Season | null => {
  const currentDate = new Date()
  const currentTime = currentDate.getTime()

  for (const seasonId in seasons) {
    const season = seasons[seasonId];

    const startDate = new Date(season.startDate).getTime()
    const endDate = new Date(season.endDate).getTime()

    if (currentTime >= startDate && currentTime <= endDate) {
      return season;
    }
  }

  return null;
}
</script>

<template>
  <v-row no-gutters>
    <v-col cols="auto" v-for="(i,index) in newSeasonItem" :key="index" class="d-flex align-center mr-3">
      <ItemSlotBase size="50px" :padding="0" class="bg-transparent">
        <ShipIconWidget :id="i.id" v-if="i._typeStringName == 'Ship'"></ShipIconWidget>
        <ItemIconWidget :id="i.id" v-if="i._typeStringName == 'Item'"></ItemIconWidget>
        <CommoditieIconWidget :id="i.id" v-if="i._typeStringName == 'Commoditie'"></CommoditieIconWidget>
        <UltimateIconWidget :id="i.id" v-if="i._typeStringName == 'Ultimate'"></UltimateIconWidget>
        <MaterialIconWidget :id="i.id" v-if="i._typeStringName == 'Material'"></MaterialIconWidget>
        <MapLocationIconWidget :id="i.id" v-if="i._typeStringName == 'MapLocation'"></MapLocationIconWidget>
        <TreasureMapIconWidget :id="i.id" v-if="i._typeStringName == 'TreasureMap'"></TreasureMapIconWidget>
        <CosmeticIconWidget :id="i.id" v-if="i._typeStringName == 'Cosmetic'"></CosmeticIconWidget>
        <ModIconWidget :id="i.id" v-if="i._typeStringName == 'Mod'"></ModIconWidget>
        <NpcIconWidget :id="i.id" v-if="i._typeStringName == 'Npc'"></NpcIconWidget>
      </ItemSlotBase>

      <ItemName :id="i.id"></ItemName>
    </v-col>
  </v-row>
</template>

<style scoped lang="less">

</style>
