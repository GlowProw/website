<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useNoticeStore } from "~/stores/noticeStore";
import { useAuthStore } from "~/stores/userAccountStore";
import { useRankingDesignedApi } from "@/assets/sripts/api/ranking_designed_service";
import { handleApiError } from "@/assets/sripts/error_handler";

import Loading from "@/components/Loading.vue";
import EmptyView from "@/components/EmptyView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import QuotaLimitWidget from "@/components/QuotaLimitWidget.vue";
import RankingSettingPanel from "@/components/RankingSettingPanel.vue";

const notice = useNoticeStore();
const { t } = useI18n();
const authStore = useAuthStore();
const rankingApi = useRankingDesignedApi();

// 状态定义
const loading = ref(false);
const searchQuery = ref("");
const rankingList = ref<any[]>([]);
const selectedRankings = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = 10;
const currentSettingId = ref("");
const settingPanelRef = ref<any>(null);

/**
 * 打开天梯设置弹窗
 * @param uuid 天梯唯一标识
 */
const openSetting = (uuid: string) => {
  currentSettingId.value = uuid;
  nextTick(() => {
    settingPanelRef.value?.open();
  });
};

onMounted(() => {
  getMyRankingsData();
});

/**
 * 格式化时间字符串
 * @param date 日期字符串或时间戳
 */
const formatDate = (date: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

/**
 * 获取当前登录用户发布的天梯列表
 */
const getMyRankingsData = async () => {
  if (!authStore.user?.userId) return;
  try {
    loading.value = true;
    const res = await rankingApi.getRankingList({
      userId: authStore.user.userId,
      page: 1,
      pageSize: 100,
    });
    const resData = res.data?.data || res.data;
    rankingList.value = resData?.data || resData?.items || (Array.isArray(resData) ? resData : []);
    selectedRankings.value = [];
  } catch (e) {
    handleApiError(e, notice, t, { component: "AccountRankings" });
  } finally {
    loading.value = false;
  }
};

/**
 * 过滤后的天梯列表
 */
const filteredList = computed(() => {
  const list = rankingList.value || [];
  if (!searchQuery.value) return list;
  const q = searchQuery.value.toLowerCase().trim();
  return list.filter((i: any) => (i.name || "").toLowerCase().includes(q));
});

/**
 * 总页数
 */
const totalPages = computed(() => {
  return Math.ceil(filteredList.value.length / pageSize) || 1;
});

/**
 * 当前页分页列表
 */
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredList.value.slice(start, start + pageSize);
});

/**
 * 判断当前页是否已全选
 */
const isAllSelected = computed(() => {
  return pagedList.value.length > 0 && selectedRankings.value.length === pagedList.value.length;
});

/**
 * 切换全选状态
 */
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedRankings.value = [];
  } else {
    selectedRankings.value = [...pagedList.value];
  }
};

/**
 * 切换单项选中状态
 * @param item 天梯项
 */
const toggleItem = (item: any) => {
  const index = selectedRankings.value.findIndex(i => i.uuid === item.uuid);
  
  if (index >= 0) {
    selectedRankings.value.splice(index, 1);
  } else {
    selectedRankings.value.push(item);
  }
};

/**
 * 判断指定天梯是否已选中
 * @param item 天梯项
 */
const isItemSelected = (item: any) => {
  return selectedRankings.value.some(i => i.uuid === item.uuid);
};

/**
 * 删除单个天梯
 * @param item 天梯数据项
 */
const onDeleteRanking = async (item: any) => {
  try {
    const confirmMsg = t("rankingDesignedItems.account.deleteConfirm", { name: item.name });
    if (!confirm(confirmMsg)) return;

    loading.value = true;

    await rankingApi.deleteRanking(item.uuid);
    notice.success(t("basic.tips.deleted"));

    await getMyRankingsData();
  } catch (e) {
    handleApiError(e, notice, t, { component: "AccountRankings" });
  } finally {
    loading.value = false;
  }
};

