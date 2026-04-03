<script lang="ts">
export default { name: 'HtmlLink' }
</script>

<script setup lang="ts">

import {onMounted, ref} from "vue";

const props = withDefaults(
    defineProps<{ href?: string, text?: string, isPoptip?: boolean, isOpen?: boolean, isIcon?: boolean, isIframeShow?: boolean }>(),
    {
      href: '',
      text: '',
      isPoptip: true,
      isOpen: true,
      isIcon: true,
      isIframeShow: true
    }
)

let afterData = ref({
      href: 'https://vuejs.org',
      text: ''
    }),
    linkLoad = ref(true),
    linkTime = ref(null),
    show = ref(false),
    iframeError = ref(false)

onMounted(() => {
  loadData()
})

/**
 * 加载数据
 */
const loadData = () => {
  // unescape is deprecated， by: https://developer.mozilla.org/en-US/docs/web/javascript/reference/global_objects/escape
  if (props.href)
    afterData.value.href = decodeURI(props.href)
  if (props.text)
    afterData.value.text = decodeURI(props.text)
}

/**
 * 预览窗口
 */
const onPoptipShow = () => {
  let status = show.value

  // 展开
  if (status == true) {
    // 重置错误状态
    iframeError.value = false
    // 加载动画
    linkLoad.value = true;
    if (linkTime.value) clearTimeout(linkTime.value)
    linkTime.value = setTimeout(function () {
      if (linkLoad.value) {
        linkLoad.value = false;
        iframeError.value = true;
      }
      linkTime.value = null;
    }, 5000)
  }
  // 收起
  if (status == false) {
    if (linkTime.value) {
      clearTimeout(linkTime.value)
      linkTime.value = null;
    }
    linkLoad.value = false;
  }
}

/**
 * 获取地址协议
 */
const getProtocol = () => {
  try {
    if (!afterData.value && !afterData.value.href) return '';
    let url = new URL(afterData.value.href)
    return url.protocol;
  } catch (e) {
    return '';
  }
}

/**
 * iframe 加载完成
 */
const onIframeLoad = () => {
  linkLoad.value = false
  iframeError.value = false
  if (linkTime.value) {
    clearTimeout(linkTime.value)
    linkTime.value = null
  }
}

/**
 * iframe 加载错误
 */
const onIframeError = () => {
  linkLoad.value = false
  iframeError.value = true
  if (linkTime.value) {
    clearTimeout(linkTime.value)
    linkTime.value = null
  }
}

/**
 * 获取域名用于显示
 */
const getDomain = () => {
  try {
    if (!afterData.value.href) return ''
    const url = new URL(afterData.value.href)
    return url.hostname
  } catch {
    return afterData.value.href
  }
}
</script>

<template>
  <v-tooltip
      location="bottom center"
      content-class="pa-0 bg-black"
      interactive
      target="cursor"
      max-width="350"
      min-width="300"
      v-model="show"
      @update:modelValue="onPoptipShow"
      :disabled="!isPoptip || getProtocol() === 'mailto:'">
    <template v-slot:activator="{ props: tooltipProps }">
       <span class="html-link cursor-pointer" v-bind="tooltipProps">
        <template v-if="isIcon || getProtocol() === 'http:' || getProtocol() === 'https:'">
          <v-icon icon="mdi-link" class="icon"/>
        </template>
        <template v-else-if="getProtocol() === 'mailto:'">
          <v-icon icon="mdi-email-outline" class="icon"/>
        </template>
        <a :href="isOpen ? afterData.href || null : null" :target="afterData.href ? isOpen ? '_blank' : null : null" rel="noopener noreferrer">
          <slot>{{ afterData.text || afterData.href }}</slot>
        </a>
      </span>
    </template>

    <template v-if="isIframeShow && isPoptip">
      <v-card border class="link-iframe">
        <!-- 加载状态 -->
        <template v-if="linkLoad">
          <div class="link-load">
            <v-icon icon="mdi-loading" class="spin-icon-load" size="30"/>
          </div>
        </template>

        <!-- 错误状态 -->
        <template v-else-if="iframeError">
          <div class="link-load">
            <v-icon icon="mdi-alert-circle-outline" size="30" color="warning"/>
            <v-btn variant="tonal" size="small" :href="afterData.href" target="_blank" class="mt-2">
              <v-icon icon="mdi-open-in-new" size="14"/>
              <span class="text-caption ms-1">{{ getDomain() }}</span>
            </v-btn>
          </div>
        </template>

        <!-- iframe 内容 - 使用更好的缩放方案 -->
        <div v-else class="iframe-container">
          <iframe
              :src="afterData.href"
              frameborder="0"
              width="100%"
              height="100%"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
              referrerpolicy="no-referrer"
              @load="onIframeLoad"
              @error="onIframeError">
          </iframe>
        </div>
      </v-card>
    </template>
  </v-tooltip>
</template>

<style scoped lang="less">
.link-load {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: 100%;
  text-align: center;
  background: var(--v-theme-surface);
}

.link-iframe {
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  width: 100%;
  background: var(--v-theme-surface);

  .iframe-container {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: white;

    iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
  }
}

.html-link {
  padding-bottom: 1px;
  border-bottom-width: 1px;
  border-bottom-style: dashed;
  transition: all .25s;

  a {
    color: hsl(from var(--text-color) h s calc(l * .8));
    text-decoration: none;

    &:before {
      display: none;
      content: "" !important;
    }
  }

  a:hover {
    color: hsl(from var(--text-color) h s calc(l * 1));
    text-decoration: underline;
  }

  .icon {
    margin-right: 4px;
    color: hsl(from var(--text-color) h s calc(l * .9));
    font-size: 14px;
  }
}

.html-link:hover {
  backdrop-filter: blur(20px);
  border-bottom-style: solid;
}

.spin-icon-load {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
