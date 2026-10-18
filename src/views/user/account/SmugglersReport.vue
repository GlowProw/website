<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {apis} from "@/assets/sripts/index";
import {handleApiError} from "@/assets/sripts/error_handler";
import {useNoticeStore} from "~/stores/noticeStore";
import {useI18n} from "vue-i18n";
import {useAuthStore} from "~/stores/userAccountStore";

import SmugglersReportShowItemWidget from "@/components/SmugglersReportShowItemWidget.vue";
import SmugglersReportEditor from "@/components/SmugglersReportEditor.vue";
import Textarea from "@/components/textarea/index.vue";
import TimeFrame from "@/components/TimeFrame.vue";
import TimeView from "@/components/TimeView.vue";
import Loading from "@/components/Loading.vue";
import EmptyView from "@/components/EmptyView.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import VerticalScrollList from "@/components/VerticalScrollList.vue";

const notice = useNoticeStore(),
    {t} = useI18n(),
    authStore = useAuthStore()

// 用户具备的基础特权开关
let isHasSmugglersReportPrivilege = ref(false),
    checkPermissionLoading = ref(false),
    smugglersReportModel = ref(false),
    smugglersReportModelIsEdit = ref(false),
    commentModelIsEdit = ref(false),
    commentModel = ref(false),
    createSmugglersReportLoading = ref(false),
    createCommentLoading = ref(false),
    smugglersReportListLoading = ref(false),
    smugglersReportListPagination = ref({
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1
    }),
    smugglersReportListData = ref<any[]>([]),
    selectedSmugglersReport = ref<any>({
      id: '',
      content: ''
    }),
    smugglersReportComment = ref({
      content: ''
    }),
    createSmugglersReportData = ref<any>({
      title: '',
      status: 'published',
      startAndEnd: '',
      content: {
        inSeason: [],
        weekly: [],
        common: []
      }
    })

// 用户细分原子特权状态映射
const userPrivilegeMap = ref<Record<string, boolean>>({
  smuggler_weekly_report_ownership: false,
  smuggler_weekly_report_create: false,
  smuggler_weekly_report_update: false,
  smuggler_weekly_report_delete: false,
  smuggler_weekly_report_comment_create: false,
  smuggler_weekly_report_comment_update: false,
  smuggler_weekly_report_comment_delete: false
})

/**
 * 是否具备创建周报权限
 */
const canCreateReport = computed(() => {
  return authStore.checkPrivilegeGroup(authStore.user?.role, ['root', 'super', 'dev']) ||
      userPrivilegeMap.value.smuggler_weekly_report_ownership ||
      userPrivilegeMap.value.smuggler_weekly_report_create
})

/**
 * 是否具备编辑周报权限
 */
const canUpdateReport = computed(() => {
  return authStore.checkPrivilegeGroup(authStore.user?.role, ['root', 'super', 'dev']) ||
      userPrivilegeMap.value.smuggler_weekly_report_ownership ||
      userPrivilegeMap.value.smuggler_weekly_report_update
})

/**
 * 是否具备删除周报权限
 */
const canDeleteReport = computed(() => {
  return authStore.checkPrivilegeGroup(authStore.user?.role, ['root', 'super', 'dev']) ||
      userPrivilegeMap.value.smuggler_weekly_report_ownership ||
      userPrivilegeMap.value.smuggler_weekly_report_delete
})

/**
 * 是否具备创建评论权限
 */
const canCreateComment = computed(() => {
  return authStore.checkPrivilegeGroup(authStore.user?.role, ['root', 'super', 'dev']) ||
      userPrivilegeMap.value.smuggler_weekly_report_ownership ||
      userPrivilegeMap.value.smuggler_weekly_report_comment_create
})

/**
 * 是否具备编辑评论权限
 */
const canUpdateComment = computed(() => {
  return authStore.checkPrivilegeGroup(authStore.user?.role, ['root', 'super', 'dev']) ||
      userPrivilegeMap.value.smuggler_weekly_report_ownership ||
      userPrivilegeMap.value.smuggler_weekly_report_comment_update
})

/**
 * 是否具备删除评论权限
 */
