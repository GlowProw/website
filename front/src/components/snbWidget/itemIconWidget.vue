<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import Loading from "../Loading.vue";
import LightRays from "../LightRays.vue"
import {onMounted, type Ref, ref, watch} from "vue";
import {Item, Items} from "glow-prow-data/src/entity/Items.ts";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useIntersectionObserver} from "@/assets/sripts/intersection_observer";
import {number, rarity} from "@/assets/sripts/index";
import {useAssetsStore} from "~/stores/assetsStore";
import ItemName from "@/components/snbWidget/itemName.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";

const
    {asString, sanitizeString} = useI18nUtils(),
    route = useRoute(),
    router = useRouter(),
    {t} = useI18n(),
    {items: itemsAssets, raritys: raritysAssets} = useAssetsStore(),
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
      margin: 1
    }),
    items: Items = Items

let itemsCardData = ref({
      icon: '',
    }),
    i: Ref<Item | null> = ref(null),

    // 稀有度
    rarityColorConfig = rarity.color


watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = items[props.id] || null

  if (itemsAssets[props.id])
    itemsCardData.value.icon = itemsAssets[props.id] || ''
  else {
    itemsCardData.value.icon = `https://skullandbonestools.de/api/imagesservice?src=items%2F${props.id}&width=128`
  }
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
      class="item-card"
      content-class="pa-0"
      target="cursor">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          ref="targetElement"
          width="100%"
          v-bind="activatorProps"
          :color="`hsl(from ${rarityColorConfig[i?.rarity]} h s calc(l * .15))`"
          :to="isOpenDetail ? `/display-cabinet/item/${i?.id}` : null"
          :class="[
              'prohibit-drag',
              `ma-${props.margin}`,
              `pa-${props.padding}`,
              `item-card-header-rarity-${i.rarity}`
          ]">
        <template v-slot:image v-if="i.rarity">
          <v-img :src="raritysAssets[`item-rarity-${i.rarity}`]" width="100%" height="100%" class="opacity-30 prohibit-drag"/>
        </template>

        <div>
          <v-img
              class="prohibit-drag"
              :src="itemsCardData.icon" cover width="100%" height="100%">
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
        </div>
      </v-card>
    </template>
    <v-card class="demo-reel bg-black" flat border>
      <div class="demo-reel-header pa-10 position-relative"
           :style="`background-color: color-mix(in srgb, hsl(from ${rarityColorConfig[ items[i.id]?.rarity || '' ]} h s l) 10%, #000)`">
        <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

        <h1 class="item-card-name font-weight-bold w-66">
          <ItemSlotBase size="28px" class="mb-2" :padding="0" v-if="i.faction">
            <FactionIconWidget class="bg-red d-inline-flex" :name="i.faction.id" v-if="i.faction"></FactionIconWidget>
          </ItemSlotBase>
          <ItemNameRarity :id="i.id">
            <ItemName :data="i"></ItemName>
          </ItemNameRarity>
        </h1>
        <p class="mb-1 mt-2">{{ i.id }}</p>

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
          <v-img :src="itemsCardData.icon" class="item-mirror-image"></v-img>
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
      <div class="demo-reel-content pl-10 pr-10 background-flavor overflow-auto">
        <BtnWidget @action-complete="router.push(`/display-cabinet/item/${i.id}`)"
                   class="mt-1"
                   v-if="isShowOpenDetail">
          {{ t('displayCabinet.item.lookDetail') }}
        </BtnWidget>
      </div>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">
.item-card {
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 200;
    border-radius: inherit;
  }

  .item-mirror-image {
    transform: scaleX(-1);
  }

  .item-card-name {
    line-height: 1.2 !important;
  }
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
    min-height: 200px;
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
