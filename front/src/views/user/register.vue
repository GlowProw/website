<script setup lang="ts">
import {ref} from "vue";
import {useRouter} from "vue-router";
import Captcha from "@/components/captcha/index.vue";
import {api, http} from "@/assets/sripts";
import {useI18n} from "vue-i18n";

const router = useRouter(),
    {t} = useI18n();

let registerLoading = ref(false),
    registerRules = ref({
      username: [
        v => !!v || '必须填写用户名',
        v => (v && v.length >= 3 && v.length <= 40) || '长度3-40',
        v => new RegExp(/^[a-zA-Z0-9_]+$/).test(v) || '用户名格式不正确',
      ],
      password: [
        v => !!v || '必须填写密码',
        v => (v && v.length >= 8 && v.length <= 60) || '长度8-60',
      ],
      email: [
        v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '邮箱格式不正确'
      ],
      captcha: [
        v => !!v || '必须填写验证码',
        v => (v && v.length == 4) || '长度4',
      ]
    }),
    messages = ref([]),
    username = ref(''),
    password = ref(''),
    email = ref(''),
    captcha = ref({});

/**
 * 注册
 */
const onRegister = async () => {
  try {
    registerLoading.value = true;
    const result = await http.post(api['account_register'], {
          data: {
            username: username.value,
            password: password.value,
            email: email.value,
            captcha: captcha.value,
          }
        }),
        d = result.data;

    if (d.error == 1) {
      return Error(d)
    }

    messages.value.push({
      text: t('basic.tips.register_ok'),
      color: 'success'
    });

    setTimeout(async () => {
      await router.push('/account/login')
    }, 1000)
  } catch (e) {
    if (e instanceof Error)
      messages.value.push(t(`basic.tips.${e.response.data.code}`, {
        context: e.response.data.code
      }))
  } finally {
    registerLoading.value = false;
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
  <div class="background-img-flavor">
    <v-container class="mt-10 register">
      <v-card dense variant="flat" class="mt-10 register-box card-enlargement-flavor">
        <h1 class="pl-8 pt-5 pb-5 background-flavor">{{ t('register.title') }}</h1>

        <v-row class="pa-8">
          <v-col>
            <v-text-field v-model="username"
                          :rules="registerRules.username"
                          variant="solo-filled"
                          min-length="3"
                          max-length="40"
                          placeholder="帐号">
              <template v-slot:details>
                至少3位到40位，使用a-z/A-Z/0-9/_来注册用户名
              </template>
            </v-text-field>
            <v-text-field v-model="password"
                          :rules="registerRules.password"
                          variant="solo-filled"
                          min-length="8"
                          max-length="64"
                          placeholder="输入密码">
              <template v-slot:details>
                至少8位到64位
              </template>
            </v-text-field>
            <div class="mb-10 mt-5">
              <p class="mb-2">可选</p>
              <v-text-field v-model="email"
                            :rules="registerRules.email"
                            label="邮箱"
                            variant="solo-filled"
                            placeholder="输入邮箱地址">
                <template v-slot:details>
                  可选邮箱，这将使得你的账户可寻回
                </template>
              </v-text-field>
            </div>
            <Captcha @getCaptchaData="onCaptchaData"
                     :rules="registerRules.captcha"
                     type="svg" class="captcha"></Captcha>
          </v-col>
        </v-row>

        <v-btn class="btn-flavor ml-8 mb-5" size="50" :loading="registerLoading" @click="onRegister" :disabled="!username && !password">注册</v-btn>
      </v-card>
    </v-container>
  </div>

  <v-snackbar-queue v-model="messages"></v-snackbar-queue>
</template>

<style scoped lang="less">
.register {
  h1 {
    color: var(--main-color);
  }

  .register-box {
    max-width: 500px;
    margin: 30px auto;
  }

  .captcha {
    width: 300px;
  }
}
</style>
