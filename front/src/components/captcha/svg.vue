<template>
  <div>
    <v-text-field v-model="inputValue" variant="solo-filled" maxlength="4" @change="onChangeValue" :placeholder="$t('captcha.title')">
      <template v-slot:append-inner>
        <div class="captcha-input-append captcha-svg"
             @click="refreshCaptcha"
             :style="`cursor: ${captchaTime.count <= 0 ? 'pointer' : 'not-allowed'};height: ${height}`">
        <span v-if="!content" class="tip">
          <template v-if="!disable">
            <span v-if="postLoad">
              <v-icon class="spin-icon-load" icon="mdi-refresh" size="20"/>
            </span>
            <span v-else>
               {{ $t('captcha.get') }}
            </span>
          </template>
          <div v-else style="min-width: 80px">
              <v-icon class="spin-icon-load" icon="mdi-refresh" size="20"/>
          </div>
        </span>
          <div v-else v-html="content"
               class="captcha-flavor"
               :class="`${captchaTime.count <= 0 ? 'disable': ''}`">
          </div>
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

<script>
import {api, http, storage} from '../../assets/sripts'

export default {
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
    }
  },
  data() {
    return {
      storageSession: storage.session,
      postLoad: false,
      hash: "",
      content: "",
      inputValue: "",
      captchaHash: {},
      captchaTime: {
        fun: null,
        count: 0,
        lock: false,
      },
    }
  },
  created() {
    let captcha = this.storageSession.get('captcha');
    if (captcha) {
      this.captchaHash = captcha.data;
    } else {
      this.storageSession.set(`captcha`, {
        [`${this.id}_${this.$route.name}`]: this.seconds
      });
    }
  },
  destroyed() {
    clearInterval(this.captchaTime.fun);
    this.captchaTime.fun = null;
  },
  methods: {
    /**
     * 变动事件
     */
    onChangeValue() {
      this.$emit('callbackDoneVerifies', {
        encryptCaptcha: this.hash,
        response: this.inputValue,
      });
      console.log(this.inputValue)
    },
    /**
     * 刷新验证码
     */
    async refreshCaptcha() {
      let captcha = this.storageSession.get('captcha');
      let that = this;

      try {
        if (captcha.code <= 0) {
          captcha = {
            data: {
              value: this.seconds,
            }
          }
        }

        if (this.disable || this.postLoad || this.captchaTime.lock) return;

        this.postLoad = true;

        let res = await http.get(api["captcha"], {
          params: {
            t: Math.random()
          }
        });

        const d = res.data;

        if (d.success === 1) {
          // 储存验证码hash
          that.captchaHash = Object.assign({
            [that.$route.name]: 0
          });

          this.hash = d.data["hash"];
          this.content = d.data["content"];

          if (Object.keys(captcha.data.value).indexOf(this.$route.name) >= 0) {
            // 会话持久对应时间加载
            this.captchaTime.count = captcha.data.value[this.$route.name];
          }

          this.capthcaTimeout(this.captchaTime.count || this.seconds || 0)
        }
      } finally {
        setTimeout(function () {
          that.postLoad = false;
        }, 800)
      }
    },
    /**
     * 计时器
     * @param num
     */
    capthcaTimeout(num) {
      const that = this;
      let fun;

      if (that.captchaTime.lock) return false;

      that.captchaTime.count = num;

      fun = setInterval(function () {
        if (that.captchaTime.count <= 0) {
          clearInterval(fun);
          that.captchaTime.lock = false;
          return;
        }
        that.captchaTime.count -= 1;

        that.captchaHash = Object.assign({
          [`${that.id}_${that.$route.name}`]: that.captchaTime.count
        });
        that.storageSession.set("captcha", that.captchaHash);
      }, 1000);

      that.captchaTime.lock = true;
      return true;
    }
  },
  computed: {
    // 是否有验证码
    isCaptcha() {
      return this.hash && this.content;
    }
  }
}
</script>

<style lang="less">
@import "../../assets/styles/captcha";

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
