<script lang="ts">
export default {
  name: "CaptchaIndex"
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import SvgCaptchaWidget from "./svg.vue"
import TurnstileCaptchaWidget, { TURNSTILE_KEYS } from "./turnstile.vue"
import { CaptchaType } from "@/assets/types/Captcha";

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
  type: 'turnstile',
  size: 'default',
  siteKey: '',
  isTest: undefined,
  env: 'auto'
})

const emit = defineEmits(['getCaptchaData'])
const route = useRoute()

const svgCaptchaRef = ref<any>(null)
const turnstileCaptchaRef = ref<any>(null)

// 优先检查 url query ?captcha=svg，否则使用传入的 type (默认 turnstile)
const captchaType = computed(() => {
  return (route.query.captcha as string) || props.type || 'turnstile'
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
  return import.meta.env.DEV ? TURNSTILE_KEYS.TEST : TURNSTILE_KEYS.PROD;
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
