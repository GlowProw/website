<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useAuthStore} from '~/stores/userAccountStore';
import {useNoticeStore} from '~/stores/noticeStore';
import {apis} from '@/assets/sripts';
import {useRules} from '@/assets/sripts/rules_user';
import Silk from '@/components/Silk.vue';
import HalfScreenBannerText from '@/components/HalfScreenBannerText.vue';
import AffixContainerView from '@/components/AffixContainerView.vue';
import {useDisplay} from 'vuetify/framework';

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
  confirmPassword: '',
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
    errorMsg.value = t('oauth.missingCode') || '缺少授权回调 Code，请重新发起授权。';
    return;
  }

  try {
    const res = await apis.userApi().oauthCallback(platform, {code, state});
    const result = res.data;

    // 1. 已有绑定直接登录成功
    if (result.code === 'signin.ok') {
      authStore.setAccountToken(result.data);
      notice.success(t('signin.success') || '登录成功！');
      const backUrl = (route.query.backUrl as string) || '/';
      return router.push(backUrl);
    }

    // 2. 已登录用户绑定成功
    if (result.code === 'oauth.bind.ok') {
      notice.success(t('oauth.bindSuccess') || '第三方账号关联成功！');
      return router.push('/account/bindings');
    }

    // 3. 未找到绑定 -> 引导进入补充注册或绑定已有账号
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

    errorMsg.value = result.message || t('oauth.unknownError') || '授权处理失败';
  } catch (err: any) {
    errorMsg.value = err?.message || t('oauth.authFailed') || '授权回调处理失败，请稍后重试。';
  } finally {
    loading.value = false;
  }
});

/**
 * 提交补充注册
 */
const onCompleteSignup = async () => {
  if (signupForm.value.password !== signupForm.value.confirmPassword) {
    return notice.error(t('signup.passwordNotMatch') || '两次输入的密码不一致');
  }

  try {
    submitLoading.value = true;
    const res = await apis.userApi().oauthCompleteSignup({
      oauthTicket: oauthTicket.value,
      username: signupForm.value.username,
      alternativeName: signupForm.value.alternativeName,
      password: signupForm.value.password,
      email: signupForm.value.email || undefined,
    });

    if (res?.data?.code === 'signin.ok') {
      authStore.setAccountToken(res.data.data);
      notice.success(t('signup.success') || '注册成功并已自动关联登录！');
      router.push('/');
    } else {
      notice.error(res?.data?.message || t('signup.failed') || '注册失败');
    }
  } catch (err: any) {
    notice.error(err?.message || t('signup.failed') || '注册失败');
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
      notice.success(t('oauth.bindAndLoginSuccess') || '绑定成功并已登录！');
      router.push('/');
    } else {
      notice.error(res?.data?.message || t('signin.invalid') || '账号或密码错误');
    }
  } catch (err: any) {
    notice.error(err?.message || t('oauth.bindFailed') || '绑定失败');
  } finally {
    submitLoading.value = false;
  }
};
</script>

