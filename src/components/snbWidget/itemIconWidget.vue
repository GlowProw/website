<script setup lang="ts">
import {use_icon_global_Style} from "@/assets/sripts/use_icon_global_Style";
import {computed, ComputedRef, onMounted, type Ref, ref, watch} from "vue";
import {Item, Items} from "glow-prow-data/src/entity/Items";
import {rarity, number} from "@/assets/sripts/index";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";
import ItemCardDetail from "@/components/snbWidget/itemCardDetail.vue";
import {useAppStore} from "~/stores/appStore";
import Loading from "@/components/Loading.vue";

const appStore = useAppStore(),
    slots = useAppStore(),
    cdnStore = useCDNAssetsServiceStore(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow(),
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

const {useIconImagePadding, useIconImageMargin} = use_icon_global_Style();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);

let itemsCardData = ref({
      icon: '',
      model: false,
      panel: 0
    }),
    i: Ref<Item | null> = ref(null),

    fontSize = computed(() => {
      let value = slots.iconSize.size * 0.14
      return Math.max(10, Math.min(18, value));
    }),
    itemRarity = computed(() => {
      if (i.value.type == 'shipUpgrade')
        return "legendary"
      return i.value?.rarity || ''
    }),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    }),
    isUpgradeMod = computed(() => {
      if (i.value.type == 'shipUpgrade') {
        return true
      }
      return false
    })


watch(() => props.id, () => {
  onReady()
})

watch(() => itemsCardData.value.model, (value) => {
  // 逻辑已移除，现已统一在 ItemCardDetail 中处理
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  i.value = items[props.id] || null

  onSetIcon()
}

const onSetIcon = () => {
  if (!i.value) return
  itemsCardData.value.icon = cdnStore.currentService.url({
    'skull-and-bones-tools': {
      id: props.id,
      type: i.value.type,
      category: 'item'
    },
    'glow-prow': {
      id: props.id,
      category: i.value.type || 'AUTO_items'
    },
    'glow-prow-zh-cn': {
      id: props.id,
      category: i.value.type || 'AUTO_items'
    },
    'local-test': {
      id: props.id,
      category: i.value.type || 'AUTO_items'
    },
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

defineOptions({
  name: "ItemIconWidget"
})
</script>

<template>
  <v-tooltip
      v-model="itemsCardData.model"
      v-if="i && i.id"
      :disabled="!props.isShowTooltip"
      :offset="[40, 0]"
      scroll-strategy="close"
      transition="opacity 300ms ease-in"
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
          :color="`hsl(from ${rarityColorConfig[itemRarity]} h s calc(l * .15))`"
          :to="isOpenDetail ? `/codex/item/${i?.id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :class="[
              'prohibit-drag',
              `ma-${computedMargin}`,
              `pa-${computedPadding}`,
              `item-card-header-rarity-${itemRarity}`
          ]">
        <div class="d-flex align-center justify-center w-100 h-100">
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
        <div v-if="isUpgradeMod" class="item-upgrade-mod-mask position-absolute bottom-0 w-100 pt-5 pb-1">
          <template v-if="slots['upgrade-mod-content']">
            <v-slot name="upgrade-mod-content"></v-slot>
          </template>
          <template v-else-if="!slots['upgrade-mod-content'] && i.tier">
            <span class="item-text d-flex align-center justify-center text-shades-white" :title="i.tier.toString()"
             :style="`font-size:${fontSize}px`">
              <v-icon icon="mdi-chevron-double-up" class="ml-n1"></v-icon><b>{{ number.intToRoman(i.tier) }}</b>
            </span>
          </template>
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

.item-upgrade-mod-mask {
  background: linear-gradient(to bottom, transparent 20%, rgba(255, 193, 7, 0.4) 80%);

  .item-text {
    text-shadow: 1px 1px 0px black;
  }
}
</style>
