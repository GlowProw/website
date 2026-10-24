<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {apis, storage} from "@/assets/sripts/index";
import {handleApiError} from "@/assets/sripts/error_handler";
import {notifyReviewResult} from "@/assets/sripts/review";
import {useNoticeStore} from "~/stores/noticeStore";
import {useI18n} from "vue-i18n";
import {useAuthStore} from "~/stores/userAccountStore";
import {useAppStore} from "~/stores/appStore";

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
import UserAvatar from "@/components/UserAvatar.vue";
import AccountCardWidget from "@/components/AccountCardWidget.vue";
import {usePageHotkeys} from "@/assets/sripts/page_hotkeys";

const notice = useNoticeStore(),
    {t} = useI18n(),
    authStore = useAuthStore(),
    appStore = useAppStore()

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
        weekly: []
      }
    }),
    // 周报编辑分类联动标签
    editorActiveTab = ref('weekly'),
    // 周报编辑已启用的分类列表
    editorCategories = ref<string[]>(['weekly'])

// 周报本地草稿存储 Key
const REPORT_DRAFT_KEY = 'smugglers_report_draft'

// 评论本地草稿存储 Key 前缀
const COMMENT_DRAFT_PREFIX = 'smugglers_comment_draft_'

// 是否存在周报本地草稿
const hasReportDraft = ref(false)

// 是否存在当前选中周报的评论本地草稿
const hasCommentDraft = ref(false)

// Debug 模式下编辑周报的原始 JSON 文本
const rawJsonText = ref('')

// JSON 语法错误提示信息
const jsonSyntaxError = ref('')

// 标记当前是否正从 JSON 文本同步至周报数据，避免循环更新
let isUpdatingFromJson = false

/**
 * 从周报内容中解析出已启用分类列表
 * 优先使用 content.categoryOrder 保存的顺序，否则按非空数据推断，全部为空时回落到 weekly
 * @param content 周报内容对象
 * @returns 分类 key 数组
 */
const resolveCategoriesFromContent = (content: any): string[] => {
  const known = ['weekly', 'inSeason', 'abyssal', 'common']

  if (Array.isArray(content?.categoryOrder) && content.categoryOrder.length > 0) {
    return content.categoryOrder.filter((c: string) => known.includes(c))
  }

  const present = known.filter(key => {
    const list = content?.[key]
    return Array.isArray(list) && list.length > 0
  })

  return present.length > 0 ? present : ['weekly']
}

/**
 * 检查是否存在周报草稿
 */
const checkReportDraft = () => {
  const res = storage.local.get(REPORT_DRAFT_KEY)
  hasReportDraft.value = res.code === 0 && !!res.data?.value
}

/**
 * 保存当前周报为草稿
 */
const onSaveReportDraft = () => {
  const draftData = {
    title: createSmugglersReportData.value.title || '',
    startAndEnd: createSmugglersReportData.value.startAndEnd || '',
    status: createSmugglersReportData.value.status || 'published',
    content: createSmugglersReportData.value.content || {weekly: []},
    editorCategories: editorCategories.value || ['weekly']
  }
  storage.local.set(REPORT_DRAFT_KEY, draftData)
  hasReportDraft.value = true
  notice.success(t('smugglersReport.account.draftSaved'))
}

/**
 * 恢复周报草稿
 */
const onRestoreReportDraft = () => {
  const res = storage.local.get(REPORT_DRAFT_KEY)
  if (res.code !== 0 || !res.data?.value) return
  const draft = res.data.value
  createSmugglersReportData.value.title = draft.title || ''
  createSmugglersReportData.value.startAndEnd = draft.startAndEnd || ''
  createSmugglersReportData.value.status = draft.status || 'published'
  createSmugglersReportData.value.content = draft.content || {weekly: []}
  if (draft.editorCategories && Array.isArray(draft.editorCategories)) {
    editorCategories.value = draft.editorCategories
  }
  syncContentToJson(createSmugglersReportData.value.content)
  notice.success(t('smugglersReport.account.draftRestored'))
}

