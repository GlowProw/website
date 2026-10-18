<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {apis} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import Loading from "@/components/Loading.vue";
import EmptyView from "@/components/EmptyView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import QuotaLimitWidget from "@/components/QuotaLimitWidget.vue";
import Textarea from "@/components/textarea/index.vue";

const notice = useNoticeStore(),
    {t} = useI18n()

let loading = ref(false),
    userTeamUpData = ref<any>({
      data: []
    }),
    searchQuery = ref(''),
    selectedTeamups = ref<any[]>([]),
    currentPage = ref(1),
    pageSize = 10

onMounted(() => {
  getMyTeamUpsData()
})

/**
 * 获取我的组队招募信息
 */
const getMyTeamUpsData = async () => {
  try {
    loading.value = true
    const result = await apis.userApi().getMeTeamups(),
        d = result.data

    userTeamUpData.value = d.data || { data: [] }
    selectedTeamups.value = []
  } catch (e) {
    handleApiError(e, notice, t, { component: 'MyTeamUps' })
  } finally {
    loading.value = false
  }
}

const allTeamUps = computed(() => {
  return userTeamUpData.value?.data || []
})

const filteredList = computed(() => {
  if (!searchQuery.value.trim()) return allTeamUps.value
  const q = searchQuery.value.toLowerCase().trim()
  return allTeamUps.value.filter((i: any) => {
    return (i.description && i.description.toLowerCase().includes(q)) ||
        (i.player && i.player.toLowerCase().includes(q))
  })
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
  return pagedList.value.length > 0 && selectedTeamups.value.length === pagedList.value.length
})

/**
 * 切换全选状态
 */
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedTeamups.value = []
  } else {
    selectedTeamups.value = [...pagedList.value]
  }
}

/**
 * 切换单项选中状态
 * @param item 组队项
 */
const toggleItem = (item: any) => {
  const index = selectedTeamups.value.findIndex(i => i.id === item.id)
  if (index >= 0) {
    selectedTeamups.value.splice(index, 1)
  } else {
    selectedTeamups.value.push(item)
  }
}

/**
 * 判断指定组队是否已选中
 * @param item 组队项
 */
const isItemSelected = (item: any) => {
  return selectedTeamups.value.some(i => i.id === item.id)
}

/**
 * 删除单个组队
 * @param item 组队数据项
 */
const onDeleteTeamup = async (item: any) => {
  try {
    if (!confirm(t('team.deleteConfirm') || '确定要删除该招募信息吗？')) return
    loading.value = true
    await apis.teamupApi().deleteTeamup(item.id)
    notice.success(t('team.deleteSuccess') || '删除成功')
    await getMyTeamUpsData()
  } catch (e) {
    handleApiError(e, notice, t, { component: 'MyTeamUps' })
  } finally {
    loading.value = false
  }
}

/**
 * 批量删除组队
 */
const onBatchDeleteTeamups = async () => {
  if (selectedTeamups.value.length === 0) return

  try {
    if (!confirm(t('team.deleteBatchConfirm') || `确定要删除选中的 ${selectedTeamups.value.length} 个招募吗？`)) return
    loading.value = true
    for (const item of selectedTeamups.value) {
      await apis.teamupApi().deleteTeamup(item.id)
    }
    notice.success(t('team.deleteSuccess') || '删除成功')
    selectedTeamups.value = []
    await getMyTeamUpsData()
  } catch (e) {
    handleApiError(e, notice, t, { component: 'MyTeamUps' })
  } finally {
    loading.value = false
  }
}

defineOptions({
  name: 'AccountTeamUps'
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
              :indeterminate="selectedTeamups.length > 0 && !isAllSelected"
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

          <span v-if="selectedTeamups.length > 0">
            {{ t('account.itemsSelected', {count: selectedTeamups.length}) }}
          </span>

          <!-- 批量删除按钮 -->
          <v-btn
              v-if="selectedTeamups.length > 0"
              variant="tonal"
              color="error"
              prepend-icon="mdi-delete"
              @click="onBatchDeleteTeamups">
            {{ t('basic.button.delete') }}
          </v-btn>

          <v-text-field
              v-if="selectedTeamups.length <= 0"
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
          <QuotaLimitWidget resource="teamup" text></QuotaLimitWidget>

          <v-btn
              variant="flat"
              @click="getMyTeamUpsData"
              :loading="loading">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- 操作头 E -->

    <!-- 组队管理列表 S -->
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
                  <v-icon size="24" color="amber">mdi-account-group</v-icon>
                </v-avatar>
              </div>
            </template>

            <template v-slot:title>
              <Textarea :value="i.description || i.title || 'Untitled Teamup'" min-height="auto" readonly class="font-weight-bold singe-line mb-2"></Textarea>

              <div class="d-flex align-center flex-wrap ga-2">
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
                <p class="d-flex align-center font-weight-medium text-caption">
                  <v-icon size="14" class="mr-1">mdi-account</v-icon>
                  {{ i.player }}
                </p>
                <v-divider vertical inset class="mx-1"></v-divider>
                <p class="d-flex align-center text-caption opacity-60">
                  <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                  {{ i.createdTime || '—' }}
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
                <v-list density="compact" min-width="120">
                  <v-list-item
                      prepend-icon="mdi-arrow-right"
                      to="/team">
                    <v-list-item-title>{{ t('team.title') }}</v-list-item-title>
                  </v-list-item>

                  <v-divider class="my-1"></v-divider>

                  <v-list-item
                      prepend-icon="mdi-delete"
                      class="text-error"
                      @click="onDeleteTeamup(i)">
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
    <!-- 组队管理列表 E -->
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
