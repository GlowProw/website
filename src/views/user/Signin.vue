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

const authStore = useAuthStore(),
    router = useRouter(),
    route = useRoute(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    rules = useRules()

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

    if (route.query.backurl)
      return await router.push(route.query.backurl as string)

    await router.push('/')
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === 'signin.notActivated') {
        notice.error(t(`basic.tips.signin.${e.code}`))
        setTimeout(() => {
          router.push({
            path: '/account/activate',
            query: {username: signinFrom.value.username}
          })
        }, 1500)
        return
      }

      notice.error(t(`basic.tips.signin.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    signinFormLoading.value = false
  }
}

/**
 * 取消登陆返回上一层
 */
const onBackRoute = async () => {
  const backurl = route.query.backurl as string || '';
  const backUrl = route.query.backUrl as string || '';

  if (backurl || backUrl)
    return router.push({path: backurl || backUrl})

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
  <div class="background-img-flavor">
    <v-container class="mt-10 signin">
      <v-card dense flat class="mt-10 signin-card card-enlargement-flavor">
        <h1 class="pl-8 pt-5 pb-5 background-flavor">{{ t('signin.title') }}</h1>

        <v-card border class="bg-black mx-8 my-5">
          <v-row class="pa-8">
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

              <Captcha @getCaptchaData="onCaptchaData" type="svg" class="captcha"></Captcha>
            </v-col>
          </v-row>
        </v-card>

        <div class="my-4 mx-8">
          <v-btn class="bg-amber" @click="onLogin" size="50" block :loading="signinFormLoading" :disabled="!signinFrom.username && !signinFrom.password" variant="flat">
            {{ t('signin.title') }}
          </v-btn>

          <v-btn class="mt-2" @click="onBackRoute" size="50" block variant="text" v-if="route.query.backurl">{{ t('basic.button.cancel') }}</v-btn>
        </div>

        <v-card-actions class="px-8 d-flex justify-space-between align-center mb-5">
          <router-link to="/account/signup" class="u">
            {{ t('signin.newUserRegistrationHint') }}
          </router-link>
          <router-link to="/account/forgot-password" class="u">
            {{ t('forgotPassword.title') }}?
          </router-link>
        </v-card-actions>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.signin {
  h1 {
    color: var(--main-color);
  }

  .signin-card {
    max-width: 500px;
    margin: 30px auto;
  }

  .captcha {
    width: 300px;
  }
}
</style>
