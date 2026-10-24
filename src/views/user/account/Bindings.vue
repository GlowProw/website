<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {apis} from '@/assets/sripts';
import {useNoticeStore} from '~/stores/noticeStore';
import Loading from '@/components/Loading.vue';
import AffixBoxHasTitleView from '@/components/AffixBoxHasTitleView.vue';
import discordLogo from '@/assets/images/logos/discord.svg';

const {t} = useI18n();
const notice = useNoticeStore();

const loading = ref(false);
const actionLoading = ref<string | null>(null);
const bindings = ref<any[]>([]);
const qqBotDialog = ref(false);

// AI 连接器（MCP）已授权应用
const aiConnectors = ref<any[]>([]);
const aiConnectorLoading = ref(false);
const aiConnectorDialog = ref(false);
const aiRevokeLoading = ref<string | null>(null);
// AI 连接器配置（来自后端 config.aiMcp）：名称 / 开关 / 端点地址
const aiConnectorInfo = ref<any>({});

// 第三方平台定义
const platformDefs = [
  {platform: 'qq', icon: 'mdi-qqchat', color: '#12b7f5', bindMode: 'oauth'},
  {platform: 'google', icon: 'mdi-google', color: '#ea4335', bindMode: 'oauth'},
  {platform: 'discord', icon: 'mdi-discord', color: '#5865f2', bindMode: 'oauth'},
  {platform: 'glow-prow-qq-bot', icon: 'mdi-robot-outline', color: '#38545b', bindMode: 'bot'},
] as const;

onMounted(() => {
  loadBindings();
  loadAiConnectors();
});

/**
 * 加载第三方平台账号绑定列表
 */
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

/**
 * 按平台标识取当前用户对应的绑定记录，未绑定时返回 undefined
 */
const getBindingFor = (platform: string) => {
  return bindings.value.find((b) => b.platform.toLowerCase() === platform.toLowerCase());
};

/**
 * 绑定平台
 */
const onBindPlatform = async (platform: string) => {
  // QQ 机器人平台无法从网站直接发起授权，改为弹窗引导用户去私聊机器人
  if (platform === 'glow-prow-qq-bot') {
    qqBotDialog.value = true;
    return;
  }

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
  const platformLabel = t(`account.bindings.platforms.${platform}.name`, platform.toUpperCase());
  const confirmMsg = t('account.bindings.unbindConfirm', {platform: platformLabel});
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

/**
 * 加载已授权的 AI 连接器（MCP）应用列表
 */
const loadAiConnectors = async () => {
  try {
    aiConnectorLoading.value = true;
    const res = await apis.userApi().getAiConnectors();
    const d = res?.data?.data || res?.data;
    aiConnectors.value = d?.apps || [];
    // 连接器配置（config.aiMcp）：enabled / name / url / docsUrl
    aiConnectorInfo.value = d?.connector || {};
  } catch (err: any) {
    notice.error(err?.message);
  } finally {
    aiConnectorLoading.value = false;
  }
};

/** AI 连接器展示名：优先用后端 config.aiMcp.name，回退语言包 */
const aiConnectorName = computed(() => aiConnectorInfo.value?.name || t('account.bindings.platforms.ai-connector.name'));

/** 复制 MCP 连接器地址 */
const aiConnectorUrlCopied = ref(false);
const copyAiConnectorUrl = async () => {
  const url = aiConnectorInfo.value?.url;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    aiConnectorUrlCopied.value = true;
    setTimeout(() => (aiConnectorUrlCopied.value = false), 2000);
  } catch {
    /* 剪贴板不可用时静默失败 */
  }
};

/**
 * 断开指定 AI 连接器应用的授权
 */
