<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, Ref, ref, watch} from "vue";
import {apis, storage_account} from "@/assets/sripts/index";
import {snapdom} from '@zumer/snapdom';
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {useNoticeStore} from "~/stores/noticeStore";
import {useGoTo} from "vuetify";
import AssemblyPoster from "@/components/AssemblyPoster.vue";
import MasteryPoster from "@/components/mastery/MasteryPoster.vue";
import {ApiError} from "@/assets/types/Api";
import {handleApiError} from "@/assets/sripts/error_handler";
import AdsWidget from "@/components/ads/google/index.vue";
import languagesConfig from "@/config/languages";
import Loading from "@/components/Loading.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import SharePosterSettingPanel from "@/components/SharePosterSettingPanel.vue";
import {useMasteryController} from "@/assets/sripts/use_mastery_controller";
import MasteryDataProcessing from "@/assets/sripts/mastery_data_processing";
import AffixContainerView from "@/components/AffixContainerView.vue";
import VerticalScrollList from "@/components/VerticalScrollList.vue";
import Silk from "@/components/Silk.vue";

const route = useRoute(),
    router = useRouter(),
    goto = useGoTo(),
    notice = useNoticeStore(),
    {t, locale} = useI18n(),
    {mobile} = useDisplay();

// 配装数据
let assemblyDetailData: Ref<any> = ref({});

