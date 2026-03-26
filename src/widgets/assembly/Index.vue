<script setup lang="ts">
import {ref, onMounted, nextTick} from "vue";
import {useRoute} from "vue-router";
import {apis} from "@/assets/sripts/index";
import AssemblyPoster from "@/components/AssemblyPoster.vue";

const route = useRoute();

const assemblyDetailData = ref<any>({});
const assemblyLoading = ref(false);

const generateImageValue = ref({
  isShowEmptySlot: true,
  isShowItemName: true,
  isFullName: false,
  isShowHeader: false,
  isShowTitle: true,
  isShowTabs: true,
  isShowDescription: true,
  filename: '',
  width: 1200,
  format: 'jpg',
  quality: 1,
  background: '#000',
});

const captureRef = ref(null);

const path = ref("");
const webPath = ref(window.location.host);

onMounted(() => {
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

  const detailPath = `/assembly/browse/${route.params.uid}/detail`;
  path.value = webPath.value + detailPath;

  getAssemblyDetail();
});

const getAssemblyDetail = async () => {
  try {
    const {uid} = route.params;
    const {password} = route.query;

    assemblyLoading.value = true;

    const result = await apis.assemblyApi().getAssemblyItem(<string>uid, {password: <string>password});
    const d = result.data;

    assemblyDetailData.value = d.data;
    generateImageValue.value.filename = assemblyDetailData.value.name as string;

    await loadAssemblyData();
  } catch (e) {
    console.error(e);
  } finally {
    assemblyLoading.value = false;
  }
};

const loadAssemblyData = async () => {
  await nextTick(() => {
    if (captureRef.value) {
      // @ts-ignore
      captureRef.value.loadAssemblyData();
    }
  });
};
</script>

<template>
  <div class="assembly-widget">
    <AssemblyPoster
      ref="captureRef"
      :assembly-detail-data="assemblyDetailData"
      :generate-image-value="generateImageValue"
      :path="path"
      :web-path="webPath"
      :assembly-loading="assemblyLoading"
    />
  </div>
</template>

<style scoped>
.assembly-widget {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
</style>
