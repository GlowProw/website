<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {apis} from "@/assets/sripts/index";

import {useAuthStore} from "~/stores/userAccountStore";
import {useLikeStore} from "~/stores/likeStore";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";
import {notifyReviewResult} from "@/assets/sripts/review";

import Textarea from "@/components/textarea/index.vue"
import EmptyView from "@/components/EmptyView.vue";
import Captcha from "@/components/captcha/index.vue";
import TimeView from "@/components/TimeView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import {useIntersectionObserver} from "@/assets/sripts/intersection_observer";
import type {Comment, CommentReply, CommentSortType, commentTargetType} from "@/assets/types/Comment";
import UserAvatar from "./UserAvatar.vue";
import AccountCardWidget from "./AccountCardWidget.vue";

const route = useRoute(),
    authStore = useAuthStore(),
    likeStore = useLikeStore(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    props = withDefaults(defineProps<{
      id: string | number,
      type: commentTargetType,
      placeholder?: string
    }>(), {
      placeholder: ''
    })

// 评论输入文本内容
let content = ref(''),
    // 提交评论加载中状态
    commentPushLoading = ref(false),
    // 评论列表加载中状态
    commentLoading = ref(false),
    // 评论列表数据集合
    commentListData = ref<Comment[]>([]),
    // 排序模式：默认最新
    currentSort = ref<CommentSortType>('latest'),
    // 验证码参数对象
    captcha = ref({}),
    // 验证码首次触发标记
    captchaOneUpdateEvent = ref(false),
    // 验证码组件引用
    captchaRef = ref<any>(null),
    // 标记当前目标评论是否已加载
    hasLoaded = ref(false)

// 绑定最外层容器元素及视口可见状态
const {targetElement: commentWidgetWrapperRef, isVisible} = useIntersectionObserver({
  rootMargin: '100px',
})

/**
 * 校验评论验证码有效性
 */
const isCaptchaValid = computed(() => {
  const c = captcha.value as any;
  if (!c) return false;
  const type = c.captchaType || c.type || 'turnstile';
  if (type === 'svg') {
    return Boolean(c.encryptCaptcha && c.response && String(c.response).trim().length === 4);
  }
  return Boolean(c.response && String(c.response).trim().length > 5);
})

/**
 * 校验目标类型与目标ID是否有效，拦截 null/undefined 伪造字符串与空值
 */
const isValidTarget = computed(() => {
  const t = String(props.type || '').trim().toLowerCase();
  const id = String(props.id || '').trim().toLowerCase();
  return Boolean(
    t &&
    t !== 'null' &&
    t !== 'undefined' &&
    id &&
    id !== 'null' &&
    id !== 'undefined'
  );
});

/**
 * 获取评论列表数据
 */
const getComment = async () => {
  if (!isValidTarget.value) return;
  try {
    commentLoading.value = true

    const result = await apis.commentApi().getComments({
          targetId: props.id,
          targetType: props.type,
          sort: currentSort.value,
        }),
        d = result.data;

    const rawList = Array.isArray(d?.data?.data)
        ? d.data.data
        : (Array.isArray(d?.data) ? d.data : []);

    commentListData.value = rawList.map((c: any) => ({
      ...c,
      isEdit: false,
      editContent: c.content,
      showReplyInput: false,
      replyContent: '',
      replyPushLoading: false,
      previewReplies: c.previewReplies || [],
      paginatedReplies: [],
      isExpandedAll: false,
      replyPage: 1,
      replyPageSize: 10,
      replyTotalPages: Math.ceil((c.replyCount || 0) / 10),
      repliesLoading: false,
      likeLoading: false,
      deleteLoading: false,
    }));
  } catch (e) {
    handleApiError(e, notice, t, {component: 'CommentWidget'})
  } finally {
    commentLoading.value = false
  }
}

/**
 * 尝试按需加载评论数据
 */
const tryLoadComment = () => {
  if (!isValidTarget.value || hasLoaded.value || !isVisible.value) return;
  hasLoaded.value = true;
  getComment();
}

/**
 * 评论排序下拉选项
 */
const sortOptions = computed<{ label: string; value: CommentSortType }[]>(() => [
  { label: t('comment.sortLatest'), value: 'latest' },
  { label: t('comment.sortComposite'), value: 'composite' },
  { label: t('comment.sortHot'), value: 'hot' },
]);

/**
 * 切换排序规则
 */
const onSortChange = (newSort: any) => {
  if (newSort) {
    currentSort.value = newSort;
    getComment();
  }
}

// 监听元素可见状态，进入可视区域后触发评论加载
watch(() => isVisible.value, (visible) => {
  if (visible) {
    tryLoadComment();
  }
})

// 监听目标 ID 或类型变化，重置加载状态并按需重新拉取
watch(() => [props.id, props.type], () => {
  hasLoaded.value = false;
  commentListData.value = [];
  tryLoadComment();
})

// 输入字数达到阈值时刷新验证码
watch(() => content.value, (value) => {
  if (value && value.length >= 5 && !captchaOneUpdateEvent.value) {
    captchaOneUpdateEvent.value = true
    captchaRef.value?.refreshCaptcha?.()
  }
})

/**
 * 切换回复输入窗口：确保全局一次只展开一个，已展开的自动收起
 */
const onToggleReplyInput = (comment: Comment) => {
  if (!authStore.isLogin) {
    notice.warning(t('comment.loginRequired'));
    return;
  }
  const willOpen = !comment.showReplyInput;
  for (const c of commentListData.value) {
    c.showReplyInput = false;
  }
  comment.showReplyInput = willOpen;
}

/**
 * 发布主评论
 */
const onPushComment = async () => {
  try {
    if (!content.value || commentPushLoading.value)
      return;

    if (!isCaptchaValid.value) {
      notice.warning(t('captcha.messages.bad') || '请先完成人机验证');
      return;
    }

    if (!isValidTarget.value)
      return console.log('not id', props)

    commentPushLoading.value = true

    const result = await apis.commentApi().createComment({
          targetId: props.id,
          targetType: props.type,
          content: content.value,
          captcha: captcha.value as any,
        }),
        d = result.data;

    const review = d.data?.review
    const accepted = notifyReviewResult(review, notice, t)

    if (accepted) {
      commentListData.value.unshift({
        id: d.data.id,
        userId: authStore.user?.userId || '',
        username: authStore.user?.alternativeName || authStore.user?.username || t('comment.me'),
        createdTime: new Date().toISOString(),
        content: content.value,
        likeCount: 0,
        replyCount: 0,
        isLiked: false,
        isEdit: false,
        showReplyInput: false,
        previewReplies: [],
        paginatedReplies: [],
        isExpandedAll: false,
        replyPage: 1,
        replyPageSize: 10,
        replyTotalPages: 0,
      })

      content.value = ''
      captcha.value = {}
      captchaOneUpdateEvent.value = false
      captchaRef.value?.refreshCaptcha?.()

      if (!review || review.status === 'approved')
        notice.success(t('basic.tips.comment.ok') || t('comment.publishSuccess'))
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'CommentWidget'})
  } finally {
    commentPushLoading.value = false
  }
}

