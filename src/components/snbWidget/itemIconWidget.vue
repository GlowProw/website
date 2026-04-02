<script lang="ts">
export default {name: 'ItemIconWidget'}
</script>

<script setup lang="ts">
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {Item, Items} from "glow-prow-data/src/entity/Items";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {number, rarity} from "@/assets/sripts/index";
import {useAssetsStore} from "~/stores/assetsStore";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {use_tooltip_follow} from "@/assets/sripts/use_tooltip_follow";
import ItemCardDetail from "@/components/snbWidget/itemCardDetail.vue";
import {useAppStore} from "~/stores/appStore";

const router = useRouter(),
    appStore = useAppStore(),
    {t} = useI18n(),
    cdnStore = useCDNAssetsServiceStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = use_tooltip_follow(),
    props = withDefaults(defineProps<{
      id: string,
      isShowOpenDetail?: boolean,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowDescription?: boolean,
      isShowTooltip?: boolean,
      padding?: number,
      margin?: number
    }>(), {
      id: 'culverin1',
      isShowOpenDetail: true,
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowDescription: true,
      isShowTooltip: true,
      padding: 0,
      margin: 1
    }),
    items = Items,

    // 稀有度
    rarityColorConfig = rarity.color

useI18nUtils();

let itemsCardData = ref({
      icon: '',
      model: false,
      panel: 0
    }),
    i: Ref<Item | null> = ref(null),

    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    })


watch(() => props.id, () => {
  onReady()
})

watch(() => itemsCardData.value.model, (value) => {
  // Logic removed as it's now in ItemCardDetail
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = items[props.id] || null

  onSetIcon()
}

// filterByObtainable removed as it's now in ItemCardDetail

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

const getType = (i: any) => i?.type
const getTier = (i: any) => i?.tier
const getRarity = (i: any) => i?.rarity

defineExpose({
  getType,
  getTier,
  getRarity
})
</script>

<template>
  <v-tooltip
      v-model="itemsCardData.model"
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
          width="100%"
          v-bind="activatorProps"
          @mousemove="onMouseMove"
          @mouseenter="onMouseEnter"
          :color="`hsl(from ${rarityColorConfig[i?.rarity]} h s calc(l * .15))`"
          :to="isOpenDetail ? `/codex/item/${i?.id}` : ''"
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
    <ItemCardDetail
        :id="props.id"
        :is-show-description="props.isShowDescription"
        :is-show-open-detail="props.isShowOpenDetail"
    />
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
