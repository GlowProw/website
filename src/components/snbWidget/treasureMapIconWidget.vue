<script lang="ts">
export default {name: 'TreasureMapIconWidget'}
</script>

<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useIntersectionObserver} from "@/assets/sripts/intersection_observer";
import {rarity} from "@/assets/sripts/index";
import {useAssetsStore} from "~/stores/assetsStore";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {use_tooltip_follow} from "@/assets/sripts/use_tooltip_follow";
import TreasureMapCardDetail from "@/components/snbWidget/treasureMapCardDetail.vue";
import {useAppStore} from "~/stores/appStore";
import {TreasureMap, TreasureMaps} from "glow-prow-data";

const
    {asString, sanitizeString} = useI18nUtils(),
    router = useRouter(),
    {t} = useI18n(),
    {raritys: raritysAssets} = useAssetsStore(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = use_tooltip_follow(),
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
    appStore = useAppStore(),
    treasureMaps: any = TreasureMaps,

    // 稀有度
    rarityColorConfig = rarity.color

let treasureMapsCardData = ref({
      icon: '',
    }),
    i: Ref<TreasureMap | null> = ref(null),
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
  i.value = treasureMaps[props.id] || null

  treasureMapsCardData.value.icon = currentImageService.url({
    id: props.id,
    category: 'treasureMaps'
  }, 'glow-prow')
}

const {targetElement, isVisible} = useIntersectionObserver({
  threshold: .7,
})
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
      content-class="pa-0 bg-transparent"
      :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          ref="targetElement"
          width="100%"
          v-bind="activatorProps"
          :color="`hsl(from ${rarityColorConfig[i?.rarity]} h s calc(l * .15))`"
          :to="isOpenDetail ? `/codex/treasureMap/${i?.id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
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
              referrerpolicy="no-referrer"
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
    <TreasureMapCardDetail
        :id="props.id"
        :is-show-open-detail="props.isShowOpenDetail"
    />
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
