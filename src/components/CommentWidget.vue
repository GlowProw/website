<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {apis} from "@/assets/sripts/index";

import {useAuthStore} from "~/stores/userAccountStore";
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
import type {commentTargetType} from "@/assets/types/Comment";

const route = useRoute(),
    authStore = useAuthStore(),
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
    commentListData = ref<any[]>([]),
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
 * 获取评论列表数据
 */
const getComment = async () => {
  if (!props.id) return;
  try {
    commentLoading.value = true

    const result = await apis.commentApi().getComments({
          targetId: props.id,
          targetType: props.type,
        }),
        d = result.data;

    commentListData.value = Array.isArray(d?.data?.data)
        ? d.data.data
        : (Array.isArray(d?.data) ? d.data : []);
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
  if (!props.id || hasLoaded.value || !isVisible.value) return;
  hasLoaded.value = true;
  getComment();
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
 * 发布评论
 */
const onPushComment = async () => {
  try {
    if (!content.value || commentPushLoading.value)
      return;

    if (!isCaptchaValid.value) {
      notice.warning(t('captcha.messages.bad') || '请先完成人机验证');
      return;
    }

    if (!props.id || !props.type)
      return console.log('not id', props)

    commentPushLoading.value = true

    const result = await apis.commentApi().createComment({
          targetId: props.id,
          targetType: props.type,
          content: content.value,
          captcha: captcha.value as any,
        }),
        d = result.data;

    // 审查结果决定是否落地展示，被拒时弹窗说明原因
    const review = d.data?.review
    const accepted = notifyReviewResult(review, notice, t)

    if (accepted) {
      commentListData.value.push({
        id: d.data.id,
        username: 'Me',
        createdTime: new Date(),
        content: content.value
      })

      content.value = ''
      captcha.value = {}
      captchaOneUpdateEvent.value = false
      captchaRef.value?.refreshCaptcha?.()

      if (!review || review.status === 'approved')
        notice.success('basic.tips.comment.ok')
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'CommentWidget'})
  } finally {
    commentPushLoading.value = false
  }
}

/**
 * 删除评论
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

    notice.success(t(`basic.tips.${d.code}`))
  } catch (e) {
    handleApiError(e, notice, t, {component: 'CommentWidget'})
  } finally {
    data.deleteLoading = false
  }
}

/**
 * 编辑评论
 */
const onEditComment = async (data: any) => {
  try {
    if (!data.content && !data.id)
      return;

    data.loading = true

    const result = await apis.commentApi().editComment(data.id, {
          content: data.content
        }),
        d = result.data;

    const review = d.data?.review
    if (notifyReviewResult(review, notice, t)) {
      data.content = data.editContent;
      if (!review || review.status === 'approved')
        notice.success(t(`basic.tips.${d.code}`))
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'CommentWidget'})
  } finally {
    data.isEdit = !data.isEdit;
    data.loading = false
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
            <div>
              <v-row class="mb-1">
                <v-col>
                  <div class="u font-weight-bold">{{ i.username }}</div>
                </v-col>
                <v-spacer></v-spacer>
                <v-col cols="auto" v-if="i.createdTime">
                  <TimeView :time="i.createdTime"></TimeView>
                </v-col>
              </v-row>
              <v-chip v-if="Number(i.reviewStatus) === 1 || Number(i.reviewStatus) === 2"
                      size="x-small"
                      :color="Number(i.reviewStatus) === 1 ? 'amber' : 'red'"
                      variant="tonal"
                      class="mb-2">
                {{ Number(i.reviewStatus) === 1 ? t('basic.review.pendingTitle') : t('basic.review.rejectedTitle') }}
              </v-chip>
              <v-card variant="text" class="px-0 pb-2" :class="[i.isEdit ? 'mt-5' : '']">
                <Textarea :model-value="i.content" :min-height="'80px'"
                          :placeholder="props.placeholder"
                          :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                          :readonly="true" v-if="!i.isEdit"></Textarea>
                <Textarea v-model="i.editContent" :min-height="'80px'"
                          :placeholder="props.placeholder"
                          :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                          :readonly="false" v-else></Textarea>
              </v-card>

              <v-row class="mt-2">
                <v-col class="d-flex ga-2">
                  <template v-if="authStore.isLogin && authStore.user.userId == i.userId">
                    <template v-if="!i.isEdit">
                      <v-btn @click="i.isEdit = true; i.editContent = i.content">
                        {{ t('basic.button.edit') }}
                      </v-btn>
                    </template>
                    <template v-else>
                      <v-btn :loading="i.loading" @click="onEditComment(i)">
                        {{ t('basic.button.save') }}
                      </v-btn>
                      <v-btn @click="i.isEdit = false">
                        {{ t('basic.button.cancel') }}
                      </v-btn>
                    </template>
                  </template>
                </v-col>
                <v-spacer></v-spacer>
                <v-col cols="auto">
                  <template v-if="authStore.isLogin && authStore.user.userId == i.userId">
                    <v-btn variant="text" prepend-icon="mdi-delete-outline" class="text-red"
                           :loading="i.deleteLoading"
                           :title="t('basic.delete')"
                           @click="onDeleteComment(i)">
                      {{ t('basic.button.delete') }}
                    </v-btn>
                  </template>
                </v-col>
              </v-row>
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

    <AffixContainerView :offset-bottom="5">
      <v-card border variant="text" class="pa-2" v-if="authStore.isLogin">
        <Textarea v-model="content"
                  :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate', 'lang']"
                  :placeholder="props.placeholder"></Textarea>
        <v-row no-gutters align="end">
          <v-col>
            <Captcha @getCaptchaData="onCaptchaData" class="captcha" ref="captchaRef"></Captcha>
          </v-col>
          <v-spacer></v-spacer>
          <v-col>
            <v-btn size="55" class="bg-amber text-black" :max-width="150" block
                   :loading="commentPushLoading"
                   :disabled="!content || !isCaptchaValid"
                   @click="onPushComment">
              {{ t('basic.button.submit') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
      <v-alert v-else>
        {{ t('comment.loginRequired') }}
        <template v-slot:append>
          <router-link :to="`/account/signin?backUrl=${route.path}`">
            <v-btn>{{ t('signin.title') }}</v-btn>
          </router-link>
        </template>
      </v-alert>
    </AffixContainerView>
  </div>
</template>

<style scoped lang="less">

</style>
