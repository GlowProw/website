<script setup lang="ts">
import axios from "axios";

import {ref} from "vue";
import {useAuthStore} from '../../../stores'
import {useRouter} from "vue-router";

import Captcha from "../../components/captcha/index.vue";
import {api, http} from "../../assets/sripts";

const authStore = useAuthStore(),
    router = useRouter();

let username = ref(''),
    password = ref(''),
    captcha = ref({});

const onLogin = async () => {

  const result = await http.post(api['account_login'], {
        username: username.value,
        password: password.value,
        captcha: captcha.value,
      }),
      d = result.data;

  if (d.code == 0) {
    authStore.setAccountToken(d.data)
    router.push('/')
  }
}

const onCaptchaData = (data: any) => {
  console.log(data)
  captcha.value = data;
}
</script>

<template>
  <v-container class="mt-10">
    <v-card dense variant="elevated" class="mt-10 pa-5">
      <v-row>
        <v-col>
          <v-text-field v-model="username"></v-text-field>
          <v-text-field v-model="password"></v-text-field>

          <Captcha @getCaptchaData="onCaptchaData" type="svg"></Captcha>
        </v-col>
      </v-row>

      <v-btn-group>
        <v-btn @click="onLogin" variant="flat">登陆</v-btn>
        <v-btn to="/account/register" variant="text">注册</v-btn>
      </v-btn-group>
    </v-card>
  </v-container>
</template>

<style scoped>

</style>