/**
 * 删除主评论
 */
const onDeleteComment = async (data: any) => {
  try {
    if (!data.id)
      return;

    data.deleteLoading = true

    const result = await apis.commentApi().deleteComment(data.id),
        d = result.data;

    if (d.error == 1)
      return

    await getComment()

    notice.success(t(`basic.tips.${d.code}`) || t('basic.delete'))
  } catch (e) {
    handleApiError(e, notice, t, {component: 'CommentWidget'})
  } finally {
    data.deleteLoading = false
  }
}

/**
 * 编辑主评论
 */
const onEditComment = async (data: any) => {
  try {
    if (!data.content && !data.id)
      return;

    data.loading = true

    const result = await apis.commentApi().editComment(data.id, {
          content: data.editContent
        }),
        d = result.data;

    const review = d.data?.review
    if (notifyReviewResult(review, notice, t)) {
      data.content = data.editContent;
      if (!review || review.status === 'approved')
        notice.success(t(`basic.tips.${d.code}`) || t('comment.publishSuccess'))
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'CommentWidget'})
  } finally {
    data.isEdit = false;
    data.loading = false
  }
}

/**
 * 展开所有回复（触发分页加载）
 */
const onExpandAllReplies = async (comment: Comment) => {
  comment.isExpandedAll = true;
  comment.replyPage = 1;
  await loadPaginatedReplies(comment);
}

