<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, Ref, ref, watch} from "vue";
import {apis, getAppHost, getAppOrigin, storage_account} from "@/assets/sripts/index";
import {useRankingDesignedApi} from "@/assets/sripts/api/ranking_designed_service";
import {snapdom} from '@zumer/snapdom';
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {useNoticeStore} from "~/stores/noticeStore";
import {useGoTo} from "vuetify";
import RankingDesignedPoster from "@/components/RankingDesignedPoster.vue";
import {handleApiError} from "@/assets/sripts/error_handler";
import AdsWidget from "@/components/ads/google/index.vue";
import languagesConfig from "@/config/languages";
import Loading from "@/components/Loading.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import SharePosterSettingPanel from "@/components/SharePosterSettingPanel.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import VerticalScrollList from "@/components/VerticalScrollList.vue";
import Silk from "@/components/Silk.vue";

const route = useRoute(),
    router = useRouter(),
    goto = useGoTo(),
    notice = useNoticeStore(),
    {t, locale} = useI18n(),
    {mobile} = useDisplay(),
    rankingApi = useRankingDesignedApi();

// 天梯详情数据
let rankingDetailData: Ref<any> = ref({});

// 天梯海报生成配置
let generateImageValue: Ref<any> = ref({
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
  language: locale.value,
});

// 海报生成尺寸与格式预设配置
const generateImageConfig = ref({
  widths: [1050, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 2048],
  formats: ['png', 'jpg', 'webp'],
  qualitys: [.6, .8, .9, 1],
  backgrounds: ['#1a1a1a', '#000', '#0a0d12', '#121924', 'rgb(35,26,0)'],
  languages: languagesConfig.child
});

// 海报组件引用
const captureRef = ref<any>(null);
// 详情数据加载状态
const rankingLoading = ref(false);
// 海报生成渲染中状态
const generatedLoading = ref(false);
// 生成海报阶段提示文本
const generatingStepText = ref('');
// 海报持久化配置开关
const posterSwitch = ref(true);
// 当前天梯详情绝对访问路径
const path = ref("");
// 站点主机域名
const webPath = computed(() => getAppHost());

// 幻灯片缩略图地址
const rankingThumbUrl = ref('');
// 幻灯片缩略图捕获中状态
const rankingThumbLoading = ref(false);

/**
 * 安全解码 URI 编码字符串
 *
 * @param str 原始字符串
 */
const safeDecodeURI = (str: string): string => {
  if (!str) return "";
  try {
    return decodeURIComponent(str);
  } catch {
    try {
      return decodeURI(str);
    } catch {
      return str;
    }
  }
};

/**
 * 极速捕获海报最低质量缩略图
 *
 * @param node 待捕获的目标 DOM 节点
 */
const captureThumbnail = async (node: HTMLElement): Promise<string> => {
  const res = await snapdom(node, {
    scale: 0.25,
    quality: 0.1,
    fast: true,
    cacheBust: false,
    filter: (n: any) => {
      if (n instanceof HTMLElement) {
        return !(n.tagName === 'IMG' && n.classList.contains('ProseMirror-separator'));
      }
      return true;
    }
  } as any);

  const blob = await res.toBlob({
    type: 'jpg',
    quality: 0.1
  } as any);

  return URL.createObjectURL(blob);
};

/**
 * 更新左侧幻灯片缩略图
 */
const updateThumbnail = async () => {
  const node = captureRef.value?.posterEl;
  if (!node) return;
  try {
    rankingThumbLoading.value = true;
    await nextTick();
    await new Promise(r => setTimeout(r, 400));
    const url = await captureThumbnail(node);
    if (rankingThumbUrl.value && rankingThumbUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(rankingThumbUrl.value);
    }
    rankingThumbUrl.value = url;
  } catch (err) {
    console.error('Failed to capture ranking thumbnail:', err);
  } finally {
    rankingThumbLoading.value = false;
  }
};

/**
 * 监听海报显示相关属性变化，触发重新装载天梯数据
 */
