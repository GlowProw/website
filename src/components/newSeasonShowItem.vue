<script setup lang="ts">

import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import NpcIconWidget from "@/components/snbWidget/npcIconWidget.vue";
import MapLocationIconWidget from "@/components/snbWidget/mapLocationIconWidget.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";

import {Items, Ships} from "glow-prow-data";
import {computed} from "vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import {useI18n} from "vue-i18n";
import {useAppStore} from "~/stores/appStore";
import ShipName from "@/components/snbWidget/shipName.vue";
import {getCurrentSeason} from "@/assets/sripts";

const
    appStore = useAppStore(),
    items = Object.values(Items),
    ships = Object.values(Ships),
    all = []
        .concat(items)
        .concat(ships),
    {t} = useI18n()

const getIconSize = computed({
  get: () => appStore.iconSize,
  set: (value) => appStore.setIconSize(value)
})

const onFilterCurrentSeason = (d: any[]) => {
  const current = getCurrentSeason()
  return d.filter((i: any) => {
    return i.bySeason?.id == current?.id
  })
}

let newSeasonItem: any = computed(() => onFilterCurrentSeason(all)),
    tShips = computed(() => onFilterCurrentSeason(ships)),
    tItems = computed(() => onFilterCurrentSeason(items))
</script>

<template>
  <v-chip-group>
    <v-chip
        class="badge-flavor text-center tag-badge text-black"
        :to="`/codex/items?season=${getCurrentSeason()?.id}`">
      {{ t(`codex.items.title`) }} {{ tItems.length || 0 }}
    </v-chip>
    <v-chip
        class="badge-flavor text-center tag-badge text-black"
        :to="`/codex/ships?season=${getCurrentSeason()?.id}`">
      {{ t(`codex.ships.title`) }} {{ tShips.length || 0 }}
    </v-chip>
  </v-chip-group>
  <v-row no-gutters>
    <v-col cols="auto" v-for="(i,index) in newSeasonItem" :key="index" class="d-flex align-center">
      <ItemSlotBase :size="`${Math.min(Math.max(getIconSize.size, 50), 60)}px`" :padding="0" :margin="0" class="bg-transparent">
        <ShipIconWidget :id="i.id" v-if="i._typeStringName == 'Ship'"></ShipIconWidget>
        <ItemIconWidget :id="i.id" v-if="i._typeStringName == 'Item'"></ItemIconWidget>
        <CommoditieIconWidget :id="i.id" v-if="i._typeStringName == 'Commoditie'"></CommoditieIconWidget>
        <UltimateIconWidget :id="i.id" v-if="i._typeStringName == 'Ultimate'"></UltimateIconWidget>
        <MaterialIconWidget :id="i.id" v-if="i._typeStringName == 'Material'"></MaterialIconWidget>
        <MapLocationIconWidget :id="i.id" v-if="i._typeStringName == 'MapLocation'"></MapLocationIconWidget>
        <TreasureMapIconWidget :id="i.id" v-if="i._typeStringName == 'TreasureMap'"></TreasureMapIconWidget>
        <CosmeticIconWidget :id="i.id" v-if="i._typeStringName == 'Cosmetic'"></CosmeticIconWidget>
        <NpcIconWidget :id="i.id" v-if="i._typeStringName == 'Npc'"></NpcIconWidget>
      </ItemSlotBase>

      <ItemName :id="i.id" v-if="i._typeStringName == 'Item'"></ItemName>
      <ShipName :id="i.id" v-if="i._typeStringName == 'Ship'"></ShipName>
    </v-col>
  </v-row>
</template>

<style scoped lang="less">

</style>
