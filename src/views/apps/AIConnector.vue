<template>
  <v-card height="200px">
    <template v-slot:image>
      <Silk
          :speed="3"
          :scale=".7"
          :color="'#1c1c1c'"
          :noise-intensity="0.1"
          :rotation="-.6"
          class="bg-black">
      </Silk>
    </template>
    <template v-slot:default>
      <v-breadcrumbs density="compact" class="ma-0 pa-0">
        <v-container>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/apps">{{ t('apps.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('apps.detail') }}</v-breadcrumbs-item>
        </v-container>
      </v-breadcrumbs>
      <v-divider opacity=".01"></v-divider>

      <v-container class="position-relative">
        <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
          <v-icon icon="mdi-robot-outline" size="120"></v-icon>
          <v-icon icon="mdi-connection" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>

  <v-divider opacity=".06"></v-divider>

  <!-- 简介与特性 S -->
  <v-container class="py-8">
    <v-row>
      <v-col cols="12" lg="7">
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ t('apps.aiConnector.description') }}
        </p>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="12" lg="4">
        <div class="d-flex ga-2 align-center flex-wrap">
          <v-chip inline
                  v-for="(tag, tagIndex) in appApps.getAppData(id).tags"
                  :key="tagIndex"
                  class="bg-amber badge-flavor text-center text-black">{{ tag }}
          </v-chip>
        </div>
        <div class="d-flex ga-2 align-center mt-3 flex-wrap">
          <v-chip inline
                  v-for="(feature, key) in connectorFeatures"
                  :key="key"
                  class="bg-amber badge-flavor text-black">
            {{ feature }}
          </v-chip>
        </div>
      </v-col>
    </v-row>
  </v-container>
  <!-- 简介与特性 E -->

  <!-- 如何连接 S -->
  <div class="bg-black mb-5 py-10">
    <v-container>
      <v-row>
        <v-col cols="12" lg="6">
          <!-- 连接器 URL S -->
          <div>
            <h2 class="mb-2 text-h4"> {{ t('apps.aiConnector.connector.title') }}</h2>

            <p class="text-medium-emphasis mb-6">
              {{ t('apps.aiConnector.connector.subtitle') }}
            </p>

            <v-card variant="flat" class="pa-4 connector-url-card">
              <div class="d-flex align-center ga-3 flex-wrap">
                <code class="text-amber connector-url u">{{ connectorUrl }}</code>
                <v-spacer></v-spacer>
                <v-btn color="amber" variant="flat" prepend-icon="mdi-content-copy"
                       @click="copyConnectorUrl">
                  {{ copied ? t('apps.aiConnector.connector.copied') : t('apps.aiConnector.connector.copy') }}
                </v-btn>
              </div>
            </v-card>

            <v-alert type="info" variant="tonal" density="compact" class="mt-4" border="start">
              {{ t('apps.aiConnector.connector.note') }}
            </v-alert>
          </div>
          <!-- 连接器 URL E -->
        </v-col>
        <!-- 可以问什么 S -->
        <v-col cols="12" lg="6">
          <AffixBoxHasTitleView>
            <template v-slot:title>
              {{ t('apps.aiConnector.ask.title') }}
            </template>

            <p class="text-body-1 text-medium-emphasis mb-6">
              {{ t('apps.aiConnector.ask.note') }}
            </p>

            <v-row density="compact">
              <v-col cols="12" md="12" v-for="(example, key) in askExamples" :key="key">
                <v-card variant="flat" class="h-100 ask-card">
                  <div class="d-flex align-center ga-4">
                    <v-avatar color="amber" variant="tonal" size="35" rounded="lg">
                      <v-icon :icon="askIcons[key]" size="15"></v-icon>
                    </v-avatar>
                    <span class="text-body-1">“{{ example }}”</span>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </AffixBoxHasTitleView>
        </v-col>
        <!-- 可以问什么 E -->
      </v-row>
    </v-container>
  </div>
  <!-- 如何连接 E -->

  <v-container>
    <v-row class="">
      <v-col cols="12" lg="3">
        <div class="d-flex align-center ga-2 mb-2">
          <h3 class="text-h4 font-weight-bold">{{ t('apps.aiConnector.connect.title') }}</h3>
        </div>
        <p class="text-body-1 text-medium-emphasis mb-6">
          {{ t('apps.aiConnector.connect.subtitle') }}
        </p>
      </v-col>
      <v-col cols="12" lg="9" class="connect-card">
        <v-tabs v-model="connectTab" bg-color="transparent" color="amber" grow>
          <v-tab v-for="tab in connectTabs" :key="tab" :value="tab">
            {{ t(`apps.aiConnector.connect.${tab}`) }}
          </v-tab>
        </v-tabs>

        <v-card-text class="pa-6 rounded-lg bg-transparent">
          <v-window v-model="connectTab" selected-class="bg-transparent" class="bg-transparent">
            <v-window-item class="bg-transparent" v-for="tab in connectTabs" :key="tab" :value="tab">
              <ol class="steps pl-6 mb-0">
                <li v-for="(step, index) in connectSteps(tab)" :key="index" class="text-body-1 mb-3">
                  {{ step }}
                </li>
              </ol>

              <template v-if="tab === 'claudeCode'">
                <div class="text-caption opacity-60 mt-4 mb-2">{{ t('apps.aiConnector.connect.codeBlockTitle') }}</div>
                <pre class="code-block">{{ t('apps.aiConnector.connect.command') }}</pre>
              </template>

              <template v-if="tab === 'other'">
                <div class="text-caption opacity-60 mt-4 mb-2">{{ t('apps.aiConnector.connect.codeBlockTitle') }}</div>
                <pre class="code-block">{{ configExample }}</pre>
              </template>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-col>
    </v-row>
  </v-container>

  <!-- 常见问题 S -->
  <v-container class="my-10">
    <v-row>
      <v-col cols="12" lg="3">
        <h3 class="text-h4 font-weight-bold">{{ t('apps.aiConnector.faq.title') }}</h3>
      </v-col>
      <v-col>
        <!-- 管理或断开连接 S -->
        <div class="mb-8">
          <v-row align="center">
            <v-col cols="12" md="8">
              <div class="d-flex align-center ga-2 mb-2">
                <h3 class="text-h5 font-weight-bold">{{ t('apps.aiConnector.manage.title') }}</h3>
              </div>
              <p class="text-body-1 text-medium-emphasis mb-0">
                {{ t('apps.aiConnector.manage.desc') }}
              </p>
            </v-col>
            <v-spacer></v-spacer>
            <v-col cols="12" md="auto" class="mt-4 mt-md-0">
              <v-btn variant="flat" size="large"
                     :to="{ name: 'AccountBindings' }">
                {{ t('apps.aiConnector.manage.action') }}
              </v-btn>
            </v-col>
          </v-row>
        </div>
        <!-- 管理或断开连接 E -->

        <!-- 计划与限制 S -->
        <div class="mb-8">
          <div class="d-flex align-center ga-2 mb-2">
            <h3 class="text-h5 font-weight-bold">{{ t('apps.aiConnector.plans.title') }}</h3>
          </div>
          <p class="text-body-1 text-medium-emphasis mb-6">
            {{ t('apps.aiConnector.plans.subtitle') }}
          </p>

          <v-row>
            <v-col cols="12" md="6">
              <v-card rounded="30" variant="flat" class="h-100 pa-5">
                <div class="d-flex align-center justify-space-between">
                  <span class="text-h6 font-weight-bold">{{ t('apps.aiConnector.plans.free') }}</span>
                  <v-chip color="amber" variant="tonal" class="font-weight-bold">
                    {{ t('apps.aiConnector.plans.freeLimit') }}
                  </v-chip>
                </div>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  {{ t('apps.aiConnector.plans.freeDesc') }}
                </p>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card rounded="30" variant="flat" class="h-100 pa-5 plan-card--highlight">
                <div class="d-flex align-center justify-space-between">
                  <span class="text-h6 font-weight-bold">{{ t('apps.aiConnector.plans.subscriber') }}</span>
                  <v-chip color="amber" variant="flat" class="font-weight-bold text-black">
                    {{ t('apps.aiConnector.plans.subscriberLimit') }}
                  </v-chip>
                </div>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  {{ t('apps.aiConnector.plans.subscriberDesc') }}
                </p>
                <v-btn color="amber" variant="tonal"
                       :to="{ name: 'PortalSettingSubscriptions' }">
                  {{ t('apps.aiConnector.plans.subscribe') }}
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </div>
        <!-- 计划与限制 E -->

        <v-expansion-panels variant="accordion" gap="10">
          <v-expansion-panel rounded="30" v-for="(item, index) in faqItems" :key="index">
            <v-expansion-panel-title class="text-body-1 font-weight-bold">
              {{ item.q }}
            </v-expansion-panel-title>
            <v-expansion-panel-text class="text-body-2 text-medium-emphasis">
              {{ item.a }}
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
  </v-container>
  <!-- 常见问题 E -->
