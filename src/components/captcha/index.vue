<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '~/stores/appStore'
import SvgCaptchaWidget from "./svg.vue"
import TurnstileCaptchaWidget from "./turnstile.vue"
import { CaptchaType, TURNSTILE_KEYS } from "@/assets/types/Captcha";

const props = withDefaults(defineProps<{
  rules?: [] | any;
  id?: string;
  disable?: boolean;
  seconds?: number;
  height?: string;
  type?: string | CaptchaType;
  size?: string;
  siteKey?: string;
  isTest?: boolean;
  env?: 'test' | 'prod' | 'auto';
}>(), {
  rules: [],
  id: '0',
  disable: false,
  seconds: 60,
  height: '40px',
  type: 'auto',
  size: 'default',
  siteKey: '',
  isTest: undefined,
  env: 'auto'
})

const emit = defineEmits(['getCaptchaData'])
const route = useRoute()
const appStore = useAppStore()

const svgCaptchaRef = ref<any>(null)
const turnstileCaptchaRef = ref<any>(null)

const captchaType = computed(() => {
  const queryCaptcha = route?.query?.captcha as string
  if (queryCaptcha && (queryCaptcha === 'svg' || queryCaptcha === 'turnstile')) {
    return queryCaptcha
  }
  if (props.type && props.type !== 'auto') {
    return props.type
  }
  return appStore.captchaType || 'turnstile'
})

// 解析当前环境使用的 Turnstile SiteKey（支持测试环境始终通过与生产环境）
const resolvedSiteKey = computed(() => {
  if (props.siteKey) return props.siteKey;
  if (props.isTest === true || props.env === 'test' || route.query.turnstileEnv === 'test') {
    return TURNSTILE_KEYS.TEST;
  }
  if (props.isTest === false || props.env === 'prod' || route.query.turnstileEnv === 'prod') {
    return TURNSTILE_KEYS.PROD;
  }
  const isLocalhost = typeof window !== 'undefined' && Boolean(
    ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(window.location.hostname) ||
    window.location.hostname.endsWith('.local') ||
    window.location.hostname.endsWith('.test') ||
    window.location.hostname.endsWith('.internal')
  );
  return (import.meta.env.DEV || isLocalhost) ? TURNSTILE_KEYS.TEST : TURNSTILE_KEYS.PROD;
})

/**
 * 重置验证器
 */
const refreshCaptcha = () => {
  if (captchaType.value === 'svg') {
    svgCaptchaRef.value?.refreshCaptcha()
  } else {
    turnstileCaptchaRef.value?.refreshCaptcha()
  }
}

/**
 * 验证器完成回调
 */
const doneVerifies = (value: any) => {
  let result: any = {
    captchaType: captchaType.value
  }

  if (captchaType.value === 'svg') {
    result = { ...result, ...value }
  } else {
    result = { ...result, ...value }
  }

  emit('getCaptchaData', result)
}

defineExpose({
  refreshCaptcha,
  reset: refreshCaptcha
})

defineOptions({
  name: 'CaptchaIndex'
})
</script>

<template>
  <div class="captcha">
    <SvgCaptchaWidget
      v-if="captchaType === 'svg'"
      ref="svgCaptchaRef"
      :id="id"
      :rules="rules"
      :seconds="seconds"
      :disable="disable"
      :size="size"
      @callbackDoneVerifies="doneVerifies"
    />
    <TurnstileCaptchaWidget
      v-else
      ref="turnstileCaptchaRef"
      :site-key="resolvedSiteKey"
      theme="dark"
      @callbackDoneVerifies="doneVerifies"
    />
  </div>
</template>

<style scoped lang="less">
.captcha {
  width: 100%;
}
</style>
