<script setup lang="ts">
import {computed, onUnmounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {ERROR_CODES, type ErrorCodeInfo} from "@/assets/sripts/error_logger";
import Logo from "./Logo.vue";

const noticeStore = useNoticeStore();
const {t} = useI18n();

// 进度条百分比 0 ~ 100
const progress = ref(0);
const isStackExpanded = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

// 图标与色彩映射
const colorConfig = computed(() => {
  const color = noticeStore.currentMessage?.color || 'primary';
  const labelKey = `notice.types.${color}`;
  switch (color) {
    case 'success':
      return {bg: '#1b382b', border: '#4caf50', text: '#81c784', icon: 'mdi-check-circle-outline', label: t(labelKey)};
    case 'error':
      return {bg: '#3e1a1a', border: '#f44336', text: '#e57373', icon: 'mdi-alert-circle-outline', label: t(labelKey)};
    case 'warning':
      return {bg: '#3a2e16', border: '#ff9800', text: '#ffb74d', icon: 'mdi-alert-outline', label: t(labelKey)};
    case 'info':
      return {bg: '#183142', border: '#2196f3', text: '#64b5f6', icon: 'mdi-information-outline', label: t(labelKey)};
    default:
      return {bg: '#232323', border: '#e5ad35', text: '#e5ad35', icon: 'mdi-bell-outline', label: t(labelKey)};
  }
});

// 是否包含自动倒计时器
const hasTimer = computed(() => {
  const timeout = noticeStore.currentMessage?.timeout;
  return timeout !== undefined && timeout > 0;
});

/**
 * 监听当前消息变动，启动定时进度条
 */
watch(
    () => noticeStore.currentMessage,
    (newMessage) => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      progress.value = 0;
      isStackExpanded.value = false; // 切换消息时重置堆栈展开状态

      if (newMessage && hasTimer.value) {
        const duration = newMessage.timeout!;
        const intervalMs = 20; // 50fps 画面平滑流畅
        const startTime = Date.now();

        timer = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const pct = (elapsed / duration) * 100;

          if (pct >= 100) {
            progress.value = 100;
            if (timer) clearInterval(timer);
            timer = null;
            noticeStore.clearCurrent();
          } else {
            progress.value = pct;
          }
        }, intervalMs);
      }
    },
    {immediate: true}
);

/**
 * 主动关闭当前消息
 */
const handleClose = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  noticeStore.clearCurrent();
};

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});

/**
 * 匹配对应的 ERROR_CODES 错误代码、标题和描述
 */
const matchedErrorCodeInfo = computed<ErrorCodeInfo | null>(() => {
  const current = noticeStore.currentMessage;
  if (!current) return null;

  // 设置 errorCode
  if (current.errorCode) {
    if (typeof current.errorCode === 'object' && (current.errorCode as any).code) {
      return current.errorCode as ErrorCodeInfo;
    }
    const codeStr = String(current.errorCode);
    const found = Object.values(ERROR_CODES).find(
        (item: ErrorCodeInfo) => item.code === codeStr || item.code.toLowerCase() === codeStr.toLowerCase()
    ) || (ERROR_CODES as Record<string, ErrorCodeInfo>)[codeStr];
    if (found) return found;
  }

  // 颜色为 error 或携带 stack，推导默认 ErrorCodeInfo
  if (current.color === 'error' || current.stack) {
    const rawErr = current.stack;
    if (rawErr && typeof rawErr === 'object') {
      const errName = (rawErr as any).name || (rawErr as any).constructor?.name;
      if (errName === 'ApiError') {
        return ERROR_CODES.GP_HTTP_4XX;
      }
      if (errName === 'TypeError' || errName === 'ReferenceError' || errName === 'SyntaxError') {
        return ERROR_CODES.GP_JS_UNCAUGHT;
      }
    }
    return ERROR_CODES.GP_HTTP_4XX;
  }

  return null;
});

/**
 * 将原始错误转换为可读堆栈字符串
 */
