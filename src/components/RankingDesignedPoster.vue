<script setup lang="ts">
import {computed, nextTick, onMounted, provide, ref, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import QRCode from "qrcode";

import RankingDesignedView from "@/components/RankingDesignedView.vue";
import Loading from "@/components/Loading.vue";
import Textarea from "@/components/textarea/index.vue";
import Logo from "@/components/Logo.vue";
import AssemblySvgIcon from "@/components/AssemblySvgIcon.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import AssemblyTagChip from "@/components/AssemblyTagChip.vue";

const props = defineProps({
  detailData: {
    type: Object,
    default: () => ({})
  },
  generateImageValue: {
    type: Object,
    default: () => ({
      isShowItemName: true,
      isShowHeader: true,
      isShowTitle: true,
      isShowTabs: true,
      isShowDescription: true,
      filename: '',
      width: 1400,
      format: 'jpg',
      quality: 1,
      background: '#000',
      language: 'zh_CN'
    })
  },
  path: {
    type: String,
    default: ""
  },
  webPath: {
    type: String,
    default: ""
  },
  loading: {
    type: Boolean,
    default: false
  },
  textization: {
    type: Array as () => string[],
    default: () => ['video']
  },
  pageInfo: {
    type: Object as () => { current: number; total: number },
    default: () => ({ current: 1, total: 1 })
  }
});

const {t} = useI18nUtils(computed(() => props.generateImageValue.language));

// 分发语言上下文至子组件
provide('context-locale', computed(() => props.generateImageValue.language));

// 海报捕获根容器引用
const captureRef = ref(null);
// 天梯画布视图引用
const rankingDetailRef = ref<any>(null);
// 二维码画布引用
const qrCanvasRef = ref<HTMLCanvasElement | null>(null);

// 作者显示名称
const authorDisplayName = computed(() => {
  return props.detailData.authorUsername ||
      props.detailData.authorAlternativeName ||
      props.detailData.username ||
      t('assembly.anonymous');
});

// 作者头像地址
const authorAvatarUrl = computed(() => {
  return props.detailData.authorAvatar ||
      props.detailData.userAvatar ||
      '';
});

/**
 * 监听海报目标链接变化并刷新二维码
 */
watch(() => props.path, (newPath) => {
  if (newPath) onGenerateQRCode(newPath);
});

/**
 * 监听是否显示物品名称变化并重载天梯视图
 */
watch(() => props.generateImageValue.isShowItemName, () => {
  loadRankingData();
});

/**
 * 页面挂载时初始化二维码渲染
 */
onMounted(() => {
  if (props.path) {
    onGenerateQRCode(props.path);
  }
});

/**
 * 渲染目标分享链接的二维码画布
 *
 * @param text 二维码目标网址
 */
const onGenerateQRCode = async (text: string) => {
  try {
    if (qrCanvasRef.value && text) {
      await QRCode.toCanvas(qrCanvasRef.value, text, {
        width: 100,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    }
  } catch (err) {
    console.error(err);
  }
};

/**
 * 装载天梯详情数据并配置海报视图属性
 */
const loadRankingData = async () => {
  await nextTick(() => {
    if (rankingDetailRef.value) {
      if (typeof rankingDetailRef.value.setSetting === "function") {
        rankingDetailRef.value.setSetting({
          ...(props.detailData?.attr || {}),
          isShowItemName: props.generateImageValue.isShowItemName
        });
      }
      if (typeof rankingDetailRef.value.onLoad === "function") {
        const rawData =
            typeof props.detailData?.data === "string"
                ? JSON.parse(props.detailData.data)
                : props.detailData?.data;
        rankingDetailRef.value.onLoad(rawData);
      }
    }
  });
};

defineExpose({
  loadRankingData,
  posterEl: computed(() => (captureRef.value as any)?.$el || captureRef.value)
});
</script>

<template>
  <v-defaults-provider :defaults="{ VImg: { eager: true } }">
    <v-card
        id="capture"
        min-height="300"
        variant="text"
        ref="captureRef"
        class="share mx-auto pt-5"
        :style="`background: ${generateImageValue.background};width:${generateImageValue.width}px`">
      <!-- 头部标识 S -->
      <v-row no-gutters class="px-5" align="center" v-if="generateImageValue.isShowHeader">
        <v-col cols="auto">
          <Logo></Logo>
        </v-col>
        <v-col class="d-flex">
          {{ t('name') }}
          <v-divider vertical inset class="mx-3" thickness="2" opacity=".3"></v-divider>
          {{ webPath }}
        </v-col>
        <v-col cols="auto" class="opacity-30">
          {{ detailData?.uuid || '' }}
        </v-col>
      </v-row>
      <!-- 头部标识 E -->

      <!-- 海报标题 S -->
      <v-row class="px-10" :class="{'pt-5': !generateImageValue.isShowHeader}" v-if="detailData.name && generateImageValue.isShowTitle">
        <b class="text-amber text-h4 w-100">{{ detailData.name }}</b>
      </v-row>
      <!-- 海报标题 E -->

      <!-- 天梯主体 S -->
      <v-card variant="text" class="px-5 my-2">
        <RankingDesignedView
            ref="rankingDetailRef"
            :readonly="true">
        </RankingDesignedView>
      </v-card>
      <!-- 天梯主体 E -->

      <!-- 标签与描述区 S -->
      <div class="px-10">
        <div class="ga-2 mb-6 mt-4" v-if="detailData.tags && detailData.tags.length > 0 && generateImageValue.isShowTabs">
          <AssemblyTagChip
              class="mr-2 mb-2 pt-1 pb-1 pl-5 pr-5"
              v-for="(i, index) in detailData.tags"
              :key="index"
              :tag="i"
              :locale="generateImageValue.language"/>
        </div>

        <Textarea
            class="mt-5"
            v-if="detailData.description && generateImageValue.isShowDescription"
            readonly
            :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
            :min-height="'0'"
            :model-value="detailData.description"
            :locale="generateImageValue.language"
            :textization="textization"></Textarea>

        <v-row class="opacity-80 mt-5 pb-5" v-show="!loading">
          <v-col>
            <div v-if="authorAvatarUrl" class="mb-1">
              <div class="d-inline-flex">
                <v-card class="mr-1">
                  <UserAvatar size="25" :src="authorAvatarUrl"></UserAvatar>
                </v-card>
                {{ authorDisplayName }}
              </div>
            </div>

            <AssemblySvgIcon name="link"></AssemblySvgIcon>
            {{ path }}
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <canvas ref="qrCanvasRef" class="rounded-sm"></canvas>
          </v-col>
        </v-row>

        <div v-if="pageInfo && pageInfo.total > 1" class="text-center opacity-40 text-caption font-weight-bold pb-2 pt-1">
          {{ pageInfo.current }} / {{ pageInfo.total }}
        </div>
      </div>
      <!-- 标签与描述区 E -->

      <!-- 加载遮罩 S -->
      <v-overlay :model-value="loading" contained :z-index="10" opacity="1" class="d-flex justify-center align-center">
        <Loading size="120"></Loading>
      </v-overlay>
      <!-- 加载遮罩 E -->
    </v-card>
  </v-defaults-provider>
</template>

<style scoped lang="less">
@import "@/assets/styles/icon";

.share {
  pointer-events: none;
  user-select: none;

  &:after {
    content: "";
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
</style>

