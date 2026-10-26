<script setup lang="ts">
import { onMounted, Ref, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { ApiError } from "@/assets/types/Api";
import { useNoticeStore } from "~/stores/noticeStore";
import { useRankingDesignedApi } from "@/assets/sripts/api/ranking_designed_service";

import RankingDesignedTempCard from "@/components/RankingDesignedTempCard.vue";
import EmptyView from "@/components/EmptyView.vue";
import TimeFrame from "@/components/TimeFrame.vue";
import Loading from "@/components/Loading.vue";
import Silk from "@/components/Silk.vue";
import AdsWidget from "@/components/ads/google/index.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import PaginationBar from "@/components/PaginationBar.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const { t } = useI18n();
const route = useRoute();
const notice = useNoticeStore();
const rankingApi = useRankingDesignedApi();

// 分页与数据结构定义
const browsePagination = ref({
  page: 1,
  pageSize: 6,
});

const browseData: Ref<any> = ref({
  data: [],
});

// 筛选表单与备选项配置
const browseFilter = ref({
  data: {
    keyword: "",
    userId: null,
    sortField: "updatedTime",
    sortOrder: "desc",
    createdStartAndEnd: null as string | null,
    updatedStartAndEnd: null as string | null,
  },
  assumption: {
    slotOrders: [
      { value: "asc", label: t("assembly.browse.filter.asc") },
      { value: "desc", label: t("assembly.browse.filter.desc") },
    ],
    timeRanges: [
      { value: "updatedTime", label: t("assembly.browse.filter.updatedTime") },
      { value: "createdTime", label: t("assembly.browse.filter.createdTime") },
      { value: "likes", label: t("assembly.browse.filter.likes") },
      { value: "views", label: t("rankingDesignedItems.browse.sortViews") },
    ],
  },
});

const browseLoading = ref(true);

onMounted(() => {
  getBrowseList();
});

/**
 * 分页拉取天梯榜单数据列表
 */
const getBrowseList = async () => {
  try {
    browseLoading.value = true;

    const { keyword, sortField, sortOrder, createdStartAndEnd, updatedStartAndEnd } = browseFilter.value.data;
    const { page, pageSize } = browsePagination.value;

    const createdStart = (createdStartAndEnd && createdStartAndEnd.split(",")[0]) || null;
    const createdEnd = (createdStartAndEnd && createdStartAndEnd.split(",")[1]) || null;
    const updatedStart = (updatedStartAndEnd && updatedStartAndEnd.split(",")[0]) || null;
    const updatedEnd = (updatedStartAndEnd && updatedStartAndEnd.split(",")[1]) || null;

    const result = await rankingApi.getRankingList({
      ...route.query,
      page,
      pageSize,
      keyword: keyword?.trim() || undefined,
      sortField: sortField as any,
      sortOrder: sortOrder as any,
      createdStart: createdStart || undefined,
      createdEnd: createdEnd || undefined,
      updatedStart: updatedStart || undefined,
      updatedEnd: updatedEnd || undefined,
    } as any);

    const d = result.data;
    const resData = d?.data || d;

    browseData.value = {
      data: resData?.data || resData?.items || (Array.isArray(resData) ? resData : []),
      pagination: resData?.pagination || null,
    };
  } catch (e) {
    if (e instanceof ApiError) {
      const errContent = e.message || e.code;
      notice.error(t(`basic.tips.${e.code}`, {
        content: errContent,
        context: errContent,
      }), { stack: e });
    } else {
      const errContent = e instanceof Error ? e.message : String(e);
      notice.error(t("basic.tips.error", {
        content: errContent,
        context: errContent,
      }), { stack: e as Error });
    }
  } finally {
    browseLoading.value = false;
  }
};

defineOptions({
  name: "RankingDesignedBrowse",
});
</script>

<template>
  <!-- 顶部面包屑与背景区域 S -->
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
          <v-breadcrumbs-item>{{ t('rankingDesignedItems.browse.title') }}</v-breadcrumbs-item>
        </v-container>
      </v-breadcrumbs>
      <v-divider opacity=".01"></v-divider>

      <v-container class="position-relative">
        <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
          <v-icon icon="mdi-podium" size="120"></v-icon>
          <v-icon icon="mdi-format-list-bulleted-type" size="120"></v-icon>
          <v-icon icon="mdi-trophy-variant" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider opacity=".06"></v-divider>
  <!-- 顶部面包屑与背景区域 E -->

  <!-- 主体容器 S -->
  <v-container>
    <!-- 顶部搜索与操作栏 S -->
    <v-row align="center">
      <v-col>
        <v-text-field
            variant="plain"
            v-model="browseFilter.data.keyword"
            clearable
            @keydown.enter="getBrowseList"
            @click:prepend="getBrowseList"
            :placeholder="t('rankingDesignedItems.browse.searchPlaceholder')">
          <template v-slot:prepend>
            <v-icon icon="mdi-magnify"></v-icon>
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-btn to="/ranking-designed-items/workshop" class="bg-amber text-black">{{ t('rankingDesignedItems.browse.newRanking') }}</v-btn>
        <v-btn class="ml-2" @click="getBrowseList">
          <v-icon icon="mdi-refresh" :class="[browseLoading ? 'spin-icon-load' : '']"></v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <!-- 顶部搜索与操作栏 E -->

    <v-row>
      <!-- 左侧天梯筛选 S -->
      <v-col cols="12" md="3" lg="3">
        <AffixContainerView>
          <AffixBoxHasTitleView :disabled-title="true">
            <v-row no-gutters>
              <v-col cols="12">
                <v-select
                    tile
                    :label="t('assembly.browse.sort')"
                    v-model="browseFilter.data.sortField"
                    item-title="label"
                    item-value="value"
                    :items="browseFilter.assumption.timeRanges"></v-select>
              </v-col>
              <v-col cols="12">
                <v-select
                    tile
                    v-model="browseFilter.data.sortOrder"
                    item-title="label"
                    item-value="value"
                    :items="browseFilter.assumption.slotOrders"></v-select>
              </v-col>
              <v-col cols="12" sm="6" md="6" lg="12">
                <div class="mb-4">
                  <p class="mb-2">{{ t('assembly.browse.createdTimeRange') }}</p>
                  <TimeFrame v-model="browseFilter.data.createdStartAndEnd"></TimeFrame>
                </div>
              </v-col>
              <v-col cols="12" sm="6" md="6" lg="12">
                <div class="mb-4">
                  <p class="mb-2">{{ t('assembly.browse.updatedTimeRange') }}</p>
                  <TimeFrame v-model="browseFilter.data.updatedStartAndEnd"></TimeFrame>
                </div>
              </v-col>
            </v-row>

            <v-btn block class="mt-2" @click="getBrowseList">
              {{ t('basic.button.submit') }}
            </v-btn>

            <template v-slot:title>
              <v-icon icon="mdi-filter"></v-icon>
              {{ t('assembly.browse.filterTitle') }}
            </template>
          </AffixBoxHasTitleView>
        </AffixContainerView>

        <AdsWidget class="my-10" id="ranking-sidebar-browse"></AdsWidget>
      </v-col>
      <!-- 左侧天梯筛选 E -->

      <!-- 右侧列表卡片展示 S -->
      <v-col cols="12" md="9" lg="9" class="position-relative">
        <AdsWidget class="mb-5" id="ranking-browse-up"></AdsWidget>

        <v-row>
          <template v-if="browseData.data && browseData.data.length > 0">
            <v-col
                cols="12"
                md="6"
                lg="6"
                v-for="(i, index) in browseData.data"
                :key="i.uuid || index">
              <RankingDesignedTempCard :item="i" />
            </v-col>
          </template>
        </v-row>

        <div class="w-100" v-if="(!browseData.data || browseData.data.length === 0) && !browseLoading">
          <EmptyView></EmptyView>
        </div>

        <v-overlay
            class="h-100 d-flex justify-center align-center bg-transparent"
            contained
            opacity="0"
            :transition="false"
            v-model="browseLoading">
          <Loading size="100"></Loading>
        </v-overlay>

        <!-- 分页 S -->
        <PaginationBar
            v-model:page="browsePagination.page"
            :pagination="browseData.pagination"
            class="mt-8"
            @change="getBrowseList" />
        <!-- 分页 E -->

        <AdsWidget id="ranking-browse-down"></AdsWidget>
      </v-col>
      <!-- 右侧列表卡片展示 E -->
    </v-row>
  </v-container>
  <!-- 主体容器 E -->
</template>

<style scoped lang="less">
@import "@/assets/styles/link";
</style>
