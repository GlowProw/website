<script setup lang="ts">
import {computed, ref} from 'vue'
import {useRoute} from 'vue-router'
import SvgCaptchaWidget from "./svg.vue"

const props = defineProps({
  id: {
    type: String,
    default: '0',
  },
  disable: {
    type: Boolean,
    default: false,
  },
  seconds: {
    type: Number,
    default: 60
  },
  height: {
    type: String,
    default: '40px'
  },
  type: {
    type: String,
    default: 'turnstile'
  },
  size: {
    type: String,
    default: 'default',
  }
})

const emit = defineEmits(['getCaptchaData'])

const route = useRoute()
const svgCaptchaRef = ref(null)

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
        :seconds="seconds"
        :disable="disable"
        :size="size"
        @callbackDoneVerifies="doneVerifies"
    />
  </div>
</template>

<style scoped lang="less">

</style>
