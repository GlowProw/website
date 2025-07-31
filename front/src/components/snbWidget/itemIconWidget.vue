<script setup lang="ts">

import Loading from "../Loading.vue";
import {onMounted, type Ref, ref, watch} from "vue";
import {Item, Items} from "glow-prow-data/src/entity/Items.ts";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18nUtil";

const {asArray, asString, sanitizeString} = useI18nUtils()

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
const props = withDefaults(defineProps<{
  id: string,
  isShowOpenDetail?: boolean,
  isOpenDetail?: boolean,
  padding?: number
}>(), {
  id: 'culverin1',
  isShowOpenDetail: true,
  isOpenDetail: true,
  padding: 1
})
const items: Items = Items,
    route = useRoute(),
    {t} = useI18n()

let itemsCardData = ref({
      iconsSrc: {},
      model: {},
      panel: {},
    }),
    i: Ref<Item> = ref(Item.fromRawData({})),

    // 稀有度
    raritys: string[] = ["common", "uncommon", "rare", "epic", "legendary"],
    itemsRarityImages = ref({})

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
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
      itemsCardData.value.iconsSrc[key] = imageMap[key].default;
    } else {
      itemsCardData.value.iconsSrc[key] = '';
    }
  }

  i.value = items[props.id] || null
}
</script>

<template>
  <v-tooltip
      v-if="i && i.id"
      min-width="450"
      max-width="450"
      interactive
      content-class="pa-0"
      target="cursor">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          width="100%"
          v-bind="activatorProps"
          :to="isOpenDetail ? `/display-cabinet/item/${i.id}` : null"
          :class="[
              `ma-${props.padding}`,
              `item-card-header-rarity-${i.rarity}`
          ]">
        <template v-slot:image v-if="i.rarity">
          <img :src="itemsRarityImages[i.rarity]" width="100%" height="100%" class="opacity-30">
        </template>

        <v-img
            :src="itemsCardData.iconsSrc[i.id] || 'none'" cover width="100%" height="100%">
          <template v-slot:error>
            <div class="fill-height repeating-gradient d-flex justify-center align-center h-100">
              <v-icon icon="mdi-help" class="opacity-30"></v-icon>
            </div>
          </template>
          <template v-slot:placeholder>
            <div class="d-flex justify-center align-center h-100">
              <Loading size="40"/>
            </div>
          </template>
        </v-img>
      </v-card>
    </template>
    <v-card class="demo-reel bg-black" flat border>
      <div class="demo-reel-header pa-10 position-relative" :class="[
                    `item-card-header-rarity-${i.rarity}`
                ]">
        <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

        <h1 class="font-weight-bold">
          {{
            asString([
              `snb.items.${i.id}.name`,
              `snb.items.${sanitizeString(i.id).cleaned}.name`
            ])
          }}
        </h1>
        <p class="mb-1">{{ i.id }}</p>

        <div class="d-flex ga-2 mt-3">
          <v-chip inline
                  :to="`/display-cabinet/item/category/${i.type}`"
                  class="badge-flavor text-center text-black" v-if="i.type">{{ t(`displayCabinet.type.${i.type}`) }}
          </v-chip>
          <v-chip inline class="badge-flavor text-center text-black" v-if="i.tier">{{ t(`displayCabinet.tier`, {num: i.tier || 0}) }}</v-chip>
        </div>
        <div class="right-show-item-image pointer-events-none position-absolute w-33">
          <v-img :src="itemsCardData.iconsSrc[i.id]" class="item-mirror-image"></v-img>
        </div>

        <template v-if="i.rarity">
          <img :src="itemsRarityImages[i.rarity]" width="100%" height="100%" class="pointer-events-none rarity opacity-20">
        </template>
      </div>
      <div class="demo-reel-content pl-10 pr-10 pb-5 background-flavor overflow-auto">
        <template v-if="route.query.debug">
          {{ i }}
        </template>

        <v-btn :to="`/display-cabinet/item/${i.id}`" class="mt-4" density="comfortable" v-if="isShowOpenDetail">
          <v-icon icon="mdi-help"></v-icon>
          详情
        </v-btn>
      </div>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">
@rarities: common, uncommon, rare, epic, legendary;

.item-mirror-image {
  transform: scaleX(-1);
}

.item-card-header-rarity {
  width: 100px;
  height: 100px;
  position: relative;

  each(@rarities, {
    &-@{value} {
      .set-rarity-color(@value);
    }
  });

  .set-rarity-color(@type) {
    & when (@type = common) {
      &::after {
        background-color: fade(#b0b0b0, 10%);
      }
    }
    & when (@type = uncommon) {
      &::after {
        background-color: fade(#2ecc71, 10%);
      }
    }
    & when (@type = rare) {
      &::after {
        background-color: fade(#3498db, 10%);
      }
    }
    & when (@type = epic) {
      &::after {
        background-color: fade(#9b59b6, 10%);
      }
    }
    & when (@type = legendary) {
      &::after {
        background-color: fade(#f1c40f, 10%);
      }
    }

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      border-radius: inherit;
    }
  }
}

.rarity {
  position: absolute;
  z-index: 0;
  top: 0;
  left: 0;
  width: 100%;
}

.demo-reel {
  .right-show-item-image {
    position: relative;
    z-index: 5;
    transform: scale(1.5);
    top: 20px;
    right: 0;
    bottom: 15px;
  }

  .item {
    pointer-events: none;
  }

  .tag-badge {
    color: hsl(from var(--main-color) h s calc(l * 0.3));
  }

  .demo-reel-header {
    height: 200px;
    overflow: hidden;

    &:before {
      content: "";
      position: absolute;
      z-index: 5;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 0;
      padding: 10% 0 0;
      background: url('@/assets/images/portal-banner-background.png') 50% 0 no-repeat;
      background-size: cover;
    }
  }

  .demo-reel-content {
    max-height: 70vh;
  }
}
</style>
