<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useAuthStore} from '~/stores/userAccountStore';
import {useNoticeStore} from '~/stores/noticeStore';
import {apis} from '@/assets/sripts';
import {useRules} from '@/assets/sripts/rules_user';
import {useDisplay} from 'vuetify/framework';

import Silk from '@/components/Silk.vue';
import HalfScreenBannerText from '@/components/HalfScreenBannerText.vue';
import AffixContainerView from '@/components/AffixContainerView.vue';
import Loading from '@/components/Loading.vue';
import Captcha from '@/components/captcha/index.vue';
import {CaptchaParams} from '@/assets/types/Captcha';
import {setTrustToken} from '@/assets/sripts/two_fa_trust';

const route = useRoute();
const router = useRouter();
const {t, te} = useI18n();
const authStore = useAuthStore();
const notice = useNoticeStore();
const rules = useRules();
const {mobile, sm} = useDisplay();

// 第三方平台展示名：绑定页语言包里有配置就用本地化名称（如 QQ 机器人），否则回退平台标识
const oauthPlatformLabel = computed(() => {
  const p = oauthProfile.value.platform;
  const key = `account.bindings.platforms.${p}.name`;
  return te(key) ? t(key) : p.toUpperCase();
});

const loading = ref(true);
const errorMsg = ref('');
const ticketExpired = ref(false);
const activeTab = ref<'signup' | 'bind'>('signup');
const showPassword = ref(false);

// 补充注册与绑定分别持有验证码，切换标签互不影响
const signupCaptchaRef = ref<InstanceType<typeof Captcha> | null>(null);
const bindCaptchaRef = ref<InstanceType<typeof Captcha> | null>(null);
const signupCaptcha = ref<CaptchaParams>({encryptCaptcha: '', response: ''});
const bindCaptcha = ref<CaptchaParams>({encryptCaptcha: '', response: ''});

// 补充注册/绑定状态
const needComplete = ref(false);
const oauthTicket = ref('');
const oauthProfile = ref<{
  platform: string;
  platformUsername: string;
  platformAvatar?: string;
  email?: string;
}>({
  platform: '',
  platformUsername: '',
  platformAvatar: '',
  email: '',
});

// 表单数据
const signupForm = ref({
  username: '',
  alternativeName: '',
  password: '',
  email: '',
});

const bindForm = ref({
  username: '',
  password: '',
});

const submitLoading = ref(false);

// 第三方登录后仍需二次验证时的状态
const twoFAOpen = ref(false);
const twoFASetupToken = ref('');
const twoFAUsername = ref('');
const twoFACode = ref('');
const twoFALoading = ref(false);
const twoFATrustDevice = ref(true);

// 当前第三方平台标识，ticket 失效时用于重新发起授权
const oauthPlatform = ref('qq');

/**
 * 校验验证码是否已完成
 * @param captcha 验证码数据
 */
const isCaptchaValid = (captcha: CaptchaParams): boolean => {
  const type = captcha.captchaType || captcha.type || 'turnstile';
  if (type === 'svg') {
    return Boolean(captcha.encryptCaptcha && captcha.response && String(captcha.response).trim().length === 4);
  }
  return Boolean(captcha.response && String(captcha.response).trim().length > 5);
};

/**
 * 解析后端错误码为本地化文案
 * @param err 接口错误
 */
const errorText = (err: any): string => {
  const code = err?.code as string | undefined;
  if (code === 'oauth.ticket.expired') {
    ticketExpired.value = true;
    return t('oauth.ticketExpired');
  }
  const key = code ? `basic.tips.${code}` : '';
  if (key && te(key)) return t(key);
  return err?.message || t('oauth.unknownError');
};

/**
 * 重新发起第三方授权，拿到新的 ticket
 */
