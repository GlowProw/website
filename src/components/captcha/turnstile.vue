<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import {TURNSTILE_KEYS} from '@/assets/types/Captcha'
import {useI18n} from 'vue-i18n'
import {useAppStore} from '~/stores/appStore'

const {t} = useI18n()
const appStore = useAppStore()

const props = withDefaults(defineProps<{
  siteKey?: string;
  theme?: 'dark' | 'light' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  isTest?: boolean;
}>(), {
  siteKey: '',
  theme: 'dark',
  size: 'normal',
  isTest: undefined
})

const emit = defineEmits<{
  (e: 'callbackDoneVerifies', payload: { captchaType: 'turnstile'; response: string }): void;
  (e: 'expired'): void;
  (e: 'error', error: any): void;
}>()

const containerRef = ref<HTMLElement | null>(null)
let widgetId: string | null = null
const token = ref('')
const loading = ref(true)
const loadError = ref(false)
const errorMessage = ref('')
const isRetrying = ref(false)
const fallbackToTestKey = ref(false)

const isPrivateOrLocalHost = (host: string): boolean => {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.test') ||
    host.endsWith('.internal') ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host)
  )
}

const isLocalOrDev = computed(() => {
  if (typeof window === 'undefined') return false
  return import.meta.env.DEV || isPrivateOrLocalHost(window.location.hostname)
})

const effectiveSiteKey = computed(() => {
  if (props.siteKey) return props.siteKey
  if (props.isTest === true) return TURNSTILE_KEYS.TEST
  if (props.isTest === false) return TURNSTILE_KEYS.PROD
  return isLocalOrDev.value ? TURNSTILE_KEYS.TEST : TURNSTILE_KEYS.PROD
})

/**
 * 加载 Cloudflare Turnstile 验证脚本
 * 注意：加载带 async/defer 的 Turnstile 脚本时，绝不能调用 turnstile.ready()，否则 Cloudflare 会直接抛出 3857 异常
 */
const loadTurnstileScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    // 如果已加载且 render 函数可用，直接 resolve
    if (typeof (window as any).turnstile?.render === 'function') {
      resolve()
      return
    }

    const scriptId = 'cf-turnstile-script'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    const callbackName = 'cfTurnstileInitGlobal'
    let resolved = false

    const markReady = () => {
      if (resolved) return
      if (typeof (window as any).turnstile?.render === 'function') {
        resolved = true
        resolve()
      }
    }

    (window as any)[callbackName] = () => {
      markReady()
    }

    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=${callbackName}&render=explicit`
      script.async = true
      script.defer = true
      script.onerror = (e) => {
        if (!resolved) {
          resolved = true
          reject(e)
        }
      }
      document.head.appendChild(script)
    }

    // 轮询检查 render 函数是否挂载
    const interval = setInterval(() => {
      if (typeof (window as any).turnstile?.render === 'function') {
        clearInterval(interval)
        markReady()
      }
    }, 50)

    setTimeout(() => {
      clearInterval(interval)
      if (!resolved) {
        if (typeof (window as any).turnstile?.render === 'function') {
          markReady()
        } else {
          resolved = true
          reject(new Error('Turnstile script load timeout'))
        }
      }
    }, 10000)
  })
}

/**
 * 渲染部件
 */
const renderWidget = async () => {
  if (typeof window === 'undefined') return

  await nextTick()
  if (!containerRef.value) return

  const turnstile = (window as any).turnstile
  if (!turnstile || typeof turnstile.render !== 'function') {
    loadError.value = true
    loading.value = false
    return
  }

  // 清除历史部件
  if (widgetId !== null) {
    try {
      turnstile.remove(widgetId)
    } catch {
      // ignore
    }
    widgetId = null
  }

  const keyToUse = fallbackToTestKey.value ? TURNSTILE_KEYS.TEST : effectiveSiteKey.value
  if (!keyToUse) return

  try {
    containerRef.value.innerHTML = ''
    widgetId = turnstile.render(containerRef.value, {
      sitekey: keyToUse,
      theme: props.theme,
      size: props.size,
      callback: (resToken: string) => {
        token.value = resToken
        loading.value = false
        loadError.value = false
        emit('callbackDoneVerifies', {
          captchaType: 'turnstile',
          response: resToken
        })
      },
      'expired-callback': () => {
        token.value = ''
        // 内部自动刷新 widget（让用户可以重新点击验证），同时 emit 通知外部
        // 用 setTimeout 避免 CF 回调期间 remove 不稳定
        setTimeout(() => {
          try {
            if (widgetId !== null && (window as any).turnstile) {
              (window as any).turnstile.reset(widgetId)
            }
          } catch {}
        }, 300)
        emit('callbackDoneVerifies', {
          captchaType: 'turnstile',
          response: ''
        })
        emit('expired')
      },
      'error-callback': (err: any) => {
        console.warn('[Turnstile] Error callback:', err)
        // 若当前为生产 Key 报错（如域名未授权或非白名单域名），自动无缝降级为测试 Key 重试
        if (!fallbackToTestKey.value && keyToUse !== TURNSTILE_KEYS.TEST) {
          console.info('[Turnstile] 自动切换为测试 Key 尝试重新渲染')
          fallbackToTestKey.value = true
          return
        }
        token.value = ''
        loadError.value = true
        loading.value = false
        errorMessage.value = String(err || '')
        emit('callbackDoneVerifies', {
          captchaType: 'turnstile',
          response: ''
        })
        emit('error', err)
      }
    })
    loading.value = false
  } catch (err: any) {
    console.error('[Turnstile] 渲染抛出异常:', err)
    if (!fallbackToTestKey.value && keyToUse !== TURNSTILE_KEYS.TEST) {
      fallbackToTestKey.value = true
      return
    }
    loadError.value = true
    loading.value = false
    errorMessage.value = err?.message || ''
  }
}

const init = async () => {
  loading.value = true
  loadError.value = false
  errorMessage.value = ''
  isRetrying.value = true
  try {
    await loadTurnstileScript()
    await renderWidget()
  } catch (err: any) {
    console.error('Failed to load Turnstile:', err)
    loadError.value = true
    loading.value = false
    errorMessage.value = err?.message || ''
  } finally {
    isRetrying.value = false
  }
}

const switchToSvg = () => {
  appStore.setCaptchaType('svg')
}

watch(fallbackToTestKey, () => {
  if ((window as any).turnstile && containerRef.value) {
    renderWidget()
  }
})

watch(effectiveSiteKey, () => {
  if ((window as any).turnstile && containerRef.value) {
    renderWidget()
  }
})

onMounted(() => {
  init()
})

onUnmounted(() => {
  if (widgetId !== null && (window as any).turnstile) {
    try {
      (window as any).turnstile.remove(widgetId)
    } catch {
      // ignore
    }
    widgetId = null
  }
})

/**
 * 刷新验证码
 */
const refreshCaptcha = () => {
  if (widgetId !== null && (window as any).turnstile) {
    try {
      (window as any).turnstile.reset(widgetId)
      token.value = ''
    } catch {
      renderWidget()
    }
  } else {
    init()
  }
}

defineExpose({
  refreshCaptcha,
  reset: refreshCaptcha
})

defineOptions({
  name: 'TurnstileCaptchaWidget',
})
</script>

<template>
  <v-card class="turnstile-box d-flex align-center justify-center position-relative" variant="text" elevation="0">
    <!-- 验证码挂载容器 -->
    <div v-show="!loadError" ref="containerRef" class="turnstile-render"></div>

    <!-- 初次加载时的转圈提示 -->
    <div v-if="loading && !loadError" class="turnstile-loading d-flex align-center justify-center ga-2 text-caption opacity-70">
      <Loading size="18"></Loading>
    </div>

    <!-- 加载失败降级提示卡片 -->
    <div v-if="loadError" class="turnstile-error d-flex align-center justify-space-between w-100 px-3 py-2 border rounded">
      <div class="d-flex align-center ga-2 text-caption">
        <v-icon size="18" color="amber">mdi-shield-alert-outline</v-icon>
        <div class="d-flex flex-column">
          <span class="font-weight-medium text-amber">{{ t('captcha.turnstileFailed') }}</span>
          <span class="text-caption opacity-50" style="font-size: 11px !important;">
            {{ errorMessage ? `[${errorMessage}] ` : '' }}{{ t('captcha.turnstileFailedHint') }}
          </span>
        </div>
      </div>
      <div class="d-flex align-center ga-2">
        <v-btn size="x-small" variant="text" :loading="isRetrying" @click="init">
          {{ t('captcha.retry') }}
        </v-btn>
        <v-btn size="x-small" variant="flat" color="amber" @click="switchToSvg">
          {{ t('captcha.switchToSvg') }}
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<style scoped lang="less">
.turnstile-box {
  width: 100%;
  min-height: 65px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.turnstile-render {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 65px;
  min-width: 300px;
  background: transparent !important;
  border: none !important;

  :deep(iframe) {
    border: none !important;
    border-width: 0 !important;
    outline: none !important;
    box-shadow: none !important;
    background-color: transparent !important;
  }
}

.turnstile-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  pointer-events: none;
}

.turnstile-error {
  background-color: rgba(255, 193, 7, 0.05);
  border-color: rgba(255, 193, 7, 0.25) !important;
}
</style>
