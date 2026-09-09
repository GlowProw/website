<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useAuthStore} from "~/stores/userAccountStore";
import QRCode from "qrcode";

import Loading from "@/components/Loading.vue";
import Logo from "@/components/Logo.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import MasteryView from "@/components/mastery/MasteryView.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import MasteryIconWidget from "@/components/snbWidget/masteryIconWidget.vue";
import MasteryName from "@/components/snbWidget/masteryName.vue";

const authStore = useAuthStore();

const props = defineProps({
  seasonId: {
    type: String,
    default: ''
  },
  seasonTitle: {
    type: String,
    default: ''
  },
  selectedNodeIds: {
    type: Object as () => Set<string>,
    default: () => new Set()
  },
  activeTree: {
    type: Object,
    default: () => ({})
  },
  localNodes: {
    type: Object,
    default: () => ({})
  },
  regularPointsSpent: {
    type: Number,
    default: 0
  },
  maxPoints: {
    type: Number,
    default: 40
  },
  activeSeasonalPerks: {
    type: Array as () => any[],
    default: () => []
  },
  aggregatedEffects: {
    type: Array as () => any[],
    default: () => []
  },
  generateImageValue: {
    type: Object,
    default: () => ({
      isShowHeader: true,
      isShowTitle: true,
      isShowTree: true,
      isShowSeasonal: true,
      isShowEffects: true,
      isShowQrCode: true,
      filename: '',
      width: 1800,
      format: 'jpg',
      quality: 1,
      background: '#0a0d12',
      language: 'zh_CN',
      viewMode: 'full'
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
  getSkillName: {
    type: Function,
    default: (k: string) => k
  },
  getSkillDesc: {
    type: Function,
    default: (k: string) => ''
  },
  getNodeIconUrl: {
    type: Function,
    default: (k: string) => ''
  },
  getCategoryColor: {
    type: Function,
    default: (cat: string) => '#ffffff'
  },
  isNodeActive: {
    type: Function,
    default: () => false
  },
  isNodeAvailable: {
    type: Function,
    default: () => false
  }
});

const {t} = useI18nUtils(computed(() => props.generateImageValue.language));

const captureRef = ref<any>(null);
const masteryViewRef = ref<InstanceType<typeof MasteryView> | null>(null);
const qrCanvasRef = ref<HTMLCanvasElement | null>(null);

// 统计各分类投入点数
const categoryPoints = computed(() => {
  const stats: Record<string, number> = {
    defensive: 0,
    offensive: 0,
    impetus: 0,
    default: 0
  };
  for (const id of props.selectedNodeIds) {
    const node = props.localNodes[id] || (props.activeTree?.nodes && props.activeTree.nodes[id]);
    if (node && node.role !== 'seasonalPerk') {
      const cat = node.category || 'default';
      stats[cat] = (stats[cat] || 0) + 1;
    }
  }
  return stats;
});

// 计算覆盖全部节点的星图边界与 1.0 缩放参数
const treeBounds = computed(() => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const nodes = Object.values(props.localNodes || {}) as any[];

  for (const n of nodes) {
    if (n.position) {
      minX = Math.min(minX, n.position.x);
      maxX = Math.max(maxX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxY = Math.max(maxY, n.position.y);
    }
  }

  if (!isFinite(minX) || !isFinite(maxX)) {
    return {
      treeWidth: 5862,
      treeHeight: 4377,
      tx: 2931,
      ty: 2188
    };
  }

  const padding = 120; // 边距保证节点圆环、发光、图标及下方文字完整无裁切
  const treeWidth = Math.ceil((maxX - minX) + padding * 2);
  const treeHeight = Math.ceil((maxY - minY) + padding * 2);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // 在 1.0 缩放下，将节点坐标中心映射到画布中心
  const tx = treeWidth / 2 - centerX * 1.0;
  const ty = treeHeight / 2 - centerY * 1.0;

  return {
    treeWidth,
    treeHeight,
    tx,
    ty
  };
});

const posterTreeWidth = computed(() => {
  return props.generateImageValue.width || 1800;
});

const treeDisplayScale = computed(() => {
  const tw = treeBounds.value.treeWidth || 5862;
  return posterTreeWidth.value / tw;
});

const treeDisplayHeight = computed(() => {
  const th = treeBounds.value.treeHeight || 4377;
  return Math.round(th * treeDisplayScale.value);
});

const loadMasteryData = async () => {
  await nextTick();
  if (masteryViewRef.value) {
    await masteryViewRef.value.preloadAllIcons?.();
    masteryViewRef.value.requestRender?.();
  }
};

/**
 * 生成二维码
 */
const onGenerateQRCode = async (text: string) => {
  try {
    if (qrCanvasRef.value && text) {
      await QRCode.toCanvas(qrCanvasRef.value, text, {
        width: 100,
        margin: 1,
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

watch(() => props.path, (newPath) => {
  if (newPath) onGenerateQRCode(newPath);
});

watch([
  () => props.localNodes,
  () => props.selectedNodeIds,
  () => props.generateImageValue.width,
  () => props.seasonId
], () => {
  loadMasteryData();
}, {deep: true});

onMounted(async () => {
  if (props.path) {
    onGenerateQRCode(props.path);
  }
  await loadMasteryData();
});

defineExpose({
  loadMasteryData,
  posterEl: computed(() => captureRef.value?.$el || captureRef.value)
});
</script>

<template>
  <v-defaults-provider :defaults="{ VImg: { eager: true } }">
    <v-card
        id="capture"
        min-height="400"
        variant="text"
        ref="captureRef"
        class="share mx-auto pt-6 pb-6"
        :style="`background: ${generateImageValue.background}; width: ${generateImageValue.width}px`"
    >
      <!-- 头部标识 S -->
      <v-row no-gutters class="px-8 mb-4" align="center" v-if="generateImageValue.isShowHeader">
        <v-col cols="auto" class="d-flex align-center">
          <Logo></Logo>
        </v-col>
        <v-col class="d-flex align-center ml-2 text-subtitle-1">
          {{ t('name') }}
          <v-divider vertical inset class="mx-3" thickness="2" opacity=".3"></v-divider>
          <span class="opacity-70 text-body-2">{{ webPath }}</span>
        </v-col>
        <v-col cols="auto" class="opacity-40 text-caption font-monospace">
          {{ seasonTitle }} · {{ t('mastery.title') }}
        </v-col>
      </v-row>
      <!-- 头部标识 E -->

      <!-- 方案标题与数据看板 S -->
      <div class="px-8 mb-6" v-if="generateImageValue.isShowTitle">
        <div class="d-flex align-center justify-space-between flex-wrap ga-4">
          <div>
            <h1 class="text-h3 font-weight-bold text-amber text-truncate" style="letter-spacing: -0.5px;">
              {{ generateImageValue.filename || seasonTitle }}
            </h1>
          </div>

          <!-- 概览指标卡片 -->
          <div class="d-flex ga-3">
            <v-card variant="text" class="pa-3 text-center bg-surface-darken-1" min-width="110" rounded="lg">
              <div class="text-h5 font-weight-bold text-amber">
                {{ regularPointsSpent || 0 }}<span class="text-caption opacity-50">/{{ maxPoints || 0 }}</span>
              </div>
              <div class="text-caption opacity-60 mb-1">{{ t('mastery.share.pointsSpent') }}</div>
            </v-card>
            <v-divider vertical></v-divider>
            <v-card variant="text" class="pa-3 text-center bg-surface-darken-1" min-width="110" rounded="lg">
              <div class="text-h5 font-weight-bold text-white">
                {{ selectedNodeIds.size || 0 }}
              </div>
              <div class="text-caption opacity-60 mb-1">{{ t('mastery.share.activatedNodes') }}</div>
            </v-card>
            <v-divider vertical v-if="activeSeasonalPerks.length > 0"></v-divider>
            <v-card variant="text" class="pa-3 text-center bg-surface-darken-1" min-width="110" rounded="lg"
                    v-if="activeSeasonalPerks.length > 0">
              <div class="text-h5 font-weight-bold text-amber-lighten-2">
                {{ activeSeasonalPerks.length || 0 }}
              </div>
              <div class="text-caption opacity-60 mb-1">{{ t('mastery.share.activePerks') }}</div>
            </v-card>
          </div>
        </div>

        <div class="d-flex align-center ga-4 text-caption opacity-75">
          <div class="d-flex align-center ga-2 mb-1">
            <v-chip size="small" color="amber" variant="flat" class="font-weight-bold">
              {{ seasonTitle }}
            </v-chip>
          </div>
        </div>
      </div>
      <!-- 方案标题与数据看板 E -->

      <!-- 专精星图预览 S -->
      <div class="mb-6" v-if="generateImageValue.isShowTree">
        <div
            v-if="Object.keys(localNodes || {}).length === 0"
            class="py-16 text-center opacity-50"
            style="min-height: 300px;">
          <Loading size="60"></Loading>
        </div>
        <div
            v-else
            class="mastery-tree-preview-container position-relative overflow-hidden"
            :style="{
              width: `${posterTreeWidth}px`,
              height: `${treeDisplayHeight}px`,
              background: 'transparent'
            }">
          <div
              :style="{
                width: `${treeBounds.treeWidth}px`,
                height: `${treeBounds.treeHeight}px`,
                transform: `scale(${treeDisplayScale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
                background: 'transparent'
              }">
            <MasteryView
                ref="masteryViewRef"
                :nodes="localNodes as any"
                :selected-node="null"
                :selected-node-ids="selectedNodeIds"
                :regular-points-spent="regularPointsSpent"
                :scale-extent="[0.1, 10]"
                :get-node-icon-url="getNodeIconUrl as any"
                :get-skill-name="getSkillName as any"
                :is-node-active="isNodeActive as any"
                :is-node-available="isNodeAvailable as any"
                :initial-scale="1"
                :initial-tx="treeBounds.tx"
                :initial-ty="treeBounds.ty"
                :readonly="true"
                :dpr="1"
            />
          </div>
        </div>
      </div>
      <!-- 专精星图预览 E -->

      <!-- 已激活赛季核心特长 S -->
      <div class="px-8 mb-6" v-if="generateImageValue.isShowSeasonal && activeSeasonalPerks.length > 0">
        <div class="d-flex align-center ga-2 mb-3">
          <span class="text-h5 text-uppercase tracking-wider text-amber">
            {{ t('mastery.share.seasonalTitle') }}
          </span>
          <v-chip size="x-small" color="amber" variant="tonal" class="ml-1">
            {{ activeSeasonalPerks.length }}
          </v-chip>
        </div>

        <v-row>
          <v-col
              v-for="perk in activeSeasonalPerks"
              :key="perk.key || perk.id"
              :cols="activeSeasonalPerks.length <= 2 ? 4 : (generateImageValue.width >= 1400 ? (activeSeasonalPerks.length <= 4 ? 3 : 4) : 4)">
            <v-row>
              <v-col cols="auto">
                <ItemSlotBase size="55px">
                  <MasteryIconWidget :id="perk.key" ></MasteryIconWidget>
                </ItemSlotBase>
              </v-col>
              <v-col>
                <div class="mb-1 d-flex ga-2 align-center text-subtitle-2 font-weight-bold text-truncate text-amber">
                  <u class="u"><MasteryName :id="perk.id"></MasteryName></u>
                  <div class="text-caption opacity-50">
                    {{ t('mastery.perkRequirement', {cost: perk.cost}) }}
                  </div>
                </div>
                <div class="text-caption opacity-80 flex-grow-1" style="font-size: 11px !important; line-height: 1.45;">
                  {{ getSkillDesc((perk as any).skill || perk.id, perk.key) }}
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </div>
      <!-- 已激活赛季核心特长 E -->

      <!-- 专精聚合效果统计 S -->
      <div class="px-8 mb-6" v-if="generateImageValue.isShowEffects && aggregatedEffects.length > 0">
        <div class="d-flex align-center ga-2 mb-3">
          <span class="text-h5 text-uppercase tracking-wider text-amber">
            {{ t('mastery.share.effectsTitle') }}
          </span>
          <v-chip size="x-small" color="amber" variant="tonal" class="ml-1">
            {{ aggregatedEffects.length }}
          </v-chip>
        </div>

        <v-row dense>
          <v-col
              v-for="eff in aggregatedEffects"
              :key="eff.id"
              :cols="generateImageValue.width >= 1500 ? 3 : (generateImageValue.width >= 1800 ? 4 : 6)">
            <v-card variant="text" class="bg-surface-darken-2 d-flex align-center justify-space-between ga-2" rounded="lg">
              <div class="d-flex align-center ga-2 overflow-hidden">
                <!--                <span-->
                <!--                    v-if="eff.contributors && eff.contributors[0]"-->
                <!--                    class="category-indicator"-->
                <!--                    :style="`background: ${getCategoryColor(eff.contributors[0].skillCategory)}`"-->
                <!--                ></span>-->
                <div class="overflow-hidden">
                  <div class="text-caption font-weight-bold text-truncate text-amber u" v-if="eff.name">
                    {{ eff.name }}

                    <v-chip
                        v-if="eff.contributors && eff.contributors.length > 1"
                        size="x-small"
                        variant="tonal"
                        color="amber"
                        class="font-weight-bold flex-shrink-0 ml-2">
                      ×{{ eff.contributors.length }}
                    </v-chip>
                  </div>
                  <div class="text-caption opacity-75 text-truncate opacity-60">{{ eff.renderedDescription }}</div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
      <!-- 专精聚合效果统计 E -->

      <!-- 底部授权与二维码 S -->
      <div class="px-8 pt-4">
        <v-row align="center" no-gutters>
          <v-col>
            <div v-if="authStore.user?.userAvatar || authStore.user?.username" class="d-flex align-center mb-2">
              <v-card class="mr-2" rounded="circle" elevation="0">
                <UserAvatar size="26" :src="authStore.user?.userAvatar"></UserAvatar>
              </v-card>
              <span class="font-weight-bold text-body-2">
                {{ authStore.user?.alternativeName || authStore.user?.username || 'Anonymous' }}
              </span>
            </div>
            <div class="d-flex align-center text-caption opacity-60">
              <v-icon icon="mdi-link-variant" size="14" class="mr-1"></v-icon>
              <span style="max-width: 750px;">{{ path }}</span>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto" v-if="generateImageValue.isShowQrCode">
            <div class="text-center">
              <canvas ref="qrCanvasRef" class="rounded-sm elevation-2 bg-white pa-1"></canvas>
              <div class="text-caption opacity-40 mt-1" style="font-size: 10px !important;">
                {{ t('mastery.share.scanToView') }}
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
      <!-- 底部授权与二维码 E -->

      <v-overlay :model-value="loading" contained opacity="0.9" class="d-flex justify-center align-center">
        <Loading size="100"></Loading>
      </v-overlay>
    </v-card>
  </v-defaults-provider>
</template>

<style scoped lang="less">
@import "@/assets/styles/icon";

.share {
  pointer-events: none;
  user-select: none;
  position: relative;

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

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.category-indicator {
  width: 5px;
  height: 18px;
  border-radius: 3px;
  flex-shrink: 0;
}

.perk-diamond-badge {
  width: 38px;
  height: 38px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  .perk-icon-img {
    width: 26px;
    height: 26px;
    object-fit: contain;
  }
}

.mastery-tree-preview-container {
  background: transparent;
  display: block;
}
</style>