/**
 * 检查当前选中周报是否存在评论草稿
 * @param reportId 周报ID
 */
const checkCommentDraft = (reportId: string) => {
  if (!reportId) {
    hasCommentDraft.value = false
    return
  }
  const res = storage.local.get(`${COMMENT_DRAFT_PREFIX}${reportId}`)
  const saved = res.code === 0 ? res.data?.value : null
  hasCommentDraft.value = typeof saved === 'string' && saved.trim().length > 0
}

/**
 * 保存当前评论草稿
 */
const onSaveCommentDraft = () => {
  const reportId = selectedSmugglersReport.value?.id
  if (!reportId) return
  storage.local.set(`${COMMENT_DRAFT_PREFIX}${reportId}`, smugglersReportComment.value.content || '')
  hasCommentDraft.value = true
  notice.success(t('smugglersReport.account.draftSaved'))
}

/**
 * 恢复当前周报的评论草稿
 */
const onRestoreCommentDraft = () => {
  const reportId = selectedSmugglersReport.value?.id
  if (!reportId) return
  const res = storage.local.get(`${COMMENT_DRAFT_PREFIX}${reportId}`)
  if (res.code === 0 && typeof res.data?.value === 'string') {
    smugglersReportComment.value.content = res.data.value
    notice.success(t('smugglersReport.account.draftRestored'))
  }
}

/**
 * 同步周报内容至 JSON 面板文本
 * @param content 周报内容对象
 */
const syncContentToJson = (content: any) => {
  if (isUpdatingFromJson) return
  try {
    rawJsonText.value = JSON.stringify(content || {weekly: []}, null, 2)
    jsonSyntaxError.value = ''
  } catch (e: any) {
    jsonSyntaxError.value = e?.message || t('smugglersReport.account.jsonSyntaxError')
  }
}

/**
 * 处理 JSON 面板文本输入双向同步
 * @param value 输入的 JSON 文本
 */
const onJsonTextChange = (value: string) => {
  rawJsonText.value = value
  if (!value || !value.trim()) {
    jsonSyntaxError.value = ''
    return
  }
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      jsonSyntaxError.value = t('smugglersReport.account.jsonSyntaxError')
      return
    }
    jsonSyntaxError.value = ''
    isUpdatingFromJson = true
    createSmugglersReportData.value.content = parsed
    editorCategories.value = resolveCategoriesFromContent(parsed)
    setTimeout(() => {
      isUpdatingFromJson = false
    }, 0)
  } catch (e: any) {
    jsonSyntaxError.value = e?.message || t('smugglersReport.account.jsonSyntaxError')
  }
}

/**
 * 格式化当前 JSON 文本
 */
const formatJsonText = () => {
  try {
    const parsed = JSON.parse(rawJsonText.value)
    rawJsonText.value = JSON.stringify(parsed, null, 2)
    jsonSyntaxError.value = ''
  } catch (e: any) {
    jsonSyntaxError.value = e?.message || t('smugglersReport.account.jsonSyntaxError')
  }
}

// 深度监听周报内容更新，自动同步至 JSON 面板
watch(
    () => createSmugglersReportData.value.content,
    (newContent) => {
      syncContentToJson(newContent)
    },
    {deep: true}
)

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
    if (!confirm(t('smugglersReport.account.confirmDeleteReport'))) return
    createSmugglersReportLoading.value = true
    for (const item of selectedReports.value) {
      await apis.smugglersApi().deleteReport(item.id)
    }
    notice.success(t('basic.tips.deleteSuccess'))
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
  (v: string) => !!(v && v.trim()) || t('smugglersReport.account.titleRequired'),
  (v: string) => !v || v.trim().length >= 1 || t('smugglersReport.account.titleMinLength'),
  (v: string) => !v || v.trim().length <= 255 || t('smugglersReport.account.titleMaxLength')
]

// 周报起止时间校验规则
const reportTimeRules = [
  (v: string) => {
    if (!v) return t('smugglersReport.account.timeRequired')
    const times = v.split(',')
    return (times.length >= 2 && !!times[0] && !!times[1]) || t('smugglersReport.account.timeRequired')
  }
]

