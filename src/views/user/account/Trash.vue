<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {apis} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import Loading from "@/components/Loading.vue";
import EmptyView from "@/components/EmptyView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import PaginationBar from "@/components/PaginationBar.vue";

const notice = useNoticeStore(),
    {t} = useI18n()

let loading = ref(false),
    trashData = ref<any[]>([]),
    pagination = ref<any>({
      page: 1,
      pageSize: 20,
      total: 0
    }),
    selectedItems = ref<any[]>([])

onMounted(() => {
  getTrashData()
})

/**
 * 获取回收站信息
 */
const getTrashData = async () => {
  try {
    loading.value = true
    const result = await apis.trashApi().getTrashList({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    })
    const d = result.data

    trashData.value = d?.data?.list || []
    if (d?.data?.pagination) {
      pagination.value = d.data.pagination
    }

    selectedItems.value = []
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Trash'})
  } finally {
    loading.value = false
  }
}

/**
 * 格式化时间
 */
const formatDate = (date: string) => {
  if (!date) return '—'
  return new Date(date).toLocaleString()
}

/**
 * 是否全选
 */
const isAllSelected = computed(() => {
  return trashData.value.length > 0 && selectedItems.value.length === trashData.value.length
})

/**
 * 切换全选
 */
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = [...trashData.value]
  }
}

/**
 * 切换单项选择
 */
const toggleItem = (item: any) => {
  const index = selectedItems.value.findIndex(i => i.id === item.id && i.type === item.type)
  if (index >= 0) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(item)
  }
}

/**
 * 判断指定项是否已被选中
 * @param item 回收站数据项
 */
const isItemSelected = (item: any) => {
  return selectedItems.value.some(i => i.id === item.id && i.type === item.type)
}

/**
 * 批量恢复
 */
const onBatchRestore = async () => {
  if (selectedItems.value.length === 0) return

  try {
    if (!confirm(t('assembly.restoreConfirm') || '确定要恢复选中的项目吗？')) return

    loading.value = true
    const itemsToRestore = selectedItems.value.map(i => ({id: i.id, type: i.type}))
    const result = await apis.trashApi().restoreItems(itemsToRestore)

    if (result.success) {
      notice.success(t('assembly.restoreSuccess') || '恢复成功')
      selectedItems.value = []
      await getTrashData()
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Trash'})
  } finally {
    loading.value = false
  }
}

/**
 * 单个恢复
 */
const onRestore = async (item: any) => {
  try {
    if (!confirm(t('assembly.restoreConfirm') || '确定要恢复该项目吗？')) return

    loading.value = true
    const result = await apis.trashApi().restoreItems([{id: item.id, type: item.type}])

    if (result.success) {
      notice.success(t('assembly.restoreSuccess') || '恢复成功')
      await getTrashData()
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Trash'})
  } finally {
    loading.value = false
  }
}

/**
 * 获取图标
 */
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'assembly':
      return 'mdi-package-variant-closed'
    case 'wheel':
      return 'mdi-steering'
    case 'warehouse':
      return 'mdi-warehouse'
    case 'mastery':
      return 'mdi-arm-flex'
    case 'like':
      return 'mdi-heart'
    case 'comment':
      return 'mdi-comment'
    case 'reply':
      return 'mdi-reply'
    case 'smuggler_weekly_report':
      return 'mdi-trophy-award'
    case 'smuggler_weekly_report_comment':
      return 'mdi-comment-text-outline'
    case 'map_collection':
      return 'mdi-map-legend'
    case 'map_point':
      return 'mdi-map-marker'
    case 'map_path':
      return 'mdi-vector-polyline'
    case 'map_region':
      return 'mdi-vector-polygon'
    default:
      return 'mdi-help-circle'
  }
}

/**
 * 获取类型文本
 */
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'assembly':
      return t('assembly.title') || '配装'
    case 'wheel':
      return t('account.wheel') || '轮盘'
    case 'warehouse':
      return t('account.warehouse') || '仓库'
    case 'mastery':
      return t('account.mastery') || '熟练度'
    case 'like':
      return t('account.like') || '点赞'
    case 'comment':
      return t('comment.title') || '评论'
    case 'reply':
      return t('comment.reply') || '回复'
    case 'smuggler_weekly_report':
      return t('smugglersReport.account.weeklyReport') || '走私贩周报'
    case 'smuggler_weekly_report_comment':
      return t('smugglersReport.account.reportComment') || '周报评论'
    case 'map_collection':
      return t('map.collection') || '地图集'
    case 'map_point':
      return t('map.point') || '地图标记'
    case 'map_path':
      return t('map.path') || '地图路径'
    case 'map_region':
      return t('map.region') || '地图区域'
    default:
      return type
  }
}