watch(() => [
  generateImageValue.value.isShowItemName
], () => {
  loadRankingData();
});

/**
 * 监听海报配置变化，同步写入 URL 查询参数和本地存储
 */
watch(() => generateImageValue.value, (value) => {
  router.push({
    name: route.name as any,
    query: {...route.query, ...generateImageValue.value} as any,
  });

  // 保存天梯海报配置
  if (value && posterSwitch.value) {
    storage_account.updateConfiguration('poster', 'ranking.poster.config', value);
  }
}, {deep: true});

/**
 * 监听路由参数变化，重新获取天梯详情
 */
watch(() => route.params.uuid, () => {
  getRankingDetail();
});

/**
 * 监听海报配置变化，刷新缩略图
 */
watch(
    () => generateImageValue.value,
    () => {
      updateThumbnail();
    },
    {deep: true}
);

/**
 * 页面挂载：读取海报开关与配置、合并 URL 参数、拉取天梯详情
 */
onMounted(() => {
  const resolved = router.resolve({
    name: 'RankingDesignedItemsDetail',
    params: { uuid: String(route.params.uuid || '') }
  });
  path.value = getAppOrigin() + resolved.href;
  posterSwitch.value = storage_account.getConfigurationItem('poster', 'poster.switch');

  if (posterSwitch.value) {
    generateImageValue.value = storage_account.getConfigurationItem('poster', 'ranking.poster.config', {
      defaultValue: generateImageValue.value
    });
  }

  if (route.query) {
    const query = {...route.query} as any;
    const booleanKeys = ['isShowItemName', 'isShowHeader', 'isShowTitle', 'isShowTabs', 'isShowDescription'];
    const numberKeys = ['width', 'quality'];

    booleanKeys.forEach(key => {
      if (query[key] !== undefined) {
        query[key] = query[key] === 'true';
      }
    });

    numberKeys.forEach(key => {
      if (query[key] !== undefined) {
        query[key] = Number(query[key]);
      }
    });

    generateImageValue.value = Object.assign(generateImageValue.value, query);
  }

  getRankingDetail();
});

/**
 * 页面卸载：清理缩略图 blob URL
 */
onUnmounted(() => {
  if (rankingThumbUrl.value && rankingThumbUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(rankingThumbUrl.value);
  }
});

/**
 * 获取天梯详情数据并解析结构
 */
const getRankingDetail = async () => {
  try {
    const {uuid} = route.params;
    rankingLoading.value = true;

    const result = await rankingApi.getRankingItem(<string>uuid);
    const d = result.data?.data || result.data;

    if (!d) {
      notice.error(t('rankingDesignedItems.notFound'));
      router.push({name: 'RankingDesignedItemsBrowse'});
      return;
    }

    let parsedTags = d.tags;
    if (typeof parsedTags === "string") {
      try {
        parsedTags = JSON.parse(parsedTags);
      } catch {
        parsedTags = [];
      }
    }

    let parsedAttr = d.attr;
    if (typeof parsedAttr === "string") {
      try {
        parsedAttr = JSON.parse(parsedAttr);
      } catch {
        parsedAttr = {};
      }
    }

    rankingDetailData.value = {
      ...d,
      tags: Array.isArray(parsedTags) ? parsedTags : [],
      attr: Object.assign(
          {
            useVersion: "1.0.0",
            language: "zh_CN",
            isComment: true,
            isLike: true,
            isAllowClone: true,
            isShowItemName: false,
            isAnonymous: false,
          },
          parsedAttr
      ),
      description: safeDecodeURI(
          d.description || t("rankingDesignedItems.detail.noDescription")
      ),
    };

    generateImageValue.value.filename = rankingDetailData.value.name || 'ranking';

    await loadRankingData();
  } catch (e) {
    handleApiError(e, notice, t, { component: 'RankingDesignedShare' });
  } finally {
    rankingLoading.value = false;
  }
};

/**
 * 装载天梯海报画布数据
 */