/**
 * 收起所有回复（回到前3条预览）
 */
const onCollapseAllReplies = (comment: Comment) => {
  comment.isExpandedAll = false;
}

/**
 * 切换回复分页
 */
const onReplyPageChange = async (comment: Comment) => {
  await loadPaginatedReplies(comment);
}

/**
 * 加载分页回复数据（每页10条，按热度和发布日期排序）
 */
const loadPaginatedReplies = async (comment: Comment) => {
  try {
    comment.repliesLoading = true;
    const res = await apis.commentApi().getReplies({
      id: comment.id,
      sort: 'hot',
      page: comment.replyPage || 1,
      pageSize: 10,
    });
    const d = res.data;
    const items = Array.isArray(d?.data?.items)
        ? d.data.items
        : (Array.isArray(d?.data) ? d.data : []);
    comment.paginatedReplies = items.map((r: any) => ({
      ...r,
      isEdit: false,
      editContent: r.content,
      loading: false,
      likeLoading: false,
      deleteLoading: false,
    }));
    const total = d?.data?.pagination?.totalCount ?? comment.replyCount ?? 0;
    comment.replyCount = total;
    comment.replyTotalPages = Math.ceil(total / 10);
  } catch (e) {
    handleApiError(e, notice, t, { component: 'CommentWidget' });
  } finally {
    comment.repliesLoading = false;
  }
}

/**
 * 提交嵌套回复
 */
const onPushReply = async (comment: Comment) => {
  try {
    if (!comment.replyContent || comment.replyPushLoading) return;
    comment.replyPushLoading = true;

    const res = await apis.commentApi().createReply({
      commentId: comment.id,
      content: comment.replyContent,
    });
    const d = res.data;
    const review = d.data?.review;
    const accepted = notifyReviewResult(review, notice, t);

    if (accepted) {
      const newReply: CommentReply = {
        id: d.data.id,
        commentId: comment.id,
        userId: authStore.user?.userId || '',
        username: authStore.user?.alternativeName || authStore.user?.username || t('comment.me'),
        content: comment.replyContent,
        createdTime: new Date().toISOString(),
        likeCount: 0,
        isLiked: false,
        isEdit: false,
        editContent: comment.replyContent,
        loading: false,
        deleteLoading: false,
      };

      if (!comment.previewReplies) comment.previewReplies = [];
      comment.previewReplies.unshift(newReply);
      if (comment.previewReplies.length > 3 && !comment.isExpandedAll) {
        comment.previewReplies = comment.previewReplies.slice(0, 3);
      }

      if (comment.isExpandedAll) {
        if (!comment.paginatedReplies) comment.paginatedReplies = [];
        comment.paginatedReplies.unshift(newReply);
      }

      comment.replyCount = (comment.replyCount || 0) + 1;
      comment.replyTotalPages = Math.ceil((comment.replyCount || 1) / 10);
      comment.replyContent = '';
      comment.showReplyInput = false;

      if (!review || review.status === 'approved') {
        notice.success(t('comment.replySuccess'));
      }
    }
  } catch (e) {
    handleApiError(e, notice, t, { component: 'CommentWidget' });
  } finally {
    comment.replyPushLoading = false;
  }
}

/**
 * 编辑回复
 */
const onEditReply = async (reply: CommentReply) => {
  try {
    if (!reply.editContent || !reply.id || reply.loading) return;
    reply.loading = true;

    const res = await apis.commentApi().editReply(reply.id, {
      content: reply.editContent,
    });
    const d = res.data;
    const review = d.data?.review;

    if (notifyReviewResult(review, notice, t)) {
      reply.content = reply.editContent;
      reply.isEdit = false;
      if (!review || review.status === 'approved') {
        notice.success(t(`basic.tips.${d.code}`) || t('comment.publishSuccess'));
      }
    }
  } catch (e) {
    handleApiError(e, notice, t, { component: 'CommentWidget' });
  } finally {
    reply.loading = false;
  }
}

