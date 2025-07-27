<script setup lang="ts">
import {Items} from 'glow-prow-data/src/entity/Items'
import {Ships} from "glow-prow-data";
import ItemIconWidget from "../../components/snbWidget/itemIconWidget.vue";
import ShipIconWidget from "../../components/snbWidget/shipIconWidget.vue";
import ItemSlotBase from "../../components/snbWidget/ItemSlotBase.vue";
import {Ship} from "glow-prow-data/src/entity/Ships.ts";
import {Item} from "glow-prow-data/src/entity/Items.ts";

let items = Items,
    ships = Ships

/**
 * 获取物品
 */
const getItemsList = (): Item[] => {
  return getRandomItems(items, 50) as Item[]
}

/**
 * 获取船
 */
const getShips = (): Ship[] => {
  return getRandomItems(ships, 5) as Ship[]
}

/**
 * 随机范围
 * @param obj
 * @param count
 */
function getRandomItems(obj, count) {
  const keys = Object.values(obj);
  const shuffledKeys = [...keys].sort(() => 0.5 - Math.random());
  return shuffledKeys.slice(0, count);
}
</script>

<template>
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">首页</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>展示柜</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container class="mb-10 overview">
    <h1>展示柜</h1>
    <p class="mb-10 opacity-80">嗨，船长, 要看看我的宝贝嘛</p>

    <v-row class="fill-height">
      <div class="w-100">
        <v-toolbar class="title-long-flavor bg-black mb-5">
          <div class="ml-10 font-weight-bold text-amber">船</div>
          <v-spacer></v-spacer>
          <router-link class="mr-10" to="/display-cabinet/ships">
            更多
          </router-link>
        </v-toolbar>
        <v-row>
          <v-col cols="auto" v-for="(i, index) in getShips()" :key="index">
            <ItemSlotBase size="120px">
              <ShipIconWidget :id="i.id"></ShipIconWidget>
            </ItemSlotBase>
          </v-col>
        </v-row>
      </div>
      <div class="mt-10">
        <v-toolbar class="title-long-flavor bg-black mb-5">
          <div class="ml-10 font-weight-bold text-amber">物品</div>
          <v-spacer></v-spacer>
          <router-link class="mr-10" to="/display-cabinet/items">
            更多
          </router-link>
        </v-toolbar>
        <v-row>
          <v-col cols="auto" v-for="(i, index) in getItemsList()" :key="index">
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