const onRevokeAiConnector = async (clientId: string, clientName: string) => {
  const confirmMsg = t('account.bindings.aiConnector.revokeConfirm', {app: clientName});
  if (!confirm(confirmMsg)) return;

  try {
    aiRevokeLoading.value = clientId;
    const res = await apis.userApi().revokeAiConnector(clientId);
    if (res?.data?.code === 'account.aiConnectors.revoked') {
      notice.success(t('account.bindings.aiConnector.revoked'));
      await loadAiConnectors();
    } else {
      notice.error(res?.data?.message || t('account.bindings.aiConnector.revokeFailed'));
    }
  } catch (err: any) {
    notice.error(err?.message || t('account.bindings.aiConnector.revokeFailed'));
  } finally {
    aiRevokeLoading.value = null;
  }
};

/**
 * 格式化授权时间
 */
const formatConnectorTime = (value: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
            <v-card-title class="py-16 d-flex justify-start align-center text-center bg-black mb-4"
                          :color="item.color">
              <v-img v-if="item.platform === 'discord'" :src="discordLogo" alt="Discord" width="60" height="60" class="mx-auto" />
              <v-icon v-else :icon="item.icon" size="60" class="mx-auto"></v-icon>
            </v-card-title>

            <v-card-text class="d-flex align-start justify-space-between mb-3">
              <div class="d-flex align-center">
                <div>
                  <div class="d-flex align-center ga-2">
                    <span class="font-weight-bold text-body-1 u">{{ t(`account.bindings.platforms.${item.platform}.name`) }}</span>
                    <v-chip
                        size="x-small"
                        :color="getBindingFor(item.platform) ? 'amber' : 'default'"
                        variant="tonal">
                      {{ getBindingFor(item.platform) ? t('account.bindings.bound') : t('account.bindings.unbound') }}
                    </v-chip>
                  </div>
                  <div class="text-caption opacity-60 mt-1">
                    {{ t(`account.bindings.platforms.${item.platform}.desc`) }}
                  </div>

                  <div v-if="getBindingFor(item.platform)" class="mt-2">
                    <p class="text-amber-darken-1" v-html="t('account.bindings.boundAccount', { username: `<u class='u'>${getBindingFor(item.platform)?.platformUsername}</u>` || t('account.bindings.authorized') })"></p>
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

    <!-- AI 连接器（MCP）卡片 S -->
    <AffixBoxHasTitleView class="mt-6">
      <v-row>
        <v-col cols="12">
          <v-card border variant="text" class="pa-4 hover-card transition-all">
            <div class="d-flex align-center flex-wrap ga-4">
              <v-avatar color="amber" variant="tonal" size="48" rounded="lg">
                <v-icon icon="mdi-robot-outline" size="26"></v-icon>
              </v-avatar>

              <div>
                <div class="d-flex align-center ga-2">
                  <span class="font-weight-bold text-body-1 u">{{ aiConnectorName }}</span>
                  <v-chip
                      size="x-small"
                      :color="aiConnectors.length ? 'amber' : 'default'"
                      variant="tonal">
                    {{
                      aiConnectors.length
                          ? t('account.bindings.aiConnector.connected', {count: aiConnectors.length})
                          : t('account.bindings.aiConnector.notConnected')
                    }}
                  </v-chip>
                  <v-chip
                      v-if="aiConnectorInfo.enabled === false"
                      size="x-small"
                      color="error"
                      variant="tonal">
                    {{ t('account.bindings.aiConnector.disabled') }}
                  </v-chip>
                </div>
                <div class="text-caption opacity-60 mt-1">
                  {{ t('account.bindings.platforms.ai-connector.desc') }}
                </div>

                <!-- MCP 连接器地址（config.aiMcp.endpoint 按环境动态解析） -->
                <div v-if="aiConnectorInfo.url" class="d-flex align-center ga-2 mt-2 flex-wrap">
                  <code class="text-amber text-caption">{{ aiConnectorInfo.url }}</code>
                  <v-btn
                      size="x-small"
                      variant="text"
                      density="compact"
                      :icon="aiConnectorUrlCopied ? 'mdi-check' : 'mdi-content-copy'"
                      @click="copyAiConnectorUrl">
                  </v-btn>
                </div>
              </div>

              <v-spacer></v-spacer>

              <div class="d-flex ga-2">
                <v-btn
                    variant="tonal"
                    prepend-icon="mdi-book-open-variant"
                    :to="{ name: 'AIConnector' }">
                  {{ t('account.bindings.aiConnector.docs') }}
                </v-btn>
                <v-btn
                    variant="tonal"
                    color="amber"
                    prepend-icon="mdi-cog-outline"
                    :loading="aiConnectorLoading"
                    @click="aiConnectorDialog = true">
                  {{ t('account.bindings.aiConnector.manage') }}
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <template v-slot:title>
        {{ t('account.bindings.aiConnector.title') }}
      </template>
    </AffixBoxHasTitleView>
    <!-- AI 连接器（MCP）卡片 E -->

    <!-- AI 连接器管理弹窗 S -->
    <v-dialog :model-value="aiConnectorDialog" max-width="560" @update:model-value="aiConnectorDialog = $event">
      <v-card class="bg-grey-darken-4 pa-2">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon icon="mdi-robot-outline" color="amber"></v-icon>
          {{ t('account.bindings.aiConnector.dialogTitle') }}
        </v-card-title>
        <v-card-text class="text-body-2">
          <p class="opacity-60 mb-4">{{ t('account.bindings.aiConnector.dialogDesc') }}</p>

          <v-list v-if="aiConnectors.length" bg-color="transparent" class="px-0">
            <v-list-item
                v-for="app in aiConnectors"
                :key="app.clientId"
                class="px-0">
              <template v-slot:prepend>
                <v-avatar color="amber" variant="tonal" size="36" rounded="lg">
                  <v-icon icon="mdi-robot-outline" size="18"></v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-bold">{{ app.clientName || app.clientId }}</v-list-item-title>
              <v-list-item-subtitle class="opacity-60">
                {{ t('account.bindings.aiConnector.authorizedAt') }}：{{ formatConnectorTime(app.createdAt) }}
                <span v-if="app.lastUsedAt"> · {{ t('account.bindings.aiConnector.lastUsedAt') }}：{{ formatConnectorTime(app.lastUsedAt) }}</span>
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-btn
                    variant="tonal"
                    color="error"
                    size="small"
                    :loading="aiRevokeLoading === app.clientId"
                    @click="onRevokeAiConnector(app.clientId, app.clientName || app.clientId)">
                  {{ t('account.bindings.aiConnector.revoke') }}
                </v-btn>
              </template>
            </v-list-item>
          </v-list>

          <v-alert v-else type="info" variant="tonal" density="compact">
            {{ t('account.bindings.aiConnector.empty') }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn variant="tonal" color="amber" @click="aiConnectorDialog = false">
            {{ t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- AI 连接器管理弹窗 E -->

    <v-dialog :model-value="qqBotDialog" max-width="460" @update:model-value="qqBotDialog = $event">
      <v-card class="bg-grey-darken-4 pa-2">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon icon="mdi-robot-outline" color="amber"></v-icon>
          {{ t('account.bindings.qqBot.dialogTitle') }}
        </v-card-title>
        <v-card-text class="text-body-2">
          <ol class="pl-4 mb-3">
            <li class="mb-2">{{ t('account.bindings.qqBot.step1') }}</li>
            <li class="mb-2">{{ t('account.bindings.qqBot.step2') }}</li>
            <li>{{ t('account.bindings.qqBot.step3') }}</li>
          </ol>
          <v-alert type="info" variant="tonal" density="compact" class="mb-1">
            {{ t('account.bindings.qqBot.hint') }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn variant="tonal" color="amber" @click="qqBotDialog = false">
            {{ t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-overlay :model-value="loading" contained class="d-flex align-center justify-center">
      <Loading size="50"></Loading>
    </v-overlay>
  </div>
</template>

<style scoped lang="less">
</style>
