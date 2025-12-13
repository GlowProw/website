<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {apis} from "@/assets/sripts/index";

import {useAuthStore} from "~/stores/userAccountStore";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {ApiError} from "@/assets/types/Api";

import Textarea from "@/components/textarea"
import EmptyView from "@/components/EmptyView.vue";
import Captcha from "@/components/captcha/index.vue";
import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue";

type commentTargetType = 'assembly' | 'item' | 'commoditie' | 'ship' | 'ultimate' | 'mod' | 'material' | 'set' | 'treasureMap'

const route = useRoute(),
    authStore = useAuthStore(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    props = withDefaults(defineProps<{
      id: string,
      type: commentTargetType,
      placeholder: string
    }>(), {})

let content = ref(''),
    commentPushLoading = ref(false),
    commentLoading = ref(false),
    commentListData = ref([]),
    captcha = ref({}),
    captchaOneUpdateEvent = ref(false),
    captchaRef = ref(null)

watch(() => props.id, () => {
  if (props.id)
    getComment()
})

watch(() => content.value, (value) => {
  if (value && value.length >= 5 && !captchaOneUpdateEvent.value) {
    captchaOneUpdateEvent.value = true
    captchaRef.value.refreshCaptcha()
  }
})

onMounted(() => {
  getComment()
})

/**
 * 获取评论
 */
const getComment = async () => {
  try {
    commentLoading.value = true

    const result = await apis.commentApi().getComments({
          targetId: props.id,
          targetType: props.type,
        }),
        d = result.data;

    commentListData.value = d.data.data;
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.response.data.message
      }))
    }
    console.error(e)
  } finally {
    commentLoading.value = false
  }
}

/**
 * 发布评论
 */
const onPushComment = async () => {
  try {
    if (!content.value && commentPushLoading.value)
      return;

    if (!props.id || !props.type)
      return console.log('not id', props)

    commentPushLoading.value = true

    const result = await apis.commentApi().createComment({
          targetId: props.id,
          targetType: props.type,
          content: content.value,
          captcha: captcha.value,
        }),
        d = result.data;

    commentListData.value.push({
      id: d.data.id,
      username: 'Me',
      createdTime: new Date(),
      content: content.value
    })

    notice.success('comment.ok')
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.response.data.message
      }))
    }
    console.error(e)
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
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.response.data.message
      }))
    }
    console.error(e)
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

    data.content = data.editContent;
    notice.success(t(`basic.tips.${d.code}`))
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.response.data.message
      }))
    }
    console.error(e)
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
</script>

<template>
  <div class="mt-n3 w-100">
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
                <b>{{ i.username }}</b>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="auto">
                <template v-if="i.createdTime">
                  <TimeView :time="i.createdTime">
                    <Time :time="i.createdTime"></Time>
                  </TimeView>
                </template>
              </v-col>
            </v-row>
            <v-card border class="pl-3 pr-3 pb-2" :class="[i.isEdit ? 'pt-2' : '']">
              <Textarea :model-value="i.content" :height="'80px'"
                        :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                        :readonly="true" v-if="!i.isEdit"></Textarea>
              <Textarea v-model="i.editContent" :height="'80px'"
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
    <template v-else>
      <div class="pt-10 pb-10">
        <EmptyView :title="t('comment.noComments')" :description="t('comment.beFirst')"></EmptyView>
      </div>
    </template>
  </div>

  <v-card border class="pa-2" v-if="authStore.isLogin">
    <Textarea v-model="content"
              :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
              :placeholder="props.placeholder"></Textarea>

    <v-row no-gutters>
      <v-col>
        <Captcha @getCaptchaData="onCaptchaData" type="svg" class="captcha" ref="captchaRef"></Captcha>
      </v-col>
      <v-spacer></v-spacer>
      <v-col>
        <v-btn size="55" class="bg-amber" :max-width="150" block
               :loading="commentPushLoading"
               :disabled="!content || !captcha && !captcha.response"
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
</template>

<style scoped lang="less">

</style>
