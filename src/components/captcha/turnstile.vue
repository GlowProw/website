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

const effectiveSiteKey = computed(() => {
  if (props.siteKey) return props.siteKey
  if (props.isTest === true) return TURNSTILE_KEYS.TEST
  if (props.isTest === false) return TURNSTILE_KEYS.PROD
  // 默认根据 Vite 环境判定：开发环境使用测试 key，生产环境使用生产 key
  return import.meta.env.DEV ? TURNSTILE_KEYS.TEST : TURNSTILE_KEYS.PROD
})

/**
 * 加载 Cloudflare Turnstile 验证脚本
 */
const loadTurnstileScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    if ((window as any).turnstile) {
      if (typeof (window as any).turnstile.ready === 'function') {
        (window as any).turnstile.ready(() => resolve())
      } else {
        resolve()
      }
      return
    }

    const scriptId = 'cf-turnstile-script'
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null

    if (existing) {
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          clearInterval(interval)
          if (typeof (window as any).turnstile.ready === 'function') {
            (window as any).turnstile.ready(() => resolve())
          } else {
            resolve()
          }
        }
      }, 50)

      setTimeout(() => {
        clearInterval(interval)
        if ((window as any).turnstile) {
          resolve()
        } else {
          reject(new Error('Turnstile script load timeout'))
        }
      }, 10000)
      return
    }

    const callbackName = `cfTurnstileLoaded_${Math.random().toString(36).substring(2, 9)}`
    ;(window as any)[callbackName] = () => {
      try {
        delete (window as any)[callbackName]
      } catch {
        (window as any)[callbackName] = undefined
      }
      resolve()
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=${callbackName}&render=explicit`
    script.async = true
    script.defer = true
    script.onload = () => {
      setTimeout(() => {
        if ((window as any).turnstile) {
          resolve()
        }
      }, 100)
    }
    script.onerror = (e) => {
      try {
        delete (window as any)[callbackName]
      } catch {
        (window as any)[callbackName] = undefined
      }
      reject(e)
    }
    document.head.appendChild(script)
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
  if (!turnstile) return

  if (widgetId !== null) {
    try {
      turnstile.remove(widgetId)
    } catch {
      // ignore
    }
    widgetId = null
  }

  const keyToUse = effectiveSiteKey.value
  if (!keyToUse) return

  const doRender = () => {
    if (!containerRef.value) return
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
          emit('callbackDoneVerifies', {
            captchaType: 'turnstile',
            response: ''
          })
          emit('expired')
        },
        'error-callback': (err: any) => {
          console.warn('[Turnstile] Error callback:', err)
          token.value = ''
          emit('callbackDoneVerifies', {
            captchaType: 'turnstile',
            response: ''
          })
          emit('error', err)
        }
      })
      loading.value = false
    } catch (err) {
      console.error('[Turnstile] 渲染失败:', err)
      loadError.value = true
      loading.value = false
    }
  }

  if (typeof turnstile.ready === 'function') {
    turnstile.ready(doRender)
  } else {
    doRender()
  }
}

const init = async () => {
  loading.value = true
  loadError.value = false
  try {
    await loadTurnstileScript()
    await renderWidget()
  } catch (err) {
    console.error('Failed to load Turnstile:', err)
    loadError.value = true
    loading.value = false
  }
}

const switchToSvg = () => {
  appStore.setCaptchaType('svg')
}

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
    renderWidget()
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
    <div v-show="!loadError" ref="containerRef" class="turnstile-render"></div>

    <!-- 加载中骨架动画 -->
    <div v-if="loading && !loadError" class="turnstile-loading d-flex align-center justify-center ga-2 text-caption opacity-60">
      <v-progress-circular indeterminate size="18" width="2" color="amber"></v-progress-circular>
      <span>Turnstile 安全验证加载中...</span>
    </div>

    <!-- 加载失败降级提示 -->
    <div v-if="loadError" class="turnstile-error d-flex align-center justify-space-between w-100 px-3 py-2 border rounded">
      <div class="d-flex align-center ga-2 text-caption text-error">
        <v-icon size="18" color="error">mdi-alert-circle-outline</v-icon>
        <span>Turnstile 加载失败</span>
      </div>
      <div class="d-flex ga-2">
        <v-btn size="x-small" variant="text" @click="init">重试</v-btn>
        <v-btn size="x-small" variant="tonal" color="amber" @click="switchToSvg">切换为图形验证码</v-btn>
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
}

.turnstile-error {
  background-color: rgba(255, 0, 0, 0.05);
  border-color: rgba(255, 0, 0, 0.2) !important;
}
</style>