/**
 * 创建走私犯周报
 */
const onCreateSmugglersReport = async () => {
  try {
    const title = createSmugglersReportData.value.title?.trim()
    if (!title || title.length < 1) {
      notice.warning(t('smugglersReport.account.titleRequired'))
      return
    }
    if (title.length > 255) {
      notice.warning(t('smugglersReport.account.titleMaxLength'))
      return
    }
    if (!createSmugglersReportData.value.startAndEnd) {
      notice.warning(t('smugglersReport.account.timeRequired'))
      return
    }
    const times = createSmugglersReportData.value.startAndEnd.split(',')
    if (times.length < 2 || !times[0] || !times[1]) {
      notice.warning(t('smugglersReport.account.timeRequired'))
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
    storage.local.rem(REPORT_DRAFT_KEY)
    hasReportDraft.value = false
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
      notice.warning(t('smugglersReport.account.titleRequired'))
      return
    }
    if (title.length > 255) {
      notice.warning(t('smugglersReport.account.titleMaxLength'))
      return
    }
    if (!createSmugglersReportData.value.startAndEnd) {
      notice.warning(t('smugglersReport.account.timeRequired'))
      return
    }
    const times = createSmugglersReportData.value.startAndEnd.split(',')
    if (times.length < 2 || !times[0] || !times[1]) {
      notice.warning(t('smugglersReport.account.timeRequired'))
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
    notice.success(t('basic.tips.deleteSuccess'))
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
  editorActiveTab.value = 'weekly'
  if (reportData && reportData.id) {
    if (!canUpdateReport.value) {
      notice.warning(t('basic.tips.permissionDenied'))
      return
    }
    smugglersReportModelIsEdit.value = true
    const rawContent = reportData.content
    const parsedContent = typeof rawContent === 'string'
        ? JSON.parse(rawContent)
        : JSON.parse(JSON.stringify(rawContent || {weekly: []}))

    editorCategories.value = resolveCategoriesFromContent(parsedContent)
    editorActiveTab.value = editorCategories.value[0] || 'weekly'

    createSmugglersReportData.value = {
      ...JSON.parse(JSON.stringify(reportData)),
      content: parsedContent,
      status: reportData.status || 'published',
      startAndEnd: `${reportData.startTime},${reportData.endTime}`
    }
  } else {
    if (!canCreateReport.value) {
      notice.warning(t('basic.tips.permissionDenied'))
      return
    }
    smugglersReportModelIsEdit.value = false
    editorCategories.value = ['weekly']
    createSmugglersReportData.value = {
      title: '',
      status: 'published',
      startAndEnd: '',
      content: {weekly: []}
    }
  }
  checkReportDraft()
  syncContentToJson(createSmugglersReportData.value.content)
  smugglersReportModel.value = true
}

/**
 * 基于指定周报克隆创建新周报
 * @param report 目标周报数据项
 */
const onCloneReport = (report: any) => {
  if (!canCreateReport.value) {
    notice.warning(t('basic.tips.permissionDenied'))
    return
  }
  editorActiveTab.value = 'weekly'
  smugglersReportModelIsEdit.value = false
  const rawContent = report.content
  const parsedContent = typeof rawContent === 'string'
      ? JSON.parse(rawContent)
      : JSON.parse(JSON.stringify(rawContent || {weekly: []}))

  editorCategories.value = resolveCategoriesFromContent(parsedContent)
  editorActiveTab.value = editorCategories.value[0] || 'weekly'

  createSmugglersReportData.value = {
    title: `${report.title || ''} (副本)`.trim(),
    status: 'published',
    startAndEnd: report.startTime && report.endTime ? `${report.startTime},${report.endTime}` : '',
    content: parsedContent
  }
  smugglersReportModel.value = true
  notice.success(t('smugglersReport.account.cloneSuccess'))
}

/**
 * 从已有周报克隆数据覆盖当前编辑对象
 * @param targetReport 选中的源周报
 */
const applyCloneFromReport = (targetReport: any) => {
  if (!targetReport) return
  if (!confirm(t('smugglersReport.account.cloneConfirm'))) return

  try {
    const raw = targetReport.content
    const parsed = typeof raw === 'string'
        ? JSON.parse(raw)
        : JSON.parse(JSON.stringify(raw || {weekly: []}))

    editorCategories.value = resolveCategoriesFromContent(parsed)
    createSmugglersReportData.value.content = parsed
    editorActiveTab.value = editorCategories.value[0] || 'weekly'
    notice.success(t('smugglersReport.account.cloneSuccess'))
  } catch (err: any) {
    notice.error('克隆周报数据解析失败: ' + (err?.message || err))
  }
}

/**
 * 复制指定周报内容到剪贴板与临时存储
 * @param content 周报内容对象或字符串
 */
const copyReportContentToClipboard = async (content: any) => {
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content
    const dataStr = JSON.stringify(parsed || {weekly: []}, null, 2)
    sessionStorage.setItem('glow_prow_clipboard_report', dataStr)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(dataStr)
    }
    notice.success(t('basic.tips.copySuccess'))
  } catch (e: any) {
    notice.success(t('basic.tips.copySuccess'))
  }
}

