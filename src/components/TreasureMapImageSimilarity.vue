<template>
  <span @click="openDialog">
    <slot></slot>
  </span>
  <v-dialog v-model="model">
    <v-container>
      <v-card border>
        <v-row no-gutters>
          <v-col cols="2">
            <div class="d-flex bg-black mb-4 h-100 align-center justify-center">
              <v-icon size="80">mdi-image-search-outline</v-icon>
            </div>
          </v-col>
          <v-col>
            <v-card tile min-height="80vh" variant="text">
              <template v-slot:title>
                <div class="text-h5 text-amber">{{ t('codex.treasureMaps.comparison.title') }}</div>
              </template>
              <template v-slot:append>
                <v-btn variant="tonal" icon @click="closeDialog">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </template>

              <div class="px-5">
                <!-- 筛选条件 S -->
                <v-row class="mb-2" align="center">
                  <v-col cols="auto" v-if="queryImageData">
                    <v-tooltip width="400" content-class="pa-0 bg-black" location="bottom">
                      <template v-slot:activator="{props}">
                        <div class="bg-black" v-bind="props">
                          <v-img
                              :src="queryImageData.url"
                              width="55"
                              height="55"
                              class="mx-auto"
                              aspect-ratio="1"
                          ></v-img>
                        </div>
                      </template>
                      <v-img
                          :src="queryImageData.url"
                          class="mx-2"
                          aspect-ratio="1"
                      ></v-img>
                    </v-tooltip>
                  </v-col>
                  <v-col cols="6">
                    <v-select
                        :label="t('codex.treasureMaps.comparison.selectAlgorithm')"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        :disabled="searching"
                        :items="algorithms"
                        v-model="selectedAlgorithm">
                      <template v-slot:selection>
                        {{ t(`codex.treasureMaps.comparison.algorithms.${selectedAlgorithm}`) }}
                      </template>
                      <template v-slot:item="{props, item}">
                        <v-list-item v-bind="props">
                          <template v-slot:title>
                            {{ t(`codex.treasureMaps.comparison.algorithms.${item.raw.value}`) }}
                          </template>
                        </v-list-item>
                      </template>
                    </v-select>
                  </v-col>
                  <v-spacer></v-spacer>
                  <v-col cols="auto">
                    <v-menu open-on-click :close-on-content-click="false">
                      <template v-slot:activator="{ props }">
                        <div v-bind="props">
                          <v-icon>{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
                          <v-icon>mdi-dots-vertical</v-icon>
                        </div>
                      </template>

                      <v-card border class="pa-5" :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 580">
                        <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
                          <v-icon size="80">{{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}</v-icon>
                        </v-card-title>

                        <v-row>
                          <v-col cols="12">
                            <v-select
                                v-model="selectedObtainables"
                                :items="obtainableOptions"
                                :label="t('codex.treasureMaps.comparison.filter.source')"
                                multiple
                                clearable
                                variant="outlined">
                              <template v-slot:selection="{item}">
                                {{ t(`snb.mapLocations.${item.value}.name`) }}
                              </template>
                              <template v-slot:item="{props, item}">
                                <v-list-item v-bind="props">
                                  <template v-slot:title>
                                    {{ t(`snb.mapLocations.${item.raw.value}.name`) }}
                                  </template>
                                </v-list-item>
                              </template>
                            </v-select>
                          </v-col>
                          <v-col cols="12">
                            <v-select
                                v-model="selectedCategories"
                                :items="categoryOptions"
                                :label="t('codex.treasureMaps.comparison.filter.category')"
                                multiple
                                clearable
                                variant="outlined"></v-select>
                          </v-col>
                          <v-col cols="12">
                            <v-number-input v-model="searchMinimumCondition"
                                            max="100"
                                            min="0"
                                            :label="t('codex.treasureMaps.comparison.filter.similarityPercent')"
                                            variant="outlined">
                              <template v-slot:append-inner>
                                <span class="mr-4">%</span>
                              </template>
                              <template v-slot:details>
                                {{ t('codex.treasureMaps.comparison.filter.similarityHint') }}
                              </template>
                            </v-number-input>
                          </v-col>
                          <v-col cols="12">
                            <v-number-input v-model="searchRangeMax"
                                            :label="t('codex.treasureMaps.comparison.filter.searchRange')"
                                            min="30"
                                            clearable
                                            variant="outlined">
                              <template v-slot:details>
                                {{ t('codex.treasureMaps.comparison.filter.rangeHint', { range: searchRangeMax }) }}
                              </template>
                            </v-number-input>
                          </v-col>
                        </v-row>
                      </v-card>
                    </v-menu>
                  </v-col>
                </v-row>
                <!-- 筛选条件 E -->

                <!-- 搜索进度显示 S -->
                <div v-if="searching" class="mb-4">
                  <v-card border class="pa-4">
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div class="text-body-1 font-weight-medium">
                        {{ t('codex.treasureMaps.comparison.searchingProgress') }}
                      </div>
                      <div class="text-amber">
                        {{ currentProgress }} / {{ totalImages }}
                        ({{ progressPercentage }}%)
                      </div>
                    </div>
                    <v-progress-linear
                        v-model="progressPercentage"
                        color="amber"
                        height="8"
                        rounded
                    ></v-progress-linear>

                    <!-- 当前正在比较的图片 -->
                    <v-row v-if="currentComparingImage" class="mt-4">
                      <v-col cols="auto" class="text-caption text-grey mb-1">
                        {{ t('codex.treasureMaps.comparison.currentComparing') }}
                      </v-col>
                      <v-col class="d-flex align-center gap-2">
                        <div>
                          <div class="text-body-2">{{ currentComparingImage.id }}</div>
                        </div>
                      </v-col>
                    </v-row>
                  </v-card>
                </div>
                <!-- 搜索进度显示 E -->

                <template v-if="searchResults.length <= 0 && !searching && !queryImageData">
                  <v-card class="pa-10 d-flex justify-center align-center" height="calc(100vh - 400px)" elevation="0" border>
                    <div class="text-center">
                      <v-icon size="66" class="mb-3 opacity-30">mdi-image-plus</v-icon>
                      <p>{{ t('codex.treasureMaps.comparison.uploadPrompt') }}</p>

                      <v-btn class="mt-7" variant="tonal" @click="$refs.fileInput.click()">
                        {{ t('codex.treasureMaps.comparison.selectImage') }}
                      </v-btn>
                    </div>
                    <input
                        ref="fileInput"
                        type="file"
                        @change="onQueryImageUpload"
                        accept="image/*"
                        style="display: none"
                    />
                  </v-card>

                  <v-alert type="info" variant="tonal" density="compact" class="my-3">
                    <p>{{ t('codex.treasureMaps.comparison.noResult.algorithmIssue') }}</p>
                    <p>{{ t('codex.treasureMaps.comparison.noResult.notInCollection') }}</p>
                    <p>{{ t('codex.treasureMaps.comparison.noResult.useFilter') }}</p>
                  </v-alert>
                </template>

                <!-- 查询图片预览 S -->
                <v-card variant="text" class="overflow-y-auto" min-height="200" max-height="calc(100vh - 280px)" v-if="searchResults.length > 0">
                  <v-row>
                    <v-col cols="auto" class="overflow-y-auto w-100">
                      <!-- 搜索结果 -->
                      <div v-if="searchResults.length > 0">
                        <div class="results-grid">
                          <v-card
                              class="bg-black"
                              border
                              v-for="(result, index) in searchResults"
                              :key="result.id">
                            <div class="bg-black">
                              <v-img :src="result.imageUrl"
                                     height="175"
                                     aspect-ratio="1"></v-img>
                            </div>

                            <v-card-text class="text-center px-2">
                              <div>
                                <ItemSlotBase :size="`99px`" class="position-relative mx-auto">
                                  <TreasureMapIconWidget :id="result.id "></TreasureMapIconWidget>
                                </ItemSlotBase>
                              </div>
                              <div class="similarity text-amber">{{ result.similarity.toFixed(2) }}%</div>
                            </v-card-text>
                          </v-card>
                        </div>
                      </div>

                      <!-- 无结果提示 -->
                      <div v-else-if="searched" class="text-center py-4">
                        <v-icon size="48" color="grey" class="mb-2">mdi-image-off</v-icon>
                        <div class="text-caption">
                          <p>{{ t('codex.treasureMaps.comparison.noResult.algorithmIssue') }}</p>
                          <p>{{ t('codex.treasureMaps.comparison.noResult.notInCollection') }}</p>
                        </div>
                      </div>
                    </v-col>
                  </v-row>
                </v-card>
                <!-- 查询图片预览 E -->
              </div>
            </v-card>

            <div class="d-flex align-center ga-2 mb-4 px-5 mt-2">
              <v-spacer></v-spacer>
              <v-btn
                  variant="text"
                  @click="resetSearch"
                  :disabled="!queryImageData && searchResults.length === 0">
                {{ t('basic.button.reset') }}
              </v-btn>
              <v-btn
                  color="var(--main-color)"
                  @click="searchSimilarImages"
                  :disabled="!queryImageData"
                  :loading="searching">
                {{ t('basic.button.search') }}
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </v-container>
  </v-dialog>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {calculateHashSimilarity, compareHistograms, compareStructuralFeatures, computeBlockFeatures, computeColorHistogram, computeStructuralFeatures, getImageHash} from '@/assets/sripts/image_similarity';
import {TreasureMapType} from "glow-prow-data/src/types/TreasureMapProperties";
import {TreasureMaps} from "glow-prow-data";
import {useDisplay} from "vuetify/framework";
import {useI18n} from "vue-i18n";

import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";

// ==================== 类型定义 ====================
interface QueryImageData {
  url: string;
  hash?: string;
  colorHistogram?: number[];
  structuralFeatures?: number[];
  imageData?: ImageData;
}

interface TreasureMapData {
  id: string;
  rarity: string;
  category: TreasureMapType;
  territory: string;
  obtainable: string[];
  type: string;
  dateAdded: string;
  lastUpdated: string;
}

interface SearchResult {
  id: string;
  index: number;
  similarity: number;
  imageUrl: string;
  rarity: string;
  category: string;
  obtainable: string[];
}

interface Algorithm {
  value: string;
  label: string;
}

interface ComparingImage {
  id: string;
  url: string;
  category: string;
  index: number;
}

// ==================== 响应式数据 ====================
const mockCollectionMap: Record<string, { default: string }> = import.meta.glob('@glow-prow-assets/treasureMaps/**/*.*', { eager: true });
const treasureMaps = TreasureMaps;
const { t } = useI18n();
const { mobile } = useDisplay();

// 状态管理
const model = ref(false);
const searched = ref(false);
const searching = ref(false);
const queryImageData = ref<QueryImageData | null>(null);
const searchResults = ref<SearchResult[]>([]);
const searchMinimumCondition = ref(50);
const searchRangeMax = ref(100);
const selectedAlgorithm = ref<string>('feature-matching');
const imageList = ref<string[]>([]);
const imageFeaturesCache = ref<Map<number, any>>(new Map());
const selectedCategories = ref<string[]>([]);
const selectedObtainables = ref<string[]>([]);

// 新增：搜索进度相关
const currentProgress = ref(0);
const totalImages = ref(0);
const currentComparingImage = ref<ComparingImage | null>(null);

// 算法配置
const algorithms: Algorithm[] = [
  { value: 'perceptual-hash', label: '感知哈希 (快速)' },
  { value: 'color-histogram', label: '颜色直方图' },
  { value: 'feature-matching', label: '特征点匹配' },
  { value: 'structural-similarity', label: '结构相似性' }
];

// ==================== 计算属性 ====================
const hasActiveFilters = computed(() => {
  return selectedCategories.value.length > 0 || selectedObtainables.value.length > 0;
});

const progressPercentage = computed(() => {
  if (totalImages.value === 0) return 0;
  return Math.round((currentProgress.value / totalImages.value) * 100);
});

const categoryOptions = computed(() => [
  { value: 'recent' },
  { value: 'old' },
  { value: 'veryOld' },
  { value: 'legend' }
].map(i => {
  i['title'] = t(`codex.treasureMap.categorys.${i.value}`);
  return i;
}));

const obtainableOptions = computed(() => {
  const allObtainables = new Set<string>();
  Object.values(treasureMaps).forEach((map: TreasureMapData) => {
    map.obtainable.forEach(obtain => allObtainables.add(obtain));
  });
  return Array.from(allObtainables).map(obtain => ({
    value: obtain,
    title: obtain
  }));
});

const filteredImageList = computed(() => {
  return imageList.value.filter((url) => {
    const imageId = getImageIdFromUrl(url);
    const mapData = treasureMaps[imageId];
    if (!mapData) return false;

    // 分类筛选
    if (selectedCategories.value.length > 0 && !selectedCategories.value.includes(mapData.category)) {
      return false;
    }

    // 来源筛选
    if (selectedObtainables.value.length > 0) {
      const hasMatchingObtainable = mapData.obtainable.some(obtain =>
          selectedObtainables.value.includes(obtain)
      );
      if (!hasMatchingObtainable) return false;
    }

    return true;
  });
});

// ==================== 生命周期钩子 ====================
onMounted(() => {
  imageList.value = Object.entries(mockCollectionMap).map(([path, module]) => module.default);
});

onUnmounted(() => {
  // 清理Blob URL防止内存泄漏
  if (queryImageData.value?.url && queryImageData.value.url.startsWith('blob:')) {
    URL.revokeObjectURL(queryImageData.value.url);
  }
});

// ==================== 事件监听 ====================
watch(() => queryImageData.value, (value, oldValue) => {
  if (value && value !== oldValue) {
    searchSimilarImages();
  }
});

// ==================== 对话框控制方法 ====================
/**
 * 打开对话框
 */
const openDialog = () => {
  model.value = true;
};

/**
 * 关闭对话框
 */
const closeDialog = () => {
  model.value = false;
  resetSearch();
};

/**
 * 重置搜索状态
 */
const resetSearch = () => {
  queryImageData.value = null;
  searchResults.value = [];
  searched.value = false;
  searching.value = false;
  currentProgress.value = 0;
  totalImages.value = 0;
  currentComparingImage.value = null;
};

// ==================== 图片处理工具方法 ====================
/**
 * 从图片URL中提取ID
 */
const getImageIdFromUrl = (url: string): string => {
  const filename = url.split('/').pop() || '';
  return filename.split('.')[0];
};

/**
 * 加载图片为ImageData
 */
const loadImageToImageData = (imageUrl: string): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// ==================== 图片上传处理方法 ====================
/**
 * 处理查询图片上传
 */
const onQueryImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
  const imageUrl = URL.createObjectURL(file);

  try {
    // 等待图片加载
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = imageUrl;
    });

    // 根据算法类型预计算特征
    const features: Partial<QueryImageData> = {};

    switch (selectedAlgorithm.value) {
      case 'perceptual-hash':
        features.hash = await getImageHash(imageUrl);
        break;
      case 'color-histogram':
        const colorImageData = await loadImageToImageData(imageUrl);
        features.colorHistogram = computeColorHistogram(colorImageData);
        break;
      case 'structural-similarity':
      case 'feature-matching':
        const structImageData = await loadImageToImageData(imageUrl);
        features.structuralFeatures = computeStructuralFeatures(structImageData);
        break;
    }

    queryImageData.value = {
      url: imageUrl,
      ...features
    };

    searchResults.value = [];
    searched.value = false;
    currentProgress.value = 0;
    currentComparingImage.value = null;
  } catch (error) {
    console.error('图片上传失败:', error);
    URL.revokeObjectURL(imageUrl);
  }
};

