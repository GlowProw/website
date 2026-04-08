<script lang="ts">
export default { name: 'MapLocationIconWidget' }
</script>

<script setup lang="ts">
import { useIconGlobalStyle } from "@/assets/sripts/useIconGlobalStyle";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useIntersectionObserver} from "@/assets/sripts/intersection_observer";
import {rarity} from "@/assets/sripts/index";
import {useAssetsStore} from "~/stores/assetsStore";

import Loading from "../Loading.vue";
import {MapLocation, MapLocations} from "glow-prow-data";
import {useAppStore} from "~/stores/appStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import MapLocationCardDetail from "@/components/snbWidget/mapLocationCardDetail.vue";

const mapImages = import.meta.glob('/src/assets/images/map/*.*', {eager: true})

const
    {asString, sanitizeString} = useI18nUtils(),
    {serializationMap} = useAssetsStore(),
    route = useRoute(),
    router = useRouter(),
    appStore = useAppStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow(),
    {t} = useI18n(),
    {raritys: raritysAssets} = useAssetsStore(),
    props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      id: '',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowTooltip: true,
      padding: 0,
      margin: 1
    }),
    mapLocations: any = MapLocations,
    rarityColorConfig = rarity.color;

let mapLocationsCardData = ref({
      icon: '',
    }),
    mapIcons = ref({}),
    i: Ref<MapLocation | null> = ref(null),

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
  i.value = mapLocations[props.id] || null

  if (props.id) {
    mapIcons.value = serializationMap(mapImages)

    if (i.value?.category && mapIcons.value[i.value.category])
      mapLocationsCardData.value.icon = mapIcons.value[i.value.category]
  }
}

const {targetElement, isVisible} = useIntersectionObserver({
  threshold: .7,
})

const getRarity = (i: any) => i?.rarity
const getType = (i: any) => i?.type

const { useIconImagePadding, useIconImageMargin } = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);
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
      class="map-location-card"
      content-class="pa-0 bg-transparent"
      :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          ref="targetElement"
          width="100%"
          v-bind="activatorProps"
          :color="`hsl(from ${rarityColorConfig[(i as any)?.rarity]} h s calc(l * .15))`"
          :to="isOpenDetail ? `/codex/mapLocation/${i?.id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :class="[
              'prohibit-drag',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
              `mapLocation-card-header-rarity-${(i as any).rarity}`
          ]">
        <template v-slot:image v-if="(i as any).rarity">
          <v-img :src="raritysAssets[`mapLocation-rarity-${(i as any).rarity}`]" width="100%" height="100%" class="opacity-30 prohibit-drag"/>
        </template>

        <div class="d-flex align-center justify-center h-100">
          <v-img
              referrerpolicy="no-referrer"
              class="prohibit-drag"
              :src="mapLocationsCardData.icon">
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
    <MapLocationCardDetail
        :id="props.id"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.map-location-card {
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

  .map-location-mirror-image {
    transform: scaleX(-1)
  }

  .map-location-card-name {
    line-height: 1.2 !important;
  }
}
</style>
