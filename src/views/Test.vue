<script setup lang="ts">
import {ref} from "vue";
import {CoreCalc} from "@/assets/sripts/item_carc";
import {Items, Ships} from "glow-prow-data";
import RhombusWidget from "@/components/snbWidget/rhombusWidget.vue";

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
    <v-card width="800px" variant="text" border class="py-16 px-5 background-flavor">
      <v-row class="d-flex align-start my-10">
        <v-col cols="4" class="text-center">
          <RhombusWidget inactiveColor="rgb(255 255 255 / 40%)" border :size="50"/>
          <div class=" mt-1">
            <p class="">空</p>
            <p class="text-caption opacity-60">插槽没有词条</p>
          </div>
        </v-col>
        <v-col cols="4" class="text-center">
          <RhombusWidget inactiveColor="rgb(255 255 255 / 40%)" border slot-activate :size="50"/>
          <div class=" mt-1">
            <p>普通词条</p>
            <p class="text-caption opacity-60">自行开孔，普通数值词条</p>
          </div>
        </v-col>
        <v-col cols="4" class="text-center">
          <RhombusWidget inactiveColor="rgb(255 255 255 / 40%)" border slot-activate glow :size="50"/>
          <div class=" mt-1">
            <p>普通词条(满级)</p>
            <p class="text-caption opacity-60">自挖孔位，词条数值达到最大值</p>
          </div>
        </v-col>

        <v-col cols="4" class="text-center">
          <RhombusWidget border border-activate slot-activate :size="50"/>
          <div class=" mt-1">
            <p>金色词条(先天)</p>
            <p class="text-caption opacity-60">先天词条，词条比"普通词条"上限提高0.5%～3%，个别更高</p>
          </div>
        </v-col>
        <v-col cols="4" class="text-center">
          <RhombusWidget border border-activate slot-activate glow :size="50"/>
          <div class=" mt-1">
            <p>金色词条(满级)</p>
            <p class="text-caption opacity-60">词条数值金色，数值极限</p>
          </div>
        </v-col>

        <v-col cols="4" class="text-center">
          <RhombusWidget border border-activate slot-activate adept-activate :size="50"/>
          <div class=" mt-1">
            <p>金色精通词条</p>
            <p class="text-caption opacity-60">比"金色词条"上限更高，词条变成'精通xx'词条，上限提升非常多，比原先多出25%以上</p>
          </div>
        </v-col>
        <v-col cols="4" class="text-center">
          <RhombusWidget border border-activate slot-activate glow adept-activate :size="50"/>
          <div class=" mt-1">
            <p>金色精通词条(满级)</p>
            <p class="text-caption opacity-60">词条金色，数值满级</p>
          </div>
        </v-col>
      </v-row>
<!--
      <h2 class="mt-10 mb-6 text-center">先天于后天区别</h2>
      <v-row class="d-flex align-start my-3">
        <v-col cols="4" class="text-center">
          <RhombusWidget border border-activate slot-activate glow :size="50"/>
          <div class=" mt-1">
            <p class="text-caption opacity-60">武器掉落时，此词条成色就是金色，并且数值逼近极限, 一个卡槽数值高普通金色2%～3%</p>
          </div>
        </v-col>

        <v-col cols="4" class="text-center">
          <RhombusWidget border border-activate slot-activate glow adept-activate :size="50"/>
          <div class=" mt-1">
            <p class="text-caption opacity-60">出自深夜自带的词条，比普通金色词条逼近数值极限，词条变成'精通xx'词条</p>
          </div>
        </v-col>
      </v-row> -->
    </v-card>
  </v-container>
</template>
