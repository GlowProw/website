<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {api, http} from "@/assets/sripts/index";

import Textarea from "@/components/textarea"
import EmptyView from "@/components/EmptyView.vue";
import {useHttpToken} from "@/assets/sripts/httpUtil";
import Captcha from "@/components/captcha/index.vue";
import {useAuthStore} from "~/stores";
import {AxiosError} from "axios";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";

type commentTargetType = 'assembly' | 'item' | 'ship' | 'ultimate' | 'mod'

const route = useRoute(),
    authStore = useAuthStore(),
    httpToKen = useHttpToken(),
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
    messages = ref([])

watch(() => props.id, () => {
  getComment()
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
    const result = await http.get(api['comments'], {
          params: {
            targetId: props.id,
            targetType: props.type,
          }
        }),
        d = result.data;

    if (d.error == 1)
      return

    commentListData.value = d.data.data;
  } catch (e) {

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

    commentPushLoading.value = true

    const result = await httpToKen.post(api['comment'], {
          data: {
            targetId: props.id,
            targetType: props.type,
            content: content.value,
            captcha: captcha.value,
          }
        }),
        d = result.data;

    if (d.error == 1)
      return

    commentListData.value.push({
      id: d.data.id,
      username: 'Me',
      createdTime: new Date(),
      content: content.value
    })

    messages.value.push('comment.ok')
  } catch (e) {
    messages.value.push(e.toString())
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

    const result = await httpToKen.post(api['comment_delete'], {
          data: {
            id: data.id,
          }
        }),
        d = result.data;

    if (d.error == 1)
      return

    await getComment()
    messages.value.push(t(`basic.tips.${e.response.data.code}`))
  } catch (e) {
    if (e instanceof AxiosError)
      messages.value.push({
        text: t(`basic.tips.${e.response.data.code}`, {
          content: e.response.data.message
        }),
        color: 'red'
      })
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

    const result = await httpToKen.post(api['comment_edit'], {
          data: {
            id: data.id,
            content: data.editContent,
          }
        }),
        d = result.data;

    if (d.error == 1)
      return

    data.content = data.editContent;
    messages.value.push(t(`basic.tips.${e.response.data.code}`))
  } catch (e) {
    if (e instanceof AxiosError)
      messages.value.push({
        text: t(`basic.tips.${e.response.data.code}`, {
          content: e.response.data.message
        }),
        color: 'red'
      })
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
                  {{ new Date(i.createdTime).toLocaleString() }}
                </template>
              </v-col>
            </v-row>
            <v-card border class="pl-3 pr-3 pb-2" :class="[i.isEdit ? 'pt-2' : '']">
              <Textarea :model-value="i.content" :height="'80px'" :readonly="true" v-if="!i.isEdit"></Textarea>
              <Textarea v-model="i.editContent" :height="'80px'" :readonly="false" v-else></Textarea>
            </v-card>

            <v-row class="mt-2">
              <v-col class="d-flex ga-2">
                <template v-if="authStore.isLogin && authStore.user.userId == i.userId">
                  <template v-if="!i.isEdit">
                    <v-btn @click="i.isEdit = true; i.editContent = i.content">
                      编辑
                    </v-btn>
                  </template>
                  <template v-else>
                    <v-btn :loading="i.loading" @click="onEditComment(i)">
                      保存
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
                  <v-btn variant="text" icon="mdi-delete-outline" class="text-red"
                         :loading="i.deleteLoading"
                         @click="onDeleteComment(i)">
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
        <EmptyView></EmptyView>
      </div>
    </template>
  </div>

  <v-card border class="pa-2" v-if="authStore.isLogin">
    <Textarea v-model="content" :placeholder="props.placeholder"></Textarea>

    <v-row no-gutters>
      <v-col>
        <Captcha @getCaptchaData="onCaptchaData" type="svg" class="captcha"></Captcha>
      </v-col>
      <v-spacer></v-spacer>
      <v-col>
        <v-btn size="55" :max-width="150" block :loading="commentPushLoading" :disabled="!content && !captcha && !captcha.response" @click="onPushComment">确认</v-btn>
      </v-col>
    </v-row>
  </v-card>
  <v-alert v-else>
    请登陆发布评论
    <template v-slot:append>
      <router-link :to="`/account/login?backurl=${route.path}`">
        <v-btn>登陆</v-btn>
      </router-link>
    </template>
  </v-alert>

  <v-snackbar-queue v-model="messages"></v-snackbar-queue>
</template>

<style scoped lang="less">

</style>
