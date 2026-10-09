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
    case 'like':
      return 'mdi-heart'
    case 'comment':
      return 'mdi-comment'
    case 'reply':
      return 'mdi-reply'
    default:
      return 'mdi-help-circle'
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

    <!-- Toolbar S -->
    <AffixContainerView>
      <v-card class="mb-4 pa-2">
        <div class="d-flex align-center">
          <!-- 全选复选框 -->
          <v-checkbox-btn
              :model-value="isAllSelected"
              :indeterminate="selectedItems.length > 0 && !isAllSelected"
              @click.stop="toggleSelectAll"
              class="mr-2">
            <template v-slot:label>
              <p
                  class="text-body-2 font-weight-medium cursor-pointer user-select-none"
                  @click="toggleSelectAll">
                {{ t('account.selectAll') }}
              </p>
            </template>
          </v-checkbox-btn>

          <v-chip
              v-if="selectedItems.length > 0"
              size="small"
              color="amber"
              variant="tonal"
              class="ml-3 font-weight-bold">
            {{ t('account.itemsSelected', {count: selectedItems.length}) }}
          </v-chip>

          <v-spacer></v-spacer>

          <!-- 行为按钮组 -->
          <div class="d-flex align-center ga-2">
            <v-btn
                variant="tonal"
                color="amber"
                prepend-icon="mdi-restore"
                :disabled="selectedItems.length === 0"
                @click="onBatchRestore">
              {{ t('assembly.restore') }}
            </v-btn>

            <v-btn
                size="small"
                variant="tonal"
                icon="mdi-refresh"
                @click="getTrashData"
                :loading="loading">
            </v-btn>
          </div>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- Toolbar E -->

    <!-- 列表展示 S -->
    <div v-if="trashData.length > 0" class="d-flex flex-column ga-2">
      <v-card
          v-for="item in trashData"
          :key="`${item.type}-${item.id}`"
          border
          rounded="lg"
          class="pa-3 hover-card cursor-pointer transition-all"
          :class="{'selected-border': isItemSelected(item)}"
          @click="toggleItem(item)">
        <div class="d-flex align-center">
          <v-checkbox-btn
              :model-value="isItemSelected(item)"
              @click.stop="toggleItem(item)"
              class="mr-3 flex-shrink-0">
            <template v-slot:label>
              <v-avatar size="40" rounded="lg" class="mr-3 flex-shrink-0">
                <v-icon :icon="getTypeIcon(item.type)" size="22" color="amber"></v-icon>
              </v-avatar>
            </template>
          </v-checkbox-btn>

          <div class="w-100">
            <div class="d-flex align-center ga-2">
              <span class="text-body-1 font-weight-bold singe-line">{{ item.title || 'Untitled' }}</span>
              <v-chip size="x-small" variant="tonal" class="text-uppercase">
                {{ item.type }}
              </v-chip>
            </div>
            <div class="text-caption opacity-50 mt-1 d-flex align-center">
              <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
              {{ t('account.deletedAt') }}: {{ formatDate(item.deletedTime) }}
            </div>
          </div>

          <v-tooltip :text="t('assembly.restore')" location="top">
            <template v-slot:activator="{props}">
              <v-btn
                  v-bind="props"
                  icon="mdi-restore"
                  size="small"
                  variant="tonal"
                  color="amber"
                  class="ml-3 flex-shrink-0"
                  @click.stop="onRestore(item)">
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </v-card>
    </div>
    <!-- 列表展示 E -->

    <div class="text-center py-12" v-else>
      <EmptyView></EmptyView>
    </div>

    <!-- 统一分页器 S -->
    <PaginationBar v-model:page="pagination.page"
                   :total-pages="totalPages"
                   class="mt-6"
                   @change="getTrashData" />
    <!-- 统一分页器 E -->
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
