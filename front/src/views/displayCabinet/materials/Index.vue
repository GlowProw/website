<script lang="ts" setup>

import {useI18n} from "vue-i18n";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {Materials} from "glow-prow-data";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import MaterialNameRarity from "@/components/snbWidget/materialNameRarity.vue";

const {t} = useI18n(),
    materials = Materials
</script>

<template>
  <v-container class="pa-5">
    <v-row class="material-list ga-4">
      <template v-for="(i, index) in materials" :key="index">
        <v-card variant="text" width="99" class="bg-transparent">
          <ItemSlotBase size="99px" class="d-flex justify-center align-center">
            <MaterialIconWidget :id="i.id" size="60"></MaterialIconWidget>
          </ItemSlotBase>
          <div class="mt-1 w-100 singe-line text-center">
            <MaterialNameRarity :id="i.id">
              <MaterialName :id="i.id" class="text-center"></MaterialName>
            </MaterialNameRarity>
          </div>
        </v-card>
      </template>
    </v-row>
  </v-container>
</template>

<style lang="less" scoped>
.material-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(99px, 1fr));
}
</style>
