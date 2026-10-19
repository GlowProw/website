<template>
  <div class="position-relative">
    <!-- 操作头 S -->
    <AffixContainerView>
      <v-card class="d-flex align-center justify-space-between flex-wrap ga-2 pa-2">
        <div class="d-flex align-center flex-wrap ga-2">
          <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              :placeholder="t('basic.button.search')"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              style="width: 200px;"
              class="flex-shrink-0">
          </v-text-field>
        </div>

        <v-spacer></v-spacer>

        <div class="d-flex align-center ga-2">
          <v-btn
              variant="flat"
              @click="getUserTeamUpsData"
              :loading="loading">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- 操作头 E -->

    <!-- 组队列表 S -->
    <div v-if="filteredList && filteredList.length > 0">
      <v-list lines="three" variant="text" class="bg-transparent">
        <template v-for="(i, index) in filteredList" :key="i.id || index">
          <v-list-item>
            <template v-slot:prepend>
              <div class="d-flex align-center">
                <v-avatar size="50" rounded="lg" color="surface-variant" class="mr-3 flex-shrink-0">
                  <v-icon size="24" color="amber">mdi-account-group</v-icon>
                </v-avatar>
              </div>
            </template>

            <template v-slot:title>
              <Textarea :value="i.description || i.title || 'Untitled Teamup'" min-height="auto" readonly class="font-weight-bold singe-line mb-2"></Textarea>

              <div class="d-flex align-center flex-wrap ga-2" v-if="i.tags && i.tags.length">
                <v-chip
                    v-for="(tag, tagIndex) in i.tags"
                    :key="tagIndex"
                    size="x-small"
                    variant="tonal"
                    color="amber">
                  {{ tag }}
                </v-chip>
              </div>
            </template>

            <template v-slot:subtitle>
              <div class="d-flex align-center flex-wrap ga-2 mt-2">
                <p class="d-flex align-center font-weight-medium text-caption" v-if="i.player">
                  <v-icon size="14" class="mr-1">mdi-account</v-icon>
                  {{ i.player }}
                </p>
                <v-divider vertical inset class="mx-1" v-if="i.player && i.createdTime"></v-divider>
                <p class="d-flex align-center text-caption opacity-60" v-if="i.createdTime">
                  <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                  <TimeView :time="i.createdTime"></TimeView>
                </p>
              </div>
            </template>

            <template v-slot:append>
              <v-btn
                  size="small"
                  variant="tonal"
                  color="amber"
                  prepend-icon="mdi-arrow-right"
                  to="/team">
                {{ t('team.title') }}
              </v-btn>
            </template>
          </v-list-item>
          <v-divider inset v-if="index < filteredList.length - 1"></v-divider>
        </template>
      </v-list>

      <!-- 分页器 S -->
      <PaginationBar
          v-if="userTeamUpData.pagination"
          v-model:page="spacePagination.page"
          :pagination="userTeamUpData.pagination"
          class="mt-8"
          @change="getUserTeamUpsData" />
      <!-- 分页器 E -->
    </div>

    <div class="text-center py-12" v-else-if="!loading">
      <EmptyView></EmptyView>
    </div>
    <!-- 组队列表 E -->

    <div v-if="loading" class="d-flex justify-center align-center py-10">
      <Loading size="50"></Loading>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, inject, onMounted, ref, watch, Ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {apis} from '@/assets/sripts';
import {useNoticeStore} from '~/stores/noticeStore';
import {handleApiError} from '@/assets/sripts/error_handler';
import {ResultData} from '@/assets/types';

import TimeView from '@/components/TimeView.vue';
import EmptyView from '@/components/EmptyView.vue';
import Loading from '@/components/Loading.vue';
import AffixContainerView from '@/components/AffixContainerView.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import Textarea from '@/components/textarea/index.vue';

const {t} = useI18n();
const notice = useNoticeStore();

const spaceContext = inject<{
  targetUserId: Ref<string>;
  spaceBlocked: Ref<boolean>;
}>('spaceContext');

// 加载状态
const loading = ref(false);
// 搜索关键字
const searchQuery = ref('');
// 空间用户组队招募数据
const userTeamUpData = ref<ResultData<any[]> & { pagination?: any }>({
  code: '0',
  data: [],
});
// 分页参数
const spacePagination = ref({
  page: 1,
  pageSize: 10,
});

/**
 * 获取指定空间用户的组队招募列表
 */
const getUserTeamUpsData = async () => {
  const uid = spaceContext?.targetUserId?.value;
  if (!uid || spaceContext?.spaceBlocked?.value) return;

  try {
    loading.value = true;
    const result = await apis.userApi().getUserTeamups(uid, spacePagination.value);
    userTeamUpData.value = result.data?.data || {code: '0', data: []};
  } catch (e) {
    handleApiError(e, notice, t, {component: 'UserSpaceTeamups'});
  } finally {
    loading.value = false;
  }
};

/**
 * 经过搜索关键词过滤后的组队列表
 */
const filteredList = computed(() => {
  const list = userTeamUpData.value?.data || [];
  if (!searchQuery.value.trim()) return list;
  const q = searchQuery.value.toLowerCase().trim();
  return list.filter((i: any) => {
    return (i.description && i.description.toLowerCase().includes(q)) ||
        (i.player && i.player.toLowerCase().includes(q));
  });
});

watch(() => spaceContext?.targetUserId?.value, (newUid) => {
  if (newUid) {
    spacePagination.value.page = 1;
    getUserTeamUpsData();
  }
});

watch(() => spaceContext?.spaceBlocked?.value, (blocked) => {
  if (!blocked) {
    getUserTeamUpsData();
  }
});

onMounted(() => {
  getUserTeamUpsData();
});

defineOptions({
  name: 'SpaceTeamups',
});
</script>
