<template>
  <div>
    <v-text-field
        v-model="inputValue"
        variant="solo-filled"
        maxlength="4"
        hide-details
        @change="onChangeValue"
        :rules="rules"
        :placeholder="t('captcha.title')"
    >
      <template v-slot:append-inner>
        <div
            class="captcha-input-append captcha-svg"
            @click="refreshCaptcha"
            :style="`cursor: ${captchaTime.count <= 0 ? 'pointer' : 'not-allowed'};height: ${height}`"
        >
          <span v-if="!content" class="tip">
            <template v-if="!disable">
              <span v-if="postLoad">
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
              <v-icon v-else icon="mdi-refresh" size="20" :class="[postLoad ? 'spin-icon-load' : '']"/>
            </div>
          </transition>
          <div class="count" v-show="captchaTime.count > 0">{{ captchaTime.count }}s</div>
        </div>
      </template>
    </v-text-field>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useRoute} from 'vue-router'
import {api, http, storage} from '@/assets/sripts'
import {useI18n} from "vue-i18n";

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
})

const emit = defineEmits(['callbackDoneVerifies'])

const route = useRoute()
const {t} = useI18n()
const storageSession = storage.session

const postLoad = ref(false)
const hash = ref("")
const content = ref("")
const inputValue = ref("")
const captchaHash = ref({})

const captchaTime = ref({
  fun: null,
  count: 0,
  lock: false,
} as {
  fun: void | number,
  count: number,
  lock: boolean
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
  let captcha = storageSession.get('captcha')
  if (captcha) {
    captchaHash.value = captcha.data
  } else {
    storageSession.set('captcha', {
      [`${props.id}_${route.name}`]: props.seconds
    })
  }
})

// 清理定时器
onUnmounted(() => {
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
  let captcha: any = storageSession.get('captcha')

  try {
    if (captcha?.code <= 0) {
      captcha = {
        data: {
          value: props.seconds,
        }
      }
    }

    if (props.disable || postLoad.value || captchaTime.value.lock) return

    postLoad.value = true

    const res = await http.get(api["captcha"], {
      params: {
        t: Math.random()
      }
    })

    const d = res.itemData

    if (d.success === 1) {
      // 储存验证码hash
      captchaHash.value = {
        [route.name]: 0
      }

      hash.value = d.itemData["hash"]
      content.value = d.itemData["content"]

      if (captcha?.data?.value && Object.keys(captcha.data.value).includes(route.name as string)) {
        // 会话持久对应时间加载
        captchaTime.value.count = captcha.data.value[route.name]
      }

      captchaTimeout(captchaTime.value.count || props.seconds || 0)
    }
  } finally {
    setTimeout(() => {
      postLoad.value = false
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
    storageSession.set("captcha", captchaHash.value)
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
