<script setup lang="ts">
import {nextTick, onMounted, ref, watch} from "vue";
import {useHttpToken} from "../../assets/sripts/httpUtil";
import {api, http} from "../../assets/sripts";
import AssemblyShowWidget from "../../components/AssemblyShowWidget.vue";
import AssemblyTouring from "../../components/AssemblyTouring.vue";
import {useI18n} from "vue-i18n";
import EmptyView from "../../components/EmptyView.vue";
import Loading from "../../components/Loading.vue";
import TimeFrame from "../../components/TimeFrame.vue";

const httpToken = useHttpToken(),
    {t} = useI18n()

let pagination = ref({
      page: 1
    }),
    list = ref({
      data: []
    }),
    filter = ref({
      data: {
        keyword: '',
        userId: null,
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
    widgetRefs = ref([]),
    loading = ref(false)

onMounted(() => {
  getBrowseList();
});

/**
 * 获取配装列表
 */
const getBrowseList = async () => {
  try {
    loading.value = true

    const {keyword, sortField, sortOrder, createdStartAndEnd, updatedStartAndEnd} = filter.value.data;

    let createdStart = createdStartAndEnd && createdStartAndEnd.split(',')[0] || null,
        createdEnd = createdStartAndEnd && createdStartAndEnd.split(',')[1] || null,
        updatedStart = updatedStartAndEnd && updatedStartAndEnd.split(',')[0] || null,
        updatedEnd = updatedStartAndEnd && updatedStartAndEnd.split(',')[1] || null;

    const result = await http.get(api['assembly_list'], {
      params: {
        keyword,
        sortField,
        sortOrder,
        createdStart,
        createdEnd,
        updatedStart,
        updatedEnd,
      }
    });
    const d = result.data;

    if (d.error) return;

    list.value = d.data;
  } finally {
    loading.value = false
  }
};

watch(list, (newList) => {
  if (newList && newList.data.length > 0) {
    nextTick(() => {
      widgetRefs.value.forEach((widget, index) => {
        if (widget?.onLoadJson) {
          widget.onLoadJson(newList.data[index].data);
        }
      });
    });
  }
}, {deep: true});
</script>

<template>
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('assembly.browse.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container>
    <v-row align="center">
      <v-col>
        <v-text-field variant="plain" v-model="filter.data.keyword" clearable
                      @keydown.enter="getBrowseList"
                      @click:prepend="getBrowseList"
                      :placeholder="t('assembly.browse.search')">
          <template v-slot:prepend>
            <v-icon icon="mdi-magnify"></v-icon>
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-btn to="/assembly/workshop">{{ t('assembly.browse.newAssembly') }}</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="3">
        <v-icon icon="mdi-filter"></v-icon>
        {{ t('assembly.browse.filterTitle') }}

        <div class="mt-3">
          <v-row no-gutters>
            <v-col cols="8">
              <v-select
                  tile
                  label="排序"
                  v-model="filter.data.sortField"
                  item-title="label"
                  item-value="value"
                  :items="filter.assumption.timeRanges"></v-select>
            </v-col>
            <v-col>
              <v-select
                  tile
                  v-model="filter.data.sortOrder"
                  item-title="label"
                  item-value="value"
                  :items="filter.assumption.slotOrders"></v-select>
            </v-col>
          </v-row>

          <p class="mb-2 font-weight-bold">创建时间范围</p>
          <TimeFrame v-model="filter.data.createdStartAndEnd"></TimeFrame>

          <p class="mb-2 font-weight-bold">更新时间范围</p>
          <TimeFrame v-model="filter.data.updatedStartAndEnd"></TimeFrame>

          <v-btn block class="mt-2" @click="getBrowseList">
            {{ t('basic.button.submit') }}
          </v-btn>
        </div>
      </v-col>
      <v-col cols="12" lg="9">
        <v-row>
          <v-col cols="12" md="12" lg="6" v-for="(item, index) in list.data"
                 :key="index" class="card-flavor"
                 v-if="list.data.length > 0">
            <v-row class="pt-5 pl-5 pr-5">
              <v-col>
                <router-link :to="`/assembly/browse/${item.uuid}/detail`">
                  <div class="text-amber text-h4 mb-1 font-weight-bold">{{ item.byUsername }}</div>
                </router-link>
                <p class="font-weight-bold">{{ item.name || 'none' }}</p>
              </v-col>
              <v-col cols="auto">
                <v-chip class="badge-flavor pl-5 pr-5" :disabled="item.isLiked">
                  赞 {{ item.likes || 0 }}
                </v-chip>
              </v-col>
            </v-row>
            <v-card class="card-flavor" :to="`/assembly/browse/${item.uuid}/detail`">
              <AssemblyTouring>
                <AssemblyShowWidget
                    class="card-flavor mb-5 ml-n10 mr-n10"
                    :readonly="true"
                    :ref="(el) => { if (el) widgetRefs[index] = el }">
                </AssemblyShowWidget>
              </AssemblyTouring>
            </v-card>
          </v-col>
          <div class="w-100" v-else-if="loading" align="center">
            <Loading size="100"></Loading>
          </div>
          <div class="w-100" v-else>
            <EmptyView></EmptyView>
          </div>
        </v-row>
      </v-col>
    </v-row>

    <v-pagination
        v-if="list.pagination"
        v-model="pagination.page"
        :length="list.pagination.totalPages"
        class="my-4"
    ></v-pagination>
  </v-container>
</template>

<style scoped lang="less">
</style>