/**
 * 复制当前编辑中的周报数据
 */
const copyCurrentReportContent = () => {
  return copyReportContentToClipboard(createSmugglersReportData.value.content)
}

/**
 * 从周报列表中复制指定周报数据
 * @param report 目标周报
 */
const copyReportFromList = (report: any) => {
  return copyReportContentToClipboard(report.content)
}

/**
 * 从剪贴板读取并导入周报数据到当前周报中
 */
const pasteReportContent = async () => {
  try {
    let text = ''
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        text = await navigator.clipboard.readText()
      } catch (err) {
        text = sessionStorage.getItem('glow_prow_clipboard_report') || ''
      }
    } else {
      text = sessionStorage.getItem('glow_prow_clipboard_report') || ''
    }

    if (!text || !text.trim()) {
      text = sessionStorage.getItem('glow_prow_clipboard_report') || ''
    }

    if (!text || !text.trim()) {
      notice.warning(t('basic.tips.clipboardEmpty'))
      return
    }

    const parsed = JSON.parse(text.trim())
    if (!parsed || typeof parsed !== 'object' || (!parsed.weekly && !Array.isArray(parsed))) {
      notice.error(t('smugglersReport.account.pasteInvalid'))
      return
    }

    const finalContent: any = Array.isArray(parsed) ? {weekly: parsed} : parsed
    editorCategories.value = resolveCategoriesFromContent(finalContent)
    createSmugglersReportData.value.content = finalContent
    editorActiveTab.value = editorCategories.value[0] || 'weekly'
    notice.success(t('basic.tips.pasteSuccess'))
  } catch (e: any) {
    notice.error(t('smugglersReport.account.pasteInvalid'))
  }
}

/**
 * 打开鉴赏家评论弹窗
 * @param reportData 周报数据项
 */
const openCommendModel = (reportData: any) => {
  if (reportData.isUserComment) {
    if (!canUpdateComment.value && !canDeleteComment.value) {
      notice.warning(t('basic.tips.permissionDenied'))
      return
    }
    commentModelIsEdit.value = true
    smugglersReportComment.value.content = reportData.userComment?.content ?? ''
  } else {
    if (!canCreateComment.value) {
      notice.warning(t('basic.tips.permissionDenied'))
      return
    }
    commentModelIsEdit.value = false
    smugglersReportComment.value.content = ''
  }
  selectedSmugglersReport.value = reportData
  checkCommentDraft(reportData.id)
  commentModel.value = true
}

/**
 * 创建鉴赏家评论
 */
