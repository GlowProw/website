<script setup lang="ts">
import {ref, watch} from "vue";
import {useRouter} from "vue-router";
import Captcha from "@/components/captcha/index.vue";
import {api, http} from "@/assets/sripts";
import {useI18n} from "vue-i18n";

const router = useRouter(),
    {t} = useI18n();

let registerLoading = ref(false),
    registerRules = ref({
      username: [
        v => !!v || '必须填写用户名ID',
        v => (v && v.length >= 3 && v.length <= 40) || '长度3-40',
        v => new RegExp(/^[a-zA-Z0-9_]+$/).test(v) || '用户名ID格式不正确',
      ],
      alternativeName: [
        v => !v || (v && v.length >= 3 && v.length <= 40) || '长度3-40',
        v => !v || new RegExp(/^[a-zA-Z0-9_]+$/).test(v) || '账户名称格式不正确',
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
    registerStyle = ref({
      hintCol: 6,
      inputCol: 6,
    }),
    isUserInputAlternativeName = ref(false),
    messages = ref([]),

    // 注册表单
    username = ref(''),
    alternativeName = ref(''),
    password = ref(''),
    email = ref(''),
    captcha = ref({});

/**
 * 注册
 */
const onRegister = async () => {
  try {
    registerLoading.value = true;
    const result = await http.post(api['account_signup'], {
          data: {
            username: username.value,
            alternativeName: alternativeName.value || username.value,
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
        <h1 class="pl-8 pt-5 pb-5 background-flavor">{{ t('signup.title') }}</h1>

        <v-row class="pa-8">
          <v-col>
            <v-row>
              <v-col order="1" order-sm="1" order-lg="1" cols="12" sm="12" :lg="registerStyle.hintCol">
                <b>{{ t('signup.username.name') }}</b>
                <p class="text-caption text-grey opacity-80">{{ t('signup.username.hint') }}</p>
              </v-col>
              <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="registerStyle.inputCol">
                <v-text-field v-model="username"
                              :rules="registerRules.username"
                              clearable
                              variant="solo-filled"
                              min-length="3"
                              max-length="40"
                              :placeholder="t('signup.username.placeholder')">
                </v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col order="1" order-sm="1" order-lg="1" cols="12" sm="12" :lg="registerStyle.hintCol">
                <b>{{ t('signup.alternativeName.name') }}</b>
                <p class="text-caption text-grey opacity-80">{{ t('signup.alternativeName.hint') }}</p>
              </v-col>
              <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="registerStyle.inputCol">
                <v-text-field v-model="alternativeName"
                              :rules="registerRules.alternativeName"
                              name="alternativeName"
                              variant="solo-filled"
                              class="mb-2"
                              clearable
                              :placeholder="t('signup.alternativeName.placeholder')">
                </v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col order="1" order-sm="1" order-lg="1" cols="12" sm="12" :lg="registerStyle.hintCol">
              </v-col>
              <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="registerStyle.inputCol">
                <v-text-field v-model="password"
                              :rules="registerRules.password"
                              variant="solo-filled"
                              type="password"
                              clearable
                              min-length="8"
                              max-length="64"
                              placeholder="输入密码">
                  <template v-slot:details>
                    至少8位到64位
                  </template>
                </v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col order="1" order-sm="1" order-lg="1" cols="12" sm="12" :lg="registerStyle.hintCol">
                <b>{{ t('signup.email.name') }}</b>
                <p class="text-caption text-grey opacity-80">{{ t('signup.email.hint') }}</p>
              </v-col>
              <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="registerStyle.inputCol">
                <v-text-field v-model="email"
                              :rules="registerRules.email"
                              label="邮箱"
                              variant="solo-filled"
                              :placeholder="t('signup.email.hint')">
                </v-text-field>
              </v-col>
            </v-row>

            <v-row class="mt-5">
              <v-col order="1" order-sm="1" order-lg="1" cols="12" sm="12" :lg="registerStyle.hintCol">
              </v-col>
              <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="registerStyle.inputCol">
                <Captcha @getCaptchaData="onCaptchaData"
                         :rules="registerRules.captcha"
                         type="svg" class="captcha"></Captcha>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <v-card-actions class="pr-8 pl-8">
          <v-spacer></v-spacer>
          <v-btn class="btn-flavor ml-8 mb-5" size="50" :loading="registerLoading" @click="onRegister" :disabled="!username && !password">注册</v-btn>
        </v-card-actions>
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
    max-width: 1020px;
    margin: 30px auto;
  }

  .captcha {
    width: 300px;
  }
}
</style>