</template>

<script setup lang="ts">
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {appApps, http} from "@/assets/sripts/index";

import Silk from "@/components/Silk.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t, tm} = useI18n();
const id = ref('aiConnector');

/**
 * MCP 连接器地址：按当前环境的 API 配置动态生成
 * （开发环境 http://localhost:3000/api/mcp，生产 https://api.glow-prow.top/api/mcp）
 */
const apiBase = String(http.globalUrl?.location || '').replace(/\/+$/, '');
const connectorUrl = `${apiBase}/mcp`;

/** 其他应用的示例配置 */
const configExample = `{
  "mcpServers": {
    "glow-prow": {
      "url": "${connectorUrl}"
    }
  }
}`;

const copied = ref(false);

/** 特性标签：描述区与展示区共用 */
const connectorFeatures = computed(() => [
  t('apps.aiConnector.features.assembly'),
  t('apps.aiConnector.features.codex'),
  t('apps.aiConnector.features.drops'),
  t('apps.aiConnector.features.login'),
]);

/** 示例问题 */
const askExamples = computed(() => ({
  assembly: t('apps.aiConnector.ask.assembly'),
  codex: t('apps.aiConnector.ask.codex'),
  drops: t('apps.aiConnector.ask.drops'),
  calendar: t('apps.aiConnector.ask.calendar'),
}));

