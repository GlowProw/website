<script setup lang="ts">
import {computed} from 'vue';
import {useIconGlobalStyle} from '@/assets/sripts/use_icon_global_style';
import {useWishlistStore} from '~/stores/wishlistStore';
import CollectionToggle from '@/components/CollectionToggle.vue';

const props = withDefaults(
    defineProps<{
      size?: number | string,
      padding?: number | string,
      margin?: number | string,
      isAutoSize?: boolean,
      isAutoPadding?: boolean,
      isAutoMargin?: boolean,
      id?: string,
      /**
       * 传入图鉴类型后在右上角显示收藏角标
       */
      collectType?: string,
      /**
       * 收藏角标对应的图鉴条目 ID
       */
      collectId?: string,
    }>(),
    {
      isAutoSize: true,
      isAutoPadding: true,
      isAutoMargin: true,
      id: '',
      collectType: '',
      collectId: '',
    }
);

const {useIconAdaptiveSize, useIconBoxPadding, useIconBoxMargin} = useIconGlobalStyle();
const wishlistStore = useWishlistStore();

const computedSize = props.isAutoSize ? useIconAdaptiveSize(() => props.size, 99) : props.size;
const computedPadding = props.isAutoPadding ? useIconBoxPadding(() => props.padding, 1) : props.padding;
const computedMargin = props.isAutoMargin ? useIconBoxMargin(() => props.margin, 0) : props.margin;

const wishlistMatch = computed(() => {
  if (!props.id) return null;
  return wishlistStore.getMatchForItem(props.id);
});

// 直接基于计算尺寸派生角标图标大小，消除客户端同步 reflow 瓶颈
const iconSize = computed(() => {
  const sizeValue = typeof computedSize === 'string'
      ? parseFloat(computedSize)
      : Number(computedSize || 99);
  const baseSize = !isNaN(sizeValue) && sizeValue > 0 ? sizeValue : 99;
  return Math.max(14, Math.round(baseSize * 0.18));
});

defineOptions({
  name: "ItemSlotBase"
})
</script>

<template>
  <div class="card-enlargement-flavor rounded-lg img-wrap"
       :class="`item-base-slot pa-${computedPadding} ma-${computedMargin}`"
       :style="`height: ${computedSize}; width: ${computedSize};min-height: ${computedSize}; min-width: ${computedSize}`">

    <slot></slot>

    <div class="item-slot-base-top-view py-1 px-1 d-flex" v-if="wishlistMatch || (props.collectType && props.collectId)">
      <v-btn
          v-if="wishlistMatch"
          class="wishlist-badge pointer-events-none"
          icon
          size="x-small"
          variant="text">
        <v-icon size="14" icon="mdi-thumb-up" class="text-amber"></v-icon>
      </v-btn>

      <v-spacer class="pointer-events-none"></v-spacer>

      <CollectionToggle v-if="props.collectType && props.collectId"
                        type="corner"
                        :target-type="props.collectType"
                        :target-id="props.collectId"></CollectionToggle>
    </div>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/img";

.item-base-slot {
  display: flex;
  position: relative;
  overflow: hidden;
  background-color: color-mix(in srgb, var(--main-color) 2%, #000 98%) !important;
  background-image: url("@/assets/images/item-slot-bg.png");
}

.item-slot-base-top-view {
  position: absolute;
  top: 0px;
  right: 0;
  left: 0px;
  z-index: 10;
}
</style>
