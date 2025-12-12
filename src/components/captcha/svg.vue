<template>
  <div>
    <v-text-field
        v-model="inputValue"
        variant="solo-filled"
        maxlength="4"
        hide-details
        @change="onChangeValue"
        :rules="rules"
        :placeholder="t('captcha.title')">
      <template v-slot:append-inner>
        <div
            class="captcha-input-append captcha-svg"
            @click="refreshCaptcha"
            :style="`cursor: ${captchaTime.count <= 0 ? 'pointer' : 'not-allowed'};height: ${height}`">
          <span v-if="!content" class="tip">
            <template v-if="!disable">
              <span v-if="loading">
                <v-icon class="spin-icon-load" icon="mdi-refresh" size="20"/>
              </span>
              <span v-else>
                {{ t('captcha.get') }}
              </span>
            </template>
            <span v-else style="min-width: 80px">
              <v-icon class="spin-icon-load" icon="mdi-refresh" size="20"/>
            </span>
          </span>
          <div
              v-else
              v-html="content"
              class="captcha-flavor"
              :class="`${captchaTime.count <= 0 ? 'disable': ''}`"
          ></div>
          <transition name="fade">
            <div v-show="content && captchaTime.count <= 0" class="captcha-svg-icon">
              <v-icon v-if="disable" icon="mdi-close" size="20"/>
              <v-icon v-else icon="mdi-refresh" size="20" :class="[loading ? 'spin-icon-load' : '']"/>
            </div>
          </transition>
          <div class="count" v-show="captchaTime.count > 0">{{ captchaTime.count }}s</div>
        </div>
      </template>
    </v-text-field>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, Ref, ref} from 'vue'
import {useRoute} from 'vue-router'
import {storage} from '@/assets/sripts'
import {useI18n} from "vue-i18n";
import {useCaptchaApi} from "@/assets/sripts/api";
import {ApiError} from "@/assets/types/Api";
import {useNoticeStore} from "~/stores/noticeStore";

const props = defineProps({
      rules: [],
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
      }
    }),
    route = useRoute(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    captchaApi = useCaptchaApi(),
    emit = defineEmits(['callbackDoneVerifies'])

let loading = ref(false),
    hash: Ref<string> = ref(""),
    content: Ref<string> = ref(""),
    inputValue: Ref<string> = ref(""),
    captchaHash: Ref<any> = ref({}),

    captchaTime: Ref<{
      fun: void | number,
      count: number,
      lock: boolean
    }> = ref({
      fun: null,
      count: 0,
      lock: false,
    })

/**
 * 是否有验证码
 */
const isCaptcha = computed(() => {
  return hash.value && content.value
})

/**
 * 初始化
 */
onMounted(() => {
  let captcha = storage.session.get('captcha')
  if (captcha.code == 0) {
    captchaHash.value = captcha.data.value
  } else {
    storage.session.set('captcha', {
      [`${props.id}_${route.name}`]: props.seconds
    })
  }
})

onUnmounted(() => {
  // 清理定时器

  clearInterval(captchaTime.value.fun as number)
  captchaTime.value.fun = null
})

/**
 * 变动事件
 */
const onChangeValue = () => {
  emit('callbackDoneVerifies', {
    encryptCaptcha: hash.value,
    response: inputValue.value,
  })
}

/**
 * 刷新验证码
 */
const refreshCaptcha = async () => {
  let captcha: any = storage.session.get('captcha')

  try {
    if (captcha?.code == 0) {
      captcha = {
        data: {
          value: props.seconds,
        }
      }
    }

    if (props.disable || loading.value || captchaTime.value.lock) return

    loading.value = true

    const result = await captchaApi.get({isUpdateTime: true}),
        d = result.data

    // 储存验证码hash
    captchaHash.value = {
      [route.name]: 0
    }

    hash.value = d.data["hash"]
    content.value = d.data["content"]

    if (captcha?.data?.value && Object.keys(captcha.data.value).includes(route.name as string)) {
      // 会话持久对应时间加载
      captchaTime.value.count = captcha.data.value[route.name]
    }

    captchaTimeout(captchaTime.value.count || props.seconds || 0)
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    setTimeout(() => {
      loading.value = false
    }, 800)
  }
}

/**
 * 计时器
 * @param {number} num
 */
const captchaTimeout = (num) => {
  if (captchaTime.value.lock) return false

  captchaTime.value.count = num
  captchaTime.value.lock = true

  captchaTime.value.fun = setInterval(() => {
    if (captchaTime.value.count <= 0) {
      clearInterval(captchaTime.value.fun as number)
      captchaTime.value.lock = false
      return
    }

    captchaTime.value.count -= 1

    captchaHash.value = {
      [`${props.id}_${route.name}`]: captchaTime.value.count
    }
    storage.session.set("captcha", captchaHash.value)
  }, 1000)

  return true
}

defineExpose({
  refreshCaptcha,
  onUnmounted,
  isCaptcha,
})
</script>

<style lang="less">
@import "@/assets/styles/captcha";

.captcha-svg {
  overflow: hidden;
  position: relative;
  display: flex;
  justify-items: center;
  align-items: center;
  margin: 0 5px;
  min-width: 80px;

  .captcha-svg-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    height: 100%;
    width: 100%;
  }

  .disable {
    filter: blur(2px);
    transition: all .24s;
    opacity: .4;
  }

  .count {
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 1s;
    font-size: 10px;
    transform: scale(.7);
    color: #000;
    padding: 0 2px;
    border: 1px solid #000;
    background-color: rgba(242, 242, 242, 0.3);
    border-radius: 5px;
    position: absolute;
    top: 2px;
    right: 2px;
  }

  .tip {
    font-size: 12px;
    margin: 0 auto;
  }
}
</style>
