<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { apis } from '@/assets/sripts';
import { useNoticeStore } from '~/stores/noticeStore';
import discordLogo from '@/assets/images/logos/discord.svg';

const props = withDefaults(defineProps<{
  mode?: 'signin' | 'signup' | 'bind';
  redirectUrl?: string;
}>(), {
  mode: 'signin',
  redirectUrl: '',
});

const { t } = useI18n();
const notice = useNoticeStore();

const loadingPlatform = ref<string | null>(null);
const providers = ref<Array<{ platform: string; name: string; icon: string }>>([
  { platform: 'qq', name: 'QQ', icon: 'mdi-qqchat' },
  { platform: 'wechat', name: '微信', icon: 'mdi-wechat' },
  { platform: 'google', name: 'Google', icon: 'mdi-google' },
  { platform: 'discord', name: 'Discord', icon: 'mdi-discord' },
]);

onMounted(async () => {
  try {
    const res = await apis.userApi().getOAuthProviders();
    if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
      providers.value = res.data.data.filter((p: any) => p.platform !== 'bot');
    }
  } catch (err) {
    // 降级使用默认列表
  }
});

const onOAuthLogin = async (platform: string) => {
  try {
    loadingPlatform.value = platform;
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const callbackTarget = `${currentOrigin}/oauth/callback?platform=${platform}`;

    const res = await apis.userApi().getOAuthUrl(platform, callbackTarget);
    if (res?.data?.data?.url) {
      window.location.href = res.data.data.url;
    } else {
      notice.error(t('oauth.urlError') || '获取授权链接失败');
    }
  } catch (err: any) {
    notice.error(err?.message || t('oauth.authFailed') || '第三方授权启动失败');
  } finally {
    loadingPlatform.value = null;
  }
};
</script>

<template>
  <div class="third-party-login-widget mt-6 mb-2">
    <div class="d-flex align-center my-4">
      <v-divider class="flex-grow-1 opacity-20"></v-divider>
      <span class="mx-3 text-caption opacity-60 text-no-wrap">
        {{ mode === 'bind' ? t('oauth.bindTitle') || '快捷关联第三方平台' : t('oauth.quickLogin') || '第三方快捷登录' }}
      </span>
      <v-divider class="flex-grow-1 opacity-20"></v-divider>
    </div>

    <v-row dense justify="center" class="ga-2">
      <v-col cols="auto" v-for="item in providers" :key="item.platform">
        <v-btn
          :variant="item.platform === 'google' ? 'outlined' : 'flat'"
          :class="['oauth-btn', `oauth-btn-${item.platform}`]"
          size="42"
          icon
          :loading="loadingPlatform === item.platform"
          @click="onOAuthLogin(item.platform)"
          :title="item.name"
        >
          <img v-if="item.platform === 'discord'" :src="discordLogo" alt="Discord" width="22" height="22">
          <v-icon v-else size="22" :icon="item.icon"></v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">
.third-party-login-widget {
  .oauth-btn {
    border-radius: 50%;
    transition: all 0.25s ease;
  }

  .oauth-btn-qq {
    background-color: #12b7f5 !important;
    color: #fff !important;
  }

  .oauth-btn-wechat {
    background-color: #07c160 !important;
    color: #fff !important;
  }

  .oauth-btn-google {
    border-color: rgba(255, 255, 255, 0.2) !important;
    background-color: rgba(255, 255, 255, 0.08) !important;
    color: #ea4335 !important;
  }

  .oauth-btn-discord {
    background-color: #5865f2 !important;
    color: #fff !important;
  }
}
</style>
