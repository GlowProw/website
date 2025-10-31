<script setup lang="ts">
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {useI18n} from "vue-i18n";
import {Ultimates} from "glow-prow-data/src/entity/Ultimates";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";

const ultimatesData = Ultimates,
    {t} = useI18n()
</script>

<template>
  <v-container class="pa-5">
    <v-row class="ultimates-list ga-4">
      <template v-for="(i,index) in ultimatesData" :key="index">
        <v-card width="99" class="bg-transparent">
          <ItemSlotBase size="99px">
            <UltimateIconWidget :id="i.id" class="pa-2"></UltimateIconWidget>
          </ItemSlotBase>
          <div class="d-flex justify-center mx-auto mt-1 w-100 singe-line">
            <UltimateName :id="i.id"></UltimateName>
          </div>
        </v-card>
      </template>
    </v-row>
  </v-container>
</template>

<style scoped>
.ultimates-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(99px, 1fr));
}

</style>