/**
 * 删除回复
 */
const onDeleteReply = async (comment: Comment, reply: CommentReply) => {
  try {
    if (!reply.id || reply.deleteLoading) return;
    reply.deleteLoading = true;

    const res = await apis.commentApi().deleteReply(reply.id);
    const d = res.data;
    if (d.error == 1) return;

    if (comment.previewReplies) {
      comment.previewReplies = comment.previewReplies.filter((r) => r.id !== reply.id);
    }
    if (comment.paginatedReplies) {
      comment.paginatedReplies = comment.paginatedReplies.filter((r) => r.id !== reply.id);
    }
    comment.replyCount = Math.max(0, (comment.replyCount || 1) - 1);
    comment.replyTotalPages = Math.ceil(comment.replyCount / 10);

    notice.success(t(`basic.tips.${d.code}`) || t('basic.delete'));
  } catch (e) {
    handleApiError(e, notice, t, { component: 'CommentWidget' });
  } finally {
    reply.deleteLoading = false;
  }
}

/**
 * 点赞/取消点赞处理（支持评论与回复）
 */
const onToggleLike = async (item: any, targetType: 'comment' | 'reply') => {
  if (!authStore.isLogin) {
    notice.warning(t('comment.loginRequired'));
    return;
  }
  if (item.likeLoading) return;
  item.likeLoading = true;

  const originalIsLiked = Boolean(item.isLiked);
  const originalLikeCount = Number(item.likeCount || 0);

  // 乐观更新界面显示
  item.isLiked = !originalIsLiked;
  item.likeCount = originalIsLiked ? Math.max(0, originalLikeCount - 1) : originalLikeCount + 1;

  try {
    const res = await likeStore.toggleLike(authStore.user?.userId || '', targetType, item.id);
    item.isLiked = res;
  } catch (e: any) {
    item.isLiked = originalIsLiked;
    item.likeCount = originalLikeCount;
    handleApiError(e, notice, t, { component: 'CommentWidget' });
  } finally {
    item.likeLoading = false;
  }
}

/**
 * 处理验证码数据
 * @param data
 */
const onCaptchaData = (data: any) => {
  captcha.value = data;
}

/**
 * 获取验证码响应凭证
 */
const getCaptchaResponse = () => (captcha.value as any).response

defineExpose({
  getCaptchaResponse,
  onCaptchaData,
})

defineOptions({
  name: "CommentWidget"
})
</script>