const onRestartOAuth = async () => {
  const platform = oauthPlatform.value;
  try {
    submitLoading.value = true;
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const backUrl = (route.query.backUrl as string) || '';
    // 重新授权后仍回到原目标页，避免用户登录成功后丢失来源
    const callbackTarget = `${currentOrigin}/oauth/callback?platform=${platform}${backUrl ? `&backUrl=${encodeURIComponent(backUrl)}` : ''}`;
    const res = await apis.userApi().getOAuthUrl(platform, callbackTarget);
    if (res?.data?.data?.url) {
      window.location.href = res.data.data.url;
      return;
    }
    notice.error(t('oauth.urlError'));
  } catch (err: any) {
    notice.error(errorText(err));
  } finally {
    submitLoading.value = false;
  }
};

/**
 * 打开第三方登录的二次验证表单
 * @param setupToken 后端签发的登录验证令牌
 * @param username 账户登录名
 */
const onOpen2FA = (setupToken: string, username: string) => {
  twoFASetupToken.value = setupToken;
  twoFAUsername.value = username;
  twoFACode.value = '';
  twoFAOpen.value = true;
};

/**
 * 提交第三方登录的二次验证
 */
const onSubmit2FA = async () => {
  const code = twoFACode.value.trim().toUpperCase();
  if (!code) return;

  twoFALoading.value = true;
  try {
    const res = await apis.userApi().loginVerify2fa(twoFASetupToken.value, code, undefined, twoFATrustDevice.value);
    const d = res.data?.data || res.data;
    if (d?.trustToken) setTrustToken(d.trustToken);
    authStore.setAccountToken(d);
    notice.success(t('basic.tips.signin.success'), {mode: 'minimal'});

    twoFAOpen.value = false;
    twoFASetupToken.value = '';
    twoFACode.value = '';

    const backUrl = (route.query.backUrl as string) || '/';
    await router.push(backUrl);
  } catch (err: any) {
    if (err?.code === '2fa.loginTokenExpired') {
      errorMsg.value = errorText(err);
      twoFAOpen.value = false;
      return;
    }
    notice.error(errorText(err));
  } finally {
    twoFALoading.value = false;
  }
};

/**
 * 处理补充注册验证码数据
 * @param data 验证码数据
 */
const onSignupCaptchaData = (data: CaptchaParams) => {
  signupCaptcha.value = data;
};

/**
 * 处理绑定验证码数据
 * @param data 验证码数据
 */
const onBindCaptchaData = (data: CaptchaParams) => {
  bindCaptcha.value = data;
};

onMounted(async () => {
  const code = (route.query.code as string) || '';
  const state = (route.query.state as string) || '';
  const platform = ((route.query.platform as string) || 'qq').toLowerCase();
  oauthPlatform.value = platform;

  if (!code) {
    loading.value = false;
    errorMsg.value = t('basic.tips.signin.oauth.missingCode');
    return;
  }

  try {
    const res = await apis.userApi().oauthCallback(platform, {code, state});
    const result = res.data;

    // 已有绑定直接登录成功
    if (result.code === 'signin.ok') {
      authStore.setAccountToken(result.data);
      notice.success(t('basic.tips.signin.success'), {mode: 'minimal'});
      const backUrl = (route.query.backUrl as string) || '/';
      return router.push(backUrl);
    }

    // 已登录用户绑定成功
    if (result.code === 'oauth.bind.ok') {
      notice.success(t('basic.tips.signin.oauth.bindSuccess'), {mode: 'minimal'});
      return router.push('/account/security/bindings');
    }

    // 账户启用了两步验证 -> 先完成二次验证再登录
    if (result.code === 'signin.2faRequired') {
      onOpen2FA(result.data.setupToken, result.data.username || '');
      loading.value = false;
      return;
    }

    // 未找到绑定 -> 引导进入补充注册或绑定已有账号
    if (result.code === 'oauth.needComplete') {
      needComplete.value = true;
      oauthTicket.value = result.data.oauthTicket;
      oauthProfile.value = {
        platform: result.data.platform,
        platformUsername: result.data.platformUsername || '',
        platformAvatar: result.data.platformAvatar || '',
        email: result.data.email || '',
      };

      // 第三方昵称仅作为别名默认值，账户 id 必须由用户自己填写
      signupForm.value.alternativeName = oauthProfile.value.platformUsername;
      signupForm.value.email = oauthProfile.value.email || '';
      loading.value = false;
      return;
    }

    errorMsg.value = result.message || t('basic.tips.signin.oauth.unknownError');
  } catch (err: any) {
    errorMsg.value = errorText(err);
  } finally {
    loading.value = false;
  }
});

