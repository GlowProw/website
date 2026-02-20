<script setup lang="ts">
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {Item, Items} from "glow-prow-data/src/entity/Items.ts";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {number, rarity} from "@/assets/sripts/index";
import {useAssetsStore} from "~/stores/assetsStore";

import Loading from "../Loading.vue";
import LightRays from "../LightRays.vue"
import ItemName from "@/components/snbWidget/itemName.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";
import ItemDamageTypeWidget from "@/components/snbWidget/itemDamageTypeWidget.vue";
import {useAppStore} from "~/stores/appStore";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import PerksWidget from "@/components/snbWidget/perksWidget.vue";
import DamageMitigationWidget from "@/components/snbWidget/damageMitigationWidget.vue";
import ObtainableWidget from "@/components/ObtainableWidget.vue";
import ItemDescription from "@/components/snbWidget/itemDescription.vue";
import ItemContentWidget from "@/components/snbWidget/itemContentWidget.vue";
import {Cosmetics} from "../../../../glow-prow-data";
import ShipUpgradedDescription from "@/components/snbWidget/ShipUpgradedDescription.vue";
import HtmlLink from "@/components/HtmlLink.vue";

const router = useRouter(),
    appStore = useAppStore(),
    {t} = useI18n(),
    {raritys: raritysAssets} = useAssetsStore(),
    cdnStore = useCDNAssetsServiceStore(),
    props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowDescription?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      id: 'culverin1',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowDescription: true,
      isShowTooltip: true,
      padding: 0,
      margin: 1
    }),
    items = Items,
    cosmetics = Cosmetics,

    // 稀有度
    rarityColorConfig = rarity.color

useI18nUtils();

let itemsCardData = ref({
      icon: '',
      model: false,
      panel: null
    }),
    i: Ref<Item | null> = ref(null),
    itemDescription: Ref<ItemDescription> = ref(null),
    itemContents: Ref<any[]> = ref([]),

    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    })


watch(() => props.id, () => {
  onReady()
})

