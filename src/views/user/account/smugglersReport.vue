<script setup lang="ts">
import {onMounted, ref} from "vue";
import {apis} from "@/assets/sripts/index";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";
import {useI18n} from "vue-i18n";
import {useAuthStore} from "~/stores/userAccountStore";

import SmugglersReportShowItemWidget from "@/components/SmugglersReportShowItemWidget.vue";
import SmugglersReportEditor from "@/components/SmugglersReportEditor.vue"
import Textarea from "@/components/textarea/index.vue";
import TimeFrame from "@/components/TimeFrame.vue";
import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue";

const notice = useNoticeStore(),
    {t} = useI18n(),
    authStore = useAuthStore()

let isHasSmugglersReportPrivilege = ref(false),
    checkPermissionLoading = ref(false),
    smugglersReportModel = ref(false),
    smugglersReportModelIsEdit = ref(false), // 是否编辑
    commentModelIsEdit = ref(false), // 是否编辑
    commentModel = ref(false),
    createSmugglersReportLoading = ref(false),
    createCommentLoading = ref(false),
    smugglersReportListLoading = ref(false),
    smugglersReportListPagination = ref({
      page: 1,
      pageSize: 6
    }),
    // 周报列表数据
    smugglersReportListData = ref({}),
    // 选择周报
    selectedSmugglersReport = ref({
      id: '',
      content: ''
    }),
    // 提交周报 评论数据
    smugglersReportComment = ref({
      content: ''
    }),
    // 创建周报数据表
    createSmugglersReportData = ref({
      title: '',
      startAndEnd: '',
      content: {
        // 当季物品
        inSeason: [],
        // 每周物品
        weekly: [],
        // 常见
        common: []
      }
    })

onMounted(async () => {
  await getCheckUserPermission()
  await getSmugglersReportList()
})

/**
 * 检查用户权限
 */
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
        ]),
        d = result.data;

    isHasSmugglersReportPrivilege.value = d.data.hasPrivilege || false;
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    checkPermissionLoading.value = false
  }
}

/**
 * 获取报告列表
 */
const getSmugglersReportList = async () => {
  try {
    if (!isHasSmugglersReportPrivilege.value) return

    smugglersReportListLoading.value = true

    const result = await apis.smugglersApi().getReports({
          ...smugglersReportListPagination.value
        }),
        d = result.data;

    smugglersReportListData.value = d.data;
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    smugglersReportListLoading.value = false
  }
}

/**
 * 创建报告
 */
const onCreateSmugglersReport = async () => {
  try {
    createSmugglersReportLoading.value = true

    const {title, content, startAndEnd} = createSmugglersReportData.value;

    let startAndEndTime = startAndEnd.toString().split(','),
        startTime = startAndEndTime[0],
        endTime = startAndEndTime[1]

    const result = await apis.smugglersApi().createReport({
          title,
          content,
          startTime,
          endTime,
          status: 'published'
        }),
        d = result.data;

    await getSmugglersReportList()
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    createSmugglersReportLoading.value = false
  }
}

/**
 * 编辑报告
 */
const onEditSmugglersReport = async () => {
  try {
    createSmugglersReportLoading.value = true

    const {title, content, id: reportId} = createSmugglersReportData.value;

    const result = await apis.smugglersApi().updateReport(reportId, {
          title,
          content,
          status: 'published'
        }),
        d = result.data;

    await getSmugglersReportList()
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    createSmugglersReportLoading.value = false
    smugglersReportModel.value = false
  }
}

/**
 * 删除周报
 */
const onDeleteSmugglersReport = async (i) => {
  try {
    createCommentLoading.value = true

    const result = await apis.smugglersApi().deleteReport(i.id),
        d = result.data;

    await getSmugglersReportList()
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    createCommentLoading.value = false
  }
}

/**
 * 打开周报模版
 */
const openSmugglersReportModel = (reportData: any | null) => {
  smugglersReportModel.value = true


  if (reportData) {
    // 编辑
    smugglersReportModelIsEdit.value = true

    createSmugglersReportData.value = reportData
    createSmugglersReportData.value.startAndEnd = `${reportData.startTime},${reportData.endTime}`
  } else {
    // 创建
    smugglersReportModelIsEdit.value = false
  }
}

