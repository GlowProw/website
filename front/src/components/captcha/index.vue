<script>
import SvgCaptchaWidget from "./svg.vue"

/**
 * 验证器
 * svg:
 * 返回结构: {content: '', hash: '', captchaType: 'svg'}
 * 取值: this.$refs.captcha.hash
 *
 * turnstile:
 * 返回结构: {response: '', captchaType: 'turnstile'}
 * 取值: <Captcha @getCaptchaData="(value) => value" />
 */
export default {
  name: 'Captcha',
  props: {
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
  },
  components: {SvgCaptchaWidget},
  methods: {
    /**
     * 重置验证器
     */
    refreshCaptcha() {
      switch (this.captchaType) {
        case "svg":
          this.$refs.svgCaptchaRef.refreshCaptcha();
          break;
        default:
          throw "Unknown captcha type";
      }
    },
    /**
     * 验证器完成回调
     * @param string|map value
     */
    doneVerifies(value) {
      let result = {captchaType: this.captchaType};
      console.log(value)

      switch (this.captchaType) {
        case "turnstile":
          result = {...result, response: value};
          break;
        case "svg":
          result = {...result, ...value};
          break;
        default:
          throw "Unknown captcha type";
      }

      this.$emit('getCaptchaData', result);
    }
  },
  computed: {
    captchaType() {
      return this.$route.query.captcha || this.type;
    }
  },
}
</script>

<template>
  <div class="captcha">
    <SvgCaptchaWidget ref="svgCaptchaRef"
                      v-if="captchaType === 'svg'"
                      :id="id"
                      :seconds="seconds"
                      :disable="disable"
                      :size="size"
                      @callbackDoneVerifies="doneVerifies"></SvgCaptchaWidget>
  </div>
</template>

<style scoped lang="less">

</style>