<template>
  <div class="oauth-callback-window">
    <v-row dense class="h-100">
      <v-col cols="12" lg="6" :class="{'d-none': mobile || sm}" class="position-relative overflow-hidden">
        <HalfScreenBannerText></HalfScreenBannerText>
        <Silk
            :speed="3"
            :scale=".7"
            :color="'#1c1c1c'"
            :noise-intensity="0.1"
            :rotation="-.2"
            class="bg-black"
        ></Silk>
      </v-col>

      <v-col cols="12" lg="6" class="bg-black d-flex align-center justify-center">
        <div class="oauth-card w-100 px-6 py-8" max-width="520">
          <!-- 加载 -->
          <div v-if="loading" class="text-center py-12">
            <Loading></Loading>
            <h3 class="mt-6 font-weight-medium">{{ t('oauth.processing') }}</h3>
          </div>

          <!-- 错误信息 -->
          <div v-else-if="errorMsg && !needComplete" class="text-center">
            <v-icon icon="mdi-alert-circle" color="red" size="64"></v-icon>
            <h3 class="mt-4 text-red font-weight-bold">{{ t('oauth.failedTitle') || '授权失败' }}</h3>
            <p class="mt-2 opacity-70">{{ errorMsg }}</p>
            <v-btn class="mt-6 bg-amber text-black" to="/account/signin" variant="flat">
              {{ t('oauth.backToSignin') || '返回登录页' }}
            </v-btn>
          </div>

          <!-- 3. 补充注册 / 绑定已有账户 -->
          <div v-else-if="needComplete">
            <div class="d-flex align-center mb-6">
              <v-avatar size="48" class="mr-3" color="grey-darken-3">
                <v-img v-if="oauthProfile.platformAvatar" :src="oauthProfile.platformAvatar"></v-img>
                <v-icon v-else icon="mdi-account-circle" size="36"></v-icon>
              </v-avatar>
              <div>
                <h2 class="text-h6 font-weight-bold">
                  {{ oauthProfile.platformUsername || '第三方用户' }}
                </h2>
                <span class="text-caption text-amber">
                  {{ t('oauth.authorizedPlatform') || '已连接' }} {{ oauthProfile.platform.toUpperCase() }}
                </span>
              </div>
            </div>

            <p class="text-caption opacity-70 mb-4">
              {{ t('oauth.firstTimeHint') || '这是您首次使用该第三方账号登录，请选择补充注册新账号或关联已有 Glow Prow 账号：' }}
            </p>

            <v-tabs v-model="activeTab" color="amber" grow class="mb-4">
              <v-tab value="signup">{{ t('oauth.tabNewAccount') || '补充注册新账号' }}</v-tab>
              <v-tab value="bind">{{ t('oauth.tabBindExisting') || '关联已有账号' }}</v-tab>
            </v-tabs>

            <AffixContainerView>
              <!-- 补充注册新账号 -->
              <v-window v-model="activeTab">
                <v-window-item value="signup">
                  <v-form @submit.prevent="onCompleteSignup">
                    <v-text-field
                        v-model="signupForm.username"
                        :rules="rules.username"
                        label="用户名 (Username)"
                        placeholder="设置您的唯一登录用户名"
                        variant="solo-filled"
                        density="comfortable"
                        prepend-inner-icon="mdi-account"
                        required
                    ></v-text-field>

                    <v-text-field
                        v-model="signupForm.alternativeName"
                        label="个性别名 (Nickname)"
                        placeholder="在社区与排位中展示的昵称"
                        variant="solo-filled"
                        density="comfortable"
                        prepend-inner-icon="mdi-badge-account"
                    ></v-text-field>

                    <v-text-field
                        v-model="signupForm.password"
                        :rules="rules.password"
                        label="登录密码 (Password)"
                        placeholder="至少 8 位包含字母与数字"
                        type="password"
                        variant="solo-filled"
                        density="comfortable"
                        prepend-inner-icon="mdi-lock"
                        required
                    ></v-text-field>

                    <v-text-field
                        v-model="signupForm.confirmPassword"
                        label="确认密码 (Confirm Password)"
                        placeholder="再次输入密码"
                        type="password"
                        variant="solo-filled"
                        density="comfortable"
                        prepend-inner-icon="mdi-lock-check"
                        required
                    ></v-text-field>

                    <v-text-field
                        v-model="signupForm.email"
                        label="电子邮箱 (Email - 可选)"
                        placeholder="用于接收重要安全通知"
                        variant="solo-filled"
                        density="comfortable"
                        prepend-inner-icon="mdi-email"
                    ></v-text-field>

                    <v-btn
                        type="submit"
                        class="bg-amber text-black mt-4 font-weight-bold"
                        size="large"
                        block
                        :loading="submitLoading"
                        variant="flat"
                    >
                      {{ t('oauth.completeSignupBtn') || '完成注册并登录' }}
                    </v-btn>
                  </v-form>
                </v-window-item>

                <!-- 关联已有账号 -->
                <v-window-item value="bind">
                  <v-form @submit.prevent="onCompleteBind">
                    <v-text-field
                        v-model="bindForm.username"
                        label="已有 GlowProw 用户名"
                        placeholder="输入您之前注册的用户名"
                        variant="solo-filled"
                        density="comfortable"
                        prepend-inner-icon="mdi-account-key"
                        required
                    ></v-text-field>

                    <v-text-field
                        v-model="bindForm.password"
                        label="账号密码"
                        placeholder="输入您的账号密码"
                        type="password"
                        variant="solo-filled"
                        density="comfortable"
                        prepend-inner-icon="mdi-lock"
                        required
                    ></v-text-field>

                    <v-btn
                        type="submit"
                        class="bg-amber text-black mt-4 font-weight-bold"
                        size="large"
                        block
                        :loading="submitLoading"
                        variant="flat"
                    >
                      {{ t('oauth.completeBindBtn') || '确认绑定并登录' }}
                    </v-btn>
                  </v-form>
                </v-window-item>
              </v-window>
            </AffixContainerView>
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">
.oauth-callback-window {
  min-height: calc(100vh + 2px);
  background-color: #000;
}
</style>
