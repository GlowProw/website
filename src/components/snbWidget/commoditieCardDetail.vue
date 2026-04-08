<script setup lang="ts">
import {onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {Commodities, Commodity} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

import LightRays from "../LightRays.vue"
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";
import CommoditieDescription from "@/components/snbWidget/commoditieDescription.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowOpenDetail?: boolean,
  isShowDescription?: boolean,
  isWidget?: boolean,
}>(), {
  id: '',
  isShowOpenDetail: true,
  isShowDescription: true,
  isWidget: false,
})

const {t} = useI18n()
const router = useRouter()
const {currentService: currentImageService} = useCDNAssetsServiceStore()

const rarityColorConfig = rarity.color
const commoditiesValue = Commodities

let commoditiesCardData = ref({
  icon: '',
})
const i: Ref<Commodity | null> = ref(null)
const commoditieDescription: Ref<any> = ref(null)

const onReady = async () => {
  i.value = (commoditiesValue as any)[props.id] || null

  commoditiesCardData.value.icon = currentImageService.url({
    id: props.id,
    category: 'commodities'
  });
}

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

defineOptions({
  name: 'CommoditieCardDetail'
})
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="i && i.id">
    <div class="demo-reel-header pa-10 position-relative"
         :style="`background-color: color-mix(in srgb, hsl(from ${rarityColorConfig[ (commoditiesValue as any)[i.id]?.rarity || '' ]} h s l) 10%, #000)`">
      <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

      <h1 class="material-card-name font-weight-bold w-66">
        <v-card variant="text" width="30" height="30" class="mb-2" v-if="i.faction">
          <FactionIconWidget class="d-inline-flex" size="30px" :name="i.faction.id" v-if="i.faction"></FactionIconWidget>
        </v-card>
        <ItemNameRarity :id="i.id">
          <CommoditieName :data="i"></CommoditieName>
        </ItemNameRarity>
      </h1>
      <p class="mb-1 mt-2">{{ i.id }}</p>

      <div class="d-flex ga-2 mt-3">
        <v-chip inline
                class="badge-flavor text-center tag-badge text-black"
                :to="`/codex/commodities?category=${i.category}`"
                v-if="i.category">
          {{ t(`codex.categorys.${i.category}`) || '' }}
        </v-chip>
        <v-chip class="badge-flavor text-center tag-badge text-black"
                :to="`/codex/commoditie/rarity/${i.rarity}`"
                v-if="i.rarity">{{ t(`codex.raritys.${i.rarity}`) }}
        </v-chip>
      </div>
      <div class="right-show-image pointer-events-none position-absolute w-33" v-if="isWidget">
        <v-img :src="commoditiesCardData.icon" class="material-mirror-image"></v-img>
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
        <div :class="commoditieDescription && commoditieDescription.isHasDescription ? 'mb-5 px-6 description' : ''">
          <CommoditieDescription ref="commoditieDescription" :id="props.id"></CommoditieDescription>
        </div>
      </template>
    </div>
    <v-divider v-if="isShowOpenDetail"></v-divider>
    <div class="demo-reel-content pl-10 pr-10 background-flavor overflow-auto"
         v-if="isShowOpenDetail">
      <BtnWidget @action-complete="router.push(`/codex/commoditie/${i.id}`)"
                 class="mt-1">
        {{ t('codex.commoditie.lookDetail') }}
      </BtnWidget>
    </div>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.material-mirror-image {
  transform: scaleX(-1);
}
</style>