const loadRankingData = async () => {
  await nextTick(() => {
    if (captureRef.value?.loadRankingData) {
      captureRef.value.loadRankingData();
    }
  });

  setTimeout(() => {
    updateThumbnail();
  }, 500);
};

/**
 * 确保海报内所有图片均已完成解码加载
 *
 * @param element 目标渲染容器 DOM
 */
const ensureImagesLoaded = async (element: HTMLElement) => {
  const imgs = Array.from(element.querySelectorAll('img'));
  const backgrounds = Array.from(element.querySelectorAll('*')).filter(el => {
    const bg = window.getComputedStyle(el).backgroundImage;
    return bg && bg !== 'none' && bg.startsWith('url');
  });

  const loadImg = async (src: string) => {
    if (!src) return;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => img.decode().then(resolve).catch(resolve);
      img.onerror = resolve;
      img.src = src;
    });
  };

  const tasks = [
    ...imgs.map(img => loadImg(img.src)),
    ...backgrounds.map(el => {
      const bg = window.getComputedStyle(el).backgroundImage;
      const url = bg.match(/url\(["']?([^"']+)["']?\)/)?.[1];
      return url ? loadImg(url) : Promise.resolve();
    })
  ];

  await Promise.all(tasks);
};

/**
 * 截取并下载单个海报节点
 *
 * @param node 海报 DOM 节点
 * @param config 渲染尺寸及格式配置
 * @param filename 输出图片文件名
 */
