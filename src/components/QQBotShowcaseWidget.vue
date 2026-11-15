<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import {useAssetsStore} from "~/stores/assetsStore";
import {useDisplay} from "vuetify/framework";
import {useMediaViewerStore, type MediaViewerItem} from "~/stores/mediaViewerStore";

const props = withDefaults(defineProps<{
  cardWidth?: number;
  cardHeight?: number;
  count?: number;
}>(), {
  cardWidth: 300,
  cardHeight: 575,
  count: 5
});

const images = import.meta.glob('@/assets/images/apps/qqBot/*', {eager: true});
const {serializationMap} = useAssetsStore();
const {mobile} = useDisplay();
const mediaViewerStore = useMediaViewerStore();

// 存储序列化后的图片地址字典
const contentImages = ref<Record<string, string>>({});

// 卡片尺寸
let size = ref({
  width: 300,
  height: 575,
});

watch(() => mobile.value, () => {
  size.value.width = props.cardWidth;
  size.value.height = props.cardHeight;
});

onMounted(() => {
  contentImages.value = serializationMap(images);

  size.value.width = props.cardWidth;
  size.value.height = props.cardHeight;
});

/**
 * 获取指定序号的展示图片地址
 *
 * @param id 截图序号
 */
const getUseImage = (id: string): string => {
  return contentImages.value[`use_${id}`] || '';
};

/**
 * 打开图片全屏大图预览查看器
 *
 * @param index 当前点击图片的索引
 */
const openPreview = (index: number) => {
  const mediaList: MediaViewerItem[] = [];
  for (let i = 1; i <= props.count; i++) {
    const src = getUseImage(String(i));
    if (src) {
      mediaList.push({
        src,
        type: 'image',
        title: `QQBot Showcase ${i}`,
      });
    }
  }

  if (mediaList.length > 0) {
    const targetIdx = index >= 0 && index < mediaList.length ? index : 0;
    mediaViewerStore.open(mediaList, targetIdx);
  }
};

defineOptions({
  name: "QQBotShowcaseWidget"
});
</script>

<template>
  <div class="qq-bot-showcase-widget">
    <!-- QQBot 截图横向展示与预览列表 S -->
    <HorizontalScrollList :forceDraggable="true" :showControls="true" :isIndicator="false">
      <v-card
          :width="size.width"
          :height="size.height"
          class="bg-black qq-bot-show-card cursor-pointer"
          rounded="lg"
          v-for="i in props.count"
          :key="i"
          @click="openPreview(i - 1)">
        <v-img height="100%" :src="getUseImage(String(i))" draggable="false" @dragstart.prevent class="img-wrap"/>
      </v-card>
    </HorizontalScrollList>
    <!-- QQBot 截图横向展示与预览列表 E -->
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/img";

.qq-bot-showcase-widget {
  width: 100%;
  position: relative;
}

.qq-bot-show-card {
  user-select: none;
  -webkit-user-select: none;
  cursor: pointer;

  :deep(img),
  :deep(.v-img__img) {
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
    user-drag: none;
  }
}
</style>