watch(() => itemsCardData.value.model, (value) => {
  // 卡片打开时才加载掉落
  if (value && itemContents.value <= 0)
    itemContents.value = [
      ...filterByObtainable(Object.values(items), props.id),
      ...filterByObtainable(Object.values(cosmetics), props.id)
    ]
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = items[props.id] || null

  onSetIcon()
}

const filterByObtainable = (items: any[], targetId: string) => {
  return items.filter(item => {
    if (!item.obtainable) return false;

    const obtainable = item.obtainable;

    if (typeof obtainable === 'string') {
      return obtainable === targetId;
    }

    if (obtainable && typeof obtainable === 'object' && 'id' in obtainable) {
      return obtainable.id === targetId;
    }

    if (Array.isArray(obtainable)) {
      const flatArray = obtainable.flat()
      return flatArray.some(element => {
        if (typeof element === 'string') {
          return element === targetId;
        } else if (element && typeof element === 'object' && 'id' in element) {
          return element.id === targetId;
        }
        return false;
      })
    }

    return false;
  })
};

const onSetIcon = () => {
  itemsCardData.value.icon = cdnStore.currentService.url({
    id: props.id,
    category: 'items'
  })
}

watch(() => cdnStore.selectedService, (newValue, oldValue) => {
  if (newValue != oldValue)
    onSetIcon()
}, {immediate: true})
</script>

<template>
  <v-tooltip
      v-model="itemsCardData.model"
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
          width="100%"
          v-bind="activatorProps"
          :color="`hsl(from ${rarityColorConfig[i?.rarity]} h s calc(l * .15))`"
          :to="isOpenDetail ? `/codex/item/${i?.id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :class="[
              'prohibit-drag',
              `ma-${props.margin}`,
              `pa-${props.padding}`,
              `item-card-header-rarity-${i.rarity}`
          ]">
        <template v-slot:image v-if="i.rarity">
          <v-img :src="raritysAssets[`item-rarity-${i.rarity}`]" width="100%" height="100%" class="opacity-30 prohibit-drag"/>
        </template>

        <div class="d-flex align-center justify-center h-100">
          <v-img
              class="prohibit-drag"
              :src="itemsCardData.icon">
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

        <h1 class="material-card-name font-weight-bold w-66">
          <ItemSlotBase size="28px" class="mb-2" :padding="0" v-if="i.faction">
            <FactionIconWidget class="bg-red d-inline-flex" :name="i.faction.id" v-if="i.faction"></FactionIconWidget>
          </ItemSlotBase>
          <ItemNameRarity :id="i.id">
            <ItemName :data="i"></ItemName>
          </ItemNameRarity>
        </h1>
        <p class="mb-1 mt-2">{{ i.id }}</p>

        <div class="d-flex ga-2 align-center mt-3">
          <v-chip inline
                  :to="`/codex/items?type=${i.type}`"
                  class="badge-flavor text-center text-black" v-if="i.type">{{ t(`codex.types.${i.type}`) }}
          </v-chip>
          <v-chip class="badge-flavor text-center tag-badge text-black"
                  :to="`/codex/items?tier=${i.tier}`"
                  v-if="i.tier">{{ t(`codex.tier`, {num: number.intToRoman(i.tier)}) }}
          </v-chip>
          <v-chip class="badge-flavor text-center tag-badge text-black"
                  :to="`/codex/items?rarity=${i.rarity}`"
                  v-if="i.rarity">{{ t(`codex.raritys.${i.rarity}`) }}
          </v-chip>
        </div>

        <div class="right-show-image pointer-events-none position-absolute w-33">
          <v-img :src="itemsCardData.icon" class="material-mirror-image"></v-img>
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
      <div class="demo-reel-content background-flavor overflow-auto">
        <template v-if="isShowDescription">
          <div class="mb-5">
            <div :class="itemDescription && itemDescription.isHasDescription ? 'px-6 description' : ''">
              <ItemDescription ref="itemDescription" :id="props.id"></ItemDescription>
            </div>
            <div v-if="i && i.type === 'shipUpgrade'" class="px-6 description">
              <ShipUpgradedDescription :data="i"></ShipUpgradedDescription>
            </div>
          </div>
        </template>

        <template v-if="typeof i.damageMitigation == 'object'">
          <div class="mb-5 px-6">
            <DamageMitigationWidget showType="horizontal" :data="i"></DamageMitigationWidget>
          </div>
        </template>

        <template v-if="i.damagePerShot">
          <div class="px-6">
            <v-row align="center">
              <v-col cols="auto">
                <v-card variant="text">
                  <p class="text-caption opacity-60">{{ t('codex.item.damagePerShot') }}</p>
                  <p class="tex-left">
                    <span v-if="i.projectilesPerShot && i.projectilesPerShot > 1"><HtmlLink :isIframeShow="false" :isIcon="false" :isOpen="false">{{ (i.damagePerShot || 0) * (i.projectilesPerShot || 0) }}</HtmlLink><v-icon size="12">mdi-equal</v-icon></span>
                    <span><HtmlLink :isIframeShow="false" :isIcon="false" :isOpen="false">{{ i.damagePerShot || 0 }}</HtmlLink></span>
                    <span v-if="i.projectilesPerShot && i.projectilesPerShot > 1"><v-icon size="12">mdi-close</v-icon>{{i.projectilesPerShot || 1}}</span>
                  </p>
                </v-card>
              </v-col>
              <v-divider vertical :opacity=".2" :thickness="2" inset class="my-4"></v-divider>
              <v-col>
                <ItemDamageTypeWidget :data="i" iconType="aggressivity" sizeType="mini" :size="28"></ItemDamageTypeWidget>
              </v-col>
            </v-row>
          </div>
        </template>

        <template v-if="i.type =='chest' && itemContents.length > 0">
          <v-row class="px-6">
            <ItemContentWidget ref="itemContentWidgetRef" :data="i" :size="40" :isOpenNewWindow="true" :isShowTitle="false" :isShowTooltip="false" :isCenter="false"></ItemContentWidget>
          </v-row>
        </template>

        <v-expansion-panels class="mt-5" v-model="itemsCardData.panel">
          <v-expansion-panel
              class="bg-transparent"
              color="transparent"
              tile
              static>
            <template v-slot:title>
              <div class="title-long-flavor bg-black">
                {{ t('codex.ship.perks') }}
              </div>
            </template>
            <template v-slot:text>
              <PerksWidget :data="i"></PerksWidget>
            </template>
          </v-expansion-panel>
          <v-expansion-panel
              class="bg-transparent"
              color="transparent"
              tile
              static
              v-if="i.obtainable">
            <template v-slot:title>
              <div class="title-long-flavor bg-black">
                {{ t('codex.item.obtainable') }}
              </div>
            </template>
            <template v-slot:text>
              <ObtainableWidget :data="i" byType="item"></ObtainableWidget>
            </template>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
      <v-divider v-if="isShowOpenDetail"></v-divider>
      <div class="demo-reel-content pl-10 pr-10 background-flavor overflow-auto" v-if="isShowOpenDetail">
        <BtnWidget @action-complete="router.push(`/codex/item/${i.id}`)"
                   class="mt-1">
          {{ t('codex.item.lookDetail') }}
        </BtnWidget>
      </div>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.item-card {
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 40;
    border-radius: inherit;
  }

  .material-mirror-image {
    transform: scaleX(-1);
  }

  .map-location-card-name {
    line-height: 1.2 !important;
  }
}
</style>