/**
 * 提交补充注册
 */
const onCompleteSignup = async () => {
  if (!isCaptchaValid(signupCaptcha.value)) {
    notice.warning(t('captcha.messages.bad'));
    return;
  }

  try {
    submitLoading.value = true;
    errorMsg.value = '';

    const res = await apis.userApi().oauthCompleteSignup({
      oauthTicket: oauthTicket.value,
      username: signupForm.value.username,
      alternativeName: signupForm.value.alternativeName || signupForm.value.username,
      password: signupForm.value.password,
      email: signupForm.value.email || undefined,
      captcha: signupCaptcha.value,
    });

    if (res?.data?.code === 'signin.ok') {
      authStore.setAccountToken(res.data.data);
      notice.success(t('basic.tips.signin.oauth.bindSuccess'), {mode: 'minimal'});

      const backUrl = (route.query.backUrl as string) || '/';
      await router.push(backUrl);
    } else {
      notice.error(res?.data?.message || t('basic.tips.signin.oauth.failed'));
    }

  } catch (err: any) {
    // 验证码与 ticket 均可能已失效，刷新验证码并给出可重试入口
    signupCaptchaRef.value?.refreshCaptcha?.();
    errorMsg.value = errorText(err);
    notice.error(errorMsg.value);
  } finally {
    submitLoading.value = false;
  }
};

/**
 * 提交绑定已有账号
 */
const onCompleteBind = async () => {
  if (!isCaptchaValid(bindCaptcha.value)) {
    notice.warning(t('captcha.messages.bad'));
    return;
  }

  try {
    submitLoading.value = true;
    errorMsg.value = '';
    const res = await apis.userApi().oauthCompleteBind({
      oauthTicket: oauthTicket.value,
      username: bindForm.value.username,
      password: bindForm.value.password,
      captcha: bindCaptcha.value,
    });

    if (res?.data?.code === 'signin.ok') {
      authStore.setAccountToken(res.data.data);
      notice.success(t('basic.tips.signin.oauth.bindAndLoginSuccess'), {mode: 'minimal'});
      const backUrl = (route.query.backUrl as string) || '/';

      router.push(backUrl);
    } else if (res?.data?.code === 'signin.2faRequired') {
      onOpen2FA(res.data.data.setupToken, res.data.data.username || bindForm.value.username);
    } else {
      notice.error(res?.data?.message || t('basic.tips.signin.accountIncorrect'));
    }

  } catch (err: any) {
    bindCaptchaRef.value?.refreshCaptcha?.();
    errorMsg.value = errorText(err);
    notice.error(errorMsg.value);
  } finally {
    submitLoading.value = false;
  }
};

/**
 * 取消并返回登录页
 */
const onBackRoute = () => {
  const backUrl = (route.query.backUrl || route.query.backurl) as string || '';

  if (backUrl) return router.push({path: backUrl});

  return router.push('/account/signin');
};
</script>

