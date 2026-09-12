<script setup lang="ts">

import {computed, onMounted, ref} from "vue";
import {apis} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import Loading from "@/components/Loading.vue";
import EmptyView from "@/components/EmptyView.vue";

const notice = useNoticeStore(),
    {t} = useI18n()

let loading = ref(false),
    trashData = ref<any[]>([]),
    pagination = ref<any>({}),
    selectedItems = ref<any[]>([]),
    // 用于装配预览
    userAssemblyWidgetRefs = ref<any[]>([])

onMounted(() => {
  getTrashData()
})

/**
 * 获取回收站配装信息
 */
const getTrashData = async () => {
  try {
    loading.value = true;
    const result = await apis.trashApi().getTrashList(),
        d = result.data;

    trashData.value = d.data.list;
    pagination.value = d.data.pagination;

    selectedItems.value = [];
  } catch (e) {
    handleApiError(e, notice, t, { component: 'Trash' })
  } finally {
    loading.value = false;
  }
}

/**
 * 格式化时间
 */
const formatDate = (date: string) => {
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
 * 批量恢复
 */
const onBatchRestore = async () => {
  if (selectedItems.value.length === 0) return

  try {
    if (!confirm(t('assembly.restoreConfirm'))) return

    loading.value = true
    const itemsToRestore = selectedItems.value.map(i => ({id: i.id, type: i.type}))
    const result = await apis.trashApi().restoreItems(itemsToRestore)

    if (result.success) {
      notice.success(t('assembly.restoreSuccess'))
      selectedItems.value = []
      await getTrashData()
    }
  } catch (e) {
    handleApiError(e, notice, t, { component: 'Trash' })
  } finally {
    loading.value = false
  }
}

/**
 * 单个恢复
 */
const onRestore = async (item: any) => {
  try {
    if (!confirm(t('assembly.restoreConfirm'))) return

    loading.value = true
    const result = await apis.trashApi().restoreItems([{id: item.id, type: item.type}])

    if (result.success) {
      notice.success(t('assembly.restoreSuccess'))
      await getTrashData()
    }
  } catch (e) {
    handleApiError(e, notice, t, { component: 'Trash' })
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
</script>

<template>
  <div class="position-relative">
    <v-overlay :model-value="loading" contained>
      <Loading></Loading>
    </v-overlay>

    <!-- 工具栏 S -->
    <v-card class="mb-5 bg-black" elevation="0" border>
      <v-toolbar color="transparent" density="compact">
        <v-checkbox
            :model-value="isAllSelected"
            :indeterminate="selectedItems.length > 0 && !isAllSelected"
            hide-details
            class="ml-4"
            @click.stop="toggleSelectAll"
        ></v-checkbox>
        <span class="ml-2">{{ t('account.selectAll') }}</span>

        <v-divider vertical class="mx-4" opacity=".1"></v-divider>

        <span class="text-caption opacity-70">
          {{ t('account.itemsSelected', {count: selectedItems.length}) }}
        </span>

        <v-spacer></v-spacer>

        <v-btn
            variant="flat"
            prepend-icon="mdi-restore"
            :disabled="selectedItems.length === 0"
            @click="onBatchRestore">
          {{ t('assembly.restore') }}
        </v-btn>
      </v-toolbar>
    </v-card>
    <!-- 工具栏 E -->

    <div v-if="trashData.length > 0">
      <v-list class="bg-transparent pa-0" slim>
        <v-row no-gutters>
          <v-col cols="12" class="mb-2" v-for="(item, index) in trashData" :key="`${item.type}-${item.id}`">
            <v-card border class="py-1 px-4 d-flex align-center" @click="selectedItems.includes(item) ? selectedItems.splice(selectedItems.indexOf(item), 1) : selectedItems.push(item)">
              <v-checkbox
                  v-model="selectedItems"
                  :value="item"
                  hide-details
                  @click.stop
                  class="flex-shrink-0"
              ></v-checkbox>

              <div class="ml-4 flex-grow-1 d-flex align-center">
                <v-icon :icon="getTypeIcon(item.type)" size="24" class="mr-4 opacity-50"></v-icon>
                <div class="flex-grow-1 min-width-0">
                  <div class="text-h6 singe-line">{{ item.title }}</div>
                  <div class="text-caption opacity-50">{{ t('account.deletedAt') }}: {{ formatDate(item.deletedTime) }}</div>
                </div>
              </div>

              <v-btn icon="mdi-restore" variant="text" class="ml-4" @click.stop="onRestore(item)"></v-btn>
            </v-card>
          </v-col>
        </v-row>
      </v-list>
    </div>

    <div class="text-center py-10" v-else>
      <EmptyView></EmptyView>
    </div>
  </div>
</template>

<style scoped lang="less">
.min-width-0 {
  min-width: 0;
}
</style>
