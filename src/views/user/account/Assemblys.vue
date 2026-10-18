<script setup lang="ts">
import {computed, nextTick, onMounted, ref} from "vue";
import {apis} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import Loading from "@/components/Loading.vue";
import AssemblySettingPanel from "@/components/AssemblySettingPanel.vue";
import EmptyView from "@/components/EmptyView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import QuotaLimitWidget from "@/components/QuotaLimitWidget.vue";

const notice = useNoticeStore(),
    {t} = useI18n()

// 状态定义
let loading = ref(false),
    searchQuery = ref(''),
    userAssemblysData = ref<any>({}),
    selectedAssemblies = ref<any[]>([]),
    currentPage = ref(1),
    pageSize = 10,
    currentSettingId = ref(''),
    settingPanelRef = ref<any>(null)

/**
 * 打开配装设置弹窗
 * @param uuid 配装唯一标识
 */
const openSetting = (uuid: string) => {
  currentSettingId.value = uuid
  nextTick(() => {
    settingPanelRef.value?.open()
  })
}

onMounted(() => {
  getMyAssemblysData()
})

/**
 * 格式化时间字符串
 * @param date 日期字符串或时间戳
 */
const formatDate = (date: string) => {
  if (!date) return '—'
  return new Date(date).toLocaleString()
}

/**
 * 过滤后的配装列表
 */
const filteredList = computed(() => {
  const list = userAssemblysData.value?.data || []
  if (!searchQuery.value) return list
  const q = searchQuery.value.toLowerCase().trim()
  return list.filter((i: any) => (i.name || '').toLowerCase().includes(q))
})

/**
 * 总页数
 */
const totalPages = computed(() => {
  return Math.ceil(filteredList.value.length / pageSize) || 1
})

/**
 * 当前页分页列表
 */
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

/**
 * 判断当前页是否已全选
 */
const isAllSelected = computed(() => {
  return pagedList.value.length > 0 && selectedAssemblies.value.length === pagedList.value.length
})

/**
 * 切换全选状态
 */
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedAssemblies.value = []
  } else {
    selectedAssemblies.value = [...pagedList.value]
  }
}

/**
 * 切换单项选中状态
 * @param item 配装项
 */
const toggleItem = (item: any) => {
  const index = selectedAssemblies.value.findIndex(i => i.uuid === item.uuid)
  if (index >= 0) {
    selectedAssemblies.value.splice(index, 1)
  } else {
    selectedAssemblies.value.push(item)
  }
}

/**
 * 判断指定配装是否已选中
 * @param item 配装项
 */
const isItemSelected = (item: any) => {
  return selectedAssemblies.value.some(i => i.uuid === item.uuid)
}

/**
 * 获取账户相关配装信息
 */
const getMyAssemblysData = async () => {
  try {
    loading.value = true
    const result = await apis.userApi().getMeAssemblys(),
        d = result.data

    userAssemblysData.value = d.data
    selectedAssemblies.value = []
  } catch (e) {
    handleApiError(e, notice, t, { component: 'MyAssemblys' })
  } finally {
    loading.value = false
  }
}

/**
 * 删除单个配装
 * @param item 配装数据项
 */
const onDeleteAssembly = async (item: any) => {
  try {
    if (!confirm(t('assembly.deleteConfirm') || '确定要删除该配装吗？')) return
    loading.value = true
    await apis.assemblyApi().deleteAssembly(item.uuid)
    notice.success(t('assembly.deleteSuccess') || '删除成功')
    await getMyAssemblysData()
  } catch (e) {
    handleApiError(e, notice, t, { component: 'MyAssemblys' })
  } finally {
    loading.value = false
  }
}

/**
 * 批量删除配装
 */
const onBatchDeleteAssemblies = async () => {
  if (selectedAssemblies.value.length === 0) return

  try {
    if (!confirm(t('assembly.deleteBatchConfirm') || `确定要删除选中的 ${selectedAssemblies.value.length} 个配装吗？`)) return
    loading.value = true
    for (const item of selectedAssemblies.value) {
      await apis.assemblyApi().deleteAssembly(item.uuid)
    }
    notice.success(t('assembly.deleteSuccess') || '删除成功')
    selectedAssemblies.value = []
    await getMyAssemblysData()
  } catch (e) {
    handleApiError(e, notice, t, { component: 'MyAssemblys' })
  } finally {
    loading.value = false
  }
}

defineOptions({
  name: 'AccountAssemblys'
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
              :indeterminate="selectedAssemblies.length > 0 && !isAllSelected"
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

          <span v-if="selectedAssemblies.length > 0" class="font-weight-bold">
            {{ t('account.itemsSelected', {count: selectedAssemblies.length}) }}
          </span>

          <!-- 批量删除按钮 -->
          <v-btn
              v-if="selectedAssemblies.length > 0"
              variant="tonal"
              color="error"
              prepend-icon="mdi-delete"
              @click="onBatchDeleteAssemblies">
            {{ t('basic.button.delete') }}
          </v-btn>

          <v-text-field
              v-if="selectedAssemblies.length <= 0"
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
          <QuotaLimitWidget resource="assembly" text></QuotaLimitWidget>

          <v-btn
              color="amber"
              variant="tonal"
              prepend-icon="mdi-plus"
              to="/assembly/workshop"
              target="_blank">
            {{ t('assembly.create') }}
          </v-btn>

          <v-btn
              variant="flat"
              @click="getMyAssemblysData"
              :loading="loading">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- 操作头 E -->

    <!-- 配装管理列表 S -->
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
                  <v-icon size="24" color="amber">mdi-package-variant-closed</v-icon>
                </v-avatar>
              </div>
            </template>

            <template v-slot:title>
              <div class="d-flex align-center flex-wrap ga-2">
                <p class="font-weight-bold">{{ i.name || 'Untitled Assembly' }}</p>

                <v-chip
                    v-if="i.tag"
                    size="x-small"
                    color="amber"
                    variant="tonal">
                  {{ i.tag }}
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
                  {{ i.browseCount || 0 }}
                </p>
                <v-divider vertical inset class="mx-1"></v-divider>
                <p class="d-flex align-center">
                  <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                  {{ formatDate(i.updatedTime || i.createdTime) }}
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
                      prepend-icon="mdi-pencil"
                      :to="`/assembly/workshop/${i.uuid}/edit`"
                      target="_blank">
                    <v-list-item-title>{{ t('basic.button.edit') }}</v-list-item-title>
                  </v-list-item>

                  <v-list-item
                      prepend-icon="mdi-open-in-new"
                      :to="`/assembly/browse/${i.uuid}/detail`"
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
                      @click="onDeleteAssembly(i)">
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
    <!-- 配装管理列表 E -->

    <!-- 配装设置弹窗 S -->
    <AssemblySettingPanel
        v-if="currentSettingId"
        ref="settingPanelRef"
        :id="currentSettingId"
        @change="getMyAssemblysData">
    </AssemblySettingPanel>
    <!-- 配装设置弹窗 E -->
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
