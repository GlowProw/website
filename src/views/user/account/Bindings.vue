<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { apis } from '@/assets/sripts';
import { useNoticeStore } from '~/stores/noticeStore';
import Loading from '@/components/Loading.vue';
import AffixBoxHasTitleView from '@/components/AffixBoxHasTitleView.vue';
import discordLogo from '@/assets/images/logos/discord.svg';

const { t } = useI18n();
const notice = useNoticeStore();

const loading = ref(false);
const actionLoading = ref<string | null>(null);
const bindings = ref<any[]>([]);

// 支持的第三方平台定义
const platformDefs = [
  { platform: 'qq', icon: 'mdi-qqchat', color: '#12b7f5' },
  { platform: 'wechat', icon: 'mdi-wechat', color: '#07c160' },
  { platform: 'google', icon: 'mdi-google', color: '#ea4335' },
  { platform: 'discord', icon: 'mdi-discord', color: '#5865f2' },
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
    notice.error(err?.message);
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
      notice.error(t('account.bindings.getAuthUrlFailed'));
    }
  } catch (err: any) {
    notice.error(err?.message || t('account.bindings.getAuthUrlFailed'));
  } finally {
    actionLoading.value = null;
  }
};

/**
 * 解绑平台
 */
const onUnbindPlatform = async (platform: string) => {
  const confirmMsg = t('account.bindings.unbindConfirm', { platform: platform.toUpperCase() });
  if (!confirm(confirmMsg)) return;

  try {
    actionLoading.value = platform;
    const res = await apis.userApi().unbindOAuth(platform);
    if (res?.data?.code === 'account.bindings.unbind.ok') {
      notice.success(t('account.bindings.unbindSuccess'));
      await loadBindings();
    } else {
      notice.error(res?.data?.message || t('account.bindings.unbindFailed'));
    }
  } catch (err: any) {
    notice.error(err?.message || t('account.bindings.unbindFailed'));
  } finally {
    actionLoading.value = null;
  }
};

defineOptions({
  name: 'AccountBindings'
});
</script>

<template>
  <div>
    <!-- 顶部标题区域 S -->
    <div class="d-flex align-center justify-between mb-6">
      <div>
        <p class="text-caption opacity-60">
          {{ t('account.bindings.subtitle') }}
        </p>
      </div>

      <v-spacer></v-spacer>

      <v-btn
          size="x-small"
          variant="tonal"
          icon="mdi-refresh"
          @click="loadBindings"
          :loading="loading">
      </v-btn>
    </div>
    <!-- 顶部标题区域 E -->

    <!-- 第三方主流登录平台卡片 S -->
     <AffixBoxHasTitleView>
        <v-row>
      <v-col cols="12" md="4" v-for="item in platformDefs" :key="item.platform">
        <v-card border variant="text" class="h-100 hover-card transition-all d-flex flex-column justify-space-between">
          <v-card-title class="py-16 text-center bg-black mb-4 text-h4 u"
          :color="item.color">
            <img v-if="item.platform === 'discord'" :src="discordLogo" alt="Discord" width="60" height="60">
            <v-icon v-else :icon="item.icon" size="60"></v-icon>
          </v-card-title>
          
          <v-card-text class="d-flex align-start justify-space-between mb-3">
            <div class="d-flex align-center">
              <div>
                <div class="d-flex align-center ga-2">
                  <span class="font-weight-bold text-body-1">{{ t(`account.bindings.platforms.${item.platform}.name`) }}</span>
                  <v-chip
                      size="x-small"
                      :color="getBindingFor(item.platform) ? 'amber' : 'default'"
                      variant="tonal">
                    {{ getBindingFor(item.platform) ? t('account.bindings.bound') : t('account.bindings.unbound') }}
                  </v-chip>
                </div>
                <div v-if="getBindingFor(item.platform)" class="text-amber mt-1">
                  {{ t('account.bindings.boundAccount', { username: getBindingFor(item.platform)?.platformUsername || t('account.bindings.authorized') }) }}
                </div>
                <div v-else class="text-caption opacity-60 mt-1">
                  {{ t(`account.bindings.platforms.${item.platform}.desc`) }}
                </div>
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="d-flex justify-end pt-2">
            <v-btn
                v-if="getBindingFor(item.platform)"
                variant="tonal"
                color="error"
                :loading="actionLoading === item.platform"
                @click="onUnbindPlatform(item.platform)">
              {{ t('account.bindings.unbindBtn') }}
            </v-btn>
            <v-btn
                v-else
                variant="tonal"
                color="amber"
                prepend-icon="mdi-link-plus"
                :loading="actionLoading === item.platform"
                @click="onBindPlatform(item.platform)">
              {{ t('account.bindings.bindBtn') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

      <template v-slot:title>
        {{ t('account.bindings.title') }}
      </template>
     </AffixBoxHasTitleView>
    <!-- 第三方主流登录平台卡片 E -->

    <v-overlay :model-value="loading" contained class="d-flex align-center justify-center">
      <Loading></Loading>
    </v-overlay>
  </div>
</template>

<style scoped lang="less">
</style>