/**
 * 批量删除天梯
 */
const onBatchDeleteRankings = async () => {
  if (selectedRankings.value.length === 0) return;
  try {
    const confirmMsg = t("rankingDesignedItems.account.batchDeleteConfirm", { count: selectedRankings.value.length });
    if (!confirm(confirmMsg)) return;
    
    loading.value = true;

    for (const item of selectedRankings.value) {
      await rankingApi.deleteRanking(item.uuid);
    }

    notice.success(t("basic.tips.deleted"));

    selectedRankings.value = [];
    await getMyRankingsData();
  } catch (e) {
    handleApiError(e, notice, t, { component: "AccountRankings" });
  } finally {
    loading.value = false;
  }
};

defineOptions({
  name: "AccountRankings",
});
</script>

<template>
  <div class="position-relative">
    <v-overlay :model-value="loading" contained class="d-flex align-center justify-center">
      <Loading size="50"></Loading>
    </v-overlay>

    <!-- 操作头 S -->
    <AffixContainerView>
      <v-card class="d-flex align-center justify-space-between flex-wrap ga-2 pa-2">
        <div class="d-flex align-center flex-wrap ga-2">
          <!-- 全选复选框 -->
          <v-checkbox-btn
              v-if="pagedList.length > 0"
              :model-value="isAllSelected"
              :indeterminate="selectedRankings.length > 0 && !isAllSelected"
              @click.stop="toggleSelectAll"
              class="mx-2">
            <template v-slot:label>
              <p
                  class="text-body-2 font-weight-medium cursor-pointer user-select-none singe-line"
                  @click="toggleSelectAll">
                {{ t('account.selectAll') }}
              </p>
            </template>
          </v-checkbox-btn>

          <span v-if="selectedRankings.length > 0" class="font-weight-bold">
            {{ t('account.itemsSelected', {count: selectedRankings.length}) }}
          </span>

          <!-- 批量删除按钮 -->
          <v-btn
              v-if="selectedRankings.length > 0"
              variant="tonal"
              color="error"
              prepend-icon="mdi-delete"
              @click="onBatchDeleteRankings">
            {{ t('basic.button.delete') }}
          </v-btn>

          <v-text-field
              v-if="selectedRankings.length <= 0"
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
          <QuotaLimitWidget resource="ranking" text></QuotaLimitWidget>

          <v-btn
              color="amber"
              variant="tonal"
              prepend-icon="mdi-plus"
              to="/ranking-designed-items/workshop"
              target="_blank">
            {{ t('rankingDesignedItems.browse.newRanking') }}
          </v-btn>

          <v-btn
              variant="flat"
              @click="getMyRankingsData"
              :loading="loading">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- 操作头 E -->

    <!-- 天梯管理列表 S -->
    <div v-if="pagedList && pagedList.length > 0">
      <v-list lines="three" variant="text" class="bg-transparent">
        <template v-for="(i, index) in pagedList" :key="i.uuid || index">
          <v-list-item>
            <template v-slot:prepend>
              <div class="d-flex align-center">
                <v-checkbox-btn
                    :model-value="isItemSelected(i)"
                    @click.stop="toggleItem(i)"
                    class="mr-2 flex-shrink-0">
                </v-checkbox-btn>
                <v-avatar size="50" rounded="lg" color="surface-variant" class="mr-3 flex-shrink-0">
                  <v-icon size="24" color="amber">mdi-podium</v-icon>
                </v-avatar>
              </div>
            </template>

            <template v-slot:title>
              <div class="d-flex align-center flex-wrap ga-2">
                <p class="font-weight-bold">{{ i.name || 'Untitled Ranking' }}</p>

                <!-- 可见性状态胶囊 -->
                <v-chip
                    size="x-small"
                    :color="i.visibility === 'publicly' ? 'green' : i.visibility === 'unlisted' ? 'amber' : 'grey'"
                    variant="tonal">
                  {{ i.visibility === 'publicly' ? t('rankingDesignedItems.visibility.publicly') : i.visibility === 'unlisted' ? t('rankingDesignedItems.visibility.unlisted') : t('rankingDesignedItems.visibility.private') }}
                </v-chip>

                <!-- 分类标签 -->
                <v-chip
                    v-for="tag in (i.tags || []).slice(0, 3)"
                    :key="tag"
                    size="x-small"
                    color="amber"
                    variant="tonal">
                  {{ tag }}
                </v-chip>
              </div>
            </template>

            <template v-slot:subtitle>
              <div class="d-flex align-center flex-wrap ga-2 mt-2">
                <p class="d-flex align-center">
                  <v-icon size="14" class="mr-1">mdi-heart-outline</v-icon>
                  {{ i.likes || 0 }}
                </p>
                <v-divider vertical inset class="mx-1"></v-divider>
                <p class="d-flex align-center">
                  <v-icon size="14" class="mr-1">mdi-eye-outline</v-icon>
                  {{ i.views || i.browseCount || 0 }}
                </p>
                <v-divider vertical inset class="mx-1"></v-divider>
                <p class="d-flex align-center">
                  <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                  {{ formatDate(i.updatedTime || i.createdTime) }}
                </p>
                <v-divider vertical inset class="mx-1"></v-divider>
                <span class="opacity-60 text-caption">
                  {{ t('rankingDesignedItems.browse.layers', { count: (i.data || i.ranking || []).length }) }}
                </span>
              </div>
            </template>

            <template v-slot:append>
              <v-menu location="bottom end">
                <template v-slot:activator="{ props }">
                  <v-btn
                      v-bind="props"
                      size="small"
                      variant="text"
                      icon="mdi-dots-vertical">
                  </v-btn>
                </template>
                <v-list min-width="260" class="pa-1" border rounded="lg">
                  <v-list-item
                      prepend-icon="mdi-pencil"
                      :to="`/ranking-designed-items/workshop/${i.uuid}/edit`"
                      target="_blank">
                    <v-list-item-title>{{ t('basic.button.edit') }}</v-list-item-title>
                  </v-list-item>

                  <v-list-item
                      prepend-icon="mdi-open-in-new"
                      :to="`/ranking-designed-items/browse/${i.uuid}/detail`"
                      target="_blank">
                    <v-list-item-title>{{ t('basic.button.view') }}</v-list-item-title>
                  </v-list-item>

                  <v-list-item
                      prepend-icon="mdi-cog"
                      @click="openSetting(i.uuid)">
                    <v-list-item-title>{{ t('basic.button.setting') }}</v-list-item-title>
                  </v-list-item>

                  <v-divider class="my-1"></v-divider>

                  <v-list-item
                      prepend-icon="mdi-delete"
                      class="text-error"
                      @click="onDeleteRanking(i)">
                    <v-list-item-title>{{ t('basic.button.delete') }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
          <v-divider inset v-if="index < pagedList.length - 1"></v-divider>
        </template>
      </v-list>

      <!-- 分页器 S -->
      <div
          v-if="totalPages > 1"
          class="d-flex justify-center mt-4">
        <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="5"
            density="comfortable"
            size="small">
        </v-pagination>
      </div>
      <!-- 分页器 E -->
    </div>

    <div class="text-center py-12" v-else>
      <EmptyView></EmptyView>
    </div>
    <!-- 天梯管理列表 E -->

    <!-- 天梯设置弹窗 S -->
    <RankingSettingPanel
        v-if="currentSettingId"
        ref="settingPanelRef"
        :id="currentSettingId"
        @change="getMyRankingsData">
    </RankingSettingPanel>
    <!-- 天梯设置弹窗 E -->
  </div>
</template>

<style scoped lang="less">
.cursor-pointer {
  cursor: pointer;
}

.user-select-none {
  user-select: none;
}
</style>
