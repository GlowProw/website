<template>
  <!-- 物品图标卡片外框 S -->
  <v-card
      width="100%"
      height="100%"
      variant="text"
      class="border item-slot-card prohibit-drag"
      :to="props.to || undefined"
      :target="props.target || undefined"
      :style="cardStyle"
      :class="[
          `ma-${computedMargin}`,
          `pa-${computedPadding}`,
          props.rarity ? `item-card-header-rarity-${props.rarity}` : '',
          { 'cursor-pointer': !!props.to || props.clickable }
      ]">
    <div class="item-slot-card-body d-flex align-center justify-center w-100 h-100 overflow-hidden position-relative">
      <slot></slot>
    </div>
  </v-card>
  <!-- 物品图标卡片外框 E -->
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { rarity } from '@/assets/sripts/index';
import { useIconGlobalStyle } from '@/assets/sripts/use_icon_global_style';

const props = withDefaults(
    defineProps<{
      rarity?: string;
      to?: string;
      target?: string;
      padding?: number;
      margin?: number;
      isAutoPadding?: boolean;
      isAutoMargin?: boolean;
      clickable?: boolean;
    }>(),
    {
      rarity: '',
      to: '',
      target: '_self',
      padding: 0,
      margin: 1,
      isAutoPadding: true,
      isAutoMargin: true,
      clickable: false,
    }
);

// 稀有度颜色映射配置
const rarityColorConfig = rarity.color;

// 全局图标边距 Hook
const { useIconImagePadding, useIconImageMargin } = useIconGlobalStyle();

const computedPadding = props.isAutoPadding
    ? useIconImagePadding(() => props.padding, 0)
    : computed(() => props.padding ?? 0);

const computedMargin = props.isAutoMargin
    ? useIconImageMargin(() => props.margin, 1)
    : computed(() => props.margin ?? 1);

/**
 * 依据稀有度计算卡片背景色彩样式
 */
const cardStyle = computed(() => {
  const r = props.rarity;
  const color = r ? rarityColorConfig[r] : '';
  if (color) {
    return {
      background: `hsl(from ${color} h s calc(l * .2))`,
    };
  }
  return {
    background: `hsl(from ${rarityColorConfig['common']} h s calc(l * .2))`,
  };
});

defineOptions({
  name: 'ItemSlotCard',
});
</script>

<style scoped lang="less">
.item-slot-card {
  box-sizing: border-box;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  position: relative;

  .item-slot-card-body {
    flex: 1 1 100%;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;

    :deep(.v-img),
    :deep(img) {
      width: 100%;
      height: 100%;
      display: block;
    }
  }
}
</style>
