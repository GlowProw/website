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
import EmptyView from "@/components/EmptyView.vue";
import ShipBaseInfoSlotWidget from "@/components/snbWidget/shipBaseInfoSlotWidget.vue";
import ShipWeaponInfoSlotWidget from "@/components/snbWidget/shipWeaponInfoSlotWidget.vue";
import PerksWidget from "@/components/snbWidget/perksWidget.vue";
import ShipDescription from "@/components/snbWidget/shipDescription.vue";
import DamageMitigationWidget from "@/components/snbWidget/damageMitigationWidget.vue";

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
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      id: 'culverin1',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowTooltip: true,
      padding: 0,
      margin: 1
    }),
    items: Items = Items,

    // 稀有度
    rarityColorConfig = rarity.color

useI18nUtils();

let itemsCardData = ref({
      icon: '',
      panel: null
    }),
    i: Ref<Item | null> = ref(null),

    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    })


watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = items[props.id] || null

  onSetIcon()
}

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
          <ItemDamageTypeWidget :data="i" sizeType="mini" :size="25"></ItemDamageTypeWidget>
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
        <v-expansion-panels v-model="itemsCardData.panel">
          <v-expansion-panel
              class="bg-transparent"
              color="transparent"
              tile
              static
              v-if="typeof i.damageMitigation == 'object'">
            <template v-slot:title>
              <div class="title-long-flavor bg-black">
                {{ t('codex.item.damageMitigation') }}
              </div>
            </template>
            <template v-slot:text>
              <DamageMitigationWidget :data="i"></DamageMitigationWidget>
            </template>
          </v-expansion-panel>
          <v-expansion-panel
              class="bg-transparent"
              color="transparent"
              tile
              static>
            <template v-slot:title>
              <div class="title-long-flavor bg-black">
                {{ t('codex.item.damageType') }}
              </div>
            </template>
            <template v-slot:text>
              <ItemDamageTypeWidget :data="itemsCardData"></ItemDamageTypeWidget>
            </template>
          </v-expansion-panel>
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
        </v-expansion-panels>
      </div>
      <v-divider v-if="isShowOpenDetail"></v-divider >
      <v-card-actions class="pa-5 pt-0"
                      v-if="isShowOpenDetail">
        <BtnWidget @action-complete="router.push(`/codex/item/${i.id}`)"
                   class="mt-1">
          {{ t('codex.item.lookDetail') }}
        </BtnWidget>
      </v-card-actions>
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
