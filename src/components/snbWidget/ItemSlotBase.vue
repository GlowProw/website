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

/**
 * 规范化尺寸输出，确保任何时候都带有合法的 CSS 长度单位
 */
function formatCssDimension(val: number | string | undefined, defaultSize: number = 99): string {
  if (val === undefined || val === null || val === '') return `${defaultSize}px`;
  const str = String(val).trim();
  const num = parseFloat(str);
  if (isNaN(num)) return str;
  return str.endsWith('px') || str.endsWith('%') || str.endsWith('rem') || str.endsWith('em') || str.endsWith('vw') || str.endsWith('vh')
    ? str
    : `${num}px`;
}

// 自适应计算尺寸
const rawAdaptiveSize = props.isAutoSize ? useIconAdaptiveSize(() => props.size, 99) : computed(() => props.size);
const computedSize = computed(() => formatCssDimension(rawAdaptiveSize.value, 99));
const computedPadding = props.isAutoPadding ? useIconBoxPadding(() => props.padding, 1) : computed(() => props.padding ?? 1);
const computedMargin = props.isAutoMargin ? useIconBoxMargin(() => props.margin, 0) : computed(() => props.margin ?? 0);

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
       :style="`height: ${computedSize}; width: ${computedSize}; min-height: ${computedSize}; min-width: ${computedSize}; max-height: ${computedSize}; max-width: ${computedSize}; aspect-ratio: 1 / 1;`">

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
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  background-color: color-mix(in srgb, var(--main-color) 2%, #000 98%) !important;
  background-image: url("@/assets/images/item-slot-bg.webp");

  // 严格确保槽内所有直接子级与 itemSlot 保持 100% 绝对一致的尺寸与 1:1 正方形比例
  :deep(> .v-card),
  :deep(> .item-slot-card),
  :deep(> a),
  :deep(> div:not(.item-slot-base-top-view)) {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
    min-width: 100% !important;
    min-height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    box-sizing: border-box !important;
    aspect-ratio: 1 / 1 !important;
    flex-shrink: 0;
  }
}

.item-slot-base-top-view {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 10;
}
</style>
