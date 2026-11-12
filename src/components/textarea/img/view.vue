<script setup lang="ts">
import {nodeViewProps, NodeViewWrapper} from "@tiptap/vue-3";
import {useI18n} from "vue-i18n";
import {useMediaViewerStore} from "~/stores/mediaViewerStore";

const props = defineProps(nodeViewProps);
const {t} = useI18n();
const mediaViewerStore = useMediaViewerStore();

/**
 * 收集当前编辑器上下文内的所有图片与视频，并打开全屏媒体查看器
 */
const onPreviewImage = () => {
  const currentSrc = props.node?.attrs?.src;
  if (!currentSrc) return;

  const mediaList: Array<{ src: string; type: 'image' | 'video' }> = [];

  // 从 TipTap 文档模型中遍历收集所有图片与视频节点
  if (props.editor) {
    try {
      props.editor.state.doc.descendants((node: any) => {
        if (node.type.name === 'Img' && node.attrs?.src) {
          mediaList.push({
            src: node.attrs.src,
            type: 'image',
          });
        } else if (node.type.name === 'Video' && node.attrs?.src) {
          mediaList.push({
            src: node.attrs.src,
            type: 'video',
          });
        }
      });
    } catch {
      // 容错降级
    }
  }

  // 若模型中未搜集到多媒体，尝试在 DOM 中检索
  if (mediaList.length === 0 && typeof document !== 'undefined') {
    const parent = document.querySelector('.textarea-wrapper') || document.querySelector('.ProseMirror');
    if (parent) {
      const imgElements = parent.querySelectorAll('.img-card img');
      imgElements.forEach((el) => {
        const src = (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src;
        if (src && !mediaList.some((m) => m.src === src)) {
          mediaList.push({
            src,
            type: 'image',
          });
        }
      });
    }
  }

  if (mediaList.length === 0) {
    mediaList.push({
      src: currentSrc,
      type: 'image',
    });
  }

  let initialIndex = mediaList.findIndex((m) => m.src === currentSrc);
  if (initialIndex < 0) {
    initialIndex = 0;
  }

  mediaViewerStore.open(mediaList, initialIndex);
};
</script>

<template>
  <node-view-wrapper>
    <!-- 图片卡片 S -->
    <v-card
        border
        class="my-3 bg-black img-card cursor-pointer"
        @click="onPreviewImage">
      <v-img :src="props.node.attrs.src" max-height="400"></v-img>
    </v-card>
    <!-- 图片卡片 E -->

    <!-- 纯文本模式兜底 S -->
    <div class="img-textized d-none">
      <v-icon icon="mdi-image-outline" size="16" color="amber" class="mr-1"></v-icon>
      <a :href="props.node.attrs.src" class="text-caption text-amber opacity-80" target="_blank" rel="noopener noreferrer">{{ props.node.attrs.src }}</a>
    </div>
    <!-- 纯文本模式兜底 E -->
  </node-view-wrapper>
</template>

<style lang="less">
.is-textized {
  .img-card {
    display: none !important;
  }
  .img-textized {
    display: inline-flex !important;
    align-items: center;
  }
}
</style>

<style scoped lang="less">
</style>
