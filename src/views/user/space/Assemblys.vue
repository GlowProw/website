<template>
  <v-row>
    <v-col cols="12" lg="3">
      <!-- 配装筛选 S -->
      <AffixContainerView>
        <AffixBoxHasTitleView :disabled-title="true">
          <v-row no-gutters>
            <v-col cols="12">
              <v-select
                  tile
                  :label="t('assembly.browse.sort')"
                  v-model="spaceFilter.data.sortField"
                  item-title="label"
                  item-value="value"
                  :items="spaceFilter.assumption.timeRanges"></v-select>
            </v-col>
            <v-col cols="12">
              <v-select
                  tile
                  v-model="spaceFilter.data.sortOrder"
                  item-title="label"
                  item-value="value"
                  :items="spaceFilter.assumption.slotOrders"></v-select>
            </v-col>
            <v-col cols="12">
              <div class="mb-4">
                <p class="mb-2 ">{{ t('assembly.browse.createdTimeRange') }}</p>
                <TimeFrame v-model="spaceFilter.data.createdStartAndEnd"></TimeFrame>
              </div>
            </v-col>
            <v-col cols="12">
              <div class="mb-4">
                <p class="mb-2 ">{{ t('assembly.browse.updatedTimeRange') }}</p>
                <TimeFrame v-model="spaceFilter.data.updatedStartAndEnd"></TimeFrame>
              </div>
            </v-col>
          </v-row>

          <v-btn block class="mt-2" @click="onFilterSubmit">
            {{ t('basic.button.submit') }}
          </v-btn>

          <template v-slot:title>
            <v-icon icon="mdi-filter"></v-icon>
            {{ t('assembly.browse.filterTitle') }}
          </template>
        </AffixBoxHasTitleView>
      </AffixContainerView>
      <!-- 配装筛选 E -->
    </v-col>

    <v-col cols="12" lg="9">
      <div class="position-relative">
        <v-row v-if="userAssemblysData.data && userAssemblysData.data.length > 0" class="">
          <v-col cols="12" md="6" lg="6" v-for="(i, index) in userAssemblysData.data" :key="i.uuid || index">
            <AssemblyTempCard :item="i" />
          </v-col>
        </v-row>

        <div class="text-center py-10" v-else-if="!loading">
          <EmptyView></EmptyView>
        </div>

        <!-- 分页 S -->
        <PaginationBar
            v-if="userAssemblysData.pagination"
            v-model:page="spacePagination.page"
            :pagination="userAssemblysData.pagination"
            class="mt-8"
            @change="getUserAssemblysData" />
        <!-- 分页 E -->

        <div v-if="loading" class="d-flex justify-center align-center py-10">
          <Loading size="50"></Loading>
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import {inject, onMounted, ref, watch, Ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {apis} from '@/assets/sripts';
import {useNoticeStore} from '~/stores/noticeStore';
import {handleApiError} from '@/assets/sripts/error_handler';
import {AssemblyListResult} from '@/assets/types';

import AssemblyTempCard from '@/components/AssemblyTempCard.vue';
import EmptyView from '@/components/EmptyView.vue';
import Loading from '@/components/Loading.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import TimeFrame from '@/components/TimeFrame.vue';
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const {t} = useI18n();
const notice = useNoticeStore();

const spaceContext = inject<{
  targetUserId: Ref<string>;
  spaceBlocked: Ref<boolean>;
}>('spaceContext');

const loading = ref(false);
const userAssemblysData = ref<AssemblyListResult>({
  code: '0',
  data: [],
});
const spacePagination = ref({
  page: 1,
  pageSize: 6,
});
const spaceFilter = ref({
  data: {
    sortField: 'createdTime',
    sortOrder: 'desc',
    createdStartAndEnd: null as string | null,
    updatedStartAndEnd: null as string | null,
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
});

const getUserAssemblysData = async () => {
  const uid = spaceContext?.targetUserId?.value;
  if (!uid || spaceContext?.spaceBlocked?.value) return;

  try {
    loading.value = true;

    // 拆分时间范围为起止参数
    const {sortField, sortOrder, createdStartAndEnd, updatedStartAndEnd} = spaceFilter.value.data;
    const createdStart = createdStartAndEnd && createdStartAndEnd.split(',')[0] || null,
        createdEnd = createdStartAndEnd && createdStartAndEnd.split(',')[1] || null,
        updatedStart = updatedStartAndEnd && updatedStartAndEnd.split(',')[0] || null,
        updatedEnd = updatedStartAndEnd && updatedStartAndEnd.split(',')[1] || null;

    const result = await apis.userApi().getUserAssemblys(uid, {
      ...spacePagination.value,
      sortField,
      sortOrder,
      createdStart,
      createdEnd,
      updatedStart,
      updatedEnd,
    });
    userAssemblysData.value = result.data?.data || {code: '0', data: []};
  } catch (e) {
    handleApiError(e, notice, t, {component: 'UserSpaceAssemblys'});
  } finally {
    loading.value = false;
  }
};

/**
 * 提交筛选条件并回到第一页刷新列表
 */
const onFilterSubmit = () => {
  spacePagination.value.page = 1;
  getUserAssemblysData();
};

watch(() => spaceContext?.targetUserId?.value, (newUid) => {
  if (newUid) {
    spacePagination.value.page = 1;
    getUserAssemblysData();
  }
});

watch(() => spaceContext?.spaceBlocked?.value, (blocked) => {
  if (!blocked) {
    getUserAssemblysData();
  }
});

onMounted(() => {
  getUserAssemblysData();
});

defineOptions({
  name: 'SpaceAssemblys',
});
</script>
