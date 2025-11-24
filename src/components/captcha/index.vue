<script setup lang="ts">
import {computed, ref} from 'vue'
import {useRoute} from 'vue-router'
import SvgCaptchaWidget from "./svg.vue"
import {CaptchaType} from "@/assets/types/Captcha";

const props = withDefaults(defineProps<{
      rules?: [] | any, id?: string, disable?: boolean, seconds?: number,
      height?: string, type?: string | CaptchaType, size?: string
    }>(), {
      rules: [],
      id: '0',
      disable: false,
      seconds: 60,
      height: '40px',
      type: 'turnstile',
      size: 'default'
    }),
    emit = defineEmits(['getCaptchaData']),
    route = useRoute()

let svgCaptchaRef = ref(null)

const captchaType = computed(() => {
  return route.query.captcha || props.type
})

/**
 * 重置验证器
 */
const refreshCaptcha = () => {
  switch (captchaType.value) {
    case "svg":
      svgCaptchaRef.value?.refreshCaptcha()
      break
    default:
      throw "Unknown captcha type"
  }
}

/**
 * 验证器完成回调
 * @param {string|object} value
 */
const doneVerifies = (value: any) => {
  let result: any = {
    captchaType: captchaType.value
  }

  switch (captchaType.value) {
    case "svg":
      result = {...result, ...value}
      break
    default:
      throw "Unknown captcha type"
  }

  emit('getCaptchaData', result)
}

defineExpose({
  refreshCaptcha
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
  </div>
</template>

<style scoped lang="less">

</style>
