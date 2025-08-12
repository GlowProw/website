<script setup lang="ts">
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import Loading from "../Loading.vue";
import LightRays from "../LightRays.vue"
import {onMounted, type Ref, ref, watch} from "vue";
import {Item, Items} from "glow-prow-data/src/entity/Items.ts";
import {useI18nUtils} from "@/assets/sripts/i18nUtil";
import {useIntersectionObserver} from "@/assets/sripts/intersectionObserver";
import {number} from "@/assets/sripts/index";
import {useItemAssetsStore} from "~/stores/itemAssetsStore";
import ItemName from "@/components/snbWidget/itemName.vue";

const
    {asString, sanitizeString} = useI18nUtils(),
    route = useRoute(),
    {t} = useI18n(),
    {assets, raritys} = useItemAssetsStore(),
    props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      id: 'culverin1',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isShowTooltip: true,
      padding: 0,
      margin: 1,
    }),
    items: Items = Items

let itemsCardData = ref({
      iconSrc: null,
    }),
    i: Ref<Item> = ref(Item.fromRawData({})),

    // 稀有度
    rarityColorConfig = {
      "": "#fff",
      "common": "#b0b0b0",
      "uncommon": "#2ecc71",
      "rare": "#3498db",
      "epic": "#9b59b6",
      "legendary": "#f1c40f"
    }


watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = items[props.id] || null
  itemsCardData.value.iconSrc = assets[props.id]
}

const {targetElement, isVisible} = useIntersectionObserver({
  threshold: .7,
});
</script>

<template>
  <v-tooltip
      v-if="i && i.id"
      :disabled="!props.isShowTooltip"
      :offset="[40, 0]"
      location="right top"
      min-width="450"
      max-width="450"
      interactive
      content-class="pa-0"
      target="cursor">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          ref="targetElement"
          width="100%"
          v-bind="activatorProps"
          :to="isOpenDetail ? `/display-cabinet/item/${i.id}` : null"
          :class="[
              `ma-${props.margin}`,
              `pa-${props.padding}`,
              `item-card-header-rarity-${i.rarity}`
          ]">
        <template v-slot:image v-if="i.rarity">
          <img :src="raritys[`item-rarity-${i.rarity}`]" width="100%" height="100%" class="opacity-30 prohibit-drag">
        </template>

        <v-img
            class="prohibit-drag"
            :src="itemsCardData.iconSrc || 'none'" cover width="100%" height="100%">
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
          <ItemName :data="i"></ItemName>
        </h1>
        <p class="mb-1">{{ i.id }}</p>

        <div class="d-flex ga-2 mt-3">
          <v-chip inline
                  :to="`/display-cabinet/item/category/${i.type}`"
                  class="badge-flavor text-center text-black" v-if="i.type">{{ t(`displayCabinet.type.${i.type}`) }}
          </v-chip>
          <v-chip class="badge-flavor text-center tag-badge text-black"
                  :to="`/display-cabinet/item/tier/${i.tier}`"
                  v-if="i.tier">{{ t(`displayCabinet.tier`, {num: number.intToRoman(i.tier)}) }}
          </v-chip>
          <v-chip class="badge-flavor text-center tag-badge text-black"
                  :to="`/display-cabinet/item/rarity/${i.rarity}`"
                  v-if="i.rarity">{{ t(`displayCabinet.rarity.${i.rarity}`) }}
          </v-chip>
        </div>
        <div class="right-show-item-image pointer-events-none position-absolute w-33">
          <v-img :src="itemsCardData.iconSrc" class="item-mirror-image"></v-img>
        </div>

        <template v-if="i.rarity">
          <LightRays
              id="iconBackRight"
              ref="iconBackRight"
              rays-origin="top-right"
              quality="low"
              :rays-color="rarityColorConfig[i.rarity]"
              :rays-speed="2"
              :light-spread="10"
              :ray-length="10"
              :follow-mouse="false"
              :mouse-influence="0"
              :noise-amount="0"
              :distortion="0"
              class="w-100 h-100 pointer-events-none position-absolute top-0 right-0"
          />
        </template>
      </div>
      <div class="demo-reel-content pl-10 pr-10 pb-5 background-flavor overflow-auto">
        <template v-if="route.query.debug">
          {{ i }}
        </template>

        <v-btn :to="`/display-cabinet/item/${i.id}`" target="_blank" class="mt-4" density="comfortable" v-if="isShowOpenDetail">
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