/**
 * 打开评论模版
 */
const openCommendModel = (reportData: any | null) => {
  commentModel.value = true

  if (reportData.isUserComment) {
    // 编辑
    commentModelIsEdit.value = true

    selectedSmugglersReport.value = reportData
    smugglersReportComment.value.content = reportData.userComment.content ?? ''
  } else {
    // 创建
    commentModelIsEdit.value = false
  }
}

/**
 * 创建评论
 */
const onCreateCommend = async () => {
  try {
    createCommentLoading.value = true

    const reportId = selectedSmugglersReport.value.id;

    if (!reportId) return

    const result = await apis.smugglersApi().addReportComment(reportId, {
          content: smugglersReportComment.value.content as string
        }),
        d = result.data;

    await getSmugglersReportList()
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    createCommentLoading.value = false
    commentModel.value = false
  }
}

/**
 * 编辑评论
 */
const onEditCommend = async () => {
  try {
    createCommentLoading.value = true

    const reportId = selectedSmugglersReport.value.id,
        commentId = selectedSmugglersReport.value?.userComment.id

    if (!reportId) return

    const result = await apis.smugglersApi().editReportComment(reportId, commentId, {
          content: smugglersReportComment.value.content as string
        }),
        d = result.data;

    await getSmugglersReportList()
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    createCommentLoading.value = false
    commentModel.value = false
  }
}

/**
 * 删除评论
 */
const onDeleteComment = async () => {
  try {
    createCommentLoading.value = true

    const reportId = selectedSmugglersReport.value.id;

    if (!reportId) return

    const result = await apis.smugglersApi().delReportComment(reportId),
        d = result.data;

    await getSmugglersReportList()
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    createCommentLoading.value = false
    commentModel.value = false
  }
}
</script>