<template>
  <div class="signin-window">
    <v-row density="compact" class="h-100" no-gutters>
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
        <v-card density="compact" variant="text" class="signin mt-16 px-8">
          <v-breadcrumbs class="ml-n3">
            <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
            <v-breadcrumbs-divider></v-breadcrumbs-divider>
            <v-breadcrumbs-item>{{ t('oauth.callbackTitle') }}</v-breadcrumbs-item>
          </v-breadcrumbs>

          <AffixContainerView>
            <!-- 加载 S -->
            <div v-if="loading" class="text-center py-16">
              <Loading class="mb-4" size="32"></Loading>
              <div class="text-subtitle-1 font-weight-bold opacity-90">
                {{ t('oauth.processing') }}
              </div>
              <div class="text-caption opacity-50 mt-1">
                {{ t('oauth.waitHint') }}
              </div>
            </div>
            <!-- 加载 E -->

            <!-- 两步验证 S -->
            <div v-else-if="twoFAOpen">
              <v-row class="py-2">
                <v-col>
                  <div class="d-flex align-center gap-2 mb-2">
                    <v-icon icon="mdi-shield-lock" color="amber" />
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
                  <v-checkbox v-model="twoFATrustDevice"
                              density="compact"
                              color="amber"
                              hide-details
                              :label="t('signin.2fa.trustDevice')"
                              class="mt-2" />
                </v-col>
              </v-row>

              <div class="py-2">
                <v-btn class="bg-amber text-black" size="50" block variant="flat"
                       :loading="twoFALoading"
                       :disabled="!twoFACode.trim()"
                       @click="onSubmit2FA">
                  {{ t('signin.2fa.submit') }}
                </v-btn>
                <v-btn class="mt-2" size="50" block variant="text" @click="onBackRoute">
                  {{ t('basic.button.cancel') }}
                </v-btn>
              </div>
            </div>
            <!-- 两步验证 E -->

            <!-- 授权失败 S -->
            <div v-else-if="errorMsg && !needComplete" class="text-center py-12">
              <v-icon icon="mdi-alert-circle" color="red" size="64" class="mb-4"></v-icon>
              <h3 class="text-h5 font-weight-bold text-red">{{ t('oauth.failedTitle') }}</h3>
              <p class="text-caption opacity-70 mt-2 mb-6">{{ errorMsg }}</p>
              <v-btn v-if="ticketExpired" class="bg-amber text-black mb-3" size="50" block variant="flat"
                     :loading="submitLoading" @click="onRestartOAuth">
                {{ t('oauth.restartAuth') }}
              </v-btn>
              <v-btn class="bg-amber text-black" to="/account/signin" size="50" block variant="flat">
                {{ t('oauth.backToSignin') }}
              </v-btn>
            </div>
            <!-- 授权失败 E -->

            <!-- 新用户首次登录：补充注册新账号 或 关联已有账号 S -->
            <div v-else-if="needComplete">

              <!-- 第三方用户信息展示卡片 S -->
              <div class="d-flex align-center pa-4 mb-4 rounded-lg bg-grey-darken-4 border-opacity-10">
                <v-avatar size="48" class="mr-3" color="grey-darken-3">
                  <v-img v-if="oauthProfile.platformAvatar" :src="oauthProfile.platformAvatar"></v-img>
                  <v-icon v-else icon="mdi-account-circle" size="36"></v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-subtitle-1 font-weight-bold">
                    {{ oauthProfile.platformUsername }}
                  </div>
                  <div class="text-caption text-amber d-flex align-center ga-1">
                    <span>{{ oauthPlatformLabel }} · {{ t('oauth.platformNickname') }}</span>
                  </div>
                </div>
              </div>
              <!-- 第三方用户信息展示卡片 E -->

              <p class="text-caption opacity-70 mb-4">
                {{ t('oauth.firstTimeHint') }}
              </p>

              <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mb-4">
                <div>{{ errorMsg }}</div>
                <v-btn v-if="ticketExpired" class="mt-2" size="small" color="amber" variant="flat"
                       :loading="submitLoading" @click="onRestartOAuth">
                  {{ t('oauth.restartAuth') }}
                </v-btn>
              </v-alert>

              <v-tabs v-model="activeTab" color="amber" class="mb-4" grow>
                <v-tab value="signup">{{ t('oauth.tabNewAccount') }}</v-tab>
                <v-tab value="bind">{{ t('oauth.tabBindExisting') }}</v-tab>
              </v-tabs>

              <v-window v-model="activeTab">
                <!-- 补充注册新账号 -->
                <v-window-item value="signup">
                  <v-row class="py-2">
                    <v-col cols="12">
                      <v-text-field
                          v-model="signupForm.username"
                          :rules="rules.username"
                          name="username"
                          variant="solo-filled"
                          prepend-inner-icon="mdi-account-key"
                          :label="t('signup.username.name') "
                          :placeholder="t('signup.username.placeholder')"
                          :hint="t('oauth.accountIdHint')"
                          persistent-hint
                      ></v-text-field>

                      <v-text-field
                          v-model="signupForm.alternativeName"
                          :rules="rules.alternativeName"
                          name="alternativeName"
                          variant="solo-filled"
                          prepend-inner-icon="mdi-rename"
                          :label="t('signup.alternativeName.name')"
                          :placeholder="t('signup.alternativeName.placeholder')"
                      ></v-text-field>

                      <v-text-field
                          v-model="signupForm.password"
                          :rules="rules.password"
                          name="password"
                          variant="solo-filled"
                          prepend-inner-icon="mdi-form-textbox-password"
                          :type="showPassword ? 'text' : 'password'"
                          :label="t('signin.form.label.password')"
                          :placeholder="t('signin.form.placeholder.password')">
                        <template v-slot:append-inner>
                          <v-icon
                              :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                              class="cursor-pointer"
                              @click="showPassword = !showPassword"
                          />
                        </template>
                      </v-text-field>

                      <v-text-field
                          v-model="signupForm.email"
                          :rules="rules.email"
                          name="email"
                          variant="solo-filled"
                          prepend-inner-icon="mdi-email"
                          :label="t('signup.email.name')"
                          :placeholder="t('signup.email.hint')"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <div class="mb-3">
                    <Captcha ref="signupCaptchaRef" class="captcha" @getCaptchaData="onSignupCaptchaData"></Captcha>
                  </div>

                  <div class="py-2">
                    <v-btn
                        class="bg-amber text-black"
                        @click="onCompleteSignup"
                        size="50"
                        block
                        :loading="submitLoading"
                        :disabled="!signupForm.username || !signupForm.password || !isCaptchaValid(signupCaptcha) || ticketExpired"
                        variant="flat">
                      {{ t('oauth.completeSignupBtn') }}
                    </v-btn>

                    <v-btn class="mt-2" @click="onBackRoute" size="50" block variant="text">
                      {{ t('basic.button.cancel') }}
                    </v-btn>
                  </div>
                </v-window-item>

                <!-- 关联已有账号 -->
                <v-window-item value="bind">
                  <v-row class="py-2">
                    <v-col cols="12">
                      <v-text-field
                          v-model="bindForm.username"
                          :rules="rules.username"
                          name="bindUsername"
                          variant="solo-filled"
                          prepend-inner-icon="mdi-account-key"
                          :label="t('signin.form.label.username')"
                          :placeholder="t('signin.form.placeholder.username')"
                      ></v-text-field>

                      <v-text-field
                          v-model="bindForm.password"
                          :rules="rules.password"
                          name="bindPassword"
                          variant="solo-filled"
                          prepend-inner-icon="mdi-form-textbox-password"
                          type="password"
                          :label="t('signin.form.label.password')"
                          :placeholder="t('signin.form.placeholder.password')"
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <div class="mb-3">
                    <Captcha ref="bindCaptchaRef" class="captcha" @getCaptchaData="onBindCaptchaData"></Captcha>
                  </div>

                  <div class="py-2">
                    <v-btn
                        class="bg-amber text-black"
                        @click="onCompleteBind"
                        size="50"
                        block
                        :loading="submitLoading"
                        :disabled="!bindForm.username || !bindForm.password || !isCaptchaValid(bindCaptcha) || ticketExpired"
                        variant="flat">
                      {{ t('oauth.completeBindBtn') }}
                    </v-btn>

                    <v-btn class="mt-2" @click="onBackRoute" size="50" block variant="text">
                      {{ t('basic.button.cancel') }}
                    </v-btn>
                  </div>
                </v-window-item>
              </v-window>

              <v-card-actions class="py-2 d-flex justify-space-between align-center mb-5">
                <router-link to="/account/signin" class="u">
                  {{ t('oauth.backToSignin') }}
                </router-link>
                <router-link to="/account/forgot-password" class="u">
                  {{ t('forgotPassword.title') }}?
                </router-link>
              </v-card-actions>
            </div>
            <!-- 新用户首次登录 E -->
          </AffixContainerView>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

.signin-window {
  overflow: hidden;
  min-height: calc(100vh + 2px);
  margin-bottom: -4px;
}

.signin {
  .captcha {
    width: 300px;
  }
}
</style>