const onCreateCommend = async () => {
  try {
    if (!canCreateComment.value) {
      notice.warning(t('basic.tips.permissionDenied'))
      return
    }
    createCommentLoading.value = true
    const reportId = selectedSmugglersReport.value?.id
    if (!reportId) return
    const result = await apis.smugglersApi().addReportComment(reportId, {
      content: smugglersReportComment.value.content as string
    })
    const d = result.data
    if (!notifyReviewResult(d.data?.review, notice, t)) return
    if (!d.data?.review || d.data.review.status === 'approved')
      notice.success(t('smugglersReport.account.commentSuccess'))
    storage.local.rem(`${COMMENT_DRAFT_PREFIX}${reportId}`)
    hasCommentDraft.value = false
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
      notice.warning(t('basic.tips.permissionDenied'))
      return
    }
    createCommentLoading.value = true
    const reportId = selectedSmugglersReport.value?.id
    const commentId = selectedSmugglersReport.value?.userComment?.id
    if (!reportId || !commentId) return
    const result = await apis.smugglersApi().editReportComment(reportId, commentId, {
      content: smugglersReportComment.value.content as string
    })
    const d = result.data
    if (!notifyReviewResult(d.data?.review, notice, t)) return
    if (!d.data?.review || d.data.review.status === 'approved')
      notice.success(t('smugglersReport.account.commentEditSuccess'))
    storage.local.rem(`${COMMENT_DRAFT_PREFIX}${reportId}`)
    hasCommentDraft.value = false
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
      notice.warning(t('basic.tips.permissionDenied'))
      return
    }
    if (!confirm(t('smugglersReport.account.confirmSoftDeleteComment'))) return
    createCommentLoading.value = true
    const reportId = selectedSmugglersReport.value?.id
    const commentId = selectedSmugglersReport.value?.userComment?.id
    if (!reportId || !commentId) return
    await apis.smugglersApi().delReportComment(reportId, commentId)
    notice.success(t('smugglersReport.account.commentSoftDeleteSuccess'))
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
    if (!confirm(t('smugglersReport.account.confirmHardDeleteComment'))) return
    createCommentLoading.value = true
    const reportId = selectedSmugglersReport.value?.id
    const commentId = selectedSmugglersReport.value?.userComment?.id
    if (!reportId || !commentId) return
    await apis.smugglersApi().hardDeleteReportComment(reportId, commentId)
    notice.success(t('smugglersReport.account.commentHardDeleteSuccess'))
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

/**
 * 快捷键提交当前编辑中的周报
 */
const onSmugglersSubmit = () => {
  if (!smugglersReportModel.value) return
  if (smugglersReportModelIsEdit.value) {
    onEditSmugglersReport()
    return
  }
  onCreateSmugglersReport()
}

/**
 * 快捷键取消编辑并关闭当前弹窗
 */
const onSmugglersCancelEdit = () => {
  if (smugglersReportModel.value) {
    smugglersReportModel.value = false
    return
  }
  if (commentModel.value) {
    commentModel.value = false
  }
}

usePageHotkeys({
  smugglersSubmit: onSmugglersSubmit,
  smugglersCancelEdit: onSmugglersCancelEdit,
}, {
  active: () => smugglersReportModel.value || commentModel.value,
  allowInEditable: ['smugglersSubmit', 'smugglersCancelEdit'],
})

defineOptions({
  name: 'AccountSmugglersReport'
})
</script>

