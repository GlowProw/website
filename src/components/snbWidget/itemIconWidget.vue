<script setup lang="ts">
import {useIconGlobalStyle} from "@/assets/sripts/use_icon_global_style";
import {computed, ComputedRef, defineAsyncComponent, onMounted, type Ref, ref, watch} from "vue";
import {Item, Items} from "glow-prow-data/src/entity/Items";
import {rarity, number} from "@/assets/sripts/index";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import {useAppStore} from "~/stores/appStore";
import Loading from "@/components/Loading.vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import ItemSlotCard from "@/components/snbWidget/ItemSlotCard.vue";

// 悬浮详情卡片改为按需异步加载，减轻海量图标挂载时的首屏开销
const ItemCardDetail = defineAsyncComponent(() => import("@/components/snbWidget/itemCardDetail.vue"));

const appStore = useAppStore(),
    slots = useAppStore(),
    cdnStore = useCDNAssetsServiceStore(),
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

const {useIconImagePadding, useIconImageMargin} = useIconGlobalStyle();
const computedPadding = useIconImagePadding(props.padding);
const computedMargin = useIconImageMargin(props.margin);

let itemsCardData = ref({
      icon: ''
    }),
    i: Ref<Item | null> = ref(null),

    fontSize = computed(() => {
      let value = slots.iconSize.size * 0.14
      return Math.max(10, Math.min(18, value));
    }),
    itemRarity = computed(() => {
      if ((i.value as any)?.type == 'shipUpgrade')
        return "legendary"
      return i.value?.rarity || ''
    }),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    }),
    isUpgradeMod = computed(() => {
      if ((i.value as any)?.type == 'shipUpgrade') {
        return true
      }
      return false
    })


watch(() => props.id, () => {
  onReady()
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
  itemsCardData.value.icon = cdnStore.currentService.image.url({
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
  <ItemCardTooltip v-if="i && i.id" :disabled="!props.isShowTooltip">
    <template v-slot:activator="{ props: activatorProps }">
      <ItemSlotCard
          v-bind="activatorProps"
          :to="isOpenDetail ? `/codex/item/${i?.id}` : ''"
          :target="isOpenNewWindow ? '_blank' : '_self'"
          :rarity="itemRarity"
          :padding="props.padding"
          :margin="props.margin">
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
            <div class="d-flex justify-center align-center h-100 opacity-60">
              <Loading size="30px" min-size="10px" max-size="50px"/>
            </div>
          </template>
        </v-img>

        <div v-if="isUpgradeMod" class="item-upgrade-mod-mask position-absolute bottom-0 w-100 pt-5 pb-1">
          <template v-if="slots['upgrade-mod-content']">
            <slot name="upgrade-mod-content"></slot>
          </template>
          <template v-else-if="!slots['upgrade-mod-content'] && i.tier">
            <span class="item-text d-flex align-center justify-center text-shades-white" :title="i.tier.toString()"
             :style="`font-size:${fontSize}px`">
              <v-icon icon="mdi-chevron-double-up" class="ml-n1"></v-icon><b>{{ number.intToRoman(i.tier) }}</b>
            </span>
          </template>
        </div>
      </ItemSlotCard>
    </template>
    <ItemCardDetail
        :id="props.id"
        :is-show-description="props.isShowDescription"
        :is-show-open-detail="props.isShowOpenDetail"
    />
  </ItemCardTooltip>
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
