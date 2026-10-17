<script setup lang="ts">
import {nextTick, onMounted, Ref, ref, watch} from "vue";
import {apis} from "@/assets/sripts";
import {useI18n} from "vue-i18n";
import {AssemblyListResult, ResultData} from "@/assets/types";
import {useRoute} from "vue-router";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";

import AssemblyWidget from "@/components/AssemblyWidget.vue";
import AssemblyTouring from "@/components/AssemblyTouring.vue";
import AssemblyTempCard from "@/components/AssemblyTempCard.vue";
import EmptyView from "@/components/EmptyView.vue";
import TimeFrame from "@/components/TimeFrame.vue";
import Loading from "@/components/Loading.vue";
import Silk from "@/components/Silk.vue";
import UserAvatar from "@/components/UserAvatar.vue";

import AdsWidget from "@/components/ads/google/index.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import AccountCardWidget from "@/components/AccountCardWidget.vue";
import PaginationBar from "@/components/PaginationBar.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const {t} = useI18n(),
    route = useRoute(),
    notice = useNoticeStore()

let browsePagination = ref({
      page: 1,
      pageSize: 6
    }),
    browseData: Ref<AssemblyListResult> = ref({
      data: []
    }),
    browseFilter = ref({
      data: {
        keyword: '',
        userId: null,
        isHasPassword: false,
        sortField: 'createdTime',
        sortOrder: 'desc',
        createdStartAndEnd: null,
        updatedStartAndEnd: null,
      },
      assumption: {
        slotOrders: [
          {value: 'asc', label: t('assembly.browse.filter.asc')},
          {value: 'desc', label: t('assembly.browse.filter.desc')}
        ],
        timeRanges: [
          {value: 'createdTime', label: t('assembly.browse.filter.createdTime')},
          {value: 'updatedTime', label: t('assembly.browse.filter.updatedTime')},
          {value: 'likes', label: t('assembly.browse.filter.likes')},
        ]
      }
    }),
    browseAssemblyWidgetRefs = ref([]),
    browseLoading = ref(true)

/**
 * 监听配装数据加载完成，批量触发每个 AssemblyWidget 的载入
 **/
watch(browseData, (newList: ResultData) => {
  if (newList && newList.data.length > 0) {
    nextTick(() => {
      const processBatch = (index = 0) => {
        if (index >= newList.data.length) return;

        const widget = browseAssemblyWidgetRefs.value[index];
        if (widget?.onLoad) {
          widget
              .setSetting({
                assemblyUseVersion: newList.data[index]?.attr?.assemblyUseVersion,
                isShowItemName: newList.data[index]?.attr?.isShowItemName,
              })
              .onLoad(newList.data[index]?.assembly || {})
        }

        // requestAnimationFrame 继续处理下一个
        requestAnimationFrame(() => {
          processBatch(index + 1)
        })
      };

      processBatch()
    })
  }
}, {deep: true})

onMounted(() => {
  getBrowseList()
})

/**
 * 获取配装列表
 */