<template>
  <div>
    <v-row>
      <v-col cols="12" lg="3">
        <AffixContainerView>
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
        </AffixContainerView>
      </v-col>
      <v-col cols="12" lg="9" class="position-relative">
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
                      <div class="d-flex align-center mt-n1">
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
                        <p class="u cursor-pointer"
                           @click="openSmugglersReportModel(i)">{{ i.title }}</p>

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
                        <p class="d-flex align-center ga-2">
                          <v-icon size="14">mdi-calendar-range</v-icon>
                          <TimeView :time="i.startTime"></TimeView>
                          <v-icon size="14">mdi-calendar-range</v-icon>
                          <TimeView :time="i.endTime"></TimeView>
                        </p>
                      </div>

                      <!-- 创建者、参与编辑与参与评论用户 S -->
                      <div class="d-flex align-center flex-wrap ga-x-4 ga-y-2 mt-2">
                        <div class="d-flex align-center ga-1" v-if="i.author_name">
                          <span class="text-caption">
                            <v-icon size="14" class="mr-1">mdi-account</v-icon>
                            {{ t('smugglersReport.account.creator') }}
                          </span>
                          <AccountCardWidget :id="i.createdBy">
                            <UserAvatar :src="i.author_avatar || ''" size="20px" class="bg-black"></UserAvatar>
                          </AccountCardWidget>
                        </div>

                        <div class="d-flex align-center ga-1" v-if="i.editors && i.editors.length > 0">
                          <span class="text-caption mr-1">
                            <v-icon size="14" class="mr-1">mdi-account</v-icon>
                            {{ t('smugglersReport.account.editors') }}
                          </span>

                          <AccountCardWidget v-for="u in i.editors" :key="`editor-${u.id}`" :id="u.id">
                            <UserAvatar :src="u.avatar || ''" size="20px" class="bg-black"></UserAvatar>
                          </AccountCardWidget>
                        </div>

                        <div class="d-flex align-center ga-1" v-if="i.commentUsers && i.commentUsers.length > 0">
                          <span class="text-caption mr-1">
                            <v-icon size="14" class="mr-1">mdi-comment-outline</v-icon>
                            {{ t('smugglersReport.account.commenters') }}({{ i.commentCount || 0 }})
                          </span>

                          <div class="d-flex ga-1">
                            <template v-for="(u, index) in i.commentUsers" :key="`commenter-${u.id}`" :id="u.id" class="d-flex">
                              <AccountCardWidget :id="u.id">
                                <UserAvatar :src="u.avatar || ''" size="20px" class="elevation-24" :class="{'ml-n4': index > 0}"></UserAvatar>
                              </AccountCardWidget>
                            </template>
                          </div>
                        </div>
                      </div>
                      <!-- 创建者、参与编辑与参与评论用户 E -->
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

                          <v-divider class="my-1"></v-divider>

                          <v-list-item
                              v-if="canCreateReport"
                              prepend-icon="mdi-content-duplicate"
                              @click="onCloneReport(i)">
                            <v-list-item-title>{{ t('smugglersReport.account.cloneReport') }}</v-list-item-title>
                          </v-list-item>

                          <v-list-item
                              prepend-icon="mdi-content-copy"
                              @click="copyReportFromList(i)">
                            <v-list-item-title>{{ t('smugglersReport.account.copyReport') }}</v-list-item-title>
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

        <v-overlay :model-value="checkPermissionLoading || smugglersReportListLoading" contained class="d-flex align-center justify-center">
          <Loading size="50"></Loading>
        </v-overlay>
      </v-col>
    </v-row>

    <!-- 周报数据编辑/创建对话框 S -->
    <v-dialog
        v-model="smugglersReportModel"
        absolute
        sticky
        scrim
        width="1320"
        max-width="95vw"
        no-click-animation>
      <v-card
          border
          rounded="lg"
          class="dialog-card d-flex flex-column">
        <!-- 固定头部 -->
        <v-card-title class="pa-4 font-weight-bold d-flex align-center justify-space-between border-b flex-shrink-0 flex-wrap ga-2">
          <span>{{ smugglersReportModelIsEdit ? t('smugglersReport.account.editReport') : t('smugglersReport.account.createWeeklyTitle') }}</span>

          <div class="d-flex align-center flex-wrap ga-2">
            <v-btn variant="tonal" icon="mdi-close" size="small" @click="smugglersReportModel = false"></v-btn>
          </div>
        </v-card-title>

        <v-card-text class="pa-4 flex-grow-1 overflow-y-auto">
          <v-row class="ga-4 ga-lg-6">
            <v-col cols="12" lg="6" class="min-width-0">
              <AffixContainerView :offset-top="0">
                <v-card variant="text" class="mx-auto w-100" style="max-width: 635px;">
                  <SmugglersReportShowItemWidget
                      :data="createSmugglersReportData.content"
                      :categories="editorCategories"
                      v-model:active-category="editorActiveTab">
                  </SmugglersReportShowItemWidget>
                </v-card>
              </AffixContainerView>

            </v-col>
            <v-col cols="12" lg="6" class="min-width-0">
              <!-- 周报信息 -->
              <v-row class="mt-2 mb-4">
                <v-col cols="12">
                  <v-text-field
                      v-model="createSmugglersReportData.title"
                      :label="t('smugglersReport.account.reportTitle')"
                      density="comfortable"
                      variant="outlined"
                      counter="200"
                      maxlength="200"
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
                    { title: t('smugglersReport.status.published'), value: 'published' },
                    { title: t('smugglersReport.status.draft'), value: 'draft' }
                  ]"
                      :label="t('smugglersReport.status.label')"
                      density="comfortable"
                      variant="outlined">
                  </v-select>
                </v-col>
              </v-row>

              <SmugglersReportEditor
                  v-model="createSmugglersReportData.content"
                  v-model:categories="editorCategories"
                  v-model:active-category="editorActiveTab">
              </SmugglersReportEditor>
            </v-col>
          </v-row>

          <!-- 当 Debug 开启时，展示双向编辑 JSON 面板 S -->
          <v-card
              v-if="appStore.isDebug"
              variant="outlined"
              class="mt-6 pa-4 border-dashed rounded-lg bg-surface-variant">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center ga-2">
                <v-icon color="warning" size="20">mdi-code-json</v-icon>
                <span class="text-subtitle-2 font-weight-bold">{{ t('smugglersReport.account.jsonPanelTitle') }}</span>
                <span class="text-caption text-medium-emphasis">{{ t('smugglersReport.account.jsonPanelDesc') }}</span>
              </div>
              <div class="d-flex align-center ga-2">
                <v-btn
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-format-align-left"
                    @click="formatJsonText">
                  {{ t('smugglersReport.account.formatJson') }}
                </v-btn>
              </div>
            </div>
            <v-textarea
                :model-value="rawJsonText"
                @update:model-value="onJsonTextChange"
                density="compact"
                variant="outlined"
                auto-grow
                rows="10"
                max-rows="20"
                hide-details="auto"
                :error-messages="jsonSyntaxError"
                style="font-family: monospace; font-size: 13px;">
            </v-textarea>
          </v-card>
          <!-- 当 Debug 开启时，展示双向编辑 JSON 面板 E -->
        </v-card-text>

        <!-- 固定底部 -->
        <v-card-actions class="pa-4 border-t flex-shrink-0">
          <v-btn
              v-if="smugglersReportModelIsEdit"
              color="error"
              variant="tonal"
              @click="onDeleteSmugglersReport(createSmugglersReportData)">
            {{ t('smugglersReport.account.deleteReport') }}
          </v-btn>

          <v-divider vertical inset class="mx-4"></v-divider>

          <!-- 从已有周报克隆下拉菜单 S -->
          <v-menu location="bottom end" v-if="smugglersReportListData.length > 0">
            <template v-slot:activator="{ props }">
              <v-btn
                  v-bind="props"
                  variant="tonal"
                  color="amber"
                  prepend-icon="mdi-content-duplicate">
                {{ t('smugglersReport.account.cloneFromSelect') }}
              </v-btn>
            </template>
            <v-list density="compact" max-height="320" min-width="260">
              <v-list-item
                  v-for="rep in smugglersReportListData"
                  :key="rep.id"
                  :title="rep.title"
                  :subtitle="rep.startTime ? `${rep.startTime} ~ ${rep.endTime}` : ''"
                  @click="applyCloneFromReport(rep)">
                <template v-slot:prepend>
                  <v-icon size="18" class="mr-2">mdi-file-document-outline</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-menu>
          <!-- 从已有周报克隆下拉菜单 E -->

          <!-- 复制数据到剪贴板 -->
          <v-btn
              variant="tonal"
              prepend-icon="mdi-content-copy"
              :title="t('smugglersReport.account.copyReport')"
              @click="copyCurrentReportContent">
            {{ t('smugglersReport.account.copyReport') }}
          </v-btn>

          <!-- 从剪贴板粘贴导入 -->
          <v-btn
              variant="tonal"
              prepend-icon="mdi-content-paste"
              :title="t('smugglersReport.account.pasteReport')"
              @click="pasteReportContent">
            {{ t('smugglersReport.account.pasteReport') }}
          </v-btn>

          <!-- 保存周报草稿 -->
          <v-btn
              variant="tonal"
              prepend-icon="mdi-content-save-outline"
              @click="onSaveReportDraft">
            {{ t('smugglersReport.account.saveDraft') }}
          </v-btn>

          <!-- 恢复周报草稿 -->
          <v-btn
              v-if="hasReportDraft"
              color="info"
              variant="tonal"
              prepend-icon="mdi-history"
              @click="onRestoreReportDraft">
            {{ t('smugglersReport.account.restoreDraft') }}
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
            {{ smugglersReportModelIsEdit ? t('basic.button.save') : t('basic.button.create') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 周报数据编辑/创建对话框 E -->

    <!-- 鉴赏家评论对话框 S -->
    <v-dialog
        v-model="commentModel"
        absolute
        sticky
        scrim
        width="1180"
        max-width="95vw"
        no-click-animation>
      <v-card
          border
          rounded="lg"
          class="dialog-card d-flex flex-column">
        <!-- 固定头部 -->
        <v-card-title class="pa-4 font-weight-bold d-flex align-center justify-space-between border-b flex-shrink-0">
          <span>{{ commentModelIsEdit ? t('smugglersReport.account.editReviewTitle') : t('smugglersReport.account.createReviewTitle') }}</span>
          <v-btn variant="tonal" icon="mdi-close" @click="commentModel = false"></v-btn>
        </v-card-title>

        <!-- 仅中间内容滚动 -->
        <v-card-text class="pa-4 flex-grow-1 overflow-y-auto">
          <v-row class="ga-4 ga-md-6 align-start">
            <v-col cols="12" md="6" class="min-width-0">
              <v-card variant="text" class="mx-auto w-100" style="max-width: 635px;">
                <VerticalScrollList :is-indicator="false">
                  <SmugglersReportShowItemWidget :data="selectedSmugglersReport.content"></SmugglersReportShowItemWidget>
                </VerticalScrollList>
              </v-card>
            </v-col>
            <v-col cols="12" md="6" class="min-width-0">
              <AffixContainerView :offset-top="0">
                <AffixBoxHasTitleView :offset-top="0">
                  <template v-slot:title>
                    {{ t('comment.title') }}
                  </template>

                  <Textarea
                      min-height="250px"
                      :maxlength="5000"
                      :placeholder="t('smugglersReport.account.recommendationPlaceholder') + '\n' + t('smugglersReport.account.warningContent')"
                      v-model="smugglersReportComment.content">
                </Textarea>
                </AffixBoxHasTitleView>
              </AffixContainerView>
            </v-col>
          </v-row>
        </v-card-text>

        <!-- 固定底部 -->
        <v-card-actions class="pa-4 border-t flex-shrink-0">
          <v-btn
              v-if="commentModelIsEdit && canDeleteComment"
              color="error"
              variant="tonal"
              @click="onDeleteComment">
            {{ t('smugglersReport.account.deleteComment') }}
          </v-btn>

          <!-- 保存评论草稿 -->
          <v-btn
              variant="tonal"
              prepend-icon="mdi-content-save-outline"
              @click="onSaveCommentDraft">
            {{ t('smugglersReport.account.saveDraft') }}
          </v-btn>

          <!-- 恢复评论草稿 -->
          <v-btn
              v-if="hasCommentDraft"
              color="info"
              variant="tonal"
              prepend-icon="mdi-history"
              @click="onRestoreCommentDraft">
            {{ t('smugglersReport.account.restoreDraft') }}
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
.dialog-card {
  max-height: 88vh;
  display: flex;
  flex-direction: column;
}

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