<template>
  <v-card border class="mb-5 py-5 px-10" v-if="!isHasSmugglersReportPrivilege">
    <div class="text-center mx-10">
      <div class="mb-n16 opacity-20">
        <v-icon size="250">mdi-trophy-award</v-icon>
      </div>

      <h1 class="mb-3 text-amber" style="z-index: 10; position: relative">走私犯线人每周鉴赏家</h1>
      <p class="text-caption opacity-60">走私贩鉴赏家，专精每周市场动态，为每件稀有物品撰写深度评测与选购指南，让每位船长都能精准锁定价值巅峰的珍宝，不再错失任何一次财富机遇。在这里，您不仅是信息的传递者，更是社群中备受信赖的潮流引领者——成为众人瞩目的焦点，赢得万千玩家的追随与赞誉。</p>
      <p class="text-caption opacity-60">成为走私犯鉴赏家，你的账号获得'走私犯鉴赏家'身份，并且允许在走私犯线人下评论推荐物品</p>
    </div>

    <v-divider class="my-10"></v-divider>

    <div>
      <p class="text-caption opacity-60">申请条件：在不同媒体平台拥有不少订阅者 或 大众玩家推举成员</p>
      <p class="text-caption opacity-60">申请方式：点击下方申请按钮</p>
    </div>

    <v-card-actions class="mt-3">
      <v-spacer></v-spacer>
      <div class="d-flex ga-2">
        <v-btn to="/smugglers-report/view">查看当前周报</v-btn>
        <v-btn variant="tonal">申请</v-btn>
      </div>
    </v-card-actions>
  </v-card>

  <div v-if="isHasSmugglersReportPrivilege">
    <v-row class="mb-1">
      <v-spacer></v-spacer>
      <v-col cols="auto">
        <v-btn to="/smugglers-report/view">查看当前周报</v-btn>
      </v-col>
      <v-divider vertical inset></v-divider>
      <v-col cols="auto" v-if="authStore.isLogin && authStore.checkPrivilegeGroup(authStore.user?.privilege,['smugglersReportConnoisseur', 'admin','super' ,'dev'])">
        <v-btn class="bg-amber" @click="openSmugglersReportModel">创建每周物品数据</v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn @click="getSmugglersReportList">
          <v-icon icon="mdi-refresh" :class="[smugglersReportListLoading ? 'spin-icon-load' : '']"></v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <v-list border rounded lines="one">
      <v-list-item v-for="(i,index) in smugglersReportListData" :key="index">
        <template v-slot:prepend>
          <v-icon size="40">mdi-trophy-award</v-icon>
        </template>
        <v-list-item-title>{{ i.title }}</v-list-item-title>
        <v-list-item-subtitle>
          <div class="d-flex text-caption opacity-60">
            <v-icon>mdi-comment</v-icon>
            <p class="ml-2">
              {{ i?.commentCount || 0 }}
            </p>

            <v-divider vertical class="mx-2"></v-divider>

            <v-icon>mdi-clipboard-text-clock</v-icon>
            <p class="ml-2">
              <TimeView :time="i.startTime">
                <Time :time="i.startTime"></Time>
              </TimeView>
              -
              <TimeView :time="i.endTime">
                <Time :time="i.endTime"></Time>
              </TimeView>
            </p>
          </div>
        </v-list-item-subtitle>

        <template v-slot:append>
          <div class="d-flex ga-2">
            <v-btn @click="openSmugglersReportModel(i)">编辑周报</v-btn>
            <v-btn @click="openCommendModel(i)">{{ i.isUserComment ? '查看' : '创建' }}评论</v-btn>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </div>

  <!-- 走私犯物品数据 S -->
  <v-dialog v-model="smugglersReportModel">
    <v-container>
      <v-card max-height="80vh" class="overflow-y-auto">
        <v-card-title>创建走私犯每周数据</v-card-title>
        <v-divider></v-divider>

        <v-card-text>
          <v-row>
            <v-col>
              <v-text-field v-model="createSmugglersReportData.title"></v-text-field>
            </v-col>
            <v-col cols="3">
              <TimeFrame v-model="createSmugglersReportData.startAndEnd"
                         :placeholder="createSmugglersReportData.startAndEnd"></TimeFrame>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="7">
              <v-card variant="text" max-height="50vh" class="overflow-y-auto">
                <SmugglersReportShowItemWidget :data="createSmugglersReportData.content"></SmugglersReportShowItemWidget>
              </v-card>
            </v-col>
            <v-col cols="5">
              <SmugglersReportEditor v-model="createSmugglersReportData.content"></SmugglersReportEditor>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions>
          <v-btn @click="onDeleteSmugglersReport(createSmugglersReportData)" v-if="smugglersReportModelIsEdit">删除周报</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="smugglersReportModel = !smugglersReportModel">取消</v-btn>
          <v-btn @click="smugglersReportModelIsEdit ? onEditSmugglersReport() : onCreateSmugglersReport()" :loading="createSmugglersReportLoading">创建</v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </v-dialog>
  <!-- 走私犯物品数据 E -->

  <!-- 走私犯物品评论 S -->
  <v-dialog v-model="commentModel">
    <v-container>
      <v-card max-height="80vh" class="overflow-y-auto">
        <v-card-title>创建鉴赏</v-card-title>
        <v-divider></v-divider>

        <v-card-text>
          <v-row>
            <v-col cols="6">
              <v-card variant="text" max-height="50vh" class="overflow-y-auto">
                <SmugglersReportShowItemWidget :data="selectedSmugglersReport.content"></SmugglersReportShowItemWidget>
              </v-card>
            </v-col>
            <v-divider vertical></v-divider>
            <v-col cols="6">
              <v-alert class="mb-2">
                请不要发布与走私犯无关内容
              </v-alert>
              <Textarea
                  min-height="300px"
                  placeholder="输入你鉴赏推荐内容"
                  v-model="smugglersReportComment.content"></Textarea>
            </v-col>
          </v-row>

        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions>
          <v-btn @click="onDeleteComment" v-if="commentModelIsEdit">
            删除评论
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="commentModel = !commentModel">取消</v-btn>
          <v-btn @click="commentModelIsEdit ? onEditCommend : onCreateCommend">
            {{ commentModelIsEdit ? '编辑' : '创建' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </v-dialog>
  <!-- 走私犯物品评论 E -->

</template>

<style scoped lang="less">
@import "@/assets/styles/icon";
</style>
