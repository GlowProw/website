<script setup lang="ts">
import {onMounted, ref} from "vue";
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
import Time from "@/components/Time.vue";
import Loading from "@/components/Loading.vue";
import EmptyView from "@/components/EmptyView.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const notice = useNoticeStore(),
    {t} = useI18n(),
    authStore = useAuthStore()

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
      pageSize: 10
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
      startAndEnd: '',
      content: {
        inSeason: [],
        weekly: [],
        common: []
      }
    })

onMounted(async () => {
  await getCheckUserPermission()
  await getSmugglersReportList()
})

const getCheckUserPermission = async () => {
  try {
    checkPermissionLoading.value = true
    const result = await apis.smugglersApi().checkPrivilege([
      "smuggler_weekly_report_ownership",
      "smuggler_weekly_report_create",
      "smuggler_weekly_report_update",
      "smuggler_weekly_report_delete",
      "smuggler_weekly_report_comment_create",
      "smuggler_weekly_report_comment_update",
      "smuggler_weekly_report_comment_delete",
    ])
    const d = result.data
    isHasSmugglersReportPrivilege.value = d.data?.hasPrivilege || false
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    checkPermissionLoading.value = false
  }
}

const getSmugglersReportList = async () => {
  try {
    if (!isHasSmugglersReportPrivilege.value) return
    smugglersReportListLoading.value = true

    const result = await apis.smugglersApi().getReports({
      page: smugglersReportListPagination.value.page,
      pageSize: smugglersReportListPagination.value.pageSize
    })
    const d = result.data
    smugglersReportListData.value = d.data?.list || []
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    smugglersReportListLoading.value = false
  }
}

const onCreateSmugglersReport = async () => {
  try {
    createSmugglersReportLoading.value = true
    const times = createSmugglersReportData.value.startAndEnd.split(',')
    const result = await apis.smugglersApi().addReport({
      title: createSmugglersReportData.value.title,
      startTime: times[0],
      endTime: times[1],
      content: createSmugglersReportData.value.content
    })
    notice.success(t(`basic.tips.${result.code}`) || '创建成功')
    await getSmugglersReportList()
    smugglersReportModel.value = false
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    createSmugglersReportLoading.value = false
  }
}

const onEditSmugglersReport = async () => {
  try {
    createSmugglersReportLoading.value = true
    const times = createSmugglersReportData.value.startAndEnd.split(',')
    const result = await apis.smugglersApi().editReport(createSmugglersReportData.value.id, {
      title: createSmugglersReportData.value.title,
      startTime: times[0],
      endTime: times[1],
      content: createSmugglersReportData.value.content
    })
    notice.success(t(`basic.tips.${result.code}`) || '修改成功')
    await getSmugglersReportList()
    smugglersReportModel.value = false
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    createSmugglersReportLoading.value = false
  }
}

const onDeleteSmugglersReport = async (reportData: any) => {
  try {
    if (!confirm(t('common.confirmDelete') || '确定要删除该周报吗？')) return
    createSmugglersReportLoading.value = true
    const result = await apis.smugglersApi().delReport(reportData.id)
    notice.success(t(`basic.tips.${result.code}`) || '删除成功')
    await getSmugglersReportList()
    smugglersReportModel.value = false
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    createSmugglersReportLoading.value = false
  }
}

const openSmugglersReportModel = (reportData: any = null) => {
  smugglersReportModel.value = true
  if (reportData && reportData.id) {
    smugglersReportModelIsEdit.value = true
    createSmugglersReportData.value = JSON.parse(JSON.stringify(reportData))
    createSmugglersReportData.value.startAndEnd = `${reportData.startTime},${reportData.endTime}`
  } else {
    smugglersReportModelIsEdit.value = false
    createSmugglersReportData.value = {
      title: '',
      startAndEnd: '',
      content: {inSeason: [], weekly: [], common: []}
    }
  }
}

const openCommendModel = (reportData: any) => {
  commentModel.value = true
  selectedSmugglersReport.value = reportData
  if (reportData.isUserComment) {
    commentModelIsEdit.value = true
    smugglersReportComment.value.content = reportData.userComment?.content ?? ''
  } else {
    commentModelIsEdit.value = false
    smugglersReportComment.value.content = ''
  }
}