// 配装海报生成配置
let generateImageValue: Ref<any> = ref({
  isShowEmptySlot: true,
  isShowItemName: true,
  isFullName: false,
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

// 精通海报生成配置
let masteryGenerateImageValue: Ref<any> = ref({
  isShowHeader: true,
  isShowTitle: true,
  isShowTree: true,
  isShowSeasonal: true,
  isShowEffects: true,
  isShowQrCode: true,
  filename: '',
  width: 1600,
  format: 'jpg',
  quality: 1,
  background: '#0a0d12',
  language: locale.value,
  viewMode: 'full'
});

const generateImageConfig = ref({
  widths: [1050, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 2048],
  formats: ['png', 'jpg', 'webp'],
  qualitys: [.6, .8, .9, 1],
  backgrounds: ['#1a1a1a', '#000', '#0a0d12', '#121924', 'rgb(35,26,0)'],
  languages: languagesConfig.child
});

const captureRef = ref<any>(null);
const masteryCaptureRef = ref<any>(null);
const assemblyLoading = ref(false);
const generatedLoading = ref(false);
const generatingStepText = ref('');
const posterSwitch = ref(true);
const path = ref("");
const webPath = computed(() => window.location.host);

const assemblyThumbUrl = ref('');
const assemblyThumbLoading = ref(false);
const masteryThumbUrl = ref('');
const masteryThumbLoading = ref(false);

/**
 * 极速捕获海报最低质量缩略图
 * @param node
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

const updateAssemblyThumbnail = async () => {
  const node = captureRef.value?.posterEl;
  if (!node) return;
  try {
    assemblyThumbLoading.value = true;
    await nextTick();
    await new Promise(r => setTimeout(r, 400));
    const url = await captureThumbnail(node);
    if (assemblyThumbUrl.value && assemblyThumbUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(assemblyThumbUrl.value);
    }
    assemblyThumbUrl.value = url;
  } catch (err) {
    console.error('Failed to capture assembly thumbnail:', err);
  } finally {
    assemblyThumbLoading.value = false;
  }
};

const updateMasteryThumbnail = async () => {
  if (!hasMastery.value) return;
  const node = masteryCaptureRef.value?.posterEl;
  if (!node) return;
  try {
    masteryThumbLoading.value = true;
    await nextTick();
    await new Promise(r => setTimeout(r, 400));
    const url = await captureThumbnail(node);
    if (masteryThumbUrl.value && masteryThumbUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(masteryThumbUrl.value);
    }
    masteryThumbUrl.value = url;
  } catch (err) {
    console.error('Failed to capture mastery thumbnail:', err);
  } finally {
    masteryThumbLoading.value = false;
  }
};

// 精通控制器及数据
const {
  selectedSeasonId,
  seasonOptions,
  activeTree,
  maxPoints,
  localNodes,
  selectedNodeIds,
  selectedSeasonalPerks,
  regularPointsSpent,
  activeSeasonalPerks,
  aggregatedEffects,
  getSkillName,
  getSkillDesc,
  getNodeIconUrl,
  isNodeActive,
  isNodeAvailable,
  getCategoryColor,
  generateShareCode
} = useMasteryController({});

// 是否包含精通方案
const hasMastery = ref(false);
const totalPosterPages = computed(() => (hasMastery.value ? 2 : 1));

// 当前选中的 PPT 幻灯片索引 (0: 配装, 1: 精通)
const currentSlideIndex = ref(0);

// 精通方案名称（对应 assembly 名称 + 精通名称）
const masterySeasonTitle = computed(() => {
  const sTitle = seasonOptions.value?.find(s => s.id === selectedSeasonId.value)?.title || selectedSeasonId.value;
  const aName = assemblyDetailData.value?.name || '';
  return aName ? `${aName} - ${sTitle || t('mastery.title')}` : (sTitle || t('mastery.title'));
});

// 精通分享链接（供二维码使用）
const masterySharePath = computed(() => {
  const code = generateShareCode();
  return `${window.location.origin}/mastery?season=${selectedSeasonId.value}&share=${code}`;
});

watch(() => [
  generateImageValue.value.isFullName,
  generateImageValue.value.isShowItemName
], () => {
  loadAssemblyData();
});

watch(() => generateImageValue.value, (value) => {
  router.push({
    name: route.name as any,
    query: {...route.query, ...generateImageValue.value} as any,
  });

  // 保存配装海报配置
  if (value && posterSwitch.value) {
    storage_account.updateConfiguration('poster', 'poster.config', value);
  }
}, {deep: true});

watch(() => masteryGenerateImageValue.value, (value) => {
  // 保存精通海报配置
  if (value && posterSwitch.value) {
    storage_account.updateConfiguration('poster', 'mastery.poster.config', value);
  }
}, {deep: true});

watch(() => route, () => {
  getAssemblyDetail();
});

watch(
    () => [masteryGenerateImageValue.value, generateImageValue.value],
    () => {
      updateAssemblyThumbnail()
      updateMasteryThumbnail()
    },
    {deep: true}
)

onMounted(() => {
  path.value = webPath.value + router.resolve({name: 'AssemblyDetail'}).path;
  posterSwitch.value = storage_account.getConfigurationItem('poster', 'poster.switch');

  if (posterSwitch.value) {
    generateImageValue.value = storage_account.getConfigurationItem('poster', 'poster.config', {
      defaultValue: generateImageValue.value
    });
    masteryGenerateImageValue.value = storage_account.getConfigurationItem('poster', 'mastery.poster.config', {
      defaultValue: masteryGenerateImageValue.value
    });
  }

  if (route.query) {
    const query = {...route.query} as any;
    const booleanKeys = ['isShowEmptySlot', 'isShowItemName', 'isFullName', 'isShowHeader', 'isShowTitle', 'isShowTabs', 'isShowDescription'];
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

  getAssemblyDetail();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  if (assemblyThumbUrl.value && assemblyThumbUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(assemblyThumbUrl.value);
  }
  if (masteryThumbUrl.value && masteryThumbUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(masteryThumbUrl.value);
  }
});

// 监听滚动自动高亮左侧当前幻灯片
const handleScroll = () => {
  if (!hasMastery.value) {
    currentSlideIndex.value = 0;
    return;
  }
  const masteryEl = document.getElementById('poster-page-mastery');
  if (masteryEl) {
    const rect = masteryEl.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.45) {
      currentSlideIndex.value = 1;
      return;
    }
  }
  currentSlideIndex.value = 0;
};

/**
 * 点击左侧缩略图滚动到对应位置
 */
const scrollToSlide = (index: number) => {
  currentSlideIndex.value = index;
  const targetId = index === 0 ? '#poster-page-assembly' : '#poster-page-mastery';
  goto(targetId, {
    duration: 500,
    offset: -80
  });
};

/**
 * 获取配装详情
 */
const getAssemblyDetail = async () => {
  try {
    const {uuid} = route.params;
    const {password} = route.query;

    assemblyLoading.value = true;

    const result = await apis.assemblyApi().getAssemblyItem(<string>uuid, {password: <string>password}),
        d = result.data;

    assemblyDetailData.value = d.data;
    generateImageValue.value.filename = assemblyDetailData.value.name as string;

    await loadAssemblyData();
  } catch (e) {
    handleApiError(e, notice, t, { component: 'AssemblyShare' });
  } finally {
    assemblyLoading.value = false;
  }
};

/**
 * 装载配装与精通数据
 */
const loadAssemblyData = async () => {
  await nextTick(() => {
    if (captureRef.value) {
      // @ts-ignore
      captureRef.value.loadAssemblyData();
    }
  });

  // 检查是否包含精通方案数据
  const rawMastery = assemblyDetailData.value.mastery?.data;
  if (rawMastery && (rawMastery.season || rawMastery.s || (rawMastery.nodes && rawMastery.nodes.length > 0) || (rawMastery.n && rawMastery.n.length > 0))) {
    hasMastery.value = true;
    try {
      const masteryDataProcessing = new MasteryDataProcessing();
      const normalized = masteryDataProcessing.import(rawMastery, assemblyDetailData.value.mastery?.attr?.masteryUseVersion);
      if (normalized?.season) {
        selectedSeasonId.value = normalized.season;
      }
      await nextTick();
      selectedNodeIds.value = new Set(normalized.nodes || []);
      const spMap: Record<string, string> = {};
      for (const spId of (normalized.perks || [])) {
        const spNode = Object.values(localNodes.value).find((nd: any) => nd.key === spId || nd.id === spId) as any;
        if (spNode) {
          const tier = spNode.group || String(spNode.cost);
          spMap[tier] = spNode.key || spNode.id;
        }
      }
      selectedSeasonalPerks.value = spMap;

      // 默认精通海报名称：配装名称 + 精通名称
      masteryGenerateImageValue.value.filename = masterySeasonTitle.value;

      await nextTick();
      if (masteryCaptureRef.value?.loadMasteryData) {
        await masteryCaptureRef.value.loadMasteryData();
      }
    } catch (e) {
      console.warn('Failed to parse mastery data:', e);
    }
  } else {
    hasMastery.value = false;
  }

  // 装载数据完成后，极速捕获左侧缩略图
  setTimeout(() => {
    updateAssemblyThumbnail();
    if (hasMastery.value) {
      updateMasteryThumbnail();
    }
  }, 500);
};

/**
 * 确保所有图片已加载
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
 */
const capturePosterNode = async (node: HTMLElement, config: any, filename: string) => {
  // 构造渲染沙盒：强制所有父级容器可见，防止裁剪导致的图片不加载
  const sandboxElements: { el: HTMLElement, style: string }[] = [];
  let current: HTMLElement | null = node.parentElement;
  while (current) {
    sandboxElements.push({ el: current, style: current.style.cssText });
    current.style.setProperty('overflow', 'visible', 'important');
    current.style.setProperty('clip-path', 'none', 'important');
    current = current.parentElement;
  }

  // 临时设置样式以确保截图完整性
  const originalStyles = node.style.cssText;
  const width = config.width || 1400;
  node.style.cssText += `; position: fixed !important; left: -${width * 3}px !important; top: 0 !important; z-index: 99999 !important; width: ${width}px !important; min-width: ${width}px !important; opacity: 1 !important; visibility: visible !important; display: block !important; height: auto !important; max-height: none !important;`;

  await new Promise(r => setTimeout(r, 500));
  await ensureImagesLoaded(node);
  await document.fonts.ready;

  // 注入 MDI 样式
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

  // 修复 snapdom 截图中 tonal 背景变白问题
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
    scale: mobile ? window.devicePixelRatio * 2 : window.devicePixelRatio,
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

  // 移除标记并恢复原始样式
  node.classList.remove('is-capturing');
  tonalFixStyle.remove();
  mdiStyle.remove();
  node.style.cssText = originalStyles;
  sandboxElements.forEach(({ el, style }) => el.style.cssText = style);
};

/**
 * 生成分享海报（支持配装与精通 2 页批量生成下载）
 */
const onGeneratedShare = async () => {
  try {
    generatedLoading.value = true;
    generatingStepText.value = hasMastery.value ? t('assembly.share.generatingPage1') : t('assembly.share.generating');
    await nextTick();

    await goto('#share-footer');

    // 生成配装海报 (第 1 页)
    const assemblyNode = captureRef.value?.posterEl;
    if (assemblyNode) {
      await goto(0, { duration: 1200 });
      const assemblyFilename = generateImageValue.value.filename || assemblyDetailData.value.name || 'assembly';
      await capturePosterNode(assemblyNode, generateImageValue.value, assemblyFilename);
    }

    // 若存在精通，生成精通海报 (第 2 页)
    if (hasMastery.value && masteryCaptureRef.value?.posterEl) {
      generatingStepText.value = t('assembly.share.generatingPage2');
      // 间隔缓冲，防止多任务连续下载被浏览器阻断
      await new Promise(r => setTimeout(r, 800));
      const masteryNode = masteryCaptureRef.value.posterEl;
      const masteryFilename = masteryGenerateImageValue.value.filename || `${assemblyDetailData.value.name || 'assembly'} - ${seasonOptions.value?.find(s => s.id === selectedSeasonId.value)?.title || t('mastery.title')}`;
      await capturePosterNode(masteryNode, masteryGenerateImageValue.value, masteryFilename);
    }

    notice.success(t('basic.tips.operateSuccess'));
  } catch (e) {
    handleApiError(e, notice, t, { component: 'AssemblySharePoster' });
    if (captureRef.value?.posterEl) {
      captureRef.value.posterEl.classList.remove('is-capturing');
    }
    if (masteryCaptureRef.value?.posterEl) {
      masteryCaptureRef.value.posterEl.classList.remove('is-capturing');
    }
  } finally {
    setTimeout(() => {
      generatedLoading.value = false;
      generatingStepText.value = '';
    }, 500);
  }
};

/**
 * 返回
 */
const onBackDetail = () => {
  router.push({name: 'AssemblyDetail'});
};
</script>

<template>
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
      <v-container class="mt-4 position-relative">
        <v-breadcrumbs>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item :to="{name:'AssemblyDetail'}">{{ t('assembly.detail.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('assembly.share.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>

        <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
          <v-icon icon="mdi-presentation" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider></v-divider>

  <v-container class="my-5 position-relative">
    <AdsWidget class="my-5" id="none"></AdsWidget>

    <v-row>
      <!-- 左侧栏 -->
      <v-col cols="2" class="" v-if="!mobile">
        <AffixContainerView>
          <VerticalScrollList>
            <div
                class="ppt-slide-thumb mb-4 cursor-pointer"
                :class="{ 'is-active': currentSlideIndex === 0 }"
                @click="scrollToSlide(0)">
              <div class="slide-card-box"
                   :style="`background:${generateImageValue.background}`">
                <Loading v-if="assemblyThumbLoading || !assemblyThumbUrl" size="80"></Loading>
                <img
                    v-else
                    :src="assemblyThumbUrl"
                    class="slide-thumb-img"
                    alt="Assembly Slide"
                />
              </div>
            </div>

            <div
                v-if="hasMastery"
                class="ppt-slide-thumb mb-4 cursor-pointer"
                :class="{ 'is-active': currentSlideIndex === 1 }"
                @click="scrollToSlide(1)">
              <div class="slide-card-box"
                   :style="`background:${masteryGenerateImageValue.background}`">
                <Loading v-if="masteryThumbLoading || !masteryThumbUrl" size="80"></Loading>
                <img
                    v-else
                    :src="masteryThumbUrl"
                    class="slide-thumb-img"
                    alt="Mastery Slide"
                />
              </div>
            </div>
          </VerticalScrollList>
        </AffixContainerView>
      </v-col>

      <!-- 海报主体展示区 -->
      <v-col cols="10" class="overflow-auto">
        <section id="poster-page-assembly" class="poster-section mb-12">
          <div class="position-relative" :class="{'opacity-20': mobile}">
            <HorizontalScrollList :is-indicator="false" :is-follow-screen-center="true" :follow-screen-safe-distance="300">
              <AssemblyPoster
                  ref="captureRef"
                  :assembly-detail-data="assemblyDetailData"
                  :generate-image-value="generateImageValue"
                  :path="path"
                  :web-path="webPath"
                  :assembly-loading="assemblyLoading"
                  :page-info="{ current: 1, total: totalPosterPages }"
              />
            </HorizontalScrollList>
          </div>
        </section>

        <section v-if="hasMastery" id="poster-page-mastery" class="poster-section mb-12 pt-6">
          <div class="position-relative" :class="{'opacity-20': mobile}">
            <HorizontalScrollList :is-indicator="false" :is-follow-screen-center="true" :follow-screen-safe-distance="300">
              <MasteryPoster
                  ref="masteryCaptureRef"
                  :season-id="selectedSeasonId"
                  :season-title="masterySeasonTitle"
                  :selected-node-ids="selectedNodeIds"
                  :active-tree="activeTree"
                  :local-nodes="localNodes"
                  :regular-points-spent="regularPointsSpent"
                  :max-points="maxPoints"
                  :active-seasonal-perks="activeSeasonalPerks"
                  :aggregated-effects="aggregatedEffects"
                  :generate-image-value="masteryGenerateImageValue"
                  :path="masterySharePath"
                  :web-path="webPath"
                  :loading="assemblyLoading"
                  :get-skill-name="getSkillName"
                  :get-skill-desc="getSkillDesc"
                  :getNodeIconUrl="getNodeIconUrl"
                  :get-category-color="getCategoryColor"
                  :is-node-active="isNodeActive"
                  :is-node-available="isNodeAvailable"
                  :page-info="{ current: 2, total: totalPosterPages }"
              />
            </HorizontalScrollList>
          </div>
        </section>
      </v-col>
    </v-row>
  </v-container>

  <!-- 生成海报加载遮罩 -->
  <v-overlay :model-value="generatedLoading" persistent
             class="blur-load d-flex align-center justify-center" opacity=".92">
    <v-card variant="text" class="text-center">
      <Loading size="120" class="mb-5">></Loading>
      <div class="text-h5 text-amber font-weight-bold" style="text-shadow: 0 2px 10px rgba(0,0,0,0.5)">
        {{ generatingStepText || t('assembly.share.generating') }}
      </div>
      <div class="text-caption text-grey-lighten-1 mt-2">
        {{ t('assembly.share.generatingHint') }}
      </div>
    </v-card>
  </v-overlay>

  <!-- 底部操作固定栏 -->
  <div class="position-fixed bottom-0 w-100 bg-black" style="z-index: 120">
    <v-divider thickness="2" opacity=".3"></v-divider>

    <v-container>
      <v-alert v-if="mobile" type="error" variant="tonal" density="compact" class="mb-3">
        {{ t('assembly.share.notMobile') }}
      </v-alert>

      <v-row>
        <v-col>
          <v-btn height="50" @click="getAssemblyDetail" class="mr-3" :loading="assemblyLoading">
            <v-icon icon="mdi-refresh" size="20" :class="[assemblyLoading ? 'spin-icon-load' : '']"/>
          </v-btn>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="auto">
          <v-btn height="50" @click="onBackDetail" class="mr-3">{{ t('basic.button.cancel') }}</v-btn>

          <v-btn-group>
            <v-btn height="50" class="bg-amber" :loading="generatedLoading" :disabled="mobile || generatedLoading || assemblyDetailData.uuid == null" @click="onGeneratedShare">
              {{ hasMastery ? t('assembly.share.createPosterMultiple', { total: totalPosterPages }) : t('assembly.share.createPoster') }}
            </v-btn>
            <v-divider vertical></v-divider>
            <v-menu open-on-click :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-btn height="50" class="bg-amber" icon :disabled="mobile" v-bind="props">
                  <v-icon>mdi-cog</v-icon>
                </v-btn>
              </template>

              <!-- 封装好的统一设置面板 -->
              <SharePosterSettingPanel
                  type="both"
                  :has-mastery="hasMastery"
                  :assembly-model-value="generateImageValue"
                  :mastery-model-value="masteryGenerateImageValue"
                  :generate-image-config="generateImageConfig"
                  @update:assembly-model-value="generateImageValue = $event"
                  @update:mastery-model-value="masteryGenerateImageValue = $event"
              />
            </v-menu>
          </v-btn-group>
        </v-col>
      </v-row>
    </v-container>
  </div>

  <div id="share-footer"></div>
</template>

<style scoped lang="less">
@import "@/assets/styles/icon";

.ppt-layout {
  position: relative;
  align-items: flex-start;
}

.ppt-sidebar {
  width: 220px;
  min-width: 220px;
  flex-shrink: 0;
}

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

  .slide-badge {
    position: absolute;
    top: -6px;
    left: -6px;
    width: 22px;
    height: 22px;
    background: #ffb300;
    color: #000;
    font-weight: bold;
    font-size: 11px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    z-index: 2;
    transition: transform 0.2s ease;
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
