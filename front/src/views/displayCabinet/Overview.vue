<script setup lang="ts">
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";

import {onMounted, Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {storage} from "@/assets/sripts";

import {Cosmetic, Cosmetics, Item, Items, Material, Materials, Modification, Modifications, Ship, Ships, Ultimate, Ultimates} from "glow-prow-data";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import {useDisplay} from "vuetify/framework";
import Sidebar from "@/views/displayCabinet/Sidebar.vue";

const
    {t} = useI18n(),
    {mobile} = useDisplay()

let items = Items,
    ships = Ships,
    ultimates = Ultimates,
    mods = Modifications,
    materials = Materials,
    cosmetics = Cosmetics,
    itemsRandomList: Ref<Item[]> = ref([]),
    shipsRandomList: Ref<Ship[]> = ref([]),
    ultimatesRandomList: Ref<Ultimate[]> = ref([]),
    modsRandomList: Ref<Modification[]> = ref([]),
    cosmeticsRandomList: Ref<Cosmetic[]> = ref([]),
    materialRandomList: Ref<Material[]> = ref([]),
    displayCabinetHistorys = ref([])

onMounted(() => {
  getItems()
  getShips()
  getUltimates()
  getMods()
  getCosmetics()
  getMaterials()
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
 * 获取模组
 */
const getMods = () => {
  modsRandomList.value = getRandom(mods, 10) as Modification[]
}

/**
 * 获取装饰
 */
const getCosmetics = () => {
  cosmeticsRandomList.value = getRandom(cosmetics, 50) as Cosmetic[]
}

/**
 * 获取材料
 */
const getMaterials = () => {
  materialRandomList.value = getRandom(materials, 50) as Material[]
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
  <v-breadcrumbs>
    <v-container class="pa-0">
      <v-breadcrumbs-item>{{ t('home.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <div class="mb-10 px-10 py-5 overview">
    <v-row class="fill-height">
      <div class="w-100 mb-5" v-if="displayCabinetHistorys.length > 0">
        <v-toolbar class="title-long-flavor bg-black mb-5">
          <div class="ml-10 font-weight-bold text-amber">
            {{ t('displayCabinet.cabinetHistoryTitle') }}
            ({{ displayCabinetHistorys.length || 0 }})
          </div>
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

      <div class="w-100">
        <v-toolbar class="title-long-flavor bg-black mb-5">
          <router-link to="/display-cabinet/mods" class="ml-10 font-weight-bold text-amber">
            {{ t('displayCabinet.modifications.title') }}
            ({{ Object.keys(mods).length || 0 }})
          </router-link>
          <v-spacer></v-spacer>
          <v-btn @click="getMods" class="mr-2" icon density="compact">
            <v-icon icon="mdi-dice-4-outline"></v-icon>
          </v-btn>
          <router-link class="mr-10" to="/display-cabinet/mods">
            {{ t('displayCabinet.more') }}
          </router-link>
        </v-toolbar>
        <v-row>
          <v-col cols="auto" v-for="(i, index) in modsRandomList" :key="index">
            <ItemSlotBase size="90px">
              <ModIconWidget :id="i.id"></ModIconWidget>
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
            <v-card variant="text" width="90">
              <ItemSlotBase size="90px">
                <ItemIconWidget :id="i.id"></ItemIconWidget>
              </ItemSlotBase>
              <div class="d-flex justify-center mx-auto mt-1 w-100 singe-line">
                <ItemName :id="i.id" class="text-center"></ItemName>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <div class="mt-10">
        <v-toolbar class="title-long-flavor bg-black mb-5">
          <router-link to="/display-cabinet/cosmetics" class="ml-10 font-weight-bold text-amber">
            {{ t('displayCabinet.cosmetics.title') }}
            ({{ Object.keys(cosmetics).length || 0 }})
          </router-link>
          <v-spacer></v-spacer>
          <v-btn @click="getCosmetics" class="mr-2" icon density="compact">
            <v-icon icon="mdi-dice-4-outline"></v-icon>
          </v-btn>
          <router-link class="mr-10" to="/display-cabinet/cosmetics">
            {{ t('displayCabinet.more') }}
          </router-link>
        </v-toolbar>
        <v-row>
          <v-col cols="auto" v-for="(i, index) in cosmeticsRandomList" :key="index">
            <v-card variant="text" width="90">
              <ItemSlotBase size="90px">
                <CosmeticIconWidget :id="i.id"></CosmeticIconWidget>
              </ItemSlotBase>
              <div class="d-flex justify-center mx-auto mt-1 w-100 singe-line">
                <CosmeticName :id="i.id" class="text-center"></CosmeticName>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <div class="mt-10">
        <v-toolbar class="title-long-flavor bg-black mb-5">
          <router-link to="/display-cabinet/materials" class="ml-10 font-weight-bold text-amber">
            {{ t('displayCabinet.materials.title') }}
            ({{ Object.keys(materials).length || 0 }})
          </router-link>
          <v-spacer></v-spacer>
          <v-btn @click="getMaterials" class="mr-2" icon density="compact">
            <v-icon icon="mdi-dice-4-outline"></v-icon>
          </v-btn>
          <router-link class="mr-10" to="/display-cabinet/materials">
            {{ t('displayCabinet.more') }}
          </router-link>
        </v-toolbar>
        <v-row>
          <v-col cols="auto" v-for="(i, index) in materialRandomList" :key="index">
            <v-card variant="text" width="90">
              <ItemSlotBase size="90px" class="d-flex justify-center align-center">
                <MaterialIconWidget :id="i.id"></MaterialIconWidget>
              </ItemSlotBase>
              <div class="d-flex justify-center mx-auto mt-1 w-100 singe-line">
                <MaterialName :id="i.id" class="text-center"></MaterialName>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-row>
  </div>
</template>

<style scoped lang="less">
.overview {
}
</style>
