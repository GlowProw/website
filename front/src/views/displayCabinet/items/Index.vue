<script setup lang="ts">

import ItemSlotBase from "../../../components/snbWidget/ItemSlotBase.vue";
import {computed, onMounted, ref} from "vue";
import {Items} from "glow-prow-data/src/entity/Items.ts";
import {useI18n} from "vue-i18n";
import Loading from "../../../components/Loading.vue";
import {useRoute} from "vue-router";
import ItemIconWidget from "../../../components/snbWidget/itemIconWidget.vue";
import EmptyView from "../../../components/EmptyView.vue";

const assets_ammunitions = import.meta.glob('@glow-prow-assets/items/ammunitions/*', {eager: true}),
    assets_weapons = import.meta.glob('@glow-prow-assets/items/weapons/*', {eager: true}),
    assets_armors = import.meta.glob('@glow-prow-assets/items/armors/*', {eager: true}),
    assets_majorFurnitures = import.meta.glob('@glow-prow-assets/items/majorFurnitures/*', {eager: true}),
    assets_offensiveFurnitures = import.meta.glob('@glow-prow-assets/items/offensiveFurnitures/*', {eager: true}),
    assets_utilityFurnitures = import.meta.glob('@glow-prow-assets/items/utilityFurnitures/*.*', {eager: true}),
    assets_consumables = import.meta.glob('@glow-prow-assets/items/consumables/*', {eager: true}),
    assets_torpedos = import.meta.glob('@glow-prow-assets/items/weapons/torpedos/*', {eager: true}),
    assets_longGuns = import.meta.glob('@glow-prow-assets/items/weapons/longGuns/*', {eager: true}),
    assets_tools = import.meta.glob('@glow-prow-assets/items/tools/*', {eager: true}),
    assets_shipsUpgrades = import.meta.glob('@glow-prow-assets/ships/upgrades/*', {eager: true}),
    assets_items = import.meta.glob('@glow-prow-assets/items/*', {eager: true});

const assetsImages = {
  ...assets_ammunitions, ...assets_weapons, ...assets_armors,
  ...assets_majorFurnitures, ...assets_utilityFurnitures, ...assets_offensiveFurnitures,
  ...assets_consumables, ...assets_torpedos, ...assets_longGuns,
  ...assets_tools, ...assets_shipsUpgrades, ...assets_items
};
const rarityImages = import.meta.glob('@/assets/images/item-rarity-*.png', {eager: true});
const items: Items = Items,
    route = useRoute(),
    {t} = useI18n()


let itemsCardData = ref({
      images: {},
      model: {},
      panel: {},
    }),
    itemsData: any = ref([]),
    raritys: string[] = ["common", "uncommon", "rare", "epic", "legendary"],
    itemsRarityImages = ref({}),
    itemsFilter = ref({
      type: 'index',
      keyValue: '',
      inputWidgetKeyValue: '',
      page: 1,
      limit: 50
    });

/**
 * 处理数据
 */
const onProcessedData = computed(() => {
      let originalData = Object.values(itemsData.value),
          resultData = [],
          searchValue = itemsFilter.value.keyValue

      if (!searchValue)
        return itemsData;

      if (searchValue)
        resultData = originalData
            .filter(i => i.id.indexOf(searchValue) >= 0 || t(`snb.items.${i.id}.name`).indexOf(searchValue) >= 0)
            .slice(0, 30)

      return resultData;
    }),
    isSearching = computed(() => itemsFilter.value.keyValue)

onMounted(() => {
  onReady()
  onFirstLoad()
})

const onReady = async () => {
  const imageMap = {};
  for (const path in assetsImages) {
    const key = path.split('/').pop()
        ?.toString()
        .replace('.webp', '')
        .replace('.png', '');
    imageMap[key] = assetsImages[path];
  }

  // 稀有度背景
  for (let key in raritys) {
    const imageKey = `/src/assets/images/item-rarity-${raritys[key]}.png`;

    if (rarityImages[imageKey]) {
      itemsRarityImages.value[raritys[key]] = rarityImages[imageKey].default;
    }
  }

  // 物品图
  for (let key in items) {
    itemsCardData.value.panel[key] = 0;
    itemsCardData.value.model[key] = false;

    if (imageMap[key]) {
      itemsCardData.value.images[key] = imageMap[key].default;
    } else {
      itemsCardData.value.images[key] = '';
    }
  }
}

const onFirstLoad = () => {
  const data = Object.values(items);
  itemsData.value.push(...data.slice(
      0,
      itemsFilter.value.limit
  ))
}

const onLoad = ({done}) => {
  const data = Object.values(items);
  const startIndex = (itemsFilter.value.page - 1) * itemsFilter.value.limit; // 修正起点
  const endIndex = startIndex + itemsFilter.value.limit;

  itemsData.value.push(...data.slice(startIndex, endIndex));
  itemsFilter.value.page++;

  if (itemsData.value.length >= data.length) {
    done('empty');
  } else {
    done('ok');
  }
}

/**
 * 检索
 */
const onSearchItem = () => {
  itemsFilter.value.keyValue = itemsFilter.value.inputWidgetKeyValue;
}

</script>

<template>
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">首页</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.items.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container>
    <v-row>
      <v-col cols="12" lg="6" xl="6">
        <h1 class="btn-flavor ships-title">{{ t('displayCabinet.items.title') }}</h1>
        <div class="w-75 mt-2">
          {{ t('displayCabinet.items.description') }}
        </div>
      </v-col>
      <v-col cols="12" lg="6" xl="6">
        <v-row>
          <v-col>
            <v-text-field placeholder="搜索" hide-details
                          variant="solo-filled"
                          density="comfortable"
                          clearable
                          @keydown.enter="onSearchItem"
                          v-model="itemsFilter.inputWidgetKeyValue">
              <template v-slot:append-inner>
                <v-btn @click="onSearchItem">搜索</v-btn>
              </template>
            </v-text-field>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>

  <template v-if="!isSearching">
    <v-infinite-scroll
        class="mb-10"
        :items="itemsData"
        @load="onLoad">
      <v-container>
        <v-row class="item-list">
          <div v-for="(i,index) in itemsData" :key="index">
            <template v-if="route.query.debug">
              {{ i.id }}
            </template>

            <ItemSlotBase size="99px">
              <ItemIconWidget :id="i.id"></ItemIconWidget>
            </ItemSlotBase>
          </div>
        </v-row>
      </v-container>
      <template v-slot:empty></template>
      <template v-slot:loading>
        <v-btn density="comfortable" icon>
          <Loading :size="42"></Loading>
        </v-btn>
      </template>
      <template v-slot:load-more="{ props }">
        <v-btn
            icon="mdi-refresh"
            size="small"
            variant="text"
            v-bind="props"
        ></v-btn>
      </template>
    </v-infinite-scroll>
  </template>
  <template v-else>
    <v-container>
      <v-row class="item-list">
        <div v-for="(i,index) in onProcessedData" :key="index">
          <template v-if="route.query.debug">
            {{ i.id }}
          </template>

          <ItemSlotBase size="99px">
            <ItemIconWidget :id="i.id"></ItemIconWidget>
          </ItemSlotBase>
        </div>

        <v-card border class="w-100" v-if="onProcessedData.length <= 0">
          <EmptyView></EmptyView>
        </v-card>
      </v-row>
    </v-container>
  </template>
</template>

<style scoped lang="less">
.item-list {
  > div {
    margin: 10px;
  }
}
</style>
