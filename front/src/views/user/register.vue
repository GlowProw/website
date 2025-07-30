<script setup lang="ts">
import {ref} from "vue";
import {useRouter} from "vue-router";
import Captcha from "../../components/captcha/index.vue";
import {api, http} from "../../assets/sripts";
import {useI18n} from "vue-i18n";

const router = useRouter(),
    {t} = useI18n();

let messages = ref([]),
    username = ref(''),
    password = ref(''),
    email = ref(''),
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
            email: email.value,
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
  <div class="background-img-flavor">
    <v-container class="mt-10 register">
      <v-card dense variant="flat" class="mt-10 register-box card-enlargement-flavor">
        <h1 class="pl-8 pt-5 pb-5 background-flavor">{{ t('register.title') }}</h1>

        <v-row class="pa-8">
          <v-col>
            <v-text-field v-model="username"
                          variant="solo-filled"
                          placeholder="帐号"></v-text-field>
            <v-text-field v-model="password"
                          variant="solo-filled"
                          placeholder="输入密码"></v-text-field>
            <div class="mb-10 mt-5">
              <p class="mb-2">可选</p>
              <v-text-field v-model="email"
                            label="邮箱"
                            variant="solo-filled"
                            placeholder="输入邮箱地址">
                <template v-slot:details>
                  可选邮箱，这将使得你的账户可寻回
                </template>
              </v-text-field>
            </div>
            <Captcha @getCaptchaData="onCaptchaData" type="svg" class="captcha"></Captcha>
          </v-col>
        </v-row>

        <v-btn class="btn-flavor ml-8 mb-5" size="50" @click="onRegister" :disabled="!username && !password">注册</v-btn>
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
