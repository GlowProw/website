<script setup lang="ts">
import {Ref, ref, computed} from "vue";
import {useAuthStore} from '~/stores/userAccountStore'
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";

import Captcha from "@/components/captcha/index.vue";
import {useRules} from "@/assets/sripts/rules_user"
import {SigninParams} from "@/assets/types/User.Login";
import {apis} from "@/assets/sripts";
import {ApiError} from "@/assets/types/Api";
import {CaptchaParams} from "@/assets/types/Captcha";
import {handleApiError} from "@/assets/sripts/error_handler";
import {useDisplay} from "vuetify/framework";
import Silk from "@/components/Silk.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import HalfScreenBannerText from "@/components/HalfScreenBannerText.vue";
import ThirdPartyLoginWidget from "@/components/ThirdPartyLoginWidget.vue";
import {setTrustToken} from "@/assets/sripts/two_fa_trust";

const authStore = useAuthStore(),
    router = useRouter(),
    route = useRoute(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    rules = useRules(),
    {mobile, sm} = useDisplay()

/**
 * 模板 ref 引用，用于失败时自动刷新验证码
 */
const captchaRef = ref<InstanceType<typeof Captcha> | null>(null)

let signinFormLoading: Ref<boolean> = ref(false),

    // 登陆表单
    signinFrom: Ref<SigninParams> = ref({
      username: '',
      password: '',
      captcha: {
        encryptCaptcha: '',
        response: ''
      }
    })

/**
 * 2FA 相关状态
 */
const twoFAOpen = ref(false)
const twoFASetupToken = ref('')
const twoFAUsername = ref('')
const twoFACode = ref('')
const twoFALoading = ref(false)
// 勾选后本机 7 天内免二次验证
const twoFATrustDevice = ref(true)

/**
 * 校验人机验证是否已完成
 */
const isCaptchaValid = computed(() => {
  const c = signinFrom.value.captcha;
  if (!c) return false;
  const type = (c as any).captchaType || c.type || 'turnstile';
  if (type === 'svg') {
    return Boolean(c.encryptCaptcha && c.response && String(c.response).trim().length === 4);
  }
  return Boolean(c.response && String(c.response).trim().length > 5);
})

/**
 * 打开 2FA 对话框
 */
const onOpen2FA = (setupToken: string, username: string) => {
  twoFASetupToken.value = setupToken
  twoFAUsername.value = username
  twoFACode.value = ''
  twoFAOpen.value = true
}

/**
 * 关闭 2FA 对话框
 */
const onClose2FA = () => {
  twoFAOpen.value = false
  twoFASetupToken.value = ''
  twoFAUsername.value = ''
  twoFACode.value = ''
  // 返回登录表单时刷新人机验证（上次验证已被消费）
  captchaRef.value?.refreshCaptcha?.()
}

/**
 * 提交 2FA 验证
 */
const onSubmit2FA = async () => {
  const code = twoFACode.value.trim().toUpperCase()
  if (!code) return

  twoFALoading.value = true
  try {
    const result = await apis.userApi().loginVerify2fa(twoFASetupToken.value, code, undefined, twoFATrustDevice.value)
    const d = result.data?.data || result.data
    if (d?.trustToken) setTrustToken(d.trustToken)
    authStore.setAccountToken(d)
    // 验证通过：清空验证状态（无需刷新验证码，即将跳转）
    twoFAOpen.value = false
    twoFASetupToken.value = ''
    twoFACode.value = ''

    const targetBackUrl = (route.query.backUrl || route.query.backurl) as string;
    if (targetBackUrl) {
      return await router.push(targetBackUrl);
    }
    await router.push('/')
  } catch (e) {
    // 验证会话过期：回到登录表单重新走完整流程
    if (e instanceof ApiError && e.code === '2fa.loginTokenExpired') {
      handleApiError(e, notice, t, { component: 'Signin', tPrefix: 'basic.tips' })
      onClose2FA()
      return
    }
    handleApiError(e, notice, t, { component: 'Signin', tPrefix: 'basic.tips' })
  } finally {
    twoFALoading.value = false
  }
}

/**
 * 登陆
 */
const onLogin = async () => {
  if (!signinFrom.value.username || !signinFrom.value.password) {
    return;
  }
  if (!isCaptchaValid.value) {
    notice.warning(t('captcha.messages.bad') || '请先完成人机验证');
    return;
  }

  try {
    signinFormLoading.value = true

    const result = await apis.userApi().signin({
          username: signinFrom.value.username,
          password: signinFrom.value.password,
          captcha: signinFrom.value.captcha,
        })

    // 2FA 需要额外验证
    if (result.code === 'signin.2faRequired') {
      const d = result.data
      onOpen2FA(d?.data?.setupToken || d?.setupToken || '', d?.data?.username || signinFrom.value.username)
      return
    }

    const tokenData = result.data?.data || result.data
    authStore.setAccountToken(tokenData)

    const targetBackUrl = (route.query.backUrl || route.query.backurl) as string;
    if (targetBackUrl) {
      return await router.push(targetBackUrl);
    }

    await router.push('/')
  } catch (e) {
    console.log(e)
    // 任何登录失败都自动刷新验证码（token 已被后端消费/过期）
    captchaRef.value?.refreshCaptcha?.()
    if (e instanceof ApiError && e.code === 'signin.notActivated') {
      handleApiError(e, notice, t, { component: 'Signin', tPrefix: 'basic.tips' })
      setTimeout(() => {
        router.push({
          path: '/account/activate',
          query: {username: signinFrom.value.username}
        })
      }, 1500)
      return
    }
    handleApiError(e, notice, t, { component: 'Signin', tPrefix: 'basic.tips' })
  } finally {
    signinFormLoading.value = false
  }
}

/**
 * 取消登陆返回上一层
 */
const onBackRoute = async () => {
  const backUrl = (route.query.backUrl || route.query.backurl) as string || '';

  if (backUrl)
    return router.push({path: backUrl})

  return router.go(-1)
}

/**
 * 处理验证码数据
 * @param data
 */
const onCaptchaData = (data: CaptchaParams) => {
  signinFrom.value.captcha = data;
}
</script>

<template>
  <div class="signin-window">
    <v-row density="compact" class="h-screen" no-gutters>
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
      <v-col cols="12" lg="6" class="bg-black">
        <v-card density="compact" variant="text" class="signin mt-16 px-8">
          <v-breadcrumbs class="ml-n3">
            <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
            <v-breadcrumbs-divider></v-breadcrumbs-divider>
            <v-breadcrumbs-item>{{ t('signin.title') }}</v-breadcrumbs-item>
          </v-breadcrumbs>

          <AffixContainerView>
            <!-- 登录表单 -->
            <template v-if="!twoFAOpen">
              <v-row class="py-2">
                <v-col>
                  <v-text-field v-model="signinFrom.username"
                                :rules="rules.username"
                                name="username"
                                variant="solo-filled"
                                prepend-inner-icon="mdi-account-key"
                                :label="t('signin.form.label.username')"
                                :placeholder="t('signin.form.placeholder.username')"></v-text-field>
                  <v-text-field v-model="signinFrom.password"
                                :rules="rules.password"
                                name="password"
                                variant="solo-filled"
                                prepend-inner-icon="mdi-form-textbox-password"
                                :label="t('signin.form.label.password')"
                                :placeholder="t('signin.form.placeholder.password')"
                                type="password"></v-text-field>

                  <Captcha ref="captchaRef" @getCaptchaData="onCaptchaData" class="captcha"></Captcha>

                  <v-checkbox v-model="twoFATrustDevice"
                              density="compact"
                              color="amber"
                              hide-details
                              :label="t('signin.2fa.trustDevice')"
                              class="mt-2" />
                </v-col>
              </v-row>

              <div class="py-2">
                <v-btn class="bg-amber text-black" @click="onLogin" size="50" block :loading="signinFormLoading" :disabled="!signinFrom.username || !signinFrom.password || !isCaptchaValid" variant="flat">
                  {{ t('signin.title') }}
                </v-btn>

                <v-btn class="mt-2" @click="onBackRoute" size="50" block variant="text" v-if="route.query.backUrl || route.query.backurl">{{ t('basic.button.cancel') }}</v-btn>
              </div>

              <ThirdPartyLoginWidget mode="signin" />

              <v-card-actions class="py-2 d-flex justify-space-between align-center mb-5">
                <router-link to="/account/signup" class="u">
                  {{ t('signin.newUserRegistrationHint') }}
                </router-link>
                <router-link to="/account/forgot-password" class="u">
                  {{ t('forgotPassword.title') }}?
                </router-link>
              </v-card-actions>
            </template>

            <!-- 两步验证表单 -->
            <template v-else>
              <v-row class="py-2">
                <v-col>
                  <div class="d-flex align-center gap-2 mb-2">
                    <span class="text-h6">{{ t('signin.2fa.title') }}</span>
                  </div>
                  <div class="text-caption text-grey mb-3">
                    {{ t('signin.2fa.usernameHint', { username: twoFAUsername }) }}
                  </div>
                  <v-text-field v-model="twoFACode"
                                variant="solo-filled"
                                prepend-inner-icon="mdi-numeric"
                                :label="t('signin.2fa.codeLabel')"
                                placeholder="000000"
                                maxlength="8"
                                autocomplete="one-time-code"
                                @keyup.enter="onSubmit2FA" />
                  <div class="text-caption text-grey opacity-80">
                    {{ t('signin.2fa.hint') }}
                  </div>
                </v-col>
              </v-row>

              <div class="py-2">
                <v-btn class="bg-amber text-black" size="50" block variant="flat"
                       :loading="twoFALoading"
                       :disabled="!twoFACode.trim()"
                       @click="onSubmit2FA">
                  {{ t('signin.2fa.submit') }}
                </v-btn>
                <v-btn class="mt-2" size="50" block variant="text" @click="onClose2FA">
                  {{ t('basic.button.cancel') }}
                </v-btn>
              </div>
            </template>
          </AffixContainerView>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.signin-window {
  min-height: 100vh;
  overflow: hidden;
}

.signin {
  .captcha {
    width: 300px;
  }
}
</style>
