<script setup lang="ts">
import {ref} from "vue";
import {useAuthStore} from '../../../stores'
import {useRoute, useRouter} from "vue-router";

import Captcha from "@/components/captcha/index.vue";
import {api, http} from "@/assets/sripts";
import {useI18n} from "vue-i18n";

const authStore = useAuthStore(),
    router = useRouter(),
    route = useRoute(),
    {t} = useI18n();

let messages = ref([]),

    loginFormLoading = ref(false),

    // 登陆表单
    username = ref(''),
    password = ref(''),
    captcha = ref({});

/**
 * 登陆
 */
const onLogin = async () => {
  try {
    loginFormLoading.value = true
    const result = await http.post(api['account_login'], {
          data: {
            username: username.value,
            password: password.value,
            captcha: captcha.value,
          }
        }),
        d = result.data;

    if (d.error == 1)
      return Error(d.message)

    authStore.setAccountToken(d.data)

    if (route.query.backurl)
      return await router.push(route.query.backurl as string)

    await router.push('/')
  } catch (e) {
    if (e instanceof Error)
      messages.value.push(e.message)
  } finally {
    loginFormLoading.value = false
  }
}

/**
 * 取消登陆返回上一层
 */
const onBackRoute = async () => {
  const {backurl} = route.query

  if (backurl)
    return router.push({path: backurl})

  return router.go(-1);
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
  <div class="background-img-flavor">
    <v-container class="mt-10 login">
      <v-card dense flat class="mt-10 login-card card-enlargement-flavor">
        <h1 class="pl-8 pt-5 pb-5 background-flavor">{{ t('login.title') }}</h1>

        <v-row class="pa-8">
          <v-col>
            <v-text-field v-model="username"
                          name="username"
                          variant="solo-filled"
                          :label="t('login.form.label.username')"
                          :placeholder="t('login.form.placeholder.username')"></v-text-field>
            <v-text-field v-model="password"
                          name="password"
                          variant="solo-filled"
                          :label="t('login.form.label.password')"
                          :placeholder="t('login.form.placeholder.password')"
                          type="password"></v-text-field>

            <Captcha @getCaptchaData="onCaptchaData" type="svg" class="captcha"></Captcha>
          </v-col>
        </v-row>

        <div class="mt-10 ml-8 mr-8">
          <v-btn class="bg-amber" @click="onLogin" size="50" block :loading="loginFormLoading" :disabled="!username && !password" variant="flat">登陆</v-btn>

          <v-btn class="mt-2" @click="onBackRoute" size="50" block variant="text" v-if="route.query.backurl">取消</v-btn>
        </div>

        <v-divider class="mt-5 mb-5"></v-divider>
        <v-btn class="ml-8 mb-5" to="/account/register" variant="text">没有账户？前往注册</v-btn>
      </v-card>
    </v-container>
  </div>

  <v-snackbar-queue v-model="messages"></v-snackbar-queue>
</template>

<style scoped>
.login {
  h1 {
    color: var(--main-color);
  }

  .login-card {
    max-width: 500px;
    margin: 30px auto;
  }

  .captcha {
    width: 300px;
  }
}
</style>
