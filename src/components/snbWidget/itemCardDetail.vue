<script setup lang="ts">
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {Item, Items} from "glow-prow-data/src/entity/Items";
import {Cosmetics} from "glow-prow-data";
import {number, rarity} from "@/assets/sripts/index";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

import Loading from "../Loading.vue";
import LightRays from "../LightRays.vue"
import ItemName from "@/components/snbWidget/itemName.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";
import ItemDamageTypeWidget from "@/components/snbWidget/itemDamageTypeWidget.vue";
import PerksWidget from "@/components/snbWidget/perksWidget.vue";
import DamageMitigationWidget from "@/components/snbWidget/damageMitigationWidget.vue";
import ByObtainableWidget from "@/components/ByObtainableWidget.vue";
import ItemDescription from "@/components/snbWidget/itemDescription.vue";
import ItemContentWidget from "@/components/snbWidget/itemContentWidget.vue";
import ShipUpgradedDescription from "@/components/snbWidget/shipUpgradedDescription.vue";
import HtmlLink from "@/components/HtmlLink.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowOpenDetail?: boolean,
  isShowDescription?: boolean,
  isWidget?: boolean,
}>(), {
  id: 'culverin1',
  isShowOpenDetail: true,
  isShowDescription: true,
  isWidget: false,
})

const {t} = useI18n()
const router = useRouter()
const cdnStore = useCDNAssetsServiceStore()

const rarityColorConfig = rarity.color
const items = Items
const cosmetics = Cosmetics

let itemsCardData = ref({
  icon: '',
  panel: props.isWidget ? Array.from({length: 100}, (i, index) => index) : 0
})
const i: Ref<Item | null> = ref(null)
const itemDescription: Ref<any> = ref(null)
const itemContents: Ref<any[]> = ref([])

const onReady = async () => {
  i.value = items[props.id] || null
  onSetIcon()

  if (i.value) {
     itemContents.value = [
      ...filterByObtainable(Object.values(items), props.id),
      ...filterByObtainable(Object.values(cosmetics), props.id)
    ]
  }
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

watch(() => props.id, () => {
  onReady()
})

watch(() => cdnStore.selectedService, (newValue, oldValue) => {
  if (newValue != oldValue)
    onSetIcon()
}, {immediate: true})

onMounted(() => {
  onReady()
})

const getType = (i: any) => i?.type

defineOptions({
  name: 'ItemCardDetail'
})
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="i && i.id">
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
      <div class="right-show-image pointer-events-none position-absolute w-33" v-if="isWidget">
        <v-img :src="itemsCardData.icon" class="material-mirror-image"></v-img>
      </div>

      <template v-if="i.rarity">
        <LightRays
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
    <div :class="{'demo-reel-content': !isWidget}" class="background-flavor overflow-auto">
      <template v-if="isShowDescription">
        <div class="mb-5">
          <div :class="itemDescription && itemDescription.isHasDescription ? 'px-6 description' : ''">
            <ItemDescription ref="itemDescription" :id="props.id"></ItemDescription>
          </div>
          <div v-if="i && getType(i) === 'shipUpgrade'" class="px-6 description">
            <ShipUpgradedDescription :data="i"></ShipUpgradedDescription>
          </div>
        </div>
      </template>

      <template v-if="typeof i.damageMitigation == 'object'">
        <div class="mb-5 px-7">
          <DamageMitigationWidget direction="horizontal" type="armor" :isForciblyIcon="true" :data="i"></DamageMitigationWidget>
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
                  <span v-if="i.projectilesPerShot && i.projectilesPerShot > 1"><v-icon size="12">mdi-close</v-icon>{{ i.projectilesPerShot || 1 }}</span>
                </p>
              </v-card>
            </v-col>
            <v-divider vertical :opacity=".2" :thickness="2" inset class="my-4"></v-divider>
            <v-col>
              <ItemDamageTypeWidget :data="i" iconType="aggressivity" sizeType="mini" :size="35"></ItemDamageTypeWidget>
            </v-col>
          </v-row>
        </div>
      </template>

      <template v-if="i.type =='chest' && itemContents.length > 0">
        <v-row class="px-8 mt-2">
          <ItemContentWidget :data="i" :size="40" :isOpenNewWindow="true" :isShowTitle="false" :isShowTooltip="false" :isCenter="false"></ItemContentWidget>
        </v-row>
      </template>

      <v-expansion-panels class="mt-5" v-model="itemsCardData.panel" :multiple="isWidget" :static="true">
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
            <ByObtainableWidget :data="i" byType="item"></ByObtainableWidget>
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
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.material-mirror-image {
  transform: scaleX(-1);
}

.material-card-name {
  line-height: 1.2 !important;
}
</style>