const askIcons: Record<string, string> = {
  assembly: 'mdi-sail-boat',
  codex: 'mdi-book-open-variant',
  drops: 'mdi-gift-outline',
  calendar: 'mdi-calendar-month-outline',
};

/** 如何连接 */
const connectTabs = ['claude', 'claudeCode', 'chatgpt', 'grok', 'other'];
const connectTab = ref('claude');

const connectSteps = (tab: string): string[] => {
  const steps = tm(`apps.aiConnector.connect.steps.${tab}`) as unknown;
  return Array.isArray(steps) ? (steps as string[]) : [];
};

/** 常见问题 */
const faqItems = computed(() => {
  const items = tm('apps.aiConnector.faq.items') as unknown;
  return Array.isArray(items) ? (items as Array<{ q: string; a: string }>) : [];
});

/** 复制连接器 URL */
const copyConnectorUrl = async () => {
  try {
    await navigator.clipboard.writeText(connectorUrl);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    // 剪贴板不可用（非安全上下文等）时退回选中复制
    const input = document.createElement('input');
    input.value = connectorUrl;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      copied.value = true;
      setTimeout(() => (copied.value = false), 2000);
    } catch {
      /* ignore */
    } finally {
      document.body.removeChild(input);
    }
  }
};

defineOptions({
  name: 'AIConnectorView'
});
</script>

<style scoped lang="less">
.badge-flavor {
  background: rgba(255, 215, 0, 0.2);
}

.connector-url-card,
.connect-card,
.ask-card,
.plan-card {
  background: rgba(255, 255, 255, 0.04);
}

.plan-card--highlight {
  background: rgba(255, 193, 7, 0.06);
}

.connector-url {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 15px;
  word-break: break-all;
}

.code-block {
  background: rgba(0, 0, 0, 0.45);
  border-radius: 8px;
  padding: 14px 16px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  white-space: pre-wrap;
  word-break: break-all;
}

.steps li::marker {
  color: #ffc107;
  font-weight: 700;
}
</style>
