<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from "vue";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import {apis} from "@/assets/sripts/index";
import MasteryPoster from "@/components/mastery/MasteryPoster.vue";
import {useMasteryController} from "@/assets/sripts/use_mastery_controller";
import MasteryDataProcessing from "@/assets/sripts/mastery_data_processing";

const route = useRoute();
const {t, locale} = useI18n();

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
  generateShareCode,
  loadFromShareCode,
  initFromUrlParams,
} = useMasteryController({});

const assemblyDetailData = ref<any>({});
const hasMastery = ref(false);
const masteryLoading = ref(true);

const generateImageValue = ref({
  isShowHeader: false,
  isShowTitle: true,
  isShowTree: true,
  isShowSeasonal: true,
  isShowEffects: true,
  isShowQrCode: true,
  filename: '',
  width: 1200,
  format: 'jpg',
  quality: 1,
  background: '#0a0d12',
  language: locale.value,
  viewMode: 'full'
});

const captureRef = ref<any>(null);
const path = ref("");
const webPath = ref(window.location.host);

const masterySeasonTitle = computed(() => {
  const sTitle = seasonOptions.value?.find(s => s.id === selectedSeasonId.value)?.title || selectedSeasonId.value;
  const aName = assemblyDetailData.value?.name || '';
  return aName ? `${aName} - ${sTitle || t('mastery.title')}` : (sTitle || t('mastery.title'));
});

onMounted(async () => {
  if (route.query) {
    const query = {...route.query} as any;
    const booleanKeys = ['isShowHeader', 'isShowTitle', 'isShowTree', 'isShowSeasonal', 'isShowEffects', 'isShowQrCode'];
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

  const {uid} = route.params;
  if (uid && uid !== 'standalone' && uid !== 'empty') {
    await getAssemblyDetail(<string>uid);
  } else {
    // 基于 URL 参数（season, share）加载
    await initMasteryData();
  }
});

const getAssemblyDetail = async (uid: string) => {
  try {
    const {password} = route.query;
    masteryLoading.value = true;

    const result = await apis.assemblyApi().getAssemblyItem(uid, {password: <string>password});
    const d = result.data;
    assemblyDetailData.value = d.data;

    const rawMastery = assemblyDetailData.value?.mastery?.data;
    if (rawMastery && (rawMastery.season || rawMastery.s || (rawMastery.nodes && rawMastery.nodes.length > 0) || (rawMastery.n && rawMastery.n.length > 0))) {
      hasMastery.value = true;
      const masteryDataProcessing = new MasteryDataProcessing();
      const normalized = masteryDataProcessing.import(rawMastery, assemblyDetailData.value.mastery?.attr?.masteryUseVersion);
      if (normalized?.season) {
        selectedSeasonId.value = normalized.season;
      }
      await nextTick();
      await new Promise(r => setTimeout(r, 100));
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

      const code = generateShareCode();
      path.value = `${window.location.origin}/mastery?season=${selectedSeasonId.value}&share=${code}`;
      generateImageValue.value.filename = masterySeasonTitle.value;

      await nextTick();
      if (captureRef.value?.loadMasteryData) {
        await captureRef.value.loadMasteryData();
      }
    } else {
      hasMastery.value = false;
    }
  } catch (e) {
    console.error('Failed to load assembly mastery detail:', e);
    hasMastery.value = false;
  } finally {
    await nextTick();
    masteryLoading.value = false;
  }
};

const initMasteryData = async () => {
  try {
    masteryLoading.value = true;
    initFromUrlParams();
    hasMastery.value = true;
    const code = generateShareCode();
    path.value = `${window.location.origin}/mastery?season=${selectedSeasonId.value}&share=${code}`;

    if (!generateImageValue.value.filename) {
      generateImageValue.value.filename = masterySeasonTitle.value;
    }

    await nextTick();
    if (captureRef.value?.loadMasteryData) {
      await captureRef.value.loadMasteryData();
    }
  } catch (e) {
    console.error('Failed to init mastery data from url params:', e);
  } finally {
    await nextTick();
    masteryLoading.value = false;
  }
};
</script>

<template>
  <div class="mastery-widget" :data-loaded="!masteryLoading" :data-has-mastery="hasMastery">
    <MasteryPoster
      v-if="hasMastery || masteryLoading"
      ref="captureRef"
      :season-id="selectedSeasonId"
      :season-title="masterySeasonTitle"
      :selected-node-ids="selectedNodeIds"
      :active-tree="activeTree"
      :local-nodes="localNodes"
      :regular-points-spent="regularPointsSpent"
      :max-points="maxPoints"
      :active-seasonal-perks="activeSeasonalPerks"
      :aggregated-effects="aggregatedEffects"
      :generate-image-value="generateImageValue"
      :path="path"
      :web-path="webPath"
      :loading="masteryLoading"
      :get-skill-name="getSkillName"
      :get-skill-desc="getSkillDesc"
      :getNodeIconUrl="getNodeIconUrl"
      :get-category-color="getCategoryColor"
      :is-node-active="isNodeActive"
      :is-node-available="isNodeAvailable"
    />
    <div v-else class="text-center pa-10 text-grey">
      暂无精通数据
    </div>
  </div>
</template>

<style scoped>
.mastery-widget {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
}
</style>
