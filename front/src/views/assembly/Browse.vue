<script setup lang="ts">
import {nextTick, onMounted, Ref, ref, watch} from "vue";
import {api, http} from "@/assets/sripts";
import AssemblyShowWidget from "@/components/AssemblyShowWidget.vue";
import AssemblyTouring from "@/components/AssemblyTouring.vue";
import {useI18n} from "vue-i18n";
import EmptyView from "@/components/EmptyView.vue";
import TimeFrame from "@/components/TimeFrame.vue";
import {AssemblyItem, Pagination, ResultData} from "@/assets/types";
import Loading from "@/components/Loading.vue";
import Silk from "@/components/Silk.vue";

const {t} = useI18n()


let browsePagination = ref({
      page: 1
    }),
    browseData: Ref<{
      data: AssemblyItem[],
      pagination?: Pagination
    }> = ref({
      data: []
    }),
    browseFilter = ref({
      data: {
        keyword: '',
        userId: null,
        isHasPassword: false,
        sortField: 'createdTime',
        sortOrder: 'asc',
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

onMounted(() => {
  getBrowseList();
});

/**
 * 获取配装列表
 */
const getBrowseList = async () => {
  try {
    browseLoading.value = true

    const {keyword, sortField, sortOrder, isHasPassword, createdStartAndEnd, updatedStartAndEnd} = browseFilter.value.data;

    let createdStart = createdStartAndEnd && createdStartAndEnd.split(',')[0] || null,
        createdEnd = createdStartAndEnd && createdStartAndEnd.split(',')[1] || null,
        updatedStart = updatedStartAndEnd && updatedStartAndEnd.split(',')[0] || null,
        updatedEnd = updatedStartAndEnd && updatedStartAndEnd.split(',')[1] || null;

    const result = await http.get(api['assembly_list'], {
      params: {
        keyword,
        sortField,
        sortOrder,
        isHasPassword,
        createdStart,
        createdEnd,
        updatedStart,
        updatedEnd,
      }
    });
    const d = result.data;

    if (d.error) return;

    browseData.value = d.data;
  } finally {
    browseLoading.value = false
  }
};

watch(browseData, (newList: ResultData) => {
  if (newList && newList.data.length > 0) {
    nextTick(() => {
      browseAssemblyWidgetRefs.value.forEach((widget, index) => {
        if (widget?.onLoadJson) {
          widget.onLoadJson(newList.data[index].assembly, newList.data[index].attr.assemblyUseVersion);
        }
      });
    });
  }
}, {deep: true});
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
      <v-container class="pa-2 mt-4 position-relative">
        <v-breadcrumbs class="pa-2">
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('assembly.browse.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>

        <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
          <v-icon icon="mdi-account-heart" size="120"></v-icon>
          <v-icon icon="mdi-assistant" size="120"></v-icon>
          <v-icon icon="mdi-ship-wheel" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider></v-divider>
  <v-container>
    <v-row align="center">
      <v-col>
        <v-text-field variant="plain" v-model="browseFilter.data.keyword" clearable
                      @keydown.enter="getBrowseList"
                      @click:prepend="getBrowseList"
                      :placeholder="t('assembly.browse.search')">
          <template v-slot:prepend>
            <v-icon icon="mdi-magnify"></v-icon>
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-btn to="/assembly/workshop" class="bg-amber">{{ t('assembly.browse.newAssembly') }}</v-btn>
        <v-btn class="ml-2" @click="getBrowseList">
          <v-icon icon="mdi-refresh" :class="[browseLoading ? 'spin-icon-load' : '']"></v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="3">
        <!-- 配装筛选 S -->
        <v-icon icon="mdi-filter"></v-icon>
        {{ t('assembly.browse.filterTitle') }}

        <div class="mt-3">
          <v-row no-gutters>
            <v-col cols="8">
              <v-select
                  tile
                  label="排序"
                  v-model="browseFilter.data.sortField"
                  item-title="label"
                  item-value="value"
                  :items="browseFilter.assumption.timeRanges"></v-select>
            </v-col>
            <v-col>
              <v-select
                  tile
                  v-model="browseFilter.data.sortOrder"
                  item-title="label"
                  item-value="value"
                  :items="browseFilter.assumption.slotOrders"></v-select>
            </v-col>
            <v-col cols="12" sm="6" md="6" lg="12">
              <p class="mb-2 font-weight-bold">创建时间范围</p>
              <TimeFrame v-model="browseFilter.data.createdStartAndEnd"></TimeFrame>
            </v-col>
            <v-col cols="12" sm="6" md="6" lg="12">
              <p class="mb-2 font-weight-bold">更新时间范围</p>
              <TimeFrame v-model="browseFilter.data.updatedStartAndEnd"></TimeFrame>
            </v-col>
            <v-col cols="12" sm="6" md="6" lg="12">
              <v-checkbox density="compact" hide-details v-model="browseFilter.data.isHasPassword" label="是否列出包含密码配装"></v-checkbox>
            </v-col>
          </v-row>

          <v-btn block class="mt-2" @click="getBrowseList">
            {{ t('basic.button.submit') }}
          </v-btn>
        </div>
        <!-- 配装筛选 E -->
      </v-col>
      <v-col cols="12" lg="9">
        <v-row>
          <v-col cols="12" md="12" lg="6" v-for="(i, index) in browseData.data"
                 :key="index" class=""
                 v-if="browseData.data.length > 0">
            <v-card class="card-enlargement-flavor pa-5">
              <v-row class="pt-5 pl-5 pr-5">
                <v-col cols="9">
                  <router-link :to="`/assembly/browse/${i.uuid}/detail`">
                    <div :title="i.name || 'none'" class="text-amber text-h4 mb-1 font-weight-bold singe-line">{{ i.name || 'none' }}</div>
                  </router-link>
                </v-col>
                <v-col cols="3">
                  <v-chip density="compact" class="badge-flavor pl-5 pr-5" :disabled="i.isLiked">
                    赞 {{ i.likes || 0 }}
                  </v-chip>
                </v-col>
              </v-row>
              <router-link :to="`/assembly/browse/${i.uuid}/detail`">
                <AssemblyTouring>
                  <AssemblyShowWidget
                      class="card-flavor mb-5 ml-n10 mr-n10"
                      :readonly="true"
                      :ref="(el) => { if (el) browseAssemblyWidgetRefs[index] = el }">
                  </AssemblyShowWidget>
                </AssemblyTouring>
              </router-link>
            </v-card>
          </v-col>
          <div class="w-100" v-else-if="browseLoading" align="center">
            <Loading size="100"></Loading>
          </div>
          <div class="w-100" v-else>
            <EmptyView></EmptyView>
          </div>
        </v-row>

        <!-- 配装分页 S -->
        <v-pagination
            v-if="browseData.pagination"
            v-model="browsePagination.page"
            :length="browseData.pagination.totalPages"
            class="my-4"
        ></v-pagination>
        <!-- 配装分页 E -->
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="less">
</style>
