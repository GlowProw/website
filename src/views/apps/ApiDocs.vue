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
              stacked
              align-tabs="center"
              item-value="value.value"
              v-model="activeTab">
            <v-tab
                v-for="tab in apiTabs"
                :key="tab.value"
                :text="tab.label"
                :value="tab.value">
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
              {{ t('apps.apiDocs.intro1') }}
            </p>

            <p class="text-subtitle-1 text-medium-emphasis mb-5">
              {{ t('apps.apiDocs.intro2') }}
            </p>
            <template v-slot:title>{{ t('apps.apiDocs.descriptionTitle') }}</template>
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
                  <p class="font-weight-bold mb-1">{{ t('apps.apiDocs.loadError') }}</p>
                  <p class="text-caption opacity-80">{{ error }}</p>
                </v-alert>
                <v-btn color="amber" variant="tonal" prepend-icon="mdi-refresh" @click="initScalar">
                  {{ t('apps.apiDocs.retry') }}
                </v-btn>
              </div>

              <!-- 容器 S -->
              <div
                  id="val-api-reference"
                  ref="scalarContainerRef"
                  class="scalar-container"
                  v-show="!loading && !error">
              </div>
              <!-- 容器 E -->
            </div>

            <template v-slot:title>
              {{ t('apps.apiDocs.apisTitle') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {conf, http} from "@/assets/sripts";
import {generateAuthGpHeader} from "@/assets/sripts/fingerprint_auth";
import {useAuthStore} from "~/stores/userAccountStore";
import Silk from "@/components/Silk.vue";
import Loading from "@/components/Loading.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import scalarCustomCss from "@/assets/styles/scalar.less?raw";

const {t, locale} = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref<string | null>(null);
const scalarContainerRef = ref<HTMLElement | null>(null);
let scalarInstance: any = null;
let abortController: AbortController | null = null;
let originalReplaceState: typeof window.history.replaceState | null = null;

const apiTabs = computed(() => [
  {value: 'backend' as const, label: t('apps.apiDocs.tabs.backend')},
  {value: 'assets' as const, label: t('apps.apiDocs.tabs.assets')},
  {value: 'lang' as const, label: t('apps.apiDocs.tabs.lang')},
]);
type ApiTab = 'backend' | 'assets' | 'lang';
const validTabs: ApiTab[] = ['backend', 'assets', 'lang'];

const getTabFromRoute = (): ApiTab => {
  const queryTab = route.query.tab;
  if (typeof queryTab === 'string' && validTabs.includes(queryTab as ApiTab)) {
    return queryTab as ApiTab;
  }
  return 'backend';
};

const activeTab = ref<ApiTab>(getTabFromRoute());

const specUrl = computed(() => {
  const base = http.globalUrl?.location || '/api/';
  return `${base.replace(/\/+$/, '')}/openapi.json`;
});

const assetsSpecUrl = '/assets-api.json';
const langSpecUrl = '/lang-api.json';

const currentSpecUrl = computed(() => {
  if (activeTab.value === 'assets') return assetsSpecUrl;
  if (activeTab.value === 'lang') return langSpecUrl;
  return specUrl.value;
});

/**
 * 基于全局配置计算API发起请求的目标服务器地址
 */
const apiBaseOrigin = computed(() => {
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
 * 拦截并过滤 Scalar 自动追加的 #description/introduction 路由 Hash
 */
const setupHistoryInterceptor = () => {
  if (typeof window === 'undefined') return;
  if (!originalReplaceState) {
    originalReplaceState = window.history.replaceState;
    window.history.replaceState = function (data: any, unused: string, url?: string | URL | null) {
      if (url) {
        const urlStr = url.toString();
        if (urlStr.includes('#description/introduction')) {
          const cleanUrl = urlStr.replace(/#description\/introduction/g, '');
          return originalReplaceState!.call(this, data, unused, cleanUrl);
        }
      }
      return originalReplaceState!.apply(this, arguments as any);
    };
  }

  if (window.location.hash.includes('description/introduction')) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
};

const cleanupHistoryInterceptor = () => {
  if (typeof window === 'undefined') return;
  if (originalReplaceState) {
    window.history.replaceState = originalReplaceState;
    originalReplaceState = null;
  }
  if (window.location.hash.includes('description/introduction')) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
};

// 监听 activeTab 变化，同步更新 URL query 参数 ?tab=
watch(activeTab, (newTab) => {
  if (route.query.tab !== newTab) {
    router.replace({
      query: {
        ...route.query,
        tab: newTab
      }
    });
  }
  initScalar();
});

// 监听 URL 路由 query 变化，同步切换 activeTab
watch(() => route.query.tab, (newTabQuery) => {
  if (typeof newTabQuery === 'string' && validTabs.includes(newTabQuery as ApiTab)) {
    if (activeTab.value !== newTabQuery) {
      activeTab.value = newTabQuery as ApiTab;
    }
  }
});

watch(locale, () => {
  initScalar();
});

onMounted(() => {
  setupHistoryInterceptor();
  initScalar();
});

/**
 * 动态加载脚本
 */
const loadScalarScript = async (): Promise<any> => {
  if ((window as any).Scalar?.createApiReference) {
    return (window as any).Scalar;
  }
  await import('@/assets/sripts/scalar.standalone.js');
  return (window as any).Scalar;
};

/**
 * 初始化实例
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
            'x-auth-gp': authGpHeader,
            'x-lang': locale.value
          }
        });
        if (!response.ok) {
          throw new Error(`OpenAPI 规范请求返回 HTTP ${response.status}`);
        }
        specification = await response.json();
      } catch (fetchErr: any) {
        if (fetchErr instanceof DOMException && fetchErr.name === 'AbortError') return;
        // 跨域或绝对路径失败时，尝试同源代理路径
        try {
          const fallbackRes = await fetch('/api/openapi.json', {
            signal: abortController.signal,
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'x-auth-gp': authGpHeader,
              'x-lang': locale.value
            }
          });
          if (!fallbackRes.ok) throw fetchErr;
          specification = await fallbackRes.json();
        } catch (_) {
          throw fetchErr;
        }
      }
    } else {
      // 静态文件，直接从同源 public 目录加载
      const targetUrl = activeTab.value === 'assets' ? assetsSpecUrl : langSpecUrl;
      const response = await fetch(targetUrl, {signal: abortController.signal});
      if (!response.ok) throw new Error(`OpenAPI 规范加载失败 HTTP ${response.status}`);
      specification = await response.json();
    }

    // 仅后端需要注入服务器地址与认证
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
        'x-lang': {
          type: 'apiKey',
          name: 'x-lang',
          in: 'header',
          description: 'Language from webpage'
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
        locale: localeMap[locale.value]
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
      customCss: scalarCustomCss,
      snapOffset: 160,
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
          },
          'x-lang': {
            value: locale.value
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

onUnmounted(() => {
  cleanupHistoryInterceptor();
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
@import url(@/assets/styles/scalar.less);

.scalar-wrapper {
  min-height: 100vh;
  position: relative;
  background-color: transparent;
}
</style>
