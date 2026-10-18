<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {apis} from "@/assets/sripts/index";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import Loading from "@/components/Loading.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import EmptyView from "@/components/EmptyView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import QuotaLimitWidget from "@/components/QuotaLimitWidget.vue";
import Textarea from "@/components/textarea/index.vue";

const {t} = useI18n(),
    notice = useNoticeStore()

let loading = ref(false),
    userCommentData = ref<any>({}),
    filterType = ref('all'),
    selectedComments = ref<any[]>([]),
    currentPage = ref(1),
    pageSize = 10

onMounted(() => {
  getMyCommentsData()
})

/**
 * 获取我的评论数据
 */
const getMyCommentsData = async () => {
  try {
    loading.value = true
    const result = await apis.userApi().getUserComments(),
        d = result.data

    userCommentData.value = d.data || {data: []}
    selectedComments.value = []
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MyComments'})
  } finally {
    loading.value = false
  }
}

const allComments = computed(() => {
  return userCommentData.value?.data || []
})

const filteredList = computed(() => {
  if (filterType.value === 'all') return allComments.value
  return allComments.value.filter((i: any) => i.targetType === filterType.value)
})

const totalPages = computed(() => {
  return Math.ceil(filteredList.value.length / pageSize) || 1
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

/**
 * 判断当前页是否已全选
 */
const isAllSelected = computed(() => {
  return pagedList.value.length > 0 && selectedComments.value.length === pagedList.value.length
})

/**
 * 切换全选状态
 */
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedComments.value = []
  } else {
    selectedComments.value = [...pagedList.value]
  }
}

/**
 * 切换单项选中状态
 * @param item 评论项
 */
const toggleItem = (item: any) => {
  const index = selectedComments.value.findIndex(i => i.id === item.id)
  if (index >= 0) {
    selectedComments.value.splice(index, 1)
  } else {
    selectedComments.value.push(item)
  }
}

/**
 * 判断指定评论是否已选中
 * @param item 评论项
 */
const isItemSelected = (item: any) => {
  return selectedComments.value.some(i => i.id === item.id)
}

/**
 * 删除单条评论
 * @param item 评论数据项
 */
const onDeleteComment = async (item: any) => {
  try {
    if (!confirm(t('comment.deleteConfirm') || '确定要删除该评论吗？')) return
    loading.value = true
    await apis.commentApi().deleteComment(item.id)
    notice.success(t('comment.deleteSuccess') || '删除成功')
    await getMyCommentsData()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MyComments'})
  } finally {
    loading.value = false
  }
}

/**
 * 批量删除评论
 */
const onBatchDeleteComments = async () => {
  if (selectedComments.value.length === 0) return

  try {
    if (!confirm(t('comment.deleteBatchConfirm') || `确定要删除选中的 ${selectedComments.value.length} 条评论吗？`)) return
    loading.value = true
    for (const item of selectedComments.value) {
      await apis.commentApi().deleteComment(item.id)
    }
    notice.success(t('comment.deleteSuccess') || '删除成功')
    selectedComments.value = []
    await getMyCommentsData()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MyComments'})
  } finally {
    loading.value = false
  }
}

defineOptions({
  name: 'AccountComments'
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
              v-if="pagedList.length > 0"
              :model-value="isAllSelected"
              :indeterminate="selectedComments.length > 0 && !isAllSelected"
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

          <v-chip
              v-if="selectedComments.length > 0"
              size="small"
              color="amber"
              variant="tonal"
              class="font-weight-bold">
            {{ t('account.itemsSelected', {count: selectedComments.length}) }}
          </v-chip>

          <!-- 批量删除按钮 -->
          <v-btn
              v-if="selectedComments.length > 0"
              variant="tonal"
              color="error"
              prepend-icon="mdi-delete"
              @click="onBatchDeleteComments">
            {{ t('basic.button.delete') }}
          </v-btn>

          <v-btn-toggle
              v-model="filterType"
              density="compact"
              variant="outlined"
              color="amber"
              mandatory>
            <v-btn value="all" size="small">{{ t('basic.all') }} ({{ allComments.length }})</v-btn>
            <v-btn value="item" size="small">{{ t('codex.items.title') }}</v-btn>
            <v-btn value="ship" size="small">{{ t('codex.ships.title')}}</v-btn>
          </v-btn-toggle>
        </div>

        <v-spacer></v-spacer>

        <div class="d-flex align-center ga-2">
          <QuotaLimitWidget resource="comment" text></QuotaLimitWidget>

          <v-btn
              variant="flat"
              @click="getMyCommentsData"
              :loading="loading">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- 操作头 E -->

    <!-- 评论管理列表 S -->
    <div v-if="pagedList && pagedList.length > 0">
      <v-list lines="three" variant="text" class="bg-transparent">
        <template v-for="(i, index) in pagedList" :key="i.id || index">
          <v-list-item>
            <template v-slot:prepend>
              <div class="d-flex align-center">
                <v-checkbox-btn
                    :model-value="isItemSelected(i)"
                    @click.stop="toggleItem(i)"
                    class="mr-2 flex-shrink-0">
                </v-checkbox-btn>
                <v-avatar size="50" rounded="lg" color="surface-variant" class="mr-3 flex-shrink-0">
                  <ItemIconWidget v-if="i.targetType === 'item'" :id="i.targetId"></ItemIconWidget>
                  <ShipIconWidget v-else-if="i.targetType === 'ship'" :id="i.targetId"></ShipIconWidget>
                  <v-icon v-else size="24" color="amber">mdi-comment-outline</v-icon>
                </v-avatar>
              </div>
            </template>

            <template v-slot:title>
              <Textarea :value="i.content" min-height="auto" readonly class="font-weight-bold singe-line mb-2"></Textarea>

              <div class="d-flex align-center flex-wrap ga-2">
                <v-chip
                    size="x-small"
                    color="amber"
                    variant="tonal"
                    class="text-uppercase font-weight-bold">
                  {{ i.targetType || 'TARGET' }}
                </v-chip>
              </div>
            </template>

            <template v-slot:subtitle>
              <div class="d-flex align-center flex-wrap ga-2 mt-2">
                <p class="d-flex align-center text-caption">
                  <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                  {{ i.createTime || i.createdTime || '—' }}
                </p>
                <span class="text-caption">ID: {{ i.targetId }}</span>
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
                <v-list density="compact" min-width="120">
                  <v-list-item
                      prepend-icon="mdi-open-in-new"
                      :to="`/codex/${i.targetType}/${i.targetId}`"
                      target="_blank">
                    <v-list-item-title>{{ t('basic.button.view') }}</v-list-item-title>
                  </v-list-item>

                  <v-divider class="my-1"></v-divider>

                  <v-list-item
                      prepend-icon="mdi-delete"
                      class="text-error"
                      @click="onDeleteComment(i)">
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
    <!-- 评论管理列表 E -->
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
