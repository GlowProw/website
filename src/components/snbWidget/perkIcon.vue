<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { resolvePerkKey } from "@/assets/sripts/perk_resolver";
import { useCDNAssetsServiceStore } from "~/stores/cdnAssetsStore";

const props = withDefaults(
    defineProps<{ id: string, size?: string | number, isBorder?: boolean }>(),
    { size: 24, isBorder: true }
);

// 获取 CDN 静态资源存储服务
const cdnStore = useCDNAssetsServiceStore();

// 解析词条图标名称
const resolvedKey = computed(() => resolvePerkKey(props.id));

// 计算 CDN 图标图片地址
const iconSrc = computed(() => {
  const key = resolvedKey.value;
  if (!key) return '';
  return cdnStore.currentService.image.url({ id: key, category: 'perks' });
});

// 标记图片加载失败状态
const loadFailed = ref(false);

watch(resolvedKey, () => {
  loadFailed.value = false;
});

// 计算是否存在有效图标
const hasIcon = computed(() => !!iconSrc.value && !loadFailed.value);

defineOptions({
  name: 'PerkIcon'
});
</script>

<template>
  <!-- 词条效果指示图标 S -->
  <v-card
      elevation="0"
      class="w-100 h-100 d-flex justify-center align-center bg-transparent prohibit-drag"
      variant="text"
      :border="isBorder">
    <v-img
        v-if="hasIcon"
        :src="iconSrc"
        :width="size"
        :height="size"
        :border="isBorder"
        class="perk-indicator-icon"
        @error="loadFailed = true"></v-img>
  </v-card>
  <!-- 词条效果指示图标 E -->
</template>

<style scoped lang="less">
.perk-indicator-icon {
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
}
</style>
