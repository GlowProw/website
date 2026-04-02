<script lang="ts">
export default { name: 'CommoditieIconWidget' }
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
import CommoditieCardDetail from "@/components/snbWidget/commoditieCardDetail.vue";
import {useAppStore} from "~/stores/appStore";
import {Commodities, Commodity} from "glow-prow-data";

const
    {asString, sanitizeString} = useI18nUtils(),
    route = useRoute(),
    router = useRouter(),
    appStore = useAppStore(),
    {t} = useI18n(),
    {raritys: raritysAssets} = useAssetsStore(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = use_tooltip_follow(),
    props = withDefaults(defineProps<{
      id: string,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowOpenDetail?: boolean,
      isShowDescription?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      id: '',
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowOpenDetail: true,
      isShowDescription: true,
      isShowTooltip: true,
      padding: 0,
      margin: 1
    }),
    commodities: any = Commodities,
    rarityColorConfig = rarity.color;

let commoditiesCardData = ref({
      icon: '',
    }),
    i: Ref<Commodity | null> = ref(null),
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
  i.value = commodities[props.id] || null

  commoditiesCardData.value.icon = currentImageService.url({
    id: props.id,
    category: 'commodities'
  });
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
      class="item-card"
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
          :to="isOpenDetail ? `/codex/commoditie/${i?.id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :class="[
              'prohibit-drag',
              `ma-${props.margin}`,
              `pa-${props.padding}`,
              `item-card-header-rarity-${i.rarity}`
          ]">

        <div class="d-flex align-center justify-center h-100">
          <v-img
              referrerpolicy="no-referrer"
              class="prohibit-drag"
              :src="commoditiesCardData.icon">
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
    <CommoditieCardDetail
        :id="props.id"
        :is-show-description="props.isShowDescription"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.commoditie-card {
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
