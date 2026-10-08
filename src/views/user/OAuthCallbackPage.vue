<script setup lang="ts">
import {onMounted, ref} from 'vue';
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

const route = useRoute();
const router = useRouter();
const {t} = useI18n();
const authStore = useAuthStore();
const notice = useNoticeStore();
const rules = useRules();
const {mobile, sm} = useDisplay();

const loading = ref(true);
const errorMsg = ref('');
const activeTab = ref<'signup' | 'bind'>('signup');
const showPassword = ref(false);

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

onMounted(async () => {
  const code = (route.query.code as string) || '';
  const state = (route.query.state as string) || '';
  const platform = ((route.query.platform as string) || 'qq').toLowerCase();

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
      notice.success(t('basic.tips.signin.success'));
      const backUrl = (route.query.backUrl as string) || '/';
      return router.push(backUrl);
    }

    // 已登录用户绑定成功
    if (result.code === 'oauth.bind.ok') {
      notice.success(t('basic.tips.signin.oauth.bindSuccess'));
      return router.push('/account/bindings');
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

      signupForm.value.alternativeName = oauthProfile.value.platformUsername;
      signupForm.value.email = oauthProfile.value.email || '';
      loading.value = false;
      return;
    }

    errorMsg.value = result.message || t('basic.tips.signin.oauth.unknownError');
  } catch (err: any) {
    errorMsg.value = err?.message || t('basic.tips.signin.oauth.authFailed');
  } finally {
    loading.value = false;
  }
});

/**
 * 提交补充注册
 */
const onCompleteSignup = async () => {
  try {
    submitLoading.value = true;

    const res = await apis.userApi().oauthCompleteSignup({
      oauthTicket: oauthTicket.value,
      username: signupForm.value.username,
      alternativeName: signupForm.value.alternativeName || signupForm.value.username,
      password: signupForm.value.password,
      email: signupForm.value.email || undefined,
    });

    if (res?.data?.code === 'signin.ok') {
      authStore.setAccountToken(res.data.data);
      notice.success(t('basic.tips.signin.oauth.bindSuccess'));
      const backUrl = (route.query.backUrl as string) || '/';
      await router.push(backUrl);
    } else {
      notice.error(res?.data?.message || t('basic.tips.signin.oauth.failed'));
    }

  } catch (err: any) {
    notice.error(err?.message || t('basic.tips.signin.oauth.failed'));
  } finally {
    submitLoading.value = false;
  }
};

/**
 * 提交绑定已有账号
 */
const onCompleteBind = async () => {
  try {
    submitLoading.value = true;
    const res = await apis.userApi().oauthCompleteBind({
      oauthTicket: oauthTicket.value,
      username: bindForm.value.username,
      password: bindForm.value.password,
    });

    if (res?.data?.code === 'signin.ok') {
      authStore.setAccountToken(res.data.data);
      notice.success(t('basic.tips.signin.oauth.bindAndLoginSuccess'));
      const backUrl = (route.query.backUrl as string) || '/';

      router.push(backUrl);
    } else {
      notice.error(res?.data?.message || t('basic.tips.signin.accountIncorrect'));
    }

  } catch (err: any) {
    notice.error(err?.message || t('basic.tips.signin.oauth.bindFailed'));
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
    <v-row dense class="h-100">
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
        <v-card dense variant="text" class="signin mt-16 px-8">
          <v-breadcrumbs class="ml-n3">
            <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
            <v-breadcrumbs-divider></v-breadcrumbs-divider>
            <v-breadcrumbs-item>{{ t('oauth.callbackTitle') }}</v-breadcrumbs-item>
          </v-breadcrumbs>

          <AffixContainerView>
            <!-- 加载 S -->
            <div v-if="loading" class="text-center py-16">
              <Loading class="mb-4"></Loading>
              <div class="text-subtitle-1 font-weight-bold opacity-90">
                {{ t('oauth.processing') }}
              </div>
              <div class="text-caption opacity-50 mt-1">
                {{ t('oauth.waitHint') }}
              </div>
            </div>
            <!-- 加载 E -->

            <!-- 授权失败 S -->
            <div v-else-if="errorMsg && !needComplete" class="text-center py-12">
              <v-icon icon="mdi-alert-circle" color="red" size="64" class="mb-4"></v-icon>
              <h3 class="text-h5 font-weight-bold text-red">{{ t('oauth.failedTitle') }}</h3>
              <p class="text-caption opacity-70 mt-2 mb-6">{{ errorMsg }}</p>
              <v-btn class="bg-amber" to="/account/signin" size="50" block variant="flat">
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
                    <span>{{ oauthProfile.platform.toUpperCase() }}</span>
                  </div>
                </div>
              </div>
              <!-- 第三方用户信息展示卡片 E -->

              <p class="text-caption opacity-70 mb-4">
                {{ t('oauth.firstTimeHint') }}
              </p>

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

                  <div class="py-2">
                    <v-btn
                        class="bg-amber"
                        @click="onCompleteSignup"
                        size="50"
                        block
                        :loading="submitLoading"
                        :disabled="!signupForm.username || !signupForm.password"
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

                  <div class="py-2">
                    <v-btn
                        class="bg-amber"
                        @click="onCompleteBind"
                        size="50"
                        block
                        :loading="submitLoading"
                        :disabled="!bindForm.username || !bindForm.password"
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