const canDeleteComment = computed(() => {
  return authStore.checkPrivilegeGroup(authStore.user?.role, ['root', 'super', 'dev']) ||
      userPrivilegeMap.value.smuggler_weekly_report_ownership ||
      userPrivilegeMap.value.smuggler_weekly_report_comment_delete
})

/**
 * 判断指定周报是否为当前时间段内生效的周报
 * @param report 周报数据项
 */
const isReportActive = (report: any) => {
  if (!report || report.status !== 'published') return false
  const now = Date.now()
  const start = new Date(report.startTime).getTime()
  const end = new Date(report.endTime).getTime()
  return !isNaN(start) && !isNaN(end) && now >= start && now <= end
}

onMounted(async () => {
  await getCheckUserPermission()
  await getSmugglersReportList()
})

/**
 * 校验当前用户是否具有走私犯周报相关权限
 */
const getCheckUserPermission = async () => {
  try {
    checkPermissionLoading.value = true
    const privKeys = [
      "smuggler_weekly_report_ownership",
      "smuggler_weekly_report_create",
      "smuggler_weekly_report_update",
      "smuggler_weekly_report_delete",
      "smuggler_weekly_report_comment_create",
      "smuggler_weekly_report_comment_update",
      "smuggler_weekly_report_comment_delete",
    ]
    const result = await apis.smugglersApi().checkPrivilege(privKeys)
    const d = result.data
    isHasSmugglersReportPrivilege.value = d.data?.hasPrivilege || false
    if (d.data?.privilegeMap) {
      userPrivilegeMap.value = {
        ...userPrivilegeMap.value,
        ...d.data.privilegeMap
      }
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    checkPermissionLoading.value = false
  }
}

/**
 * 获取走私犯周报列表数据
 */
const getSmugglersReportList = async () => {
  try {
    if (!isHasSmugglersReportPrivilege.value) return
    smugglersReportListLoading.value = true

    const result = await apis.smugglersApi().getReports({
      page: smugglersReportListPagination.value.page,
      pageSize: smugglersReportListPagination.value.pageSize
    })
    const d = result.data
    const list = Array.isArray(d?.data)
        ? d.data
        : (Array.isArray(d?.data?.list) ? d.data.list : (Array.isArray(d?.list) ? d.list : (Array.isArray(d) ? d : [])))
    smugglersReportListData.value = list

    const pageInfo = d?.pagination || d?.data?.pagination
    if (pageInfo) {
      smugglersReportListPagination.value = {
        ...smugglersReportListPagination.value,
        page: Number(pageInfo.page) || smugglersReportListPagination.value.page,
        pageSize: Number(pageInfo.pageSize) || smugglersReportListPagination.value.pageSize,
        totalPages: Number(pageInfo.totalPages) || 1,
      }
    }
    selectedReports.value = []
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    smugglersReportListLoading.value = false
  }
}

// 已选中的周报列表
const selectedReports = ref<any[]>([])

/**
 * 判断当前页是否已全选周报
 */
const isAllReportsSelected = computed(() => {
  return smugglersReportListData.value.length > 0 && selectedReports.value.length === smugglersReportListData.value.length
})

/**
 * 切换周报全选状态
 */
const toggleSelectAllReports = () => {
  if (isAllReportsSelected.value) {
    selectedReports.value = []
  } else {
    selectedReports.value = [...smugglersReportListData.value]
  }
}

/**
 * 切换周报单项选中
 * @param report 周报数据项
 */
const toggleReportItem = (report: any) => {
  const index = selectedReports.value.findIndex(i => i.id === report.id)
  if (index >= 0) {
    selectedReports.value.splice(index, 1)
  } else {
    selectedReports.value.push(report)
  }
}

/**
 * 判断指定周报是否已选中
 * @param report 周报数据项
 */
const isReportSelected = (report: any) => {
  return selectedReports.value.some(i => i.id === report.id)
}

/**
 * 批量删除选中的周报
 */
const onBatchDeleteReports = async () => {
  if (selectedReports.value.length === 0) return

  try {
    if (!confirm(t('smugglersReport.account.confirmDeleteReport') || '确定要删除选中的周报吗？')) return
    createSmugglersReportLoading.value = true
    for (const item of selectedReports.value) {
      await apis.smugglersApi().deleteReport(item.id)
    }
    notice.success(t('smugglersReport.account.commentDeleteSuccess') || '删除成功')
    selectedReports.value = []
    await getSmugglersReportList()
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    createSmugglersReportLoading.value = false
  }
}

// 周报标题校验规则（最低1字，最多255字）
const reportTitleRules = [
  (v: string) => !!(v && v.trim()) || t('smugglersReport.account.titleRequired') || '请输入周报标题',
  (v: string) => !v || v.trim().length >= 1 || '标题最少 1 个字符',
  (v: string) => !v || v.trim().length <= 255 || '标题最多 255 个字符'
]

// 周报起止时间校验规则
const reportTimeRules = [
  (v: string) => {
    if (!v) return t('smugglersReport.account.timeRequired') || '请选择完整起止时间'
    const times = v.split(',')
    return (times.length >= 2 && !!times[0] && !!times[1]) || (t('smugglersReport.account.timeRequired') || '请选择完整起止时间')
  }
]

/**
 * 创建走私犯周报
 */
const onCreateSmugglersReport = async () => {
  try {
    const title = createSmugglersReportData.value.title?.trim()
    if (!title || title.length < 1) {
      notice.warning(t('smugglersReport.account.titleRequired') || '请输入周报标题')
      return
    }
    if (title.length > 255) {
      notice.warning('周报标题最多允许 255 个字符')
      return
    }
    if (!createSmugglersReportData.value.startAndEnd) {
      notice.warning(t('smugglersReport.account.timeRequired') || '请选择完整起止时间')
      return
    }
    const times = createSmugglersReportData.value.startAndEnd.split(',')
    if (times.length < 2 || !times[0] || !times[1]) {
      notice.warning(t('smugglersReport.account.timeRequired') || '请选择完整起止时间')
      return
    }
    createSmugglersReportLoading.value = true
    const result = await apis.smugglersApi().createReport({
      title,
      startTime: times[0],
      endTime: times[1],
      status: createSmugglersReportData.value.status || 'published',
      content: createSmugglersReportData.value.content
    })
    notice.success(t('smugglersReport.account.commentSuccess'))
    await getSmugglersReportList()
    smugglersReportModel.value = false
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    createSmugglersReportLoading.value = false
  }
}

/**
 * 编辑更新走私犯周报
 */
const onEditSmugglersReport = async () => {
  try {
    const title = createSmugglersReportData.value.title?.trim()
    if (!title || title.length < 1) {
      notice.warning(t('smugglersReport.account.titleRequired') || '请输入周报标题')
      return
    }
    if (title.length > 255) {
      notice.warning('周报标题最多允许 255 个字符')
      return
    }
    if (!createSmugglersReportData.value.startAndEnd) {
      notice.warning(t('smugglersReport.account.timeRequired') || '请选择完整起止时间')
      return
    }
    const times = createSmugglersReportData.value.startAndEnd.split(',')
    if (times.length < 2 || !times[0] || !times[1]) {
      notice.warning(t('smugglersReport.account.timeRequired') || '请选择完整起止时间')
      return
    }
    createSmugglersReportLoading.value = true
    const result = await apis.smugglersApi().updateReport(createSmugglersReportData.value.id, {
      title,
      startTime: times[0],
      endTime: times[1],
      status: createSmugglersReportData.value.status || 'published',
      content: createSmugglersReportData.value.content
    })
    notice.success(t('smugglersReport.account.commentEditSuccess'))
    await getSmugglersReportList()
    smugglersReportModel.value = false
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    createSmugglersReportLoading.value = false
  }
}

/**
 * 删除走私犯周报
 * @param reportData 周报数据项
 */
const onDeleteSmugglersReport = async (reportData: any) => {
  try {
    if (!confirm(t('smugglersReport.account.confirmDeleteReport'))) return
    createSmugglersReportLoading.value = true
    const result = await apis.smugglersApi().deleteReport(reportData.id)
    notice.success(t('smugglersReport.account.commentDeleteSuccess'))
    await getSmugglersReportList()
    smugglersReportModel.value = false
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    createSmugglersReportLoading.value = false
  }
}

/**
 * 打开周报编辑/新建弹窗
 * @param reportData 可选，待编辑的周报对象
 */
const openSmugglersReportModel = (reportData: any = null) => {
  if (reportData && reportData.id) {
    if (!canUpdateReport.value) {
      notice.warning(t('basic.permissionDenied') || '无权限编辑周报')
      return
    }
    smugglersReportModelIsEdit.value = true
    createSmugglersReportData.value = JSON.parse(JSON.stringify(reportData))
    createSmugglersReportData.value.status = reportData.status || 'published'
    createSmugglersReportData.value.startAndEnd = `${reportData.startTime},${reportData.endTime}`
  } else {
    if (!canCreateReport.value) {
      notice.warning(t('basic.permissionDenied') || '无权限创建周报')
      return
    }
    smugglersReportModelIsEdit.value = false
    createSmugglersReportData.value = {
      title: '',
      status: 'published',
      startAndEnd: '',
      content: {inSeason: [], weekly: [], common: []}
    }
  }
  smugglersReportModel.value = true
}

/**
 * 打开鉴赏家评论弹窗
 * @param reportData 周报数据项
 */
const openCommendModel = (reportData: any) => {
  if (reportData.isUserComment) {
    if (!canUpdateComment.value && !canDeleteComment.value) {
      notice.warning(t('basic.permissionDenied') || '无权限操作该周报评论')
      return
    }
    commentModelIsEdit.value = true
    smugglersReportComment.value.content = reportData.userComment?.content ?? ''
  } else {
    if (!canCreateComment.value) {
      notice.warning(t('basic.permissionDenied') || '无权限创建评论')
      return
    }
    commentModelIsEdit.value = false
    smugglersReportComment.value.content = ''
  }
  selectedSmugglersReport.value = reportData
  commentModel.value = true
}

/**
 * 创建鉴赏家评论
 */
const onCreateCommend = async () => {
  try {
    if (!canCreateComment.value) {
      notice.warning(t('basic.permissionDenied') || '无权限创建评论')
      return
    }
    createCommentLoading.value = true
    const reportId = selectedSmugglersReport.value?.id
    if (!reportId) return
    await apis.smugglersApi().addReportComment(reportId, {
      content: smugglersReportComment.value.content as string
    })
    notice.success(t('basic.button.submit') || '评论成功')
    await getSmugglersReportList()
    commentModel.value = false
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    createCommentLoading.value = false
  }
}

/**
 * 修改鉴赏家评论
 */
const onEditCommend = async () => {
  try {
    if (!canUpdateComment.value) {
      notice.warning(t('basic.permissionDenied') || '无权限更新评论')
      return
    }
    createCommentLoading.value = true
    const reportId = selectedSmugglersReport.value?.id
    const commentId = selectedSmugglersReport.value?.userComment?.id
    if (!reportId || !commentId) return
    await apis.smugglersApi().editReportComment(reportId, commentId, {
      content: smugglersReportComment.value.content as string
    })
    notice.success(t('basic.button.submit') || '修改成功')
    await getSmugglersReportList()
    commentModel.value = false
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    createCommentLoading.value = false
  }
}

/**
 * 软删除鉴赏家评论
 */
const onSoftDeleteComment = async () => {
  try {
    if (!canDeleteComment.value) {
      notice.warning(t('basic.permissionDenied') || '无权限删除评论')
      return
    }
    if (!confirm(t('smugglersReport.account.confirmSoftDeleteComment') || '确定要软删除此条评论吗？')) return
    createCommentLoading.value = true
    const reportId = selectedSmugglersReport.value?.id
    const commentId = selectedSmugglersReport.value?.userComment?.id
    if (!reportId || !commentId) return
    await apis.smugglersApi().delReportComment(reportId, commentId)
    notice.success(t('smugglersReport.account.commentSoftDeleteSuccess') || '评论已软删除')
    await getSmugglersReportList()
    commentModel.value = false
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    createCommentLoading.value = false
  }
}

/**
 * 物理永久删除鉴赏家评论
 */
const onHardDeleteComment = async () => {
  try {
    if (!confirm(t('smugglersReport.account.confirmHardDeleteComment') || '警告：物理删除将彻底从数据库永久抹除此评论，无法恢复！确定继续吗？')) return
    createCommentLoading.value = true
    const reportId = selectedSmugglersReport.value?.id
    const commentId = selectedSmugglersReport.value?.userComment?.id
    if (!reportId || !commentId) return
    await apis.smugglersApi().hardDeleteReportComment(reportId, commentId)
    notice.success(t('smugglersReport.account.commentHardDeleteSuccess') || '评论已物理删除')
    await getSmugglersReportList()
    commentModel.value = false
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    createCommentLoading.value = false
  }
}

/**
 * 评论删除方法别名
 */
const onDeleteComment = onSoftDeleteComment

defineOptions({
  name: 'AccountSmugglersReport'
})
</script>

<template>
  <div class="position-relative">
    <v-overlay :model-value="checkPermissionLoading || smugglersReportListLoading" contained class="d-flex align-center justify-center">
      <Loading size="50"></Loading>
    </v-overlay>

    <v-row>
      <v-col cols="12" lg="3">
        <p class="opacity-60 mb-4">
          {{ t('smugglersReport.account.connoisseurDesc') }}
        </p>

        <v-btn
            block
            border
            variant="plain"
            prepend-icon="mdi-open-in-new"
            to="/smugglers-report/view"
            target="_blank">
          {{ t('smugglersReport.account.viewCurrentReport') }}
        </v-btn>
      </v-col>
      <v-col>
        <AffixBoxHasTitleView>
          <!-- 未具备鉴赏家权限时的申请展示卡片 S -->
          <v-card border rounded="lg" class="pa-6 position-relative overflow-hidden mb-6" v-if="!isHasSmugglersReportPrivilege && !checkPermissionLoading">
            <div class="position-absolute top-0 right-0 opacity-10 pt-4 pr-4">
              <v-icon size="180">mdi-trophy-award</v-icon>
            </div>

            <div class="position-relative" style="z-index: 1;">
              <h3 class="text-h5 text-amber font-weight-bold mb-3 d-flex align-center">
              </h3>
              <p class="opacity-80 mb-2 max-w-700">
                {{ t('smugglersReport.account.connoisseurBenefit') }}
              </p>
              <p class="text-caption opacity-60 mb-1">
                {{ t('smugglersReport.account.applyCondition') }}
              </p>
              <p class="text-caption opacity-60 mb-6">
                {{ t('smugglersReport.account.applyMethod') }}
              </p>

              <div class="d-flex align-center ga-3">
                <v-btn color="amber" variant="tonal" size="small" prepend-icon="mdi-open-in-new" to="/smugglers-report/view">
                  {{ t('smugglersReport.account.viewCurrentReport') }}
                </v-btn>
                <v-btn variant="outlined" size="small">
                  {{ t('smugglersReport.account.apply') }}
                </v-btn>
              </div>
            </div>
          </v-card>
          <!-- 未具备鉴赏家权限时的申请展示卡片 E -->

          <!-- 周报管理列表 S -->
          <div v-if="isHasSmugglersReportPrivilege">
            <!-- 操作头 S -->
            <AffixContainerView>
              <v-card class="d-flex align-center justify-space-between flex-wrap ga-2 pa-2">
                <div class="d-flex align-center flex-wrap ga-2">
                  <v-checkbox-btn
                      v-if="canDeleteReport && smugglersReportListData.length > 0"
                      :model-value="isAllReportsSelected"
                      :indeterminate="selectedReports.length > 0 && !isAllReportsSelected"
                      @click.stop="toggleSelectAllReports"
                      class="mx-2">
                    <template v-slot:label>
                      <p
                          class="text-body-2 font-weight-medium cursor-pointer user-select-none singe-line"
                          @click="toggleSelectAllReports">
                        {{ t('account.selectAll') }}
                      </p>
                    </template>
                  </v-checkbox-btn>

                  <p v-if="selectedReports.length > 0">
                    {{ t('account.itemsSelected', {count: selectedReports.length}) }}
                  </p>

                  <v-btn
                      v-if="canDeleteReport && selectedReports.length > 0"
                      variant="tonal"
                      color="error"
                      prepend-icon="mdi-delete"
                      @click="onBatchDeleteReports">
                    {{ t('smugglersReport.account.deleteReport') }}
                  </v-btn>

                  <v-btn
                      v-if="canCreateReport && selectedReports.length <= 0"
                      color="amber"
                      variant="tonal"
                      prepend-icon="mdi-plus"
                      @click="openSmugglersReportModel">
                    {{ t('smugglersReport.account.createWeeklyData') }}
                  </v-btn>
                </div>

                <v-spacer></v-spacer>

                <v-btn
                    variant="flat"
                    @click="getSmugglersReportList"
                    :loading="smugglersReportListLoading">
                  <v-icon>mdi-refresh</v-icon>
                </v-btn>
              </v-card>
            </AffixContainerView>
            <!-- 操作头 E -->

            <!-- 列表内容展示 -->
            <div v-if="smugglersReportListData.length > 0">
              <v-list lines="three" variant="text" class="bg-transparent">
                <template v-for="(i, index) in smugglersReportListData" :key="i.id || index">
                  <v-list-item :class="['', {'active-report-border': isReportActive(i)}]">
                    <template v-slot:prepend>
                      <div class="d-flex align-center">
                        <v-checkbox-btn
                            v-if="canDeleteReport"
                            :model-value="isReportSelected(i)"
                            @click.stop="toggleReportItem(i)"
                            class="mr-2 flex-shrink-0">
                        </v-checkbox-btn>
                        <v-avatar size="50" rounded="lg" color="surface-variant" class="mr-3 flex-shrink-0">
                          <v-icon size="24" :color="isReportActive(i) ? 'amber' : 'medium-emphasis'">mdi-trophy-award</v-icon>
                        </v-avatar>
                      </div>
                    </template>
                    <template v-slot:title>
                      <div class="d-flex align-center flex-wrap ga-2">
                        <p>{{ i.title }}</p>

                        <v-chip
                            size="x-small"
                            :color="i.status === 'published' ? 'success' : (i.status === 'draft' ? 'grey' : 'orange')"
                            variant="tonal">
                          {{ i.status === 'published' ? t('smugglersReport.status.published') : (i.status === 'draft' ? t('smugglersReport.status.draft') : t('smugglersReport.status.archived')) }}
                        </v-chip>

                        <v-chip
                            v-if="isReportActive(i)"
                            size="x-small"
                            color="amber"
                            variant="flat"
                            prepend-icon="mdi-check-decagram"
                            class="font-weight-bold">
                          {{ t('smugglersReport.status.currentActive') }}
                        </v-chip>
                      </div>
                    </template>

                    <template v-slot:subtitle>
                      <div class="d-flex align-center flex-wrap ga-2 mt-2">
                        <p class="d-flex align-center">
                          <v-icon size="14" class="mr-1">mdi-comment-outline</v-icon>
                          {{ i.commentCount || 0 }} 条评论
                        </p>
                        <v-divider vertical inset class="mx-1"></v-divider>
                        <p class="d-flex align-center ga-2">
                          <v-icon size="14">mdi-calendar-range</v-icon>
                          <TimeView :time="i.startTime"></TimeView>
                          <v-icon size="14">mdi-calendar-range</v-icon>
                          <TimeView :time="i.endTime"></TimeView>
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
                              v-if="canUpdateReport"
                              prepend-icon="mdi-pencil"
                              @click="openSmugglersReportModel(i)">
                            <v-list-item-title>{{ t('smugglersReport.account.editReport') }}</v-list-item-title>
                          </v-list-item>

                          <v-list-item
                              v-if="i.isUserComment ? (canUpdateComment || canDeleteComment) : canCreateComment"
                              :prepend-icon="i.isUserComment ? 'mdi-comment-edit-outline' : 'mdi-comment-plus-outline'"
                              @click="openCommendModel(i)">
                            <v-list-item-title>{{ i.isUserComment ? t('smugglersReport.account.viewComment') : t('smugglersReport.account.createComment') }}</v-list-item-title>
                          </v-list-item>

                          <v-divider v-if="canDeleteReport && (canUpdateReport || (i.isUserComment ? (canUpdateComment || canDeleteComment) : canCreateComment))" class="my-1"></v-divider>

                          <v-list-item
                              v-if="canDeleteReport"
                              prepend-icon="mdi-delete"
                              class="text-error"
                              @click="onDeleteSmugglersReport(i)">
                            <v-list-item-title>{{ t('smugglersReport.account.deleteReport') }}</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </template>
                  </v-list-item>
                  <v-divider inset v-if="index < smugglersReportListData.length - 1"></v-divider>
                </template>
              </v-list>

              <!-- 分页器 S -->
              <div
                  v-if="smugglersReportListPagination.totalPages > 1"
                  class="d-flex justify-center mt-4">
                <v-pagination
                    v-model="smugglersReportListPagination.page"
                    :length="smugglersReportListPagination.totalPages"
                    :total-visible="5"
                    density="comfortable"
                    size="small"
                    @update:model-value="getSmugglersReportList">
                </v-pagination>
              </div>
              <!-- 分页器 E -->
            </div>

            <div class="text-center py-12" v-else>
              <EmptyView></EmptyView>
            </div>
          </div>
          <!-- 周报管理列表 E -->

          <template v-slot:title>
            {{ t('account.mySmugglersReport') }}
          </template>
        </AffixBoxHasTitleView>

        <!-- 周报规则与指南卡片 S -->
        <AffixBoxHasTitleView>
          <template v-slot:title>
            {{ t('smugglersReport.rules.title') }}
          </template>

          <v-row>
            <v-col cols="6">
              <div class="d-flex align-center font-weight-medium mb-1">
                <span>{{ t('smugglersReport.rules.createReportTitle') }}</span>
              </div>
              <p class="text-medium-emphasis mb-0 leading-relaxed">
                {{ t('smugglersReport.rules.createReportContent') }}
              </p>
            </v-col>

            <v-col cols="6">
              <div class="d-flex align-center font-weight-medium mb-1">
                <span>{{ t('smugglersReport.rules.commentReportTitle') }}</span>
              </div>
              <p class="text-medium-emphasis mb-0 leading-relaxed">
                {{ t('smugglersReport.rules.commentReportContent') }}
              </p>
            </v-col>

            <v-col cols="6">
              <div class="d-flex align-center font-weight-medium mb-1">
                <span>{{ t('smugglersReport.rules.limitTitle') }}</span>
              </div>
              <p class="text-medium-emphasis mb-0 leading-relaxed">
                {{ t('smugglersReport.rules.limitContent') }}
              </p>
            </v-col>

            <v-col cols="6">
              <div class="d-flex align-center font-weight-medium mb-1">
                <span>{{ t('smugglersReport.rules.contentGuideTitle') }}</span>
              </div>
              <p class="text-medium-emphasis mb-0 leading-relaxed">
                {{ t('smugglersReport.rules.contentGuideContent') }}
              </p>
            </v-col>
          </v-row>
        </AffixBoxHasTitleView>
        <!-- 周报规则与指南卡片 E -->
      </v-col>
    </v-row>

    <!-- 周报数据编辑/创建对话框 S -->
    <v-dialog v-model="smugglersReportModel" absolute
              sticky
              scrim
              width="auto"
              no-click-animation>
      <v-card border rounded="lg">
        <v-card-title class="pa-4 font-weight-bold d-flex align-center justify-space-between border-b">
          <span>{{ t('smugglersReport.account.createWeeklyTitle') }}</span>
          <v-btn variant="tonal" icon="mdi-close" @click="smugglersReportModel = false"></v-btn>
        </v-card-title>

        <v-card-item class="pa-4">
          <v-row>
            <v-col cols="12" sm="12" md="12" lg="6">
              <v-card variant="text" width="635" class="mx-auto">
                <VerticalScrollList :is-indicator="false">
                  <SmugglersReportShowItemWidget :data="createSmugglersReportData.content"></SmugglersReportShowItemWidget>
                </VerticalScrollList>
              </v-card>
            </v-col>
            <v-col cols="12" sm="12" md="12" lg="6">
              <!-- 周报信息 -->
              <v-row class="mt-2 mb-4">
                <v-col cols="12" md="12">
                  <v-text-field
                      v-model="createSmugglersReportData.title"
                      :label="t('smugglersReport.account.reportTitle')"
                      density="comfortable"
                      variant="outlined"
                      counter="255"
                      maxlength="255"
                      :rules="reportTitleRules">
                  </v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <TimeFrame
                      density="comfortable"
                      variant="outlined"
                      v-model="createSmugglersReportData.startAndEnd"
                      :placeholder="createSmugglersReportData.startAndEnd"
                      :rules="reportTimeRules">
                  </TimeFrame>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                      v-model="createSmugglersReportData.status"
                      :items="[
                    { title: t('smugglersReport.status.published') || '已发布', value: 'published' },
                    { title: t('smugglersReport.status.draft') || '草稿', value: 'draft' }
                  ]"
                      :label="t('smugglersReport.status.label')"
                      density="comfortable"
                      variant="outlined">
                  </v-select>
                </v-col>
              </v-row>

              <SmugglersReportEditor v-model="createSmugglersReportData.content"></SmugglersReportEditor>
            </v-col>
          </v-row>
        </v-card-item>

        <v-card-actions class="pa-4 border-t">
          <v-btn
              v-if="smugglersReportModelIsEdit"
              color="error"
              variant="tonal"
              @click="onDeleteSmugglersReport(createSmugglersReportData)">
            {{ t('smugglersReport.account.deleteReport') }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="smugglersReportModel = false">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-btn
              color="amber"
              variant="tonal"
              :loading="createSmugglersReportLoading"
              @click="smugglersReportModelIsEdit ? onEditSmugglersReport() : onCreateSmugglersReport()">
            {{ smugglersReportModelIsEdit ? t('basic.button.edit') : t('basic.button.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 周报数据编辑/创建对话框 E -->

    <!-- 鉴赏家评论对话框 S -->
    <v-dialog v-model="commentModel" absolute
              sticky
              scrim
              width="auto"
              no-click-animation>
      <v-card border rounded="lg">
        <v-card-title class="pa-4 font-weight-bold d-flex align-center justify-space-between border-b">
          <span>{{ t('smugglersReport.account.createReviewTitle') }}</span>
          <v-btn variant="tonal" icon="mdi-close" @click="commentModel = false"></v-btn>
        </v-card-title>

        <v-card-item class="pa-4">
          <v-row>
            <v-col cols="12" sm="12" md="12" lg="6">
              <v-card variant="text" width="635" class="mx-auto">
                <VerticalScrollList :is-indicator="false">
                  <SmugglersReportShowItemWidget :data="selectedSmugglersReport.content"></SmugglersReportShowItemWidget>
                </VerticalScrollList>
              </v-card>
            </v-col>
            <v-col cols="12" sm="12" md="12" lg="6">
              <v-alert type="info" variant="tonal" density="compact" class="mb-3 text-caption">
                {{ t('smugglersReport.account.warningContent') }}
              </v-alert>
              <Textarea
                  min-height="250px"
                  :placeholder="t('smugglersReport.account.recommendationPlaceholder')"
                  v-model="smugglersReportComment.content">
                </Textarea>
            </v-col>
          </v-row>
        </v-card-item>

        <v-card-actions class="pa-4 border-t">
          <v-btn
              v-if="commentModelIsEdit && canDeleteComment"
              color="error"
              variant="tonal"
              @click="onDeleteComment">
            {{ t('smugglersReport.account.deleteComment') }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="commentModel = false">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-btn
              v-if="commentModelIsEdit ? canUpdateComment : canCreateComment"
              color="amber"
              variant="tonal"
              :loading="createCommentLoading"
              @click="commentModelIsEdit ? onEditCommend() : onCreateCommend()">
            {{ commentModelIsEdit ? t('basic.button.edit') : t('basic.button.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 鉴赏家评论对话框 E -->
  </div>
</template>

<style scoped lang="less">
.min-width-0 {
  min-width: 0;
}

.max-w-700 {
  max-width: 700px;
}

.hover-card {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
</style>
