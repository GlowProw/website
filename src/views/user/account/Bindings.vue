<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { apis } from '@/assets/sripts';
import { useNoticeStore } from '~/stores/noticeStore';
import AffixContainerView from '@/components/AffixContainerView.vue';

const { t } = useI18n();
const notice = useNoticeStore();

const loading = ref(false);
const actionLoading = ref<string | null>(null);
const bindings = ref<any[]>([]);

// 支持的第三方平台定义
const platformDefs = [
  { platform: 'qq', name: 'QQ 平台', icon: 'mdi-qqchat', color: '#12b7f5', desc: '支持 QQ 快捷一键登录与个人中心快速同步' },
  { platform: 'wechat', name: '微信平台', icon: 'mdi-wechat', color: '#07c160', desc: '支持微信扫码登录与公众号/小程序联动' },
  { platform: 'google', name: 'Google', icon: 'mdi-google', color: '#ea4335', desc: '支持 Google 国际通用快捷登录' },
];

onMounted(() => {
  loadBindings();
});

const loadBindings = async () => {
  try {
    loading.value = true;
    const res = await apis.userApi().getUserBindings();
    if (res?.data?.data) {
      bindings.value = res.data.data;
    }
  } catch (err: any) {
    notice.error(err?.message || '获取平台绑定列表失败');
  } finally {
    loading.value = false;
  }
};

const getBindingFor = (platform: string) => {
  return bindings.value.find((b) => b.platform.toLowerCase() === platform.toLowerCase());
};

/**
 * 绑定平台
 */
const onBindPlatform = async (platform: string) => {
  try {
    actionLoading.value = platform;
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const callbackTarget = `${currentOrigin}/oauth/callback?platform=${platform}`;

    const res = await apis.userApi().getOAuthUrl(platform, callbackTarget);
    if (res?.data?.data?.url) {
      window.location.href = res.data.data.url;
    } else {
      notice.error('获取授权链接失败');
    }
  } catch (err: any) {
    notice.error(err?.message || '发起授权失败');
  } finally {
    actionLoading.value = null;
  }
};

/**
 * 解绑平台
 */
const onUnbindPlatform = async (platform: string) => {
  if (!confirm(`确定要解除与 ${platform.toUpperCase()} 账号的绑定吗？`)) return;

  try {
    actionLoading.value = platform;
    const res = await apis.userApi().unbindOAuth(platform);
    if (res?.data?.code === 'account.bindings.unbind.ok') {
      notice.success('解绑成功');
      await loadBindings();
    } else {
      notice.error(res?.data?.message || '解绑失败');
    }
  } catch (err: any) {
    notice.error(err?.message || '解绑失败');
  } finally {
    actionLoading.value = null;
  }
};
</script>

<template>
  <div class="account-bindings">
    <AffixContainerView>
      <div class="mb-6">
        <h2 class="text-h5 font-weight-bold mb-1">
          {{ t('account.bindings.title') || '第三方平台绑定' }}
        </h2>
        <p class="text-caption opacity-70">
          {{ t('account.bindings.subtitle') || '绑定第三方平台可享受一键快捷登录与账号同步。' }}
        </p>
      </div>

      <v-progress-linear v-if="loading" indeterminate color="amber" class="mb-4"></v-progress-linear>

      <!-- 第三方主流登录平台 -->
      <v-row dense>
        <v-col cols="12" md="6" v-for="item in platformDefs" :key="item.platform">
          <v-card variant="outlined" class="binding-card pa-4 mb-3">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-avatar size="44" :color="item.color" class="mr-3 text-white">
                  <v-icon :icon="item.icon" size="24"></v-icon>
                </v-avatar>
                <div>
                  <div class="d-flex align-center ga-2">
                    <span class="font-weight-bold">{{ item.name }}</span>
                    <v-chip
                      size="x-small"
                      :color="getBindingFor(item.platform) ? 'green' : 'grey'"
                      variant="flat"
                    >
                      {{ getBindingFor(item.platform) ? (t('account.bindings.bound') || '已绑定') : (t('account.bindings.unbound') || '未绑定') }}
                    </v-chip>
                  </div>
                  <div v-if="getBindingFor(item.platform)" class="text-caption opacity-80 mt-1 d-flex align-center">
                    <span class="text-amber">{{ getBindingFor(item.platform)?.platformUsername || '已授权用户' }}</span>
                  </div>
                  <div v-else class="text-caption opacity-50 mt-1">
                    {{ item.desc }}
                  </div>
                </div>
              </div>

              <div>
                <v-btn
                  v-if="getBindingFor(item.platform)"
                  variant="text"
                  color="red"
                  size="small"
                  :loading="actionLoading === item.platform"
                  @click="onUnbindPlatform(item.platform)"
                >
                  {{ t('account.bindings.unbindBtn') || '解除绑定' }}
                </v-btn>
                <v-btn
                  v-else
                  variant="flat"
                  class="bg-amber text-black font-weight-bold"
                  size="small"
                  :loading="actionLoading === item.platform"
                  @click="onBindPlatform(item.platform)"
                >
                  {{ t('account.bindings.bindBtn') || '立即绑定' }}
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </AffixContainerView>
  </div>
</template>

<style scoped lang="less">
.account-bindings {
  .binding-card {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    transition: all 0.25s ease;

    &:hover {
      border-color: rgba(255, 193, 7, 0.3);
      background: rgba(255, 255, 255, 0.04);
    }
  }
}
</style>