// ==================== 特征缓存和计算方法 ====================
/**
 * 获取或缓存图片特征
 */
const getOrCreateImageFeatures = async (imgUrl: string, index: number): Promise<any> => {
  if (imageFeaturesCache.value.has(index)) {
    return imageFeaturesCache.value.get(index)!;
  }

  // 加载图片并计算所有特征
  const imageData = await loadImageToImageData(imgUrl);
  const features: any = {};

  // 预计算所有可能用到的特征（缓存优化）
  features.hash = await getImageHash(imgUrl);
  features.colorHistogram = computeColorHistogram(imageData);
  features.structuralFeatures = computeStructuralFeatures(imageData);
  features.blockFeatures = computeBlockFeatures(imageData);

  imageFeaturesCache.value.set(index, features);
  return features;
};

/**
 * 计算图片相似度
 */
const calculateSimilarity = (queryData: QueryImageData, features: any): number => {
  switch (selectedAlgorithm.value) {
    case 'perceptual-hash':
      return queryData.hash ? calculateHashSimilarity(queryData.hash, features.hash) : 0;
    case 'color-histogram':
      return queryData.colorHistogram ? compareHistograms(queryData.colorHistogram, features.colorHistogram) : 0;
    case 'structural-similarity':
      return queryData.structuralFeatures ? compareStructuralFeatures(queryData.structuralFeatures, features.structuralFeatures) : 0;
    case 'feature-matching':
      return queryData.structuralFeatures ? compareStructuralFeatures(queryData.structuralFeatures, features.blockFeatures) : 0;
    default:
      return 0;
  }
};

