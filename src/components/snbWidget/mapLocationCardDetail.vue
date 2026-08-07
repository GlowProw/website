<script setup lang="ts">
import {onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {MapLocation, MapLocations} from "glow-prow-data";
import {rarity} from "@/assets/sripts/index";
import {useAssetsStore} from "~/stores/assetsStore";

import LightRays from "../LightRays.vue"
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import MapLocationName from "@/components/snbWidget/mapLocationName.vue";
import ByMapWidget from "@/components/ByMapWidget.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowOpenDetail?: boolean,
  isWidget?: boolean,
}>(), {
  id: '',
  isShowOpenDetail: true,
  isWidget: false,
})

const {t} = useI18n()
const router = useRouter()
const {serializationMap} = useAssetsStore()
const mapImages = import.meta.glob('/src/assets/images/map/*.*', {eager: true})

const rarityColorConfig = rarity.color
const mapLocationsValue = MapLocations

let mapLocationsCardData = ref({
  icon: '',
  panel: true
})
const mapIcons = ref<any>({})
const i: Ref<MapLocation | null> = ref(null)

const onReady = async () => {
  i.value = (mapLocationsValue as any)[props.id] || null

  if (props.id) {
    mapIcons.value = serializationMap(mapImages)
    if (i.value?.category && mapIcons.value[i.value.category])
      mapLocationsCardData.value.icon = mapIcons.value[i.value.category]
  }
}

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

defineOptions({
  name: 'MapLocationCardDetail'
})
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="i && i.id">
    <div class="demo-reel-header pa-10 position-relative"
         :style="`background-color: color-mix(in srgb, hsl(from ${rarityColorConfig[ (mapLocationsValue as any)[i.id]?.rarity || '' ]} h s l) 10%, #000)`">
      <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

      <h1 class="map-location-card-name font-weight-bold w-66">
        <MapLocationName :id="i.id"></MapLocationName>
      </h1>
      <p class="mb-1 mt-2">{{ i.id }}</p>

      <div class="d-flex ga-2 mt-3">
        <v-chip inline
                :to="`/codex/mapLocations?category=${i.category}`"
                class="badge-flavor text-center text-black" v-if="(i as any).type">{{ t(`codex.types.${i.category}`) }}
        </v-chip>
      </div>
      <div class="right-show-image pointer-events-none position-absolute w-33">
        <v-img :src="mapLocationsCardData.icon" class="map-location-mirror-image"></v-img>
      </div>

      <template v-if="(i as any).rarity">
        <LightRays
            rays-origin="top-right"
            quality="low"
            :rays-color="rarityColorConfig[(i as any).rarity]"
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
      <v-expansion-panels class="mt-5" v-model="mapLocationsCardData.panel" :multiple="isWidget">
        <v-expansion-panel
            class="bg-transparent"
            color="transparent"
            tile
            static
            value="obtainable"
            v-if="i.id">
          <template v-slot:title>
            <div class="title-long-flavor bg-black">
              {{ t('codex.item.byMap') }}
            </div>
          </template>
          <template v-slot:text>
            <ByMapWidget
              :draggable="false"
              :zoomable="false"
              :target-key="i.id"></ByMapWidget>
          </template>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
    <v-divider v-if="isShowOpenDetail"></v-divider>
    <div class="demo-reel-content pl-10 pr-10 background-flavor overflow-auto"
         v-if="isShowOpenDetail">
      <BtnWidget @action-complete="router.push(`/codex/mapLocation/${i.id}`)"
                 class="mt-1">
        {{ t('codex.mapLocation.lookDetail') }}
      </BtnWidget>
    </div>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.map-location-mirror-image {
  transform: scaleX(-1)
}

.map-location-card-name {
  line-height: 1.2 !important;
}
</style>