<template>
  <div class="comment-widget-wrapper" ref="commentWidgetWrapperRef">
    <v-card variant="text" class="mb-5" v-if="authStore.isLogin">
      <Textarea v-model="content"
                :disabled="!authStore.isLogin"
                :maxlength="5000"
                :min-height="'120px'"
                :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate', 'lang']"
                :placeholder="!authStore.isLogin ? t('comment.loginRequired') : props.placeholder"></Textarea>
      <v-row no-gutters align="end">
        <v-col>
          <Captcha @getCaptchaData="onCaptchaData" class="captcha" ref="captchaRef" v-if="authStore.isLogin"></Captcha>
        </v-col>
        <v-spacer></v-spacer>
        <v-col>
          <v-btn size="55" class="bg-amber text-black" :max-width="150" block
                  :loading="commentPushLoading"
                  :disabled="!authStore.isLogin || (!content || !isCaptchaValid)"
                  @click="onPushComment">
            {{ t('basic.button.submit') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
    <v-alert v-else class="mb-5 bg-surface" variant="text">
      {{ t('comment.loginRequired') }}
      <template v-slot:append>
        <router-link :to="`/account/signin?backUrl=${route.path}`">
          <v-btn>{{ t('signin.title') }}</v-btn>
        </router-link>
      </template>
    </v-alert>

    <!-- 评论筛选与统计头部 S -->
    <AffixContainerView>
      <v-card class="comment-header d-flex align-center justify-space-between px-3 py-2 flex-wrap ga-2">
        <div class="d-flex align-center ga-2">
          <span class="text-subtitle-1 font-weight-bold">{{ t('comment.title') }}</span>
          <v-chip size="small" variant="tonal" color="amber">{{ commentListData.length }}</v-chip>
        </div>

        <div style="min-width: 120px; max-width: 140px;">
          <v-select
              v-model="currentSort"
              :items="sortOptions"
              item-title="label"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              color="amber"
              @update:model-value="onSortChange"></v-select>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- 评论筛选与统计头部 E -->

    <!-- 评论时间轴 S -->
    <div class="comment-widget">
      <v-progress-linear v-if="commentLoading" indeterminate color="amber" class="mb-4 rounded"></v-progress-linear>
      <v-timeline
          density="compact"
          side="end"
          v-if="commentListData && commentListData.length > 0">
        <v-timeline-item
            dot-color="orange"
            class="w-100"
            min-width="100%"
            size="large"
            fill-dot
            v-for="(i,index) in commentListData" :key="index">
          <template v-slot:icon>
            <v-icon icon="mdi-message"></v-icon>
          </template>

          <template v-slot:default>
            <div class="comment-card-item">
              <v-row class="mb-1" no-gutters align="center">
                <v-col>
                  <div class="font-weight-bold d-flex align-center ga-2">
                    <UserAvatar :src="i.userAvatar" :size="32"></UserAvatar>
                    <AccountCardWidget :id="i.userId">{{ i.username }}</AccountCardWidget>
                    <v-chip v-if="authStore.user?.userId == i.userId" size="x-small" color="amber" variant="tonal">{{ t('comment.me') }}</v-chip>
                  </div>
                </v-col>
                <v-col cols="auto" class="d-flex align-center ga-2" v-if="i.createdTime">
                  <TimeView :time="i.createdTime" relative></TimeView>
                  <!-- 评论作者编辑/删除按钮：移动到顶部，桌面端悬停显示，移动端始终显示 -->
                  <div v-if="authStore.isLogin && authStore.user?.userId == i.userId && !i.isEdit"
                       class="comment-hover-actions d-flex align-center ga-1">
                    <v-btn size="x-small" variant="text" prepend-icon="mdi-pencil-outline" @click="i.isEdit = true; i.editContent = i.content">
                      {{ t('basic.button.edit') }}
                    </v-btn>
                    <v-btn size="x-small" variant="text" color="red" prepend-icon="mdi-delete-outline"
                           :loading="i.deleteLoading"
                           :title="t('basic.delete')"
                           @click="onDeleteComment(i)">
                      {{ t('basic.button.delete') }}
                    </v-btn>
                  </div>
                </v-col>
              </v-row>

              <v-chip v-if="Number(i.reviewStatus) === 1 || Number(i.reviewStatus) === 2"
                      size="x-small"
                      :color="Number(i.reviewStatus) === 1 ? 'amber' : 'red'"
                      variant="tonal"
                      class="mb-2">
                {{ Number(i.reviewStatus) === 1 ? t('basic.review.pendingTitle') : t('basic.review.rejectedTitle') }}
              </v-chip>

              <v-card variant="text" class="px-0 pb-2" :class="[i.isEdit ? 'mt-3' : '']">
                <Textarea :model-value="i.content" :min-height="'auto'"
                          :placeholder="props.placeholder"
                          :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                          :readonly="true" v-if="!i.isEdit"></Textarea>
                <div v-else>
                  <Textarea v-model="i.editContent" :min-height="'auto'"
                            :maxlength="5000"
                            :placeholder="props.placeholder"
                            :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                            :readonly="false"></Textarea>
                  <div class="d-flex justify-end ga-2 mt-2">
                    <v-btn size="small" variant="text" @click="i.isEdit = false">{{ t('basic.button.cancel') }}</v-btn>
                    <v-btn size="small" color="amber" class="text-black" :loading="i.loading" @click="onEditComment(i)">{{ t('basic.button.save') }}</v-btn>
                  </div>
                </div>
              </v-card>

              <!-- 操作栏：点赞、回复 S -->
              <div class="d-flex align-center justify-space-between flex-wrap ga-2 mt-2">
                <div class="d-flex align-center ga-1">
                  <!-- 点赞按钮 -->
                  <v-btn size="small" variant="flat"
                         :class="i.isLiked ? 'text-red font-weight-bold' : 'text-medium-emphasis'"
                         :prepend-icon="i.isLiked ? 'mdi-heart' : 'mdi-heart-outline'"
                         :loading="i.likeLoading"
                         @click="onToggleLike(i, 'comment')">
                    {{ i.likeCount || 0 }}
                  </v-btn>

                  <!-- 回复按钮：单开窗口模式 -->
                  <v-btn size="small" variant="tonal" color="amber"
                         @click="onToggleReplyInput(i)">
                    {{ t('comment.reply') }}
                  </v-btn>
                </div>
              </div>
              <!-- 操作栏 E -->

              <!-- 嵌套回复输入框 S -->
              <v-card v-if="i.showReplyInput" class="mt-3 pa-2 bg-grey-darken-4 rounded" border>
                <Textarea v-model="i.replyContent" 
                          :placeholder="`${t('comment.reply')} @${i.username} ${t('comment.replyPlaceholder')}`"
                          :min-height="'60px'" :maxlength="5000"
                          :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"></Textarea>
                <div class="d-flex justify-end ga-2 mt-2">
                  <v-btn size="small" variant="text" @click="i.showReplyInput = false">{{ t('basic.button.cancel') }}</v-btn>
                  <v-btn size="small" color="amber" class="text-black"
                         :loading="i.replyPushLoading"
                         :disabled="!i.replyContent"
                         @click="onPushReply(i)">
                    {{ t('basic.button.submit') }}
                  </v-btn>
                </div>
              </v-card>
              <!-- 嵌套回复输入框 E -->

              <!-- 嵌套回复展示列表 S (有回复则默认直接展示，无回复不显示该卡片) -->
              <div v-if="i.replyCount && i.replyCount > 0" class="replies-wrapper rounded-lg mt-3 px-3 py-1">
                <v-progress-linear v-if="i.repliesLoading" indeterminate color="amber" height="2" class="mb-2"></v-progress-linear>

                <!-- 回复列表渲染（未展开所有时直接渲染前3条；展开所有时渲染分页列表） -->
                <div v-for="(reply, rIndex) in (i.isExpandedAll ? (i.paginatedReplies || []) : (i.previewReplies || []))" :key="reply.id || rIndex" class="reply-item py-4">
                  <div class="d-flex align-center justify-space-between mb-1">
                    <div class="text-subtitle-2 font-weight-bold d-flex align-center ga-2">
                      <UserAvatar :src="reply.userAvatar" :size="24"></UserAvatar>
                      <AccountCardWidget :id="reply.userId">{{ reply.username }}</AccountCardWidget>
                      <v-chip v-if="authStore.user?.userId == reply.userId" size="x-small" color="amber" variant="tonal">{{ t('comment.me') }}</v-chip>
                    </div>
                    <div class="d-flex align-center ga-2">
                      <span class="text-subtitle-2"><TimeView v-if="reply.createdTime" :time="reply.createdTime" relative></TimeView></span>
                      <!-- 回复作者操作：移动到顶部，桌面端悬停显示，移动端始终显示 -->
                      <div v-if="authStore.isLogin && authStore.user?.userId == reply.userId && !reply.isEdit"
                           class="reply-hover-actions d-flex align-center ga-1">
                        <v-btn size="x-small" variant="text" prepend-icon="mdi-pencil-outline" @click="reply.isEdit = true; reply.editContent = reply.content">
                          {{ t('basic.button.edit') }}
                        </v-btn>
                        <v-btn size="x-small" variant="text" color="red" prepend-icon="mdi-delete-outline"
                               :loading="reply.deleteLoading"
                               @click="onDeleteReply(i, reply)">
                          {{ t('basic.button.delete') }}
                        </v-btn>
                      </div>
                    </div>
                  </div>

                  <div class="reply-content">
                    <Textarea v-if="!reply.isEdit" :model-value="reply.content" :readonly="true" :min-height="'40px'" :toolbar="[]"></Textarea>
                    <div v-else class="mt-1">
                      <Textarea v-model="reply.editContent" :min-height="'60px'" :maxlength="5000" :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"></Textarea>
                      <div class="d-flex justify-end ga-2 mt-1">
                        <v-btn size="small" variant="text" @click="reply.isEdit = false">{{ t('basic.button.cancel') }}</v-btn>
                        <v-btn size="small" color="amber" class="text-black" :loading="reply.loading" :disabled="!reply.editContent" @click="onEditReply(reply)">{{ t('basic.button.save') }}</v-btn>
                      </div>
                    </div>
                  </div>

                  <div class="d-flex align-center justify-space-between mt-1">
                    <div class="d-flex align-center ga-1">
                      <!-- 回复点赞 -->
                      <v-btn size="x-small" variant="text"
                             :class="reply.isLiked ? 'text-red font-weight-bold' : 'text-medium-emphasis'"
                             :prepend-icon="reply.isLiked ? 'mdi-heart' : 'mdi-heart-outline'"
                             :loading="reply.likeLoading"
                             @click="onToggleLike(reply, 'reply')">
                        {{ reply.likeCount || 0 }}
                      </v-btn>
                    </div>
                  </div>
                </div>

                <!-- 大于3条时：尾部显示“展开所有”；展开后显示分页及“收起回复” -->
                <div v-if="!i.isExpandedAll && i.replyCount > 3" class="d-flex align-center pt-1 pb-1">
                  <v-btn size="small" variant="text" color="amber" density="compact" class="font-weight-medium px-1 text-caption"
                         prepend-icon="mdi-chevron-down"
                         :loading="i.repliesLoading"
                         @click="onExpandAllReplies(i)">
                    {{ t('comment.expandAllReplies', { count: i.replyCount }) }}
                  </v-btn>
                </div>

                <div v-else-if="i.isExpandedAll" class="d-flex align-center justify-space-between flex-wrap ga-2 pt-2 pb-1 border-t-sm border-opacity-25 mt-1">
                  <v-pagination v-if="i.replyTotalPages && i.replyTotalPages > 1"
                                v-model="i.replyPage"
                                :length="i.replyTotalPages"
                                density="compact"
                                size="small"
                                total-visible="5"
                                @update:model-value="onReplyPageChange(i)"></v-pagination>
                  <v-spacer v-else></v-spacer>
                  <v-btn size="small" variant="text" color="medium-emphasis" density="compact" class="text-caption px-1"
                         prepend-icon="mdi-chevron-up"
                         @click="onCollapseAllReplies(i)">
                    {{ t('comment.collapseReplies') }}
                  </v-btn>
                </div>
              </div>
              <!-- 嵌套回复展示列表 E -->

            </div>
          </template>
        </v-timeline-item>
      </v-timeline>
      <template v-else-if="!commentLoading">
        <div class="pt-10 pb-10">
          <EmptyView :title="t('comment.noComments')" :description="t('comment.beFirst')"></EmptyView>
        </div>
      </template>
    </div>
    <!-- 评论时间轴 E -->
  </div>
</template>

<style scoped lang="less">
.replies-wrapper {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
}

.reply-item + .reply-item {
  border-top: 1px solid rgba(255, 255, 255, 0.03);
}

.comment-hover-actions,
.reply-hover-actions {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.comment-card-item:hover .comment-hover-actions,
.reply-item:hover .reply-hover-actions {
  opacity: 1;
}

@media (hover: none), (pointer: coarse), (max-width: 768px) {
  .comment-hover-actions,
  .reply-hover-actions {
    opacity: 1 !important;
  }
}

:deep(.v-timeline-item:last-child .v-timeline-divider__after) {
  display: none !important;
}
</style>