const capturePosterNode = async (node: HTMLElement, config: any, filename: string) => {
  const sandboxElements: { el: HTMLElement, style: string }[] = [];
  let current: HTMLElement | null = node.parentElement;
  while (current) {
    sandboxElements.push({ el: current, style: current.style.cssText });
    current.style.setProperty('overflow', 'visible', 'important');
    current.style.setProperty('clip-path', 'none', 'important');
    current = current.parentElement;
  }

  const originalStyles = node.style.cssText;
  const width = config.width || 1400;
  node.style.cssText += `; position: fixed !important; left: -${width * 3}px !important; top: 0 !important; z-index: 99999 !important; width: ${width}px !important; min-width: ${width}px !important; opacity: 1 !important; visibility: visible !important; display: block !important; height: auto !important; max-height: none !important;`;

  await new Promise(r => setTimeout(r, 500));
  await ensureImagesLoaded(node);
  await document.fonts.ready;

  const mdiStyle = document.createElement('style');
  mdiStyle.id = 'mdi-style-inject';
  let mdiCss = '';
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const isMdi = sheet.href?.includes('materialdesignicons') ||
            Array.from(sheet.cssRules).some(r => r.cssText.includes('Material Design Icons'));
        if (isMdi) {
          for (const rule of Array.from(sheet.cssRules)) {
            mdiCss += rule.cssText;
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
  mdiStyle.innerHTML = mdiCss;
  node.appendChild(mdiStyle);

  const tonalFixStyle = document.createElement('style');
  tonalFixStyle.id = 'tonal-fix-inject';
  tonalFixStyle.innerHTML = `
    .v-card--variant-tonal > .v-card__underlay,
    .v-chip--variant-tonal > .v-chip__underlay,
    .v-chip > .v-chip__underlay,
    .v-card--variant-tonal .v-card__underlay {
      background: currentColor !important;
      opacity: 0.08 !important;
    }
    .v-card--variant-elevated > .v-card__underlay,
    .v-card--variant-outlined > .v-card__underlay {
      opacity: 0 !important;
    }
  `;
  node.appendChild(tonalFixStyle);

  node.classList.add('is-capturing');
  await new Promise(r => setTimeout(r, 350));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  const d = await snapdom(node, {
    width: config.width,
    scale: mobile.value ? window.devicePixelRatio * 2 : window.devicePixelRatio,
    embedFonts: true,
    iconFonts: ['Material Design Icons', 'MaterialDesignIcons', 'materialdesignicons', 'Material Icons'],
    quality: config.quality,
    filter: (n: any) => {
      if (n instanceof HTMLElement) {
        return !(n.tagName === 'IMG' && n.classList.contains('ProseMirror-separator'));
      }
      return true;
    },
    cacheBust: false
  } as any);

  await d.download({
    quality: config.quality,
    format: config.format,
    filename: `${filename}.${config.format}`
  } as any);

  node.classList.remove('is-capturing');
  tonalFixStyle.remove();
  mdiStyle.remove();
  node.style.cssText = originalStyles;
  sandboxElements.forEach(({ el, style }) => el.style.cssText = style);
};

/**
 * 触发海报高清渲染与图片下载流程
 */
const onGeneratedShare = async () => {
  try {
    generatedLoading.value = true;
    generatingStepText.value = t('rankingDesignedItems.share.generating');
    await nextTick();

    await goto('#share-footer');

    const rankingNode = captureRef.value?.posterEl;
    if (rankingNode) {
      await goto(0, { duration: 1200 });
      const rankingFilename = generateImageValue.value.filename || rankingDetailData.value.name || 'ranking';
      await capturePosterNode(rankingNode, generateImageValue.value, rankingFilename);
    }

    notice.success(t('basic.tips.operateSuccess'));
  } catch (e) {
    handleApiError(e, notice, t, { component: 'RankingDesignedSharePoster' });
    if (captureRef.value?.posterEl) {
      captureRef.value.posterEl.classList.remove('is-capturing');
    }
  } finally {
    setTimeout(() => {
      generatedLoading.value = false;
      generatingStepText.value = '';
    }, 500);
  }
};

/**
 * 返回天梯详情页
 */
const onBackDetail = () => {
  router.push({
    name: 'RankingDesignedItemsDetail',
    params: { uuid: String(route.params.uuid || '') }
  });
};
</script>

<template>
  <!-- 顶部横幅 S -->
  <v-card height="200px">
    <template v-slot:image>
      <Silk
          :speed="3"
          :scale=".7"
          :color="'#1c1c1c'"
          :noise-intensity="0.1"
          :rotation="-.6"
          class="bg-black">
      </Silk>
    </template>
    <template v-slot:default>
      <v-breadcrumbs density="compact" class="ma-0 pa-0">
        <v-container>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/ranking-designed-items">{{ t('rankingDesignedItems.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item :to="{ name: 'RankingDesignedItemsDetail', params: { uuid: route.params.uuid } }">{{ t('rankingDesignedItems.detail.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('rankingDesignedItems.share.title') }}</v-breadcrumbs-item>
        </v-container>
      </v-breadcrumbs>
      <v-divider opacity=".01"></v-divider>

      <v-container class="position-relative">
        <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
          <v-icon icon="mdi-presentation" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>
  <!-- 顶部横幅 E -->
  <v-divider opacity=".06"></v-divider>

  <!-- 主体海报展示区 S -->
  <v-container class="my-5 position-relative">
    <AdsWidget class="my-5" id="none"></AdsWidget>

    <v-row>
      <!-- 左侧幻灯片缩略图 S -->
      <v-col cols="2" v-if="!mobile">
        <AffixContainerView>
          <VerticalScrollList>
            <div class="ppt-slide-thumb mb-4 cursor-pointer is-active">
              <div
                  class="slide-card-box"
                  :style="`background:${generateImageValue.background}`">
                <Loading v-if="rankingThumbLoading || !rankingThumbUrl" size="80"></Loading>
                <img
                    v-else
                    :src="rankingThumbUrl"
                    class="slide-thumb-img"
                    alt="Tier List Slide" />
              </div>
            </div>
          </VerticalScrollList>
        </AffixContainerView>
      </v-col>
      <!-- 左侧幻灯片缩略图 E -->

      <!-- 海报主体展示区 S -->
      <v-col :cols="mobile ? 12 : 10" class="overflow-auto">
        <section id="poster-page-ranking" class="poster-section mb-12">
          <div class="position-relative" :class="{'opacity-20': mobile}">
            <HorizontalScrollList :is-indicator="false" :is-follow-screen-center="true" :follow-screen-safe-distance="300">
              <RankingDesignedPoster
                  ref="captureRef"
                  :detail-data="rankingDetailData"
                  :generate-image-value="generateImageValue"
                  :path="path"
                  :web-path="webPath"
                  :loading="rankingLoading"
                  :page-info="{ current: 1, total: 1 }" />
            </HorizontalScrollList>
          </div>
        </section>
      </v-col>
      <!-- 海报主体展示区 E -->
    </v-row>
  </v-container>
  <!-- 主体海报展示区 E -->

  <!-- 生成海报加载遮罩 S -->
  <v-overlay
      :model-value="generatedLoading"
      persistent
      :z-index="2000"
      class="blur-load d-flex align-center justify-center"
      opacity=".92">
    <v-card variant="text" class="text-center">
      <Loading size="120" class="mb-5"></Loading>
      <div class="text-h5 text-amber font-weight-bold" style="text-shadow: 0 2px 10px rgba(0,0,0,0.5)">
        {{ generatingStepText || t('rankingDesignedItems.share.generating') }}
      </div>
      <div class="text-caption text-grey-lighten-1 mt-2">
        {{ t('rankingDesignedItems.share.generatingHint') }}
      </div>
    </v-card>
  </v-overlay>
  <!-- 生成海报加载遮罩 E -->

  <!-- 底部操作固定栏 S -->
  <div class="position-fixed bottom-0 w-100 bg-black" style="z-index: 120">
    <v-divider thickness="2" opacity=".3"></v-divider>

    <v-container>
      <v-alert v-if="mobile" type="error" variant="tonal" density="compact" class="mb-3">
        {{ t('rankingDesignedItems.share.notMobile') }}
      </v-alert>

      <v-row>
        <v-col>
          <v-btn height="50" @click="getRankingDetail" class="mr-3" :loading="rankingLoading">
            <v-icon icon="mdi-refresh" size="20" :class="[rankingLoading ? 'spin-icon-load' : '']" />
          </v-btn>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="auto">
          <v-btn height="50" @click="onBackDetail" class="mr-3">{{ t('basic.button.cancel') }}</v-btn>

          <v-btn-group>
            <v-btn
                height="50"
                class="bg-amber text-black"
                :loading="generatedLoading"
                :disabled="mobile || generatedLoading || rankingDetailData.uuid == null"
                @click="onGeneratedShare">
              {{ t('rankingDesignedItems.share.createPoster') }}
            </v-btn>
            <v-divider vertical></v-divider>
            <v-menu open-on-click :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-btn height="50" class="bg-amber text-black" icon :disabled="mobile" v-bind="props">
                  <v-icon>mdi-cog</v-icon>
                </v-btn>
              </template>

              <!-- 设置面板 S -->
              <SharePosterSettingPanel
                  type="ranking"
                  :ranking-model-value="generateImageValue"
                  :generate-image-config="generateImageConfig"
                  @update:ranking-model-value="generateImageValue = $event" />
              <!-- 设置面板 E -->
            </v-menu>
          </v-btn-group>
        </v-col>
      </v-row>
    </v-container>
  </div>
  <!-- 底部操作固定栏 E -->

  <div id="share-footer"></div>
</template>

<style scoped lang="less">
@import "@/assets/styles/icon";

.ppt-slide-thumb {
  position: relative;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.08);
  transition: all 0.25s ease;
  user-select: none;

  &.is-active {
    border-color: #ffb300 !important;
    box-shadow: 0 0 16px rgba(255, 179, 0, 0.35);
    background: rgba(255, 179, 0, 0.06);
  }

  .slide-card-box {
    width: 100%;
    height: 260px;
    overflow: hidden;
    position: relative;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.4);
    pointer-events: none;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;

    .slide-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  }
}

.poster-section {
  scroll-margin-top: 90px;
}
</style>

