<script setup lang="ts">
import {ref} from "vue";
import {useRouter} from "vue-router";
import Captcha from "../../components/captcha/index.vue";
import {api, http} from "../../assets/sripts";

const router = useRouter();

let messages = ref([]),
    username = ref(''),
    password = ref(''),
    captcha = ref({});

/**
 * 注册
 */
const onRegister = async () => {
  try {
    const result = await http.post(api['account_register'], {
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

    await router.push('/account/login')
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
    <v-card dense variant="flat" class="mt-10 pa-5">
      <v-row>
        <v-col>
          <v-text-field v-model="username" placeholder="帐号"></v-text-field>
          <v-text-field v-model="password" placeholder="输入密码"></v-text-field>

          <Captcha @getCaptchaData="onCaptchaData" type="svg"></Captcha>

          <v-btn @click="onRegister" :disabled="!username && !password">注册</v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-container>

  <v-snackbar-queue v-model="messages"></v-snackbar-queue>
</template>

<style scoped>

</style>
