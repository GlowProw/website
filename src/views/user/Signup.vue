<script setup lang="ts">
import {Ref, ref} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";

import Captcha from "@/components/captcha/index.vue";
import {useRules} from "@/assets/sripts/rules_user"
import {useUserApi} from "@/assets/sripts/api";
import {ApiError} from "@/assets/types/Api";

const router = useRouter(),
    noticeStore = useNoticeStore(),
    {t} = useI18n(),
    notice = useNoticeStore(),
    userApi = useUserApi(),
    rules = useRules()

let signupLoading: Ref<boolean> = ref(false),
    signupStyle = ref({
      hintCol: 6,
      inputCol: 6,
    }),

    // 注册表单
    signupFrom = ref({
      username: '',
      alternativeName: '',
      password: '',
      email: '',
      captcha: ''
    })

/**
 * 注册
 */
const onRegister = async () => {
  try {
    signupLoading.value = true;

    const result = await userApi.signup({
          username: signupFrom.value.username,
          alternativeName: signupFrom.value.alternativeName || signupFrom.value.username,
          password: signupFrom.value.password,
          email: signupFrom.value.email,
          captcha: signupFrom.value.captcha,
        }),
        d = result.data;

    noticeStore.success(t(`basic.tips.${d.code}`))

    setTimeout(async () => {
      await router.push('/account/signin')
    }, 1000)
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    signupLoading.value = false;
  }
}

/**
 * 处理验证码数据
 * @param data
 */
const onCaptchaData = (data: any) => {
  signupFrom.value.captcha = data;
}
</script>

<template>
  <div class="background-img-flavor">
    <v-container class="mt-10 signup">
      <v-card dense variant="flat" class="mt-10 signup-box card-enlargement-flavor">
        <h1 class="pl-8 pt-5 pb-5 background-flavor">{{ t('signup.title') }}</h1>

        <v-row class="pa-8">
          <v-col>
            <v-row>
              <v-col order="1" order-sm="1" order-lg="1" cols="12" sm="12" :lg="signupStyle.hintCol">
                <b>{{ t('signup.username.name') }}</b>
                <p class="text-caption text-grey opacity-80">{{ t('signup.username.hint') }}</p>
              </v-col>
              <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="signupStyle.inputCol">
                <v-text-field v-model="signupFrom.username"
                              :rules="rules.username"
                              clearable
                              variant="solo-filled"
                              min-length="3"
                              max-length="40"
                              :placeholder="t('signup.username.placeholder')">
                </v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col order="1" order-sm="1" order-lg="1" cols="12" sm="12" :lg="signupStyle.hintCol">
                <b>{{ t('signup.alternativeName.name') }}</b>
                <p class="text-caption text-grey opacity-80">{{ t('signup.alternativeName.hint') }}</p>
              </v-col>
              <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="signupStyle.inputCol">
                <v-text-field v-model="signupFrom.alternativeName"
                              :rules="rules.alternativeName"
                              name="alternativeName"
                              variant="solo-filled"
                              class="mb-2"
                              clearable
                              :placeholder="t('signup.alternativeName.placeholder')">
                </v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col order="1" order-sm="1" order-lg="1" cols="12" sm="12" :lg="signupStyle.hintCol">
              </v-col>
              <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="signupStyle.inputCol">
                <v-text-field v-model="signupFrom.password"
                              :rules="rules.password"
                              variant="solo-filled"
                              type="password"
                              clearable
                              min-length="8"
                              max-length="64"
                              :placeholder="t('signin.form.placeholder.password')">
                  <template v-slot:details>
                    {{ t('signup.password.hint') }}
                  </template>
                </v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col order="1" order-sm="1" order-lg="1" cols="12" sm="12" :lg="signupStyle.hintCol">
                <b>{{ t('signup.email.name') }}</b>
                <p class="text-caption text-grey opacity-80">{{ t('signup.email.hint') }}</p>
              </v-col>
              <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="signupStyle.inputCol">
                <v-text-field v-model="signupFrom.email"
                              :rules="rules.email"
                              :label="t('signup.email.name')"
                              variant="solo-filled"
                              :placeholder="t('signup.email.hint')">
                </v-text-field>
              </v-col>
            </v-row>

            <v-row class="mt-5">
              <v-col order="1" order-sm="1" order-lg="1" cols="12" sm="12" :lg="signupStyle.hintCol">
              </v-col>
              <v-col order="2" order-sm="2" order-lg="2" cols="12" sm="12" :lg="signupStyle.inputCol">
                <Captcha @getCaptchaData="onCaptchaData"
                         :rules="rules.captcha"
                         type="svg" class="captcha"></Captcha>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <v-card-actions class="pr-8 pl-8">
          <v-spacer></v-spacer>
          <v-btn class="btn-flavor ml-8 mb-5" size="50" :loading="signupLoading" @click="onRegister" :disabled="!signupFrom.username && !signupFrom.password">
            {{ t('signup.register') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped lang="less">
.signup {
  h1 {
    color: var(--main-color);
  }

  .signup-box {
    max-width: 1020px;
    margin: 30px auto;
  }

  .captcha {
    width: 300px;
  }
}
</style>
