<script setup lang="ts">
import {Ref, ref} from "vue";
import {useAuthStore} from '~/stores/userAccountStore'
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";

import Captcha from "@/components/captcha/index.vue";
import {useRules} from "@/assets/sripts/rules_user"
import {SigninParams} from "@/assets/types/User.Login";
import {apis} from "@/assets/sripts";
import {ApiError} from "@/assets/types/Api";
import {CaptchaParams} from "@/assets/types/Captcha";
import {handleApiError} from "@/assets/sripts/error_handler";
import { log } from "console";
import Logo from "@/components/Logo.vue";
import {useDisplay} from "vuetify/framework";
import Silk from "@/components/Silk.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const authStore = useAuthStore(),
    router = useRouter(),
    route = useRoute(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    rules = useRules(),
    {mobile, sm} = useDisplay()

let signinFormLoading: Ref<boolean> = ref(false),

    // 登陆表单
    signinFrom: Ref<SigninParams> = ref({
      username: '',
      password: '',
      captcha: {
        encryptCaptcha: '',
        response: ''
      }
    })

/**
 * 登陆
 */
const onLogin = async () => {
  try {
    signinFormLoading.value = true

    const result = await apis.userApi().signin({
          username: signinFrom.value.username,
          password: signinFrom.value.password,
          captcha: signinFrom.value.captcha,
        }),
        d = result.data;

    authStore.setAccountToken(d.data)

    const targetBackUrl = (route.query.backUrl || route.query.backurl) as string;
    if (targetBackUrl) {
      return await router.push(targetBackUrl);
    }

    await router.push('/')
  } catch (e) {
    console.log(e)
    if (e instanceof ApiError && e.code === 'signin.notActivated') {
      handleApiError(e, notice, t, { component: 'Signin', tPrefix: 'basic.tips' })
      setTimeout(() => {
        router.push({
          path: '/account/activate',
          query: {username: signinFrom.value.username}
        })
      }, 1500)
      return
    }
    handleApiError(e, notice, t, { component: 'Signin', tPrefix: 'basic.tips' })
  } finally {
    signinFormLoading.value = false
  }
}

/**
 * 取消登陆返回上一层
 */
const onBackRoute = async () => {
  const backUrl = (route.query.backUrl || route.query.backurl) as string || '';

  if (backUrl)
    return router.push({path: backUrl})

  return router.go(-1)
}

/**
 * 处理验证码数据
 * @param data
 */
const onCaptchaData = (data: CaptchaParams) => {
  signinFrom.value.captcha = data;
}
</script>

<template>
  <div class="signin-window">
    <v-row dense class="h-100">
      <v-col cols="12" lg="6" :class="{'d-none': mobile || sm}" class="position-relative overflow-hidden">
        <Silk
            :speed="3"
            :scale=".7"
            :color="'#1c1c1c'"
            :noise-intensity="0.1"
            :rotation="-.2"
            class="bg-black">
        </Silk>
      </v-col>
      <v-col cols="12" lg="6" class="bg-black">
        <v-card dense variant="text" class="signin mt-16 px-8">
          <v-breadcrumbs class="ml-n3">
            <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
            <v-breadcrumbs-divider></v-breadcrumbs-divider>
            <v-breadcrumbs-item>{{ t('signin.title') }}</v-breadcrumbs-item>
          </v-breadcrumbs>

          <AffixContainerView>
            <v-row class="py-2">
              <v-col>
                <v-text-field v-model="signinFrom.username"
                              :rules="rules.username"
                              name="username"
                              variant="solo-filled"
                              prepend-inner-icon="mdi-account-key"
                              :label="t('signin.form.label.username')"
                              :placeholder="t('signin.form.placeholder.username')"></v-text-field>
                <v-text-field v-model="signinFrom.password"
                              :rules="rules.password"
                              name="password"
                              variant="solo-filled"
                              prepend-inner-icon="mdi-form-textbox-password"
                              :label="t('signin.form.label.password')"
                              :placeholder="t('signin.form.placeholder.password')"
                              type="password"></v-text-field>

                <Captcha @getCaptchaData="onCaptchaData" class="captcha"></Captcha>
              </v-col>
            </v-row>

            <div class="py-2">
              <v-btn class="bg-amber" @click="onLogin" size="50" block :loading="signinFormLoading" :disabled="!signinFrom.username && !signinFrom.password" variant="flat">
                {{ t('signin.title') }}
              </v-btn>

              <v-btn class="mt-2" @click="onBackRoute" size="50" block variant="text" v-if="route.query.backUrl || route.query.backurl">{{ t('basic.button.cancel') }}</v-btn>
            </div>

            <v-card-actions class="py-2 d-flex justify-space-between align-center mb-5">
              <router-link to="/account/signup" class="u">
                {{ t('signin.newUserRegistrationHint') }}
              </router-link>
              <router-link to="/account/forgot-password" class="u">
                {{ t('forgotPassword.title') }}?
              </router-link>
            </v-card-actions>
          </AffixContainerView>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.signin-window {
  overflow: hidden;
  min-height: calc(100vh + 2px);
  margin-bottom: -4px;
}

.signin {
  .captcha {
    width: 300px;
  }
}
</style>
