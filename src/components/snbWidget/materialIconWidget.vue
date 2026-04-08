<script lang="ts">
export default {name: 'MaterialIconWidget'}
</script>

<script setup lang="ts">
import { useIconGlobalStyle } from "@/assets/sripts/useIconGlobalStyle";
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useAssetsStore} from "~/stores/assetsStore";
import {rarity} from "@/assets/sripts/index";
import {Material, Materials} from "glow-prow-data";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import MaterialCardDetail from "@/components/snbWidget/materialCardDetail.vue";
import {useAppStore} from "~/stores/appStore";
import Loading from "@/components/Loading.vue";

const props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowDescription?: boolean,
      isShowTooltip?: boolean,
      imageType?: string,
      size?: string | number,
      padding?: number,
      margin?: number
    }>(), {
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowDescription: true,
      isShowTooltip: true,
      size: 20,
      padding: 0,
      margin: 1
    }),
    appStore = useAppStore(),
    {t} = useI18n(),
    {raritys: raritysAssets} = useAssetsStore(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow(),
    materials = Materials,

    // 稀有度
    rarityColorConfig = rarity.color

let materialsCardData = ref({
      icon: '',
    }) as Ref<{ icon: null | string }>,
    i: Ref<Material | null> = ref(null),
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
  i.value = materials[props.id] || null

  materialsCardData.value.icon = currentImageService.url({
    id: props.id,
    category: 'materials'
  })
}

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
      class="material-card"
      content-class="pa-0 bg-transparent"
      :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          ref="targetElement"
          width="100%"
          variant="text"
          translate
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/material/${i?.id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :style="`background: hsl(from ${rarityColorConfig[i?.rarity]} h s calc(l * .2))`"
          :class="[
              'prohibit-drag',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
          ]">
        <div class="d-flex align-center justify-center w-100 h-100">
          <v-img
              referrerpolicy="no-referrer"
              class="prohibit-drag"
              :src="materialsCardData.icon">
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
    <MaterialCardDetail
        :id="props.id"
        :is-show-description="props.isShowDescription"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.material-card {
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
    transform: scaleX(-1)
  }

  .material-card-name {
    line-height: 1.2 !important;
  }
}
</style>
