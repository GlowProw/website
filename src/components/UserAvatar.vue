<template>
  <!-- 头像展示容器 S -->
  <v-avatar
      icon="ios-person"
      class="user-avatar d-flex justify-center align-center bg-black img img-wrap"
      :class="{'cursor-pointer': canPreview}"
      :shape="shape"
      :rounded="tile ? 0 : ''"
      :size="size"
      :image="newSrc">
    <img
        :src="newSrc"
        width="100%"
        height="100%"
        v-show="imageStatus === 1"
        class="ivu-avatar-square"
        @load="imageStatus = 1"
        @error="loadImageError"/>
    <v-icon :size="Number(size) / 2.4" class="opacity-60" v-show="imageStatus === 0">mdi-account</v-icon>
  </v-avatar>
  <!-- 头像展示容器 E -->
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {normalizeAvatarUrl} from "@/assets/sripts/avatar";
import {useMediaViewerStore} from "~/stores/mediaViewerStore";

const props = withDefaults(defineProps<{
  size?: number | string;
  tile?: boolean;
  shape?: string;
  src?: string;
  previewable?: boolean;
}>(), {
  size: 150,
  tile: false,
  shape: 'square',
  src: '',
  previewable: true,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const mediaViewerStore = useMediaViewerStore();

// 头像加载状态：0 加载中或异常回退，1 加载成功正常显示
const imageStatus = ref(0);
const newSrc = ref('');
const jxIndex = ref(0);

// Gravatar 镜像备用源列表
const jx = [
  "https://gravatar.loli.net/avatar/",
  "https://cdn.v2ex.com/gravatar/",
  "https://cdn.sep.cc/avatar/",
];

// 是否允许点击放大预览
const canPreview = computed(() => {
  return props.previewable && Boolean(newSrc.value) && imageStatus.value === 1;
});

watch(() => props.src, (val) => {
  imageStatus.value = 0;
  jxIndex.value = 0;
  newSrc.value = normalizeAvatarUrl(val);
}, {immediate: true});

/**
 * 头像图片加载失败时轮换至备用 Gravatar 镜像源
 */
const loadImageError = () => {
  if (jxIndex.value >= -1 && jxIndex.value < jx.length) {
    const prevDomain = jxIndex.value === 0 ? 'https://www.gravatar.com/avatar/' : jx[jxIndex.value - 1];
    newSrc.value = newSrc.value.replaceAll(prevDomain, jx[jxIndex.value]);
    jxIndex.value += 1;
  }
};
</script>

<style scoped lang="less">
@import "@/assets/styles/img";
</style>