const totalPages = computed(() => {
  if (!pagination.value?.total || !pagination.value?.pageSize) return 1
  return Math.ceil(pagination.value.total / pagination.value.pageSize)
})

defineOptions({
  name: 'AccountTrash'
})
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
              v-if="trashData.length > 0"
              :model-value="isAllSelected"
              :indeterminate="selectedItems.length > 0 && !isAllSelected"
              @click.stop="toggleSelectAll"
              class="ml-2 mr-2">
            <template v-slot:label>
              <p
                  class="text-body-2 font-weight-medium cursor-pointer user-select-none singe-line"
                  @click="toggleSelectAll">
                {{ t('account.selectAll') }}
              </p>
            </template>
          </v-checkbox-btn>

          <!-- 批量恢复按钮 -->
          <v-btn
              v-if="selectedItems.length > 0"
              variant="tonal"
              color="amber"
              prepend-icon="mdi-restore"
              @click="onBatchRestore">
            {{ t('assembly.restore') }}

            <span v-if="selectedItems.length > 0" class="mx-1">
              ({{ t('account.itemsSelected', {count: selectedItems.length}) }})
            </span>
          </v-btn>
        </div>

        <v-spacer></v-spacer>

        <v-btn
            variant="flat"
            size="small"
            @click="getTrashData"
            :loading="loading">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-card>
    </AffixContainerView>
    <!-- 操作头 E -->

    <!-- 回收站管理列表 S -->
    <div v-if="trashData.length > 0">
      <v-list lines="three" variant="text" class="bg-transparent">
        <template v-for="(i, index) in trashData" :key="`${i.type}-${i.id}`">
          <v-list-item>
            <template v-slot:prepend>
              <div class="d-flex align-center">
                <v-checkbox-btn
                    :model-value="isItemSelected(i)"
                    @click.stop="toggleItem(i)"
                    class="mr-2 flex-shrink-0">
                </v-checkbox-btn>
                <v-avatar size="50" rounded="lg" color="surface-variant" class="mr-3 flex-shrink-0">
                  <v-icon size="24" color="amber">{{ getTypeIcon(i.type) }}</v-icon>
                </v-avatar>
              </div>
            </template>

            <template v-slot:title>
              <div class="d-flex align-center flex-wrap ga-2">
                <p class="font-weight-bold">{{ i.title || 'Untitled' }}</p>
                <v-chip size="x-small" variant="tonal" class="text-uppercase font-weight-bold">
                  {{ getTypeLabel(i.type) }}
                </v-chip>
              </div>
            </template>

            <template v-slot:subtitle>
              <div class="d-flex align-center flex-wrap ga-2 mt-2">
                <p v-if="i.preview" class="text-caption opacity-70 singe-line mr-2">
                  {{ i.preview }}
                </p>
                <p class="d-flex align-center text-caption opacity-60">
                  <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                  {{ t('account.deletedAt') }}: {{ formatDate(i.deletedTime) }}
                </p>
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
                      prepend-icon="mdi-restore"
                      @click="onRestore(i)">
                    <v-list-item-title>{{ t('assembly.restore') }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
          <v-divider inset v-if="index < trashData.length - 1"></v-divider>
        </template>
      </v-list>

      <!-- 分页器 S -->
      <div
          v-if="totalPages > 1"
          class="d-flex justify-center mt-4">
        <v-pagination
            v-model="pagination.page"
            :length="totalPages"
            :total-visible="5"
            density="comfortable"
            size="small"
            @update:model-value="getTrashData">
        </v-pagination>
      </div>
      <!-- 分页器 E -->
    </div>

    <div class="text-center py-12" v-else>
      <EmptyView></EmptyView>
    </div>
    <!-- 回收站管理列表 E -->
  </div>
</template>

<style scoped lang="less">
.min-width-0 {
  min-width: 0;
}

.cursor-pointer {
  cursor: pointer;
}

.user-select-none {
  user-select: none;
}
</style>
