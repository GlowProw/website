<script setup lang="ts">
import {Items} from 'glow-prow-data/src/entity/Items'
import {Ships} from "glow-prow-data";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {Ship} from "glow-prow-data/src/entity/Ships.ts";
import {Item} from "glow-prow-data/src/entity/Items.ts";
import {onMounted, Ref, ref} from "vue";
import {storage} from "@/assets/sripts";
import {Ultimate, Ultimates} from "glow-prow-data/src/entity/Ultimates";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import {useI18n} from "vue-i18n";

let items = Items,
    ships = Ships,
    ultimates = Ultimates,
    itemsRandomList: Ref<Item[]> = ref([]),
    shipsRandomList: Ref<Ship[]> = ref([]),
    ultimatesRandomList: Ref<Ultimate[]> = ref([]),
    displayCabinetHistorys = ref([]),
    {t} = useI18n()

onMounted(() => {
  getItems()
  getShips()
  getUltimates()
  getDisplayCabinetHistory()
})

/**
 * 获取历史记录
 */
const getDisplayCabinetHistory = () => {
  let name = 'displayCabinet.history'

  const d = storage.session.get(name)

  if (d.code == 0)
    displayCabinetHistorys.value = Object.values(d.data.value);
}


/**
 * 清理历史
 */
const onCleaningHistory = () => {
  let name = 'displayCabinet.history'

  displayCabinetHistorys.value = []
  return storage.session.rem(name)
}

/**
 * 获取物品
 */
const getItems = () => {
  itemsRandomList.value = getRandom(items, 50) as Item[]
}

/**
 * 获取船
 */
const getShips = () => {
  shipsRandomList.value = getRandom(ships, 5) as Ship[]
}

/**
 * 获取终结技能
 */
const getUltimates = () => {
  ultimatesRandomList.value = getRandom(ultimates, 5) as Ultimate[]
}

/**
 * 随机范围
 * @param obj
 * @param count
 */
function getRandom(obj, count) {
  const keys = Object.values(obj);
  const shuffledKeys = [...keys].sort(() => 0.5 - Math.random());
  return shuffledKeys.slice(0, count);
}
</script>

<template>
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('home.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container class="mb-10 overview">
    <h1>{{t('displayCabinet.title')}}</h1>
    <p class="mb-10 opacity-80">{{ t('displayCabinet.ships.description') }}</p>

    <v-row class="fill-height">
      <div class="w-100 mb-5" v-if="displayCabinetHistorys.length > 0">
        <v-toolbar class="title-long-flavor bg-black mb-5">
          <router-link to="/display-cabinet/ships" class="ml-10 font-weight-bold text-amber">
            {{ t('displayCabinet.cabinetHistoryTitle') }}
            ({{ displayCabinetHistorys.length || 0 }})
          </router-link>
          <v-spacer></v-spacer>
          <v-col cols="auto" class="mr-4">
            <v-btn icon="mdi-delete" @click="onCleaningHistory" v-if="displayCabinetHistorys.length >= 0"></v-btn>
          </v-col>
        </v-toolbar>

        <v-row>
          <v-col cols="auto" v-for="(i,index) in displayCabinetHistorys" :key="index">
            <ItemSlotBase size="120px">
              <ItemIconWidget :id="i.id" v-if="i.type == 'item'"></ItemIconWidget>
              <ShipIconWidget :id="i.id" v-if="i.type == 'ship'"></ShipIconWidget>
              <UltimateIconWidget :id="i.id" v-if="i.type == 'ultimate'"></UltimateIconWidget>
            </ItemSlotBase>
          </v-col>
        </v-row>
      </div>

      <div class="w-100">
        <v-toolbar class="title-long-flavor bg-black mb-5">
          <router-link to="/display-cabinet/ships" class="ml-10 font-weight-bold text-amber">
            {{ t('displayCabinet.ships.title') }}
            ({{ Object.keys(ships).length || 0 }})
          </router-link>
          <v-spacer></v-spacer>
          <v-btn @click="getShips" class="mr-2" icon density="compact">
            <v-icon icon="mdi-dice-4-outline"></v-icon>
          </v-btn>
          <router-link class="mr-10" to="/display-cabinet/ships">
            {{ t('displayCabinet.more') }}
          </router-link>
        </v-toolbar>
        <v-row>
          <v-col cols="auto" v-for="(i, index) in shipsRandomList" :key="index">
            <ItemSlotBase size="120px">
              <ShipIconWidget :id="i.id"></ShipIconWidget>
            </ItemSlotBase>
          </v-col>
        </v-row>
      </div>
      <div class="w-100">
        <v-toolbar class="title-long-flavor bg-black mb-5">
          <router-link to="/display-cabinet/ultimates" class="ml-10 font-weight-bold text-amber">
            {{ t('displayCabinet.ultimates.title') }}
            ({{ Object.keys(ultimates).length || 0 }})
          </router-link>
          <v-spacer></v-spacer>
          <v-btn @click="getUltimates" class="mr-2" icon density="compact">
            <v-icon icon="mdi-dice-4-outline"></v-icon>
          </v-btn>
          <router-link class="mr-10" to="/display-cabinet/ultimates">
            {{ t('displayCabinet.more') }}
          </router-link>
        </v-toolbar>
        <v-row>
          <v-col cols="auto" v-for="(i, index) in ultimatesRandomList" :key="index">
            <ItemSlotBase size="120px">
              <UltimateIconWidget :id="i.id"></UltimateIconWidget>
            </ItemSlotBase>
          </v-col>
        </v-row>
      </div>
      <div class="mt-10">
        <v-toolbar class="title-long-flavor bg-black mb-5">
          <router-link to="/display-cabinet/items" class="ml-10 font-weight-bold text-amber">
            {{ t('displayCabinet.items.title') }}
            ({{ Object.keys(items).length || 0 }})
          </router-link>
          <v-spacer></v-spacer>
          <v-btn @click="getItems" class="mr-2" icon density="compact">
            <v-icon icon="mdi-dice-4-outline"></v-icon>
          </v-btn>
          <router-link class="mr-10" to="/display-cabinet/items">
            {{ t('displayCabinet.more') }}
          </router-link>
        </v-toolbar>
        <v-row>
          <v-col cols="auto" v-for="(i, index) in itemsRandomList" :key="index">
            <ItemSlotBase size="90px">
              <ItemIconWidget :id="i.id"></ItemIconWidget>
            </ItemSlotBase>
          </v-col>
        </v-row>
      </div>
    </v-row>

  </v-container>
</template>

<style scoped lang="less">
.overview {
}
</style>