const stackText = computed(() => {
  const raw = noticeStore.currentMessage?.stack;
  if (!raw) return '';
  if (raw instanceof Error) {
    const rawStr = raw.stack || raw.message || String(raw);
    return rawStr.replace(/\[object Object\]/g, raw.message || 'ApiError');
  }
  if (typeof raw === 'object') {
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }
  return String(raw);
});

defineOptions({
  name: 'AppMessageWidget',
});
</script>

<template>
  <v-dialog
      :model-value="!!noticeStore.currentMessage"
      :opacity=".5"
      :eager="true"
      persistent
      no-click-animation
      width="100%"
      max-width="100%"
      content-class="notice-dialog-fullwidth"
      transition="slide-y-transition"
      style="margin: 0; padding: 0;">
    <div class="background-flavor bg-black position-absolute w-100 h-100" :style="{zIndex: 1}"></div>
    <v-card
        v-if="noticeStore.currentMessage"
        class="background-img-flavor notice-card w-100 position-relative rounded-0 border-0 overflow-hidden d-flex flex-column justify-space-between pa-6 pa-md-10"
        :style="{
          zIndex: 1,
          minHeight: '300px',
          backgroundColor: `color-mix(in srgb, rgba(0, 0, 0, 0.9) 50%, ${colorConfig.bg} 50%)`,
          borderBottom: `4px solid ${colorConfig.border}`
        }"
        elevation="24">

      <!-- 顶部位于弹窗最上面的进度条 (从左到右，仅在存在定时器时显示) S -->
      <template v-if="hasTimer">
        <div class="progress-bar-container position-absolute top-0 left-0 right-0 w-100" style="z-index: 10;">
          <v-progress-linear
              :key="noticeStore.currentMessage?.id"
              :model-value="progress"
              height="6"
              :color="colorConfig.border"
              class="ma-0 notice-progress-linear"
          ></v-progress-linear>
        </div>
      </template>
      <template v-else>
        <div class="progress-bar-container position-absolute top-0 left-0 right-0 w-100" style="z-index: 10;">
          <v-progress-linear
              :model-value="100"
              height="6"
              :color="colorConfig.border"
              class="ma-0 notice-progress-linear"
          ></v-progress-linear>
        </div>
      </template>
      <!-- 顶部位于弹窗最上面的进度条 E -->

      <!-- 头部操作与排队信息 S -->
      <div class="d-flex align-center justify-space-between w-100 mt-2">
        <div class="d-flex align-center ga-3">
          <v-chip
              size="default"
              variant="flat"
              :color="colorConfig.border"
              class="font-weight-bold text-black text-uppercase px-4">
            {{ colorConfig.label }}
          </v-chip>

          <v-chip v-if="matchedErrorCodeInfo"
                  size="default"
                  variant="flat"
                  :color="colorConfig.border"
                  class="font-weight-bold text-black text-uppercase px-4">
            {{ matchedErrorCodeInfo.code }}
          </v-chip>

          <!-- 堆积消息剩余条数提示 S -->
          <v-chip
              v-if="noticeStore.messages.length > 0"
              variant="outlined"
              color="amber"
              class="font-weight-bold">
            <v-icon start icon="mdi-layers-outline" size="16"></v-icon>
            {{ t('notice.remainingMessages', {count: noticeStore.messages.length}) }}
          </v-chip>
          <!-- 堆积消息剩余条数提示 E -->
        </div>

        <!-- 主动关闭按钮 S -->
        <v-btn
            icon="mdi-close"
            variant="tonal"
            size="large"
            color="white"
            @click="handleClose"
            :title="t('notice.closeTitle')">
        </v-btn>
        <!-- 主动关闭按钮 E -->
      </div>
      <!-- 头部操作与排队信息 E -->

      <!-- 主体消息文本展示区 (居中充满，保证 min-height 500px 体验) S -->
      <div class="d-flex flex-column justify-center align-center flex-grow-1 py-8">
        <v-icon
            :icon="colorConfig.icon"
            size="96"
            :color="colorConfig.border"
            class="mb-6 opacity-90 animate-bounce"></v-icon>

        <h2 v-if="noticeStore.currentMessage.title" class="text-h5 font-weight-bold mb-4" :style="{ color: colorConfig.text }">
          {{ noticeStore.currentMessage.title }}
        </h2>

        <!-- ERROR_CODES 错误代码与标题/描述展示卡片 S -->
        <div
            v-if="matchedErrorCodeInfo"
            class="error-code-card w-100 mt-2 rounded-lg text-left shadow-lg"
            style="max-width: 850px;">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center ga-2">
              <span class="text-subtitle-1 font-weight-bold text-red-lighten-2">
                {{ matchedErrorCodeInfo.titleKey ? t(matchedErrorCodeInfo.titleKey) : matchedErrorCodeInfo.title }}
              </span>
            </div>
            <v-chip size="x-small" variant="outlined" color="red-lighten-3" class="text-caption text-uppercase px-2">
              {{ matchedErrorCodeInfo.category }}
            </v-chip>
          </div>
          <div class="text-body-2 text-grey-lighten-2 opacity-90" style="line-height: 1.5;">
            {{ matchedErrorCodeInfo.descriptionKey ? t(matchedErrorCodeInfo.descriptionKey) : matchedErrorCodeInfo.description }}
          </div>
        </div>
        <!-- ERROR_CODES 错误代码与标题/描述展示卡片 E -->

        <div
            class="error-code-card w-100 rounded-lg text-left shadow-lg"
            style="max-width: 850px;">
          <div class="text-body-2 text-grey-lighten-2 font-weight-medium text-white max-w-100 text-pre-wrap mb-4" style="max-width: 900px; line-height: 1.6;">
            <u class="u">{{ noticeStore.currentMessage.text }}</u>
          </div>
        </div>
      </div>
      <!-- 主体消息文本展示区 E -->

      <!-- 堆栈信息区域 S - 仅当 stack 存在时显示 -->
      <div v-if="noticeStore.currentMessage.stack" class="stack-section w-100 rounded-lg overflow-hidden mb-3"
           style="border: 1px solid rgba(255,255,255,0.1);">
        <div
            class="stack-toggle d-flex align-center justify-space-between pa-3 cursor-pointer"
            :style="{ backgroundColor: 'rgba(0,0,0,0.3)' }"
            @click="isStackExpanded = !isStackExpanded">
          <div class="d-flex align-center ga-2">
            <v-icon size="16" :color="colorConfig.border">mdi-bug-outline</v-icon>
            <span class="text-caption font-weight-bold" :style="{ color: colorConfig.text }">
              {{ t('notice.stackTrace') }}
            </span>
          </div>
          <v-icon size="16" color="white" :icon="isStackExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"></v-icon>
        </div>
        <v-expand-transition>
          <div v-if="isStackExpanded" class="stack-content pa-3" style="background: rgba(0,0,0,0.5);">
            <pre class="text-caption font-monospace text-white opacity-80 overflow-x-auto ma-0" style="max-height: 200px; white-space: pre-wrap; word-break: break-all;">{{ stackText }}</pre>
          </div>
        </v-expand-transition>
      </div>
      <!-- 堆栈信息区域 E -->

      <!-- 底部底部提示栏 S -->
      <div class="d-flex align-center justify-space-between w-100 text-caption opacity-60 pt-4 border-t border-opacity-12">
        <p>
          <Logo></Logo>
        </p>
        <span>{{ hasTimer ? t('notice.closeHint') : t('notice.manualCloseHint') }}</span>
      </div>
      <!-- 底部底部提示栏 E -->

    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
.notice-dialog-fullwidth {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  margin: 0 !important;
  max-width: 100vw !important;
  width: 100vw !important;
  z-index: 99999 !important;
}

.notice-card {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8) !important;
}

.notice-progress-linear :deep(.v-progress-linear__determinate) {
  transition: width 0.05s linear !important;
}

.text-pre-wrap {
  white-space: pre-wrap;
  word-break: break-all;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.animate-bounce {
  animation: pulse 2s infinite ease-in-out;
}
</style>
