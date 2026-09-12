<script setup lang="ts">
import {ref} from "vue";
import LongPressButton from "@/components/snbWidget/btnWidget.vue";
import WheelWidget from "@/components/WheelShowWidget.vue";
import WarehouseShowWidget from "@/components/WarehouseShowWidget.vue";
import TreasureMapImageSimilarity from "@/components/TreasureMapImageSimilarity.vue";
import TreasureMapImageSimilarityNew from "@/components/TreasureMapImageSimilarity.vue";
import CalcResultTable from "@/components/CalcResultTable.vue";
import { CoreCalc } from "@/assets/sripts/item_carc";
import { Ships, Items } from "glow-prow-data";

let value = ref('');
let result = ref(
  CoreCalc.create()
    .addShip(Ships.galleon)
    .addShipUpgrade(Items.galleonUpgrade7)
    .addArmor(Items.nocturneHeart)
    .addFurniture([
      Items.hullMarkersTable,
      Items.physiciansLedger,
      Items.ramrodWorkshop,
      Items.causticSpallStation,
      Items.devilsConcoction,
      Items.culverinWorks1,
    ])
    .addWeapon(Items.hellepoort, 'front')
    .addWeapon(Items.langeKartouwe, 'aft')
    .addWeapon(Items.hellepoort, 'left')
    .addWeapon(Items.hellepoort, 'right')
    .addAuxiliaryWeapon(Items.spiritcaller)
    .run()
);
</script>

<template>
  <v-container class="mt-10">
    <CalcResultTable :result="result"></CalcResultTable>
  </v-container>
</template>

<style scoped lang="less">

</style>
