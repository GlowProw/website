<template>
  <div>
    <v-card height="200px" class="header-card">
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
        <v-container class="mt-4 position-relative">
          <v-breadcrumbs>
            <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
            <v-breadcrumbs-divider></v-breadcrumbs-divider>
            <v-breadcrumbs-item to="/apps">{{ t('apps.title') }}</v-breadcrumbs-item>
            <v-breadcrumbs-divider></v-breadcrumbs-divider>
            <v-breadcrumbs-item>{{ t('apps.apiDocs.name') }}</v-breadcrumbs-item>
          </v-breadcrumbs>

          <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
            <v-icon icon="mdi-api" size="120"></v-icon>
            <v-icon icon="mdi-code-json" size="120"></v-icon>
          </div>
        </v-container>
      </template>
    </v-card>

    <v-container class="py-0">
      <v-row>
        <v-col cols="12">
          <v-tabs
              center-active
              stacked
              v-model="activeTab">
            <v-tab
                v-for="tab in apiTabs"
                :key="tab.value"
                :variant="activeTab === tab.value ? 'tonal' : 'text'"
                :color="activeTab === tab.value ? 'amber' : 'default'"
                @click="activeTab = tab.value">
              {{ tab.label }}
            </v-tab>
          </v-tabs>
        </v-col>
      </v-row>
    </v-container>
    <v-divider></v-divider>

    <v-container>
      <v-row>
        <v-col cols="8">
          <AffixBoxHasTitleView>
            <p class="text-subtitle-1 text-medium-emphasis mb-5">
              面向普通开发者开放的 《碧海黑帆》 游戏数据与资源图片服务。选择接口、填写参数， 即可在下方发起真实请求。
            </p>

            <p class="text-subtitle-1 text-medium-emphasis mb-5">
              闪耀船首提供 本体后端服务接口 / CDN资源服务，以方便社区进行二次开发，帮助社区完善《碧海黑帆》数据。遵循对应项目协议条款(/zh-CN/setting/about)，具体阅读《服务条款》和《隐私协议》内容
            </p>
            <template v-slot:title>描述</template>
          </AffixBoxHasTitleView>
        </v-col>

        <v-col cols="12">
          <AffixBoxHasTitleView>
            <div class="scalar-wrapper position-relative">
              <div v-if="loading" class="py-16 text-center">
                <Loading size="120"></Loading>
              </div>

              <!-- 错误提示 -->
              <div v-if="error" class="py-16 text-center px-4">
                <v-alert
                    type="warning"
                    variant="tonal"
                    max-width="600"
                    class="mx-auto mb-4 text-start">
                  <p class="font-weight-bold mb-1">未能成功拉取 OpenAPI 规范数据</p>
                  <p class="text-caption opacity-80">{{ error }}</p>
                </v-alert>
                <v-btn color="amber" variant="tonal" prepend-icon="mdi-refresh" @click="initScalar">
                  重试加载
                </v-btn>
              </div>

              <!-- Scalar 挂载容器 -->
              <div
                  id="val-api-reference"
                  ref="scalarContainerRef"
                  class="scalar-container"
                  v-show="!loading && !error">
              </div>
            </div>

            <template v-slot:title>
              Apis
            </template>
          </AffixBoxHasTitleView>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {conf, http} from "@/assets/sripts";
import {generateAuthGpHeader} from "@/assets/sripts/fingerprint_auth";
import {useAuthStore} from "~/stores/userAccountStore";
import Silk from "@/components/Silk.vue";
import Loading from "@/components/Loading.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t, locale} = useI18n();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref<string | null>(null);
const scalarContainerRef = ref<HTMLElement | null>(null);
let scalarInstance: any = null;
let abortController: AbortController | null = null;

const apiTabs = [
  {value: 'backend', label: '后端接口'},
  {value: 'assets', label: 'CDN资源 (图片与训练模型)'},
  {value: 'lang', label: '多语言翻译 (glow-prow-data-languages)'},
] as const;
type ApiTab = typeof apiTabs[number]['value'];
const activeTab = ref<ApiTab>('backend');

/**
 * 基于全局 api_config 配置计算 OpenAPI 规范文件拉取地址
 */
const specUrl = computed(() => {
  const base = http.globalUrl?.location || '/api/';
  return `${base.replace(/\/+$/, '')}/openapi.json`;
});

/** 静态 spec 路径，放在 public 目录下 */
const assetsSpecUrl = '/assets-api.json';
const langSpecUrl = '/lang-api.json';

/** 当前 tab 对应的 spec 地址 */
const currentSpecUrl = computed(() => {
  if (activeTab.value === 'assets') return assetsSpecUrl;
  if (activeTab.value === 'lang') return langSpecUrl;
  return specUrl.value;
});

/**
 * 基于全局 api_config 配置计算 API 发起请求的目标 Host 服务器地址
 */
const apiBaseOrigin = computed(() => {
  return 'http://localhost:3000';
  const prod = (conf.CONF.child as any)[conf.CONF.requestProductionName];
  if (!prod) return 'https://api.glow-prow.top';
  const portStr = prod.port ? `:${prod.port}` : '';
  return `${prod.protocol || 'https'}://${prod.host}${portStr}`;
});

