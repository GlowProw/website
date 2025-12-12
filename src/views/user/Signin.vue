<script setup lang="ts">
import {Ref, ref} from "vue";
import {useAuthStore} from '~/stores/userAccountStore'
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";

import Captcha from "@/components/captcha/index.vue";
import {useRules} from "@/assets/sripts/rules_user"
import {SigninParams} from "@/assets/types/User.Login";
import {useUserApi} from "@/assets/sripts/api";
import {ApiError} from "@/assets/types/Api";

const authStore = useAuthStore(),
    router = useRouter(),
    route = useRoute(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    {signin} = useUserApi(),
    rules = useRules()

let signinFormLoading: Ref<boolean> = ref(false),

    // 登陆表单
    signinFrom: Ref<SigninParams> = ref({
      username: '',
      password: '',
      captcha: {}
    })

/**
 * 登陆
 */
const onLogin = async () => {
  try {
    signinFormLoading.value = true

    const result = await signin({
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
      notice.error(t(`basic.tips.${e.code}`, {
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
  const {backurl = '', backUrl = ''} = route.query

  if (backurl || backUrl)
    return router.push({path: backurl || backUrl})

  return router.go(-1)
}

/**
 * 处理验证码数据
 * @param data
 */
const onCaptchaData = (data: any) => {
  signinFrom.value.captcha = data;
}
</script>

<template>
  <div class="background-img-flavor">
    <v-container class="mt-10 signin">
      <v-card dense flat class="mt-10 signin-card card-enlargement-flavor">
        <h1 class="pl-8 pt-5 pb-5 background-flavor">{{ t('signin.title') }}</h1>

        <v-row class="pa-8">
          <v-col>
            <v-text-field v-model="signinFrom.username"
                          :rules="rules.username"
                          name="username"
                          variant="solo-filled"
                          :label="t('signin.form.label.username')"
                          :placeholder="t('signin.form.placeholder.username')"></v-text-field>
            <v-text-field v-model="signinFrom.password"
                          :rules="rules.password"
                          name="password"
                          variant="solo-filled"
                          :label="t('signin.form.label.password')"
                          :placeholder="t('signin.form.placeholder.password')"
                          type="password"></v-text-field>

            <Captcha @getCaptchaData="onCaptchaData" type="svg" class="captcha"></Captcha>
          </v-col>
        </v-row>

        <div class="mt-10 ml-8 mr-8">
          <v-btn class="bg-amber" @click="onLogin" size="50" block :loading="signinFormLoading" :disabled="!signinFrom.username && !signinFrom.password" variant="flat">
            {{ t('signin.title') }}
          </v-btn>

          <v-btn class="mt-2" @click="onBackRoute" size="50" block variant="text" v-if="route.query.backurl">{{ t('basic.button.cancel') }}</v-btn>
        </div>

        <v-divider class="mt-5 mb-5"></v-divider>
        <v-btn class="ml-8 mb-5" to="/account/signup" variant="text">
          {{ t('signin.newUserRegistrationHint') }}
        </v-btn>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped>
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
