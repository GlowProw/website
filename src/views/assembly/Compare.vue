<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useHead} from "@unhead/vue";
import {apis} from "@/assets/sripts";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import Silk from "@/components/Silk.vue";
import Loading from "@/components/Loading.vue";
import AssemblyCompareWidget from "@/components/AssemblyCompareWidget.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";

const route = useRoute();
const router = useRouter();
const {t} = useI18n();
const notice = useNoticeStore();

// 页面数据加载状态
const pageLoading = ref(false);

// 基准配装数据与标题
const baseAssembly = ref<any>(null);
const baseTitle = ref<string>('');

// 对比目标配装数据与标题
const targetAssembly = ref<any>(null);
const targetTitle = ref<string>('');

// 计算当前指定的基准配装 UUID（来自路由参数或查询参数）
const baseUuid = computed(() => {
  const param = route.params.uuid;
  if (param) return Array.isArray(param) ? param[0] : param;
  const qBase = route.query.base;
  if (qBase) return Array.isArray(qBase) ? qBase[0] : qBase;
  return '';
});

// 计算当前指定的对比目标配装 UUID（来自查询参数）
const targetUuid = computed(() => {
  const qTarget = route.query.target;
  if (qTarget) return Array.isArray(qTarget) ? qTarget[0] : qTarget;
  return '';
});

// 动态设置网页标题
useHead({
  title: () => `${t('assembly.compare.title', '配装对比')} - ${t('assembly.title', '配装厂')}`,
});

/**
 * 根据 UUID 获取配装详情数据
 *
 * @param uuid 配装唯一标识
 */
const fetchAssemblyDetail = async (uuid: string): Promise<any> => {
  if (!uuid) return null;
  const result = await apis.assemblyApi().getAssemblyItem(uuid);
  const data = result.data?.data || result.data;
  return data;
};

/**
 * 加载初始配装对比数据
 */
const loadInitialAssemblies = async () => {
  if (!baseUuid.value && !targetUuid.value) {
    return;
  }

  pageLoading.value = true;
  try {
    if (baseUuid.value) {
      const data = await fetchAssemblyDetail(baseUuid.value);
      if (data) {
        baseAssembly.value = data;
        baseTitle.value = data.name || '';
      }
    }

    if (targetUuid.value) {
      const targetData = await fetchAssemblyDetail(targetUuid.value);
      if (targetData) {
        targetAssembly.value = targetData;
        targetTitle.value = targetData.name || '';
      }
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'AssemblyComparePage'});
  } finally {
    pageLoading.value = false;
  }
};

watch(() => [baseUuid.value, targetUuid.value], () => {
  loadInitialAssemblies();
});

onMounted(() => {
  loadInitialAssemblies();
});

defineOptions({
  name: "AssemblyComparePage"
});
</script>

<template>
  <div class="assembly-compare-page">
    <!-- 配装对比顶栏横幅 S -->
    <v-card height="200px" elevation="0">
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
        <!-- 面包屑导航 S -->
        <v-breadcrumbs density="compact" class="ma-0 pa-0">
          <v-container>
            <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
            <v-breadcrumbs-divider></v-breadcrumbs-divider>
            <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
            <v-breadcrumbs-divider></v-breadcrumbs-divider>
            <template v-if="route.params.uuid">
              <v-breadcrumbs-item :to="`/assembly/browse/${route.params.uuid}/detail`">
                {{ baseTitle || t('assembly.detail.title') }}
              </v-breadcrumbs-item>
              <v-breadcrumbs-divider></v-breadcrumbs-divider>
            </template>
            <v-breadcrumbs-item>{{ t('assembly.compare.title') }}</v-breadcrumbs-item>
          </v-container>
        </v-breadcrumbs>
        <!-- 面包屑导航 E -->

        <v-divider opacity=".01"></v-divider>

        <!-- 页面标题与图标视觉 S -->
        <v-container class="position-relative">
          <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
            <v-icon icon="mdi-scale-balance" size="120"></v-icon>
          </div>
          <div class="pl-2 pt-1">
            <!-- <h1 class="text-amber text-h4 font-weight-bold">{{ t('assembly.compare.title') }}</h1>
            <p class="text-medium-emphasis text-body-2 mt-1">
              {{ t('assembly.compare.subtitle', '全方位多维对比多套配装属性与收益差距') }}
            </p> -->
          </div>
        </v-container>
        <!-- 页面标题与图标视觉 E -->
      </template>
    </v-card>
    <!-- 配装对比顶栏横幅 E -->

    <v-divider opacity=".06"></v-divider>

    <!-- 配装对比主体容器 S -->
    <HorizontalScrollList class="px-md-6 py-4" :is-follow-screen-center="true" :is-indicator="false">
      <div>
        <div v-if="pageLoading" class="d-flex align-center justify-center py-16">
          <Loading size="80"></Loading>
        </div>
        <div v-show="!pageLoading">
          <AssemblyCompareWidget
              :base-assembly="baseAssembly"
              :target-assembly="targetAssembly"
              :base-title="baseTitle"
              :target-title="targetTitle"
          ></AssemblyCompareWidget>
        </div>
      </div>
    </HorizontalScrollList>
    <!-- 配装对比主体容器 E -->
  </div>
</template>

<style scoped lang="less">
.assembly-compare-page {
  width: 100%;
  min-height: 100vh;
}
</style>
