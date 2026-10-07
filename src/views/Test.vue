<script setup lang="ts">
import {ref} from "vue";
import {CoreCalc} from "@/assets/sripts/item_carc";
import {Items, Ships} from "glow-prow-data";
import ModSlotWidget from "@/widgets/modSlot/Index.vue";
import CombatEffectWidget from "@/widgets/combatEffect/Index.vue";
import InfamyWidget from "@/widgets/infamy/Index.vue";

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
    <!-- 恶名系统与魁首巅峰里程碑 -->
    <InfamyWidget class="mb-10"/>

    <!-- 战斗机制：伤害类型、状态效果与赛季附加效果 -->
    <CombatEffectWidget class="mb-10"/>

    <!-- 装备词条插槽/精通说明部件 -->
    <ModSlotWidget/>
  </v-container>
</template>