/**
 * 语言映射字典
 */
const localeMap: Record<string, string> = {
  zh_CN: 'zh-CN',
  zh_TW: 'zh-TW',
  en_US: 'en'
};

/**
 * 动态加载 Scalar 1.64.0 Standalone Bundle 脚本
 */
const loadScalarScript = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Scalar?.createApiReference) {
      return resolve((window as any).Scalar);
    }
    const scriptId = 'scalar-1-64-0-script';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement;
    if (existingScript) {
      const startedAt = Date.now();
      const timer = window.setInterval(() => {
        if ((window as any).Scalar?.createApiReference) {
          window.clearInterval(timer);
          resolve((window as any).Scalar);
          return;
        }
        if (Date.now() - startedAt >= 15000) {
          window.clearInterval(timer);
          reject(new Error('Scalar 脚本加载超时'));
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.64.0/dist/browser/standalone.js';
    script.async = true;
    script.onload = () => resolve((window as any).Scalar);
    script.onerror = () => reject(new Error('无法加载 Scalar 1.64.0 核心脚本'));
    document.head.appendChild(script);
  });
};

/**
 * 初始化 Scalar 1.64.0 实例
 */
const initScalar = async () => {
  if (typeof window === 'undefined') return;

  try {
    loading.value = true;
    error.value = null;

    abortController?.abort();
    abortController = new AbortController();

    const [Scalar] = await Promise.all([
      loadScalarScript()
    ]);

    const authGpHeader = generateAuthGpHeader();
    const userToken = authStore.user?.token || '';
    const isBackend = activeTab.value === 'backend';

    let specification: any;
    if (isBackend) {
      try {
        const response = await fetch(specUrl.value, {
          signal: abortController.signal,
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'x-auth-gp': authGpHeader
          }
        });
        if (!response.ok) {
          throw new Error(`OpenAPI 规范请求返回 HTTP ${response.status}`);
        }
        specification = await response.json();
      } catch (fetchErr: any) {
        if (fetchErr instanceof DOMException && fetchErr.name === 'AbortError') return;
        // 跨域或绝对路径失败时，尝试同源代理路径 /api/openapi.json
        try {
          const fallbackRes = await fetch('/api/openapi.json', {
            signal: abortController.signal,
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'x-auth-gp': authGpHeader
            }
          });
          if (!fallbackRes.ok) throw fetchErr;
          specification = await fallbackRes.json();
        } catch (_) {
          throw fetchErr;
        }
      }
    } else {
      // 静态 spec 文件（assets / lang），直接从同源 public 目录加载
      const targetUrl = activeTab.value === 'assets' ? assetsSpecUrl : langSpecUrl;
      const response = await fetch(targetUrl, {signal: abortController.signal});
      if (!response.ok) throw new Error(`OpenAPI 规范加载失败 HTTP ${response.status}`);
      specification = await response.json();
    }

    // 仅 backend 需要注入服务器地址与认证 Scheme
    if (isBackend) {
      specification.servers = [
        {
          url: apiBaseOrigin.value,
          description: 'API Host'
        }
      ];
      delete (specification as any).host;
      delete (specification as any).basePath;

      specification.components = specification.components || {};
      specification.components.securitySchemes = {
        'x-token': {
          type: 'apiKey',
          name: 'x-token',
          in: 'header',
        },
        'x-auth-gp': {
          type: 'apiKey',
          name: 'x-auth-gp',
          in: 'header',
        },
        ...((specification.components as any).securitySchemes || {})
      };
    }

    if (specification.info) {
      specification.info.title = '';
      specification.info.description = '';
    }

    const container = scalarContainerRef.value || document.getElementById('val-api-reference');
    if (!container) return;

    // 清理旧实例与旧内容
    if (scalarInstance?.destroy) {
      try {
        scalarInstance.destroy();
      } catch (_) {
      }
      scalarInstance = null;
    }
    container.innerHTML = '';

    const scalarConfig: any = {
      content: specification,
      localization: {
        locale: localeMap[locale.value] || 'zh-CN'
      },
      layout: 'classic',
      darkMode: true,
      hideDarkModeToggle: true,
      hideDownloadButton: true,
      hideModels: true,
      hideSearch: true,
      showDeveloperTools: 'never',
      withDefaultFonts: false,
      showOperationId: false,
      customCss: `
        .scalar-app {
          --scalar-font: var(--font-body, 'Roboto', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
          --scalar-font-code: var(--font-mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
          --scalar-background-1: transparent;
          --scalar-background-2: transparent;
          --scalar-background-3: transparent;
          --scalar-background-accent: #000;
          --scalar-color-1: #ece8e1;
          --scalar-color-2: #9aa7b2;
          --scalar-color-3: #6b7b88;
          --scalar-color-accent: #ffb300;
          --scalar-border-color: rgba(236, 232, 225, 0.15);
          --scalar-sidebar-background-1: #080c11;
          --scalar-sidebar-color-active: #ffb300;
          --scalar-sidebar-item-active-background: rgba(255, 193, 7, 0.12);
          --scalar-button-1: #ffb300;
          --scalar-button-1-hover: #ffc107;
          --scalar-button-1-color: #000000;
          --scalar-radius: 4px;
          --scalar-heading-1: 18px;
          --scalar-page-description: 17px;
          --scalar-heading-2: 22px;
          --scalar-heading-3: 18px;
          --scalar-heading-4: 17px;
          --scalar-heading-5: 16px;
          --scalar-heading-6: 15px;
          --scalar-paragraph: 15px;
          --scalar-small: 14px;
          --scalar-mini: 13px;
          --scalar-micro: 13px;
          --scalar-bold: 600;
          --scalar-semibold: 500;
          --scalar-regular: 400;
          --scalar-font-size-1: 22px;
          --scalar-font-size-2: 18px;
          --scalar-font-size-3: 18px;
          --scalar-font-size-4: 16px;
          --scalar-font-size-5: 14px;
          --scalar-font-size-6: 13px;
          --scalar-font-size-7: 13px;
          --scalar-line-height-1: 34px;
          --scalar-line-height-2: 26px;
          --scalar-line-height-3: 22px;
          --scalar-line-height-4: 20px;
          --scalar-line-height-5: 18px;
          --scalar-font-normal: 400;
          --scalar-font-medium: 500;
          --scalar-font-bold: 700;
        }
        .custom-scroll,
        .scalar-app-layout {
          background-color: #000 !important;
        }
        .scalar-container.scalar-client--open {
            backdrop-filter: blur(30px);
        }
        .section-container,
        .references-classic-header,
        .section-accordion-content,
        .references-classic .section,
        .section-accordion-title,
        .references-classic-header-container { padding: 0 !important; }

        .section-accordion-chevron { top: 9px !important; }
        .section-accordion-wrapper { padding: 0 0 0 20px !important; }
        .section-accordion-wrapper  { margin-bottom: 5px !important; }
        .section-header.mb-3 { margin-bottom: 6px !important; }
        .scalar-app .section-header-wrapper h2,
        .scalar-app .section-header-wrapper h3 { letter-spacing: .01em; }
        .scalar-app .section-container { border-top: none !important; margin-bottom: 10px !important; }
        .rounded-b-xl,
        .rounded-r-xl,
        .rounded-l-xl,
        .rounded-t-xl {
          border-radius: 4px !important;
        }

        /* 隐藏下载 OpenAPI 文档按钮 */
        [data-testid="download-openapi-document"],
        .download-openapi-document,
        button[aria-label*="download" i],
        button[aria-label*="OpenAPI" i],
        a[download],
        .scalar-app button:has(svg[data-icon="download"]) {
          display: none !important;
        }

        /* 隐藏顶部标题和描述区块 */
        .scalar-app [data-section-id="description/introduction"],
        .scalar-app .introduction,
        .scalar-app .references-classic-header-container:first-of-type,
        .scalar-app .section-container:has(#description\\/introduction) {
          display: none !important;
        }

        /* 隐藏 API 搜索栏、搜索快捷按钮及搜索弹窗 */
        .scalar-sidebar-search,
        .scalar-sidebar-search-button,
        [data-testid="sidebar-search-button"],
        .scalar-search,
        .scalar-command-palette,
        .scalar-command-palette-backdrop,
        .scalar-app [data-testid="sidebar-search-button"],
        .scalar-app .sidebar-search,
        button[aria-label*="search" i],
        button:has([data-icon="magnifying-glass"]) {
          display: none !important;
        }
      `
    };

    if (isBackend) {
      scalarConfig.servers = [
        {
          url: apiBaseOrigin.value,
          description: 'API Host'
        }
      ];
      scalarConfig.authentication = {
        preferredSecurityScheme: 'x-token',
        apiKey: {
          token: userToken
        },
        securitySchemes: {
          'x-token': {
            value: userToken
          },
          'x-auth-gp': {
            value: authGpHeader
          }
        }
      };
    }

    scalarInstance = Scalar.createApiReference(container, scalarConfig);
    loading.value = false;
  } catch (err: any) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    console.error('[Scalar] 初始化文档失败:', err);
    error.value = err?.message || '加载 OpenAPI 规范失败';
    loading.value = false;
  }
};

watch(locale, () => {
  initScalar();
});

watch(activeTab, () => {
  initScalar();
});

onMounted(() => {
  initScalar();
});

onUnmounted(() => {
  abortController?.abort();
  if (scalarInstance?.destroy) {
    try {
      scalarInstance.destroy();
    } catch (_) {
    }
    scalarInstance = null;
  }
});

defineOptions({
  name: 'ApiDocsView'
});
</script>

<style scoped lang="less">
.header-card {
  :deep(.v-card__image) {
    background-color: black;
  }
}

.scalar-wrapper {
  min-height: 80vh;
  position: relative;
  background-color: transparent;
}
</style>
