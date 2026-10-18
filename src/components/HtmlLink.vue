<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
import Loading from "@/components/Loading.vue";

const props = withDefaults(
    defineProps<{ href?: string, text?: string, isPoptip?: boolean, isOpen?: boolean, isIcon?: boolean, isIframeShow?: boolean }>(),
    {
      href: '',
      text: '',
      isPoptip: true,
      isOpen: true,
      isIcon: true,
      isIframeShow: false
    }
)

let afterData = ref({
      href: '',
      text: ''
    }),
    linkLoad = ref(true),
    linkTime = ref<any>(null),
    show = ref(false),
    iframeError = ref(false)

const safeDecodeURI = (str: string): string => {
  if (!str) return '';
  try {
    return decodeURIComponent(str);
  } catch {
    try {
      return decodeURI(str);
    } catch {
      return str;
    }
  }
};

/**
 * 加载数据
 */
const loadData = () => {
  afterData.value.href = props.href ? props.href.trim() : ''
  afterData.value.text = props.text ? safeDecodeURI(props.text) : ''
}

onMounted(() => {
  loadData()
})

watch(() => [props.href, props.text], () => {
  loadData()
})

/**
 * 预览窗口
 */
const onPoptipShow = (val?: boolean) => {
  const isOpening = typeof val === 'boolean' ? val : show.value

  // 展开
  if (isOpening) {
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
    }, 8000)
  } else {
    // 收起
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
    if (!afterData.value || !afterData.value.href) return '';
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    let url = new URL(afterData.value.href, base);
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
    if (!afterData.value || !afterData.value.href) return ''
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(afterData.value.href, base)
    return url.hostname || url.pathname
  } catch {
    return afterData.value.href
  }
}

defineOptions({
  name: 'HtmlLink'
})
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
        <a class="u" :href="isOpen ? afterData.href || null : null" :target="afterData.href ? isOpen ? '_blank' : null : null" rel="noopener noreferrer">
          <slot>{{ afterData.text || afterData.href }}</slot>
        </a>
      </span>
    </template>

    <template v-if="isIframeShow && isPoptip">
      <v-card border class="link-iframe bg-black" min-width="360">
        <!-- 错误状态 -->
        <template v-if="iframeError">
          <div class="link-load">
            <v-icon icon="mdi-alert-circle-outline" size="30" color="warning"/>
            <v-btn variant="tonal" size="small" :href="afterData.href" target="_blank" class="mt-2">
              <v-icon icon="mdi-open-in-new" size="14"/>
              <span class="text-caption ms-1">{{ getDomain() }}</span>
            </v-btn>
          </div>
        </template>

        <!-- iframe 容器：始终保持在 DOM 中渲染以触发 load 事件 -->
        <div v-show="!iframeError" class="iframe-container">
          <!-- 加载遮罩层：处于加载中时覆盖在 iframe 之上 -->
          <div v-if="linkLoad" class="link-load-overlay bg-black">
            <Loading size="50"></Loading>
          </div>

          <iframe
              v-if="show && afterData.href"
              :src="afterData.href"
              frameborder="0"
              width="100%"
              height="100%"
              @load="onIframeLoad"
              @error="onIframeError">
          </iframe>
        </div>
      </v-card>
    </template>
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/link";

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

    .link-load-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: var(--v-theme-surface);
      z-index: 2;
    }

    iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      z-index: 1;
    }
  }
}

.html-link {
  padding-bottom: 1px;
  transition: all .25s;

  a {
    color: hsl(from var(--text-color) h s calc(l * .8));
    //text-decoration: none;

    &:before {
      display: none;
      content: "" !important;
    }
  }

  a:hover {
    color: hsl(from var(--text-color) h s calc(l * 1));
  }

  .icon {
    margin-right: 4px;
    color: hsl(from var(--text-color) h s calc(l * .9));
    font-size: 14px;
  }
}

.html-link:hover {
  backdrop-filter: blur(20px);
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