// ==================== 搜索核心方法 ====================
/**
 * 执行相似图片搜索
 */
const searchSimilarImages = async () => {
  if (!queryImageData.value) return;

  searching.value = true;
  searchResults.value = [];
  searched.value = false;
  currentProgress.value = 0;
  currentComparingImage.value = null;

  try {
    const results: SearchResult[] = [];
    const filteredList = filteredImageList.value;
    totalImages.value = filteredList.length;

    // 并行处理所有图片比较（按顺序但异步）
    for (let index = 0; index < filteredList.length; index++) {
      const imgUrl = filteredList[index];
      const imageId = getImageIdFromUrl(imgUrl);
      const mapData = treasureMaps[imageId];

      // 更新当前比较的图片信息
      if (mapData) {
        currentComparingImage.value = {
          id: imageId,
          url: imgUrl,
          category: mapData.category,
          index: index
        };
      }

      const features = await getOrCreateImageFeatures(imgUrl, index);
      const similarity = calculateSimilarity(queryImageData.value, features);

      if (mapData) {
        results.push({
          id: imageId,
          index,
          similarity,
          imageUrl: imgUrl,
          rarity: mapData.rarity,
          category: mapData.category,
          obtainable: mapData.obtainable
        });
      }

      // 更新进度
      currentProgress.value = index + 1;
    }

    // 筛选、排序并截取结果
    searchResults.value = results
        .filter(item => item.similarity >= searchMinimumCondition.value)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, searchRangeMax.value);

  } catch (error) {
    console.error('搜索过程中出错:', error);
  } finally {
    searching.value = false;
    searched.value = true;
    currentComparingImage.value = null;
  }
};

// ==================== 暴露方法 ====================
/**
 * 外部打开对话框的方法
 */
const openModel = () => {
  model.value = true;
};

defineExpose({
  openModel
});
</script>

<style scoped>
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(180px * 1.3), 1fr));
  gap: 16px;
}

.similarity {
  font-size: 1.1em;
  font-weight: bold;
  margin: 4px 0;
}
</style>
