<script setup lang="ts">
import {ref} from "vue";
import {useAuthStore} from '../../../stores'
import {useRouter} from "vue-router";

import Captcha from "../../components/captcha/index.vue";
import {api, http} from "../../assets/sripts";

const authStore = useAuthStore(),
    router = useRouter();

let messages = ref([]),
    username = ref('cabbagelol'),
    password = ref('zsezse'),
    captcha = ref({});

/**
 * 登陆
 */
const onLogin = async () => {
  try {
    console.log(captcha.value)
    const result = await http.post(api['account_login'], {
          data: {
            username: username.value,
            password: password.value,
            captcha: captcha.value,
          }
        }),
        d = result.data;

    if (d.code != 0) {
      return Error(d.message)
    }

    authStore.setAccountToken(d.data)
    await router.push('/')
  } catch (e) {
    if (e instanceof Error)
      messages.value.push(e.message)
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
  <v-container class="mt-10">
    <v-card dense variant="elevated" class="mt-10 pa-5">
      <v-row>
        <v-col>
          <v-text-field v-model="username" placeholder="账户id"></v-text-field>
          <v-text-field v-model="password" placeholder="输入帐号密码"></v-text-field>

          <Captcha @getCaptchaData="onCaptchaData" type="svg"></Captcha>
        </v-col>
      </v-row>

      <v-btn @click="onLogin" :disabled="!username && !password" variant="flat">登陆</v-btn>
      <v-divider class="mt-5 mb-5"></v-divider>
      <v-btn to="/account/register" variant="text">没有账户？前往注册</v-btn>
    </v-card>
  </v-container>

  <v-snackbar-queue v-model="messages"></v-snackbar-queue>
</template>

<style scoped>

</style>
