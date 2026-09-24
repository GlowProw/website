<script lang="ts">
export { TURNSTILE_KEYS } from '@/assets/types/Captcha'

export default {
  name: 'TurnstileCaptchaWidget'
}
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { TURNSTILE_KEYS } from '@/assets/types/Captcha'

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

const effectiveSiteKey = computed(() => {
  if (props.siteKey) return props.siteKey
  if (props.isTest === true) return TURNSTILE_KEYS.TEST
  if (props.isTest === false) return TURNSTILE_KEYS.PROD
  // 默认根据 Vite 环境判定：开发环境使用测试 key，生产环境使用生产 key
  return import.meta.env.DEV ? TURNSTILE_KEYS.TEST : TURNSTILE_KEYS.PROD
})

const loadTurnstileScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).turnstile) {
      resolve()
      return
    }

    const scriptId = 'cf-turnstile-script'
    if (document.getElementById(scriptId)) {
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          clearInterval(interval)
          resolve()
        }
      }, 50)
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => {
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          clearInterval(interval)
          resolve()
        }
      }, 50)
    }
    script.onerror = (e) => reject(e)
    document.head.appendChild(script)
  })
}

const renderWidget = () => {
  if (!containerRef.value || !(window as any).turnstile) return

  if (widgetId !== null) {
    try {
      (window as any).turnstile.remove(widgetId)
    } catch {
      // ignore
    }
    widgetId = null
  }

  const keyToUse = effectiveSiteKey.value
  if (!keyToUse) return

  try {
    widgetId = (window as any).turnstile.render(containerRef.value, {
      sitekey: keyToUse,
      theme: props.theme,
      size: props.size,
      callback: (resToken: string) => {
        token.value = resToken
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
        token.value = ''
        emit('callbackDoneVerifies', {
          captchaType: 'turnstile',
          response: ''
        })
        emit('error', err)
      }
    })
  } catch (err) {
    console.error('Failed to render Cloudflare Turnstile:', err)
  }
}

watch(effectiveSiteKey, () => {
  if ((window as any).turnstile && containerRef.value) {
    renderWidget()
  }
})

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

onMounted(async () => {
  try {
    await loadTurnstileScript()
    renderWidget()
  } catch (err) {
    console.error('Failed to load Turnstile script:', err)
  }
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

defineExpose({
  refreshCaptcha,
  reset: refreshCaptcha
})
</script>

<template>
  <v-card class="turnstile-box" elevation="24">
    <div ref="containerRef" class="turnstile-render"></div>
  </v-card>
</template>

<style scoped lang="less">
.turnstile-box {
  width: calc(100% - 4px);
  height: 63px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.turnstile-box > * {
  transform: translateX(-1px) translateY(-1px);
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

  :deep(*) {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
}
</style>
