<script setup lang="ts">
import {Ships} from "glow-prow-data";
import {Ship} from "glow-prow-data/src/entity/Ships.ts";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";

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
  <v-breadcrumbs>
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.ships.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container class="mb-10 pa-10">
    <v-row class="ships-list ga-4">
      <ItemSlotBase size="99px" v-for="(i,index) in onProcessedData()" :key="index">
        <ShipIconWidget :id="i.id" class="pa-2"></ShipIconWidget>
      </ItemSlotBase>
    </v-row>
  </v-container>
</template>

<style scoped lang="less">
.ships-title {
  padding: 25px 40px;
  margin-bottom: 20px;
  font-size: 3rem;
  max-width: 100% !important;
}

.ships-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(99px, 1fr));
}
</style>