const getBrowseList = async () => {
  try {
    browseLoading.value = true

    const {keyword, sortField, sortOrder, isHasPassword, createdStartAndEnd, updatedStartAndEnd} = browseFilter.value.data;
    const {page, pageSize} = browsePagination.value;

    let createdStart = createdStartAndEnd && createdStartAndEnd.split(',')[0] || null,
        createdEnd = createdStartAndEnd && createdStartAndEnd.split(',')[1] || null,
        updatedStart = updatedStartAndEnd && updatedStartAndEnd.split(',')[0] || null,
        updatedEnd = updatedStartAndEnd && updatedStartAndEnd.split(',')[1] || null;

    const result = await apis.assemblyApi().getAssemblyList({
          ...route.query,
          page,
          pageSize,
          keyword,
          sortField,
          sortOrder,
          isHasPassword,
          createdStart,
          createdEnd,
          updatedStart,
          updatedEnd,
        } as any),
        d = result.data;

    browseData.value = d.data;
  } catch (e) {
    if (e instanceof ApiError) {
      const errContent = e.message || e.code;
      notice.error(t(`basic.tips.${e.code}`, {
        content: errContent,
        context: errContent
      }), {stack: e})
    } else {
      const errContent = e instanceof Error ? e.message : String(e);
      notice.error(t('basic.tips.error', {
        content: errContent,
        context: errContent
      }), {stack: e as Error})
    }
  } finally {
    browseLoading.value = false
  }
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
      <v-breadcrumbs density="compact" class="ma-0 pa-0">
        <v-container>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('assembly.browse.title') }}</v-breadcrumbs-item>
        </v-container>
      </v-breadcrumbs>
      <v-divider opacity=".01"></v-divider>

      <v-container class="position-relative">
        <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
          <v-icon icon="mdi-account-heart" size="120"></v-icon>
          <v-icon icon="mdi-assistant" size="120"></v-icon>
          <v-icon icon="mdi-ship-wheel" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider opacity=".06"></v-divider>

  <v-container>
    <v-row align="center">
      <v-col>
        <v-text-field variant="plain"
                      v-model="browseFilter.data.keyword"
                      clearable
                      @keydown.enter="getBrowseList"
                      @click:prepend="getBrowseList"
                      :placeholder="t('assembly.browse.search')">
          <template v-slot:prepend>
            <v-icon icon="mdi-magnify"></v-icon>
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-btn to="/assembly/workshop" class="bg-amber text-black">{{ t('assembly.browse.newAssembly') }}</v-btn>
        <v-btn class="ml-2" @click="getBrowseList">
          <v-icon icon="mdi-refresh" :class="[browseLoading ? 'spin-icon-load' : '']"></v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="3" lg="3">
        <!-- 配装筛选 S -->
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
                  <p class="mb-2 ">{{ t('assembly.browse.createdTimeRange') }}</p>
                  <TimeFrame v-model="browseFilter.data.createdStartAndEnd"></TimeFrame>
                </div>
              </v-col>
              <v-col cols="12" sm="6" md="6" lg="12">
                <div class="mb-4">
                  <p class="mb-2 ">{{ t('assembly.browse.updatedTimeRange') }}</p>
                  <TimeFrame v-model="browseFilter.data.updatedStartAndEnd"></TimeFrame>
                </div>
              </v-col>
              <!--            <v-col cols="12" sm="6" md="6" lg="12">-->
              <!--              <v-checkbox density="compact" hide-details v-model="browseFilter.data.isHasPassword" :label="t('assembly.browse.includePasswordProtected')"></v-checkbox>-->
              <!--            </v-col>-->
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
        <!-- 配装筛选 E -->

        <AdsWidget class="my-10" id="assembly-sidebar-browse"></AdsWidget>
      </v-col>
      <v-col cols="12" md="9" lg="9" class="position-relative">
        <AdsWidget class="mb-5" id="assembly-browse-up"></AdsWidget>

        <v-row>
          <template v-if="browseData.data.length > 0">
            <v-col cols="12" md="6" lg="6" v-for="(i, index) in browseData.data"
                   :key="i.uuid || index">
              <AssemblyTempCard :item="i" />
            </v-col>
          </template>
        </v-row>

        <div class="w-100" v-if="!browseData.data && !browseLoading">
          <EmptyView></EmptyView>
        </div>

        <v-overlay class="h-100 d-flex justify-center align-center bg-transparent"
                   contained
                   opacity="0"
                   :transition="false"
                   v-model="browseLoading">
          <Loading size="100"></Loading>
        </v-overlay>

        <!-- 分页 S -->
        <PaginationBar v-model:page="browsePagination.page"
                       :pagination="browseData.pagination"
                       class="mt-8"
                       @change="getBrowseList" />
        <!-- 分页 E -->

        <AdsWidget id="assembly-browse-down"></AdsWidget>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";
</style>
