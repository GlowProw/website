<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {onMounted, type Ref, ref, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useIntersectionObserver} from "@/assets/sripts/intersection_observer";
import {rarity} from "@/assets/sripts/index";
import {useAssetsStore} from "~/stores/assetsStore";

import Loading from "../Loading.vue";
import LightRays from "../LightRays.vue"
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import {TreasureMap, TreasureMaps} from "glow-prow-data";
import TreasureMapName from "@/components/snbWidget/treasureMapName.vue";

const
    {asString, sanitizeString} = useI18nUtils(),
    route = useRoute(),
    router = useRouter(),
    {t} = useI18n(),
    {treasureMaps: treasureMapsAssets, raritys: raritysAssets} = useAssetsStore(),
    props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      id: '',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isShowTooltip: true,
      padding: 0,
      margin: 1
    }),

    treasureMaps: TreasureMaps = TreasureMaps

let treasureMapsCardData = ref({
      icon: '',
    }),
    i: Ref<TreasureMap | null> = ref(null),

    // 稀有度
    rarityColorConfig = rarity.color


watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = treasureMaps[props.id] || null

  if (treasureMapsAssets[props.id])
    treasureMapsCardData.value.icon = treasureMapsAssets[props.id] || ''
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
      class="treasureMap-card"
      content-class="pa-0"
      target="cursor">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          ref="targetElement"
          width="100%"
          v-bind="activatorProps"
          :color="`hsl(from ${rarityColorConfig[i?.rarity]} h s calc(l * .15))`"
          :to="isOpenDetail ? `/codex/treasureMap/${i?.id}` : null"
          :class="[
              'prohibit-drag',
              `ma-${props.margin}`,
              `pa-${props.padding}`,
              `treasureMap-card-header-rarity-${i.rarity}`
          ]">
        <template v-slot:image v-if="i.rarity">
          <v-img :src="raritysAssets[`treasureMap-rarity-${i.rarity}`]" width="100%" height="100%" class="opacity-30 prohibit-drag"/>
        </template>

        <div class="d-flex align-center justify-center h-100">
          <v-img
              class="prohibit-drag"
              :src="treasureMapsCardData.icon">
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
           :style="`background-color: color-mix(in srgb, hsl(from ${rarityColorConfig[ treasureMaps[i.id]?.rarity || '' ]} h s l) 10%, #000)`">
        <div class="v-skeleton-loader__bone v-skeleton-loader__image opacity-30 position-absolute left-0 top-0 w-100 h-100"></div>

        <h1 class="treasure-card-name card-name font-weight-bold w-66">
          <TreasureMapName :data="i"></TreasureMapName>
        </h1>
        <p class="card-id mb-1 mt-2">{{ i.id }}</p>

        <div class="card-chip d-flex ga-2 mt-3">
          <v-chip inline
                  :to="`/codex/treasureMaps?type=${i.type}`"
                  class="badge-flavor text-center text-black" v-if="i.type">{{ t(`codex.types.${i.type}`) }}
          </v-chip>
          <v-chip class="badge-flavor text-center tag-badge text-black"
                  :to="`/codex/treasureMaps?category=${i.category}`"
                  v-if="i.category">{{ t(`codex.treasureMap.categorys.${i.category}`) }}
          </v-chip>
          <v-chip class="badge-flavor text-center tag-badge text-black"
                  :to="`/codex/treasureMaps?rarity=${i.rarity}`"
                  v-if="i.rarity">{{ t(`codex.raritys.${i.rarity}`) }}
          </v-chip>
        </div>
        <div class="right-show-image pointer-events-none position-absolute w-50">
          <v-img :src="treasureMapsCardData.icon" class="treasure-mirror-image"></v-img>
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
        <BtnWidget @action-complete="router.push(`/codex/treasureMap/${i.id}`)"
                   class="mt-1"
                   v-if="isShowOpenDetail">
          {{ t('codex.treasureMap.lookDetail') }}
        </BtnWidget>
      </div>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

// 覆盖新藏宝图位置
.right-show-image {
  transform: scale(1.5) translateX(calc(-50% + 70px)) translateY(calc(20%)) !important;
  top: 0 !important;
  right: 0 !important;
  mask-image: linear-gradient(to right, #00000000 0%, black 80%);
}

.treasureMap-card {
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
