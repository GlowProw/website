<script setup lang="ts">
import {Ref, ref} from "vue";
import {useRouter, useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {useDisplay} from "vuetify/framework";

import Captcha from "@/components/captcha/index.vue";
import {useRules} from "@/assets/sripts/rules_user"
import {apis} from "@/assets/sripts";
import {SignupParams} from "@/assets/types/User.Signup";
import {CaptchaParams} from "@/assets/types/Captcha";
import {handleApiError} from "@/assets/sripts/error_handler";
import Silk from "@/components/Silk.vue";
import HalfScreenBannerText from "@/components/HalfScreenBannerText.vue";
import ThirdPartyLoginWidget from "@/components/ThirdPartyLoginWidget.vue";

const router = useRouter(),
    route = useRoute(),
    {t} = useI18n(),
    notice = useNoticeStore(),
    rules = useRules(),
    {mobile, sm} = useDisplay()

let signupLoading: Ref<boolean> = ref(false),
    signupPasswordMode = ref(false),

    // 注册表单
    signupFrom: Ref<SignupParams> = ref({
      username: '',
      alternativeName: '',
      password: '',
      email: '',
      captcha: {
        encryptCaptcha: '',
        response: ''
      }
    })

/**
 * 注册
 */
const onRegister = async () => {
  try {
    signupLoading.value = true;

    const result = await apis.userApi().signup({
          username: signupFrom.value.username,
          alternativeName: signupFrom.value.alternativeName || signupFrom.value.username,
          password: signupFrom.value.password,
          email: signupFrom.value.email,
          captcha: signupFrom.value.captcha,
        }),
        d = result.data;

    notice.success(t(`basic.tips.${d.code}`), {mode: 'minimal'})

    setTimeout(async () => {
      await router.push({
        path: '/account/activate',
        query: {username: signupFrom.value.username}
      })
    }, 1000)
  } catch (e) {
    handleApiError(e, notice, t, {component: 'Signup', tPrefix: 'basic.tips'})
  } finally {
    signupLoading.value = false;
  }
}

/**
 * 返回上一层或登录
 */
const onBackRoute = () => {
  const backUrl = (route.query.backUrl || route.query.backurl) as string || '';
  if (backUrl) return router.push({path: backUrl});
  return router.push('/account/signin');
}

/**
 * 处理验证码数据
 * @param data
 */
const onCaptchaData = (data: CaptchaParams) => {
  signupFrom.value.captcha = data;
}
</script>

<template>
  <div>
    <div class="signup-window">
      <v-row dense class="min-h-screen">
        <v-col cols="12" lg="6" :class="{'d-none': mobile || sm}" class="position-relative overflow-hidden">
          <HalfScreenBannerText></HalfScreenBannerText>
          <Silk
              :speed="3"
              :scale=".7"
              :color="'#1c1c1c'"
              :noise-intensity="0.1"
              :rotation="-.2"
              class="bg-black">
          </Silk>
        </v-col>
        <v-col cols="12" lg="6" class="bg-black overflow-y-auto">
          <v-card dense variant="text" class="signup mt-16 mb-6 px-8">
            <v-breadcrumbs class="ml-n3">
              <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
              <v-breadcrumbs-divider></v-breadcrumbs-divider>
              <v-breadcrumbs-item>{{ t('signup.title') }}</v-breadcrumbs-item>
            </v-breadcrumbs>

            <v-row class="py-2">
              <v-col cols="12">
                <!-- 用户名/账户 ID -->
                <div class="field-group mb-3">
                  <b>{{ t('signup.username.name') }}</b>
                  <p class="text-caption text-grey opacity-80 mb-2">{{ t('signup.username.hint') }}</p>
                  <v-text-field v-model="signupFrom.username"
                                :rules="rules.username"
                                name="username"
                                variant="solo-filled"
                                prepend-inner-icon="mdi-account-key"
                                min-length="3"
                                max-length="40"
                                clearable
                                :placeholder="t('signup.username.placeholder')"></v-text-field>
                </div>

                <!-- 别名 -->
                <div class="field-group mb-3">
                  <b>{{ t('signup.alternativeName.name') }}</b>
                  <p class="text-caption text-grey opacity-80 mb-2">{{ t('signup.alternativeName.hint') }}</p>
                  <v-text-field v-model="signupFrom.alternativeName"
                                :rules="rules.alternativeName"
                                name="alternativeName"
                                variant="solo-filled"
                                prepend-inner-icon="mdi-rename"
                                clearable
                                :placeholder="t('signup.alternativeName.placeholder')"></v-text-field>
                </div>

                <!-- 密码 -->
                <div class="field-group mb-3">
                  <b>{{ t('signup.password.name') }}</b>
                  <p class="text-caption text-grey opacity-80 mb-2">{{ t('signup.password.hint') }}</p>
                  <v-text-field v-model="signupFrom.password"
                                :rules="rules.password"
                                name="password"
                                variant="solo-filled"
                                prepend-inner-icon="mdi-form-textbox-password"
                                :type="signupPasswordMode ? 'text' : 'password'"
                                clearable
                                min-length="8"
                                max-length="64"
                                :placeholder="t('signin.form.placeholder.password')">
                    <template v-slot:append-inner>
                      <v-icon
                        :icon="signupPasswordMode ? 'mdi-eye-off' : 'mdi-eye'"
                        class="cursor-pointer"
                        @click="signupPasswordMode = !signupPasswordMode"
                      />
                    </template>
                  </v-text-field>
                </div>

                <!-- 邮箱 -->
                <div class="field-group mb-3">
                  <b>{{ t('signup.email.name') }}</b>
                  <p class="text-caption text-grey opacity-80 mb-2">{{ t('signup.email.hint') }}</p>
                  <v-text-field v-model="signupFrom.email"
                                :rules="rules.email"
                                name="email"
                                variant="solo-filled"
                                prepend-inner-icon="mdi-email"
                                clearable
                                :placeholder="t('signup.email.hint')"></v-text-field>
                </div>

                <!-- 验证码 -->
                <Captcha @getCaptchaData="onCaptchaData" class="captcha"></Captcha>
              </v-col>
            </v-row>

            <div class="py-2">
              <v-btn class="bg-amber" @click="onRegister" size="50" block :loading="signupLoading" :disabled="!signupFrom.username || !signupFrom.password || !signupFrom.email" variant="flat">
                {{ t('signup.register') }}
              </v-btn>

              <v-btn class="mt-2" @click="onBackRoute" size="50" block variant="text">{{ t('basic.button.cancel') }}</v-btn>
            </div>

            <ThirdPartyLoginWidget mode="signup" />
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.signup-window {
  min-height: 100vh;
}

.signup {
  .captcha {
    width: 300px;
  }
}
</style>