const onCreateCommend = async () => {
  try {
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

const onEditCommend = async () => {
  try {
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

const onDeleteComment = async () => {
  try {
    if (!confirm(t('common.confirmDelete') || '确定删除此条评论吗？')) return
    createCommentLoading.value = true
    const reportId = selectedSmugglersReport.value?.id
    if (!reportId) return
    await apis.smugglersApi().delReportComment(reportId)
    notice.success(t('basic.button.submit') || '删除成功')
    await getSmugglersReportList()
    commentModel.value = false
  } catch (e) {
    handleApiError(e, notice, t, {component: 'MySmugglersReport'})
  } finally {
    createCommentLoading.value = false
  }
}

defineOptions({
  name: 'AccountSmugglersReport'
})
</script>

<template>
  <div class="position-relative">
    <v-overlay :model-value="checkPermissionLoading || smugglersReportListLoading" contained class="d-flex align-center justify-center">
      <Loading></Loading>
    </v-overlay>

    <!-- 顶部标题区域 S -->
    <div class="d-flex align-center justify-between mb-4">
      <div>
        <p class="text-caption opacity-60 mt-1">
          {{ t('smugglersReport.account.connoisseurDesc') || '走私犯线人每周市场动态、稀有物品深度评测与推荐选购指南管理' }}
        </p>
      </div>
    </div>
    <!-- 顶部标题区域 E -->

    <AffixBoxHasTitleView>
      <!-- 未具备鉴赏家权限时的申请展示卡片 S -->
      <v-card border rounded="lg" class="pa-6 position-relative overflow-hidden mb-6" v-if="!isHasSmugglersReportPrivilege && !checkPermissionLoading">
        <div class="position-absolute top-0 right-0 opacity-10 pt-4 pr-4">
          <v-icon size="180">mdi-trophy-award</v-icon>
        </div>

        <div class="position-relative" style="z-index: 1;">
          <h3 class="text-h5 text-amber font-weight-bold mb-3 d-flex align-center">
            <v-icon icon="mdi-shield-crown-outline" class="mr-2"></v-icon>
            {{ t('smugglersReport.account.connoisseurTitle') }}
          </h3>
          <p class="text-body-2 opacity-80 mb-2 max-w-700">
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

      <!-- 具备鉴赏家权限时的周报管理列表 S -->
      <div v-if="isHasSmugglersReportPrivilege">
        <!-- 统一 Toolbar -->
        <v-card border rounded="lg" class="mb-4 pa-2 bg-surface">
          <div class="d-flex align-center justify-space-between flex-wrap ga-2">
            <div class="text-body-2 font-weight-medium d-flex align-center">
              <v-icon size="18" class="mr-1 text-amber">mdi-format-list-bulleted</v-icon>
              {{ t('smugglersReport.title') || '周报列表' }}
            </div>

            <div class="d-flex align-center ga-2">
              <v-btn
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-open-in-new"
                  to="/smugglers-report/view">
                {{ t('smugglersReport.account.viewCurrentReport') }}
              </v-btn>

              <v-btn
                  v-if="authStore.isLogin && authStore.checkPrivilegeGroup(authStore.user?.privilege, ['smugglersReportConnoisseur', 'admin', 'super', 'dev'])"
                  color="amber"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-plus"
                  @click="openSmugglersReportModel">
                {{ t('smugglersReport.account.createWeeklyData') }}
              </v-btn>

              <v-btn
                  size="small"
                  variant="tonal"
                  icon="mdi-refresh"
                  @click="getSmugglersReportList"
                  :loading="smugglersReportListLoading">
              </v-btn>
            </div>
          </div>
        </v-card>

        <!-- 列表内容展示 -->
        <div v-if="smugglersReportListData.length > 0" class="d-flex flex-column ga-3">
          <v-card
              v-for="(i, index) in smugglersReportListData"
              :key="i.id || index"
              border
              rounded="lg"
              class="pa-4 hover-card transition-all">
            <div class="d-flex align-center justify-space-between flex-wrap ga-3">
              <div class="d-flex align-center flex-grow-1 min-width-0">
                <v-avatar size="44" rounded="lg" color="surface-variant" class="mr-3 flex-shrink-0">
                  <v-icon size="24" color="amber">mdi-trophy-award</v-icon>
                </v-avatar>

                <div class="min-width-0 flex-grow-1">
                  <h3 class="text-body-1 font-weight-bold singe-line mb-1">{{ i.title }}</h3>
                  <div class="d-flex align-center flex-wrap ga-2 text-caption opacity-60">
                  <span class="d-flex align-center">
                    <v-icon size="14" class="mr-1">mdi-comment-outline</v-icon>
                    {{ i.commentCount || 0 }} 条评论
                  </span>
                    <v-divider vertical class="mx-1"></v-divider>
                    <span class="d-flex align-center">
                    <v-icon size="14" class="mr-1">mdi-calendar-range</v-icon>
                    <TimeView :time="i.startTime"><Time :time="i.startTime"></Time></TimeView>
                    &nbsp;~&nbsp;
                    <TimeView :time="i.endTime"><Time :time="i.endTime"></Time></TimeView>
                  </span>
                  </div>
                </div>
              </div>

              <!-- 右侧操作栏 -->
              <div class="d-flex align-center ga-2 flex-shrink-0">
                <v-btn
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-pencil"
                    @click="openSmugglersReportModel(i)">
                  {{ t('smugglersReport.account.editReport') }}
                </v-btn>

                <v-btn
                    size="small"
                    variant="tonal"
                    color="amber"
                    :prepend-icon="i.isUserComment ? 'mdi-comment-edit-outline' : 'mdi-comment-plus-outline'"
                    @click="openCommendModel(i)">
                  {{ i.isUserComment ? t('smugglersReport.account.viewComment') : t('smugglersReport.account.createComment') }}
                </v-btn>
              </div>
            </div>
          </v-card>
        </div>

        <div class="text-center py-12" v-else>
          <EmptyView></EmptyView>
        </div>
      </div>
      <!-- 具备鉴赏家权限时的周报管理列表 E -->

      <template v-slot:title>
        {{ t('account.mySmugglersReport') }}
      </template>
    </AffixBoxHasTitleView>


    <!-- 周报数据编辑/创建对话框 S -->
    <v-dialog v-model="smugglersReportModel" max-width="1024">
      <v-card border rounded="lg">
        <v-card-title class="pa-4 font-weight-bold d-flex align-center justify-space-between border-b">
          <span>{{ t('smugglersReport.account.createWeeklyTitle') }}</span>
          <v-btn variant="tonal" density="compact" icon="mdi-close" @click="smugglersReportModel = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <v-row class="mb-2">
            <v-col cols="12" md="8">
              <v-text-field
                  v-model="createSmugglersReportData.title"
                  label="周报标题"
                  variant="outlined"
                  density="compact"
                  hide-details>
              </v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <TimeFrame
                  v-model="createSmugglersReportData.startAndEnd"
                  :placeholder="createSmugglersReportData.startAndEnd">
              </TimeFrame>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="7">
              <v-card border rounded="lg" max-height="450px" class="overflow-y-auto pa-2">
                <SmugglersReportShowItemWidget :data="createSmugglersReportData.content"></SmugglersReportShowItemWidget>
              </v-card>
            </v-col>
            <v-col cols="12" md="5">
              <v-card border rounded="lg" class="pa-2 h-100">
                <SmugglersReportEditor v-model="createSmugglersReportData.content"></SmugglersReportEditor>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

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
    <v-dialog v-model="commentModel" max-width="1024">
      <v-card border rounded="lg">
        <v-card-title class="pa-4 font-weight-bold d-flex align-center justify-space-between border-b">
          <span>{{ t('smugglersReport.account.createReviewTitle') }}</span>
          <v-btn variant="tonal" density="compact" icon="mdi-close" @click="commentModel = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-card border rounded="lg" max-height="400px" class="overflow-y-auto pa-2">
                <SmugglersReportShowItemWidget :data="selectedSmugglersReport.content"></SmugglersReportShowItemWidget>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
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
        </v-card-text>

        <v-card-actions class="pa-4 border-t">
          <v-btn
              v-if="commentModelIsEdit"
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
  transition: border-color 0.2s ease;

  &:hover {
    border-color: rgba(255, 193, 7, 0.4);
  }
}
</style>
