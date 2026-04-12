<script setup lang="ts">
import { useIconGlobalStyle } from "@/assets/sripts/useIconGlobalStyle";

import {computed, onMounted, type Ref, ref, watch} from "vue";
import {Ship, Ships} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import ShipCardDetail from "@/components/snbWidget/shipCardDetail.vue";
import {useAppStore} from "~/stores/appStore";

const props = withDefaults(defineProps<{
      id: string,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowOpenDetail?: boolean,
      isShowDescription?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      id: 'dhow',
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowOpenDetail: true,
      isShowDescription: true,
      isShowTooltip: true,
      padding: 0,
      margin: 0
    }),
    appStore = useAppStore(),
    {currentService: currentImageService} = useCDNAssetsServiceStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow()


let shipCardData = ref<any>({
      icon: '',
      model: false,
      panel: null
    }),
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

  shipCardData.value.panel = null;
  shipCardData.value.model = false;

  shipCardData.value.icon = currentImageService.url({
    id: props.id,
    category: 'ships'
  });
}

defineOptions({
  name: 'ShipIconWidget'
})

const { useIconImagePadding, useIconImageMargin } = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);
</script>

<template>
  <v-tooltip v-model="shipCardData.model"
             min-width="450"
             max-width="450"
             interactive
             :disabled="!props.isShowTooltip"
             :offset="[40, 0]"
             location="right top"
             content-class="pa-0 bg-transparent"
             :target="[tooltipPos.x, tooltipPos.y]">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          v-bind="activatorProps"
          width="100%"
          :to="isOpenDetail ? `/codex/ship/${id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :class="[
              'prohibit-drag',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
          ]">
        <v-img :src="shipCardData.icon" class="pointer-events-none prohibit-drag"></v-img>
      </v-card>
    </template>

    <ShipCardDetail
        :id="props.id"
        :is-show-description="props.isShowDescription"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
