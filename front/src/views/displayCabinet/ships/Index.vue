<script setup lang="ts">
import {Materials, Ships} from "glow-prow-data";
import {Ship} from "glow-prow-data/src/entity/Ships.ts";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";

const shipsData: Ship[] = Ships,
    materialsData: any = Materials,
    {t} = useI18n()

let shipsCardData = ref({
      images: {},
      model: {},
      panel: {}
    }),
    shipsFilter = ref({
      type: 'index',
      key: ''
    });

onMounted(() => {
  onReady()
})

const shipImages = import.meta.glob('@glow-prow-assets/ships/*.png', {eager: true});

const onReady = async () => {
  for (let key in Ships) {
    const imageKey = `/node_modules/glow-prow-assets/ships/${key}.png`;

    shipsCardData.value.panel[key] = 0;
    shipsCardData.value.model[key] = false;

    if (shipImages[imageKey]) {
      shipsCardData.value.images[key] = shipImages[imageKey].default;
    } else {
      shipsCardData.value.images[key] = '';
    }
  }
}


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
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{t('portal.title')}}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{t('displayCabinet.title')}}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.ships.title')}}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container class="mb-10">
    <v-row>
      <v-col cols="12" lg="5" xl="5">
        <h1 class="btn-flavor ships-title">船只</h1>
        <div class="w-75">
          <p>"自新大陆开拓以来，每一艘传奇战舰都在此留下印记。钢铁与风帆的交响诗，等待您的检阅。"</p>
        </div>
      </v-col>
      <v-col cols="12" lg="7" xl="7">
        <v-row>
          <v-spacer></v-spacer>
          <v-col>
            <v-text-field placeholder="搜索" hide-details variant="underlined" density="comfortable" v-model="shipsFilter.key"></v-text-field>
          </v-col>
          <v-col>
            <v-combobox density="comfortable" hide-details
                        variant="underlined"
                        v-model="shipsFilter.type" :items="['time', 'index']"></v-combobox>
          </v-col>
        </v-row>

        <v-row class="ships-list ga-2">
          <ItemSlotBase size="150px" v-for="(i,index) in onProcessedData()" :key="index">
            <ShipIconWidget :id="i.id" class="pa-2"></ShipIconWidget>
          </ItemSlotBase>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.ships-title {
  padding: 25px 40px;
  margin-bottom: 20px;
  font-size: 3rem;
}

.ships-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

</style>
