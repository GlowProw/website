<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import EmptyView from "@/components/EmptyView.vue";
import { useErrorLogger, ERROR_CODES, logError } from "@/assets/sripts/error_logger";
import { useNoticeStore } from "~/stores/noticeStore";
import { mode } from "d3";

const { t } = useI18n();
const { CLIENT_ID, SESSION_ID, sessionLogs, exportLogsJSON, clearSessionLogs } = useErrorLogger();
const noticeStore = useNoticeStore();

const filterCategory = ref('all');
const expandedLogs = ref<string[]>([]);

const toggleExpand = (id: string) => {
  const index = expandedLogs.value.indexOf(id);
  if (index >= 0) {
    expandedLogs.value.splice(index, 1);
  } else {
    expandedLogs.value.push(id);
  }
};

const isExpanded = (id: string) => expandedLogs.value.includes(id);

/**
 * 依据分类筛选日志
 */
const filteredLogs = computed(() => {
  if (filterCategory.value === 'all') {
    return sessionLogs.value;
  }
  return sessionLogs.value.filter(log => log.category === filterCategory.value);
});

/**
 * 分类数量统计
 */
const categoryStats = computed(() => {
  const stats: Record<string, number> = {
    all: sessionLogs.value.length,
    network: 0,
    http: 0,
    javascript: 0,
    promise: 0,
    vue: 0,
    router: 0,
    storage: 0,
    resource: 0,
    data: 0
  };
  sessionLogs.value.forEach(log => {
    if (stats[log.category] !== undefined) {
      stats[log.category]++;
    }
  });
  return stats;
});

/**
 * 模拟测试错误
 * @param type
 */
const triggerTestError = (type: 'net' | 'js' | 'promise' | 'vue') => {
  if (type === 'net') {
    logError(ERROR_CODES.GP_NET_001, '模拟网络连接超时 [Test Network Timeout]', 'Error: Failed to fetch\n    at fetch (api.ts:42)\n    at onClick (Button.vue:12)');
  } else if (type === 'js') {
    logError(ERROR_CODES.GP_JS_UNCAUGHT, 'TypeError: Cannot read property "undefined" of null', 'TypeError: Cannot read property "undefined" of null\n    at render (Log.vue:88)\n    at updateComponent (vue.runtime.esm-bundler.js:1542)');
  } else if (type === 'promise') {
    logError(ERROR_CODES.GP_PROMISE_UNHANDLED, 'Unhandled Rejection: Request failed with status 500', 'Error: Request failed with status 500\n    at axios.ts:108\n    at processTicksAndRejections');
  } else if (type === 'vue') {
    logError(ERROR_CODES.GP_VUE_LIFECYCLE, 'Vue Setup Executed with Unhandled Error', 'Error: Component Setup Failed\n    at setup (Widget.vue:15)\n    at callWithErrorHandling (vue.js:321)', 'TestComponent');
  }
};

/**
 * 触发 useNoticeStore 通知测试
 * @param type
 */
const triggerNoticeTest = (type: 'single' | 'queue' | 'net' | '4xx' | '5xx' | 'js' | 'persistent' | 'persistentQueue') => {
  if (type === 'single') {
    noticeStore.info('这是一条常规提示通知测试消息', { title: '普通提示', mode: 'minimal' });
  } else if (type === 'queue') {
    noticeStore.success('操作已成功执行并同步到云端', { title: '成功' });
    noticeStore.warning('当前偏好配置发生了变动，请留意保存', { title: '警告' });
    noticeStore.error('尝试连接远程搜索 Worker 失败', { title: '故障通知' });
  } else if (type === 'net') {
    noticeStore.error('客户端无法连接远程服务器或网络请求发送失败 (GP_NET_001)', {
      title: '网络连接异常',
      errorCode: ERROR_CODES.GP_NET_001,
      stack: new Error('TypeError: Failed to fetch\n    at XMLHttpRequest.send (http.ts:128)\n    at getSmugglersReport (smugglers_service.ts:42)')
    });
  } else if (type === '4xx') {
    noticeStore.error('请求已被服务器拒绝，HTTP 400 Bad Request / 认证失效 (GP_HTTP_4XX)', {
      title: '客户端请求错误',
      errorCode: ERROR_CODES.GP_HTTP_4XX,
      stack: new Error('ApiError: Request failed with status code 400\n    at createError (AxiosError.js:45)\n    at settle (settle.js:18)')
    });
  } else if (type === '5xx') {
    noticeStore.error('后端服务器在处理请求时遭遇内部未捕获故障 (GP_HTTP_5XX)', {
      title: '服务端响应异常',
      errorCode: ERROR_CODES.GP_HTTP_5XX,
      stack: new Error('ApiError: 500 Internal Server Error\n    at processResponse (api-util.ts:25)\n    at async getAssemblyItem (assembly_service.ts:88)')
    });
  } else if (type === 'js') {
    noticeStore.error('Uncaught TypeError: Cannot read properties of undefined (reading "title")', {
      title: 'JS 未捕获运行时异常',
      errorCode: ERROR_CODES.GP_JS_UNCAUGHT,
      stack: new Error('TypeError: Cannot read properties of undefined (reading "title")\n    at AppMessageWidget.vue:150\n    at renderComponentRoot (vue.esm-bundler.js:890)')
    });
  } else if (type === 'persistent') {
    noticeStore.error('此错误弹窗没有倒计时器（timeout: 0），不会自动倒计时消退！必须主动点击右上角 ✕ 按钮关闭。', {
      title: '常驻错误通知 (无定时器)',
      timeout: 0,
      errorCode: ERROR_CODES.GP_HTTP_5XX,
      stack: new Error('Persistent Error Notification Test Stack Trace\n    at triggerNoticeTest (Log.vue:80)')
    });
  } else if (type === 'persistentQueue') {
    noticeStore.error('【第 1 条 - 无定时器】必须主动点击右上角 ✕ 关掉我！关掉后第 2 条通知才会开始倒计时！', {
      title: '第 1 条：常驻通知 (无定时器)',
      timeout: 0,
      errorCode: ERROR_CODES.GP_NET_001,
      stack: new Error('Queue Item 1 (Persistent Manual Close)')
    });
    noticeStore.warning('【第 2 条 - 5秒倒计时】第 1 条被手动关闭后，我才成功显示并开始倒计时！', {
      title: '第 2 条：定时通知 (5秒倒计时)',
      timeout: 5000
    });
  }
};

/**
 * 复制客户端 ID
 */
const copyClientId = () => {
  navigator.clipboard.writeText(CLIENT_ID);
};
</script>

<template>
  <v-row>
    <!-- 客户端会话与导出信息 S -->
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-4">
          {{ t('setting.log.description') }}
        </p>

        <v-card class="pa-3 mb-4">
          <div class="text-caption text-grey">{{ t('setting.log.clientId') }}</div>
          <div class="d-flex align-center justify-space-between mt-1">
            <span class="font-weight-bold text-caption text-truncate" :title="CLIENT_ID">{{ CLIENT_ID }}</span>
            <v-btn icon="mdi-content-copy" variant="text" density="compact" size="small" @click="copyClientId"></v-btn>
          </div>

          <v-divider class="my-2"></v-divider>

          <div class="text-caption text-grey">{{ t('setting.log.sessionId') }}</div>
          <div class="font-weight-bold text-caption text-truncate mt-1" :title="SESSION_ID">{{ SESSION_ID }}</div>
        </v-card>

        <div class="d-flex ga-2 mb-4">
          <v-btn color="var(--main-color)" prepend-icon="mdi-download" @click="exportLogsJSON">
            {{ t('setting.log.exportBtn') }}
          </v-btn>
          <v-btn variant="outlined"
          color="error" prepend-icon="mdi-delete-outline"
          @click="clearSessionLogs"
          :disabled="sessionLogs.length === 0" :title="t('setting.log.clearBtn')">
          </v-btn>
        </div>

        <v-divider class="my-4"></v-divider>

        <div class="text-subtitle-2 mb-2">{{ t('setting.log.testTitle') }}</div>
        <div class="d-flex flex-wrap ga-2 mb-4">
          <v-btn size="x-small" variant="tonal" color="warning" @click="triggerTestError('net')">{{ t('setting.log.netError') }}</v-btn>
          <v-btn size="x-small" variant="tonal" color="error" @click="triggerTestError('js')">{{ t('setting.log.jsError') }}</v-btn>
          <v-btn size="x-small" variant="tonal" color="info" @click="triggerTestError('promise')">{{ t('setting.log.promiseError') }}</v-btn>
          <v-btn size="x-small" variant="tonal" color="purple" @click="triggerTestError('vue')">{{ t('setting.log.vueError') }}</v-btn>
        </div>

        <v-divider class="my-3"></v-divider>

        <div class="text-subtitle-2 mb-2">{{ t('setting.log.noticeTestTitle') }}</div>
        <div class="d-flex flex-wrap ga-2 mb-2">
          <v-btn size="x-small" variant="flat" color="var(--main-color)" @click="triggerNoticeTest('single')">
            {{ t('setting.log.testSingleNotice') }}
          </v-btn>
          <v-btn size="x-small" variant="outlined" color="info" @click="triggerNoticeTest('queue')">
            {{ t('setting.log.testQueueNotice') }}
          </v-btn>
        </div>
        <div class="d-flex flex-wrap ga-2 mb-2">
          <v-btn size="x-small" variant="tonal" color="warning" @click="triggerNoticeTest('net')">
            {{ t('setting.log.testNoticeNetError') }}
          </v-btn>
          <v-btn size="x-small" variant="tonal" color="orange" @click="triggerNoticeTest('4xx')">
            {{ t('setting.log.testNotice4xxError') }}
          </v-btn>
          <v-btn size="x-small" variant="tonal" color="red" @click="triggerNoticeTest('5xx')">
            {{ t('setting.log.testNotice5xxError') }}
          </v-btn>
          <v-btn size="x-small" variant="tonal" color="purple" @click="triggerNoticeTest('js')">
            {{ t('setting.log.testNoticeJsError') }}
          </v-btn>
        </div>
        <div class="d-flex flex-wrap ga-2">
          <v-btn size="x-small" variant="flat" color="error" @click="triggerNoticeTest('persistent')">
            {{ t('setting.log.testNoticePersistent') }}
          </v-btn>
          <v-btn size="x-small" variant="outlined" color="amber" @click="triggerNoticeTest('persistentQueue')">
            {{ t('setting.log.testNoticePersistentQueue') }}
          </v-btn>
        </div>

        <template v-slot:title>
          {{ t('setting.log.infoTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <!-- 客户端会话与导出信息 E -->

    <!-- 日志明细列表 S -->
    <v-col cols="12" lg="8">
      <AffixBoxHasTitleView>
        <!-- 筛选标签 S -->
        <div class="d-flex flex-wrap ga-2 mb-4">
          <v-chip
              size="small"
              :color="filterCategory === 'all' ? 'var(--main-color)' : undefined"
              :variant="filterCategory === 'all' ? 'flat' : 'outlined'"
              @click="filterCategory = 'all'">
            {{ t('setting.log.filterAll') }} ({{ categoryStats.all }})
          </v-chip>
          <v-chip
              size="small"
              :color="filterCategory === 'javascript' ? 'error' : undefined"
              :variant="filterCategory === 'javascript' ? 'flat' : 'outlined'"
              @click="filterCategory = 'javascript'">
            {{ t('setting.log.categoryJs') }} ({{ categoryStats.javascript }})
          </v-chip>
          <v-chip
              size="small"
              :color="filterCategory === 'promise' ? 'warning' : undefined"
              :variant="filterCategory === 'promise' ? 'flat' : 'outlined'"
              @click="filterCategory = 'promise'">
            {{ t('setting.log.categoryPromise') }} ({{ categoryStats.promise }})
          </v-chip>
          <v-chip
              size="small"
              :color="filterCategory === 'vue' ? 'purple' : undefined"
              :variant="filterCategory === 'vue' ? 'flat' : 'outlined'"
              @click="filterCategory = 'vue'">
            {{ t('setting.log.categoryVue') }} ({{ categoryStats.vue }})
          </v-chip>
          <v-chip
              size="small"
              :color="filterCategory === 'network' ? 'info' : undefined"
              :variant="filterCategory === 'network' ? 'flat' : 'outlined'"
              @click="filterCategory = 'network'">
            {{ t('setting.log.categoryNet') }} ({{ categoryStats.network }})
          </v-chip>
        </div>
        <!-- 筛选标签 E -->

        <!-- 日志条目 S -->
        <div v-if="filteredLogs.length > 0" class="log-list">
          <v-card
              v-for="log in filteredLogs"
              :key="log.id"
              border
              class="mb-3 pa-3"
              density="compact"
              variant="tonal">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-2">
                <v-chip size="x-small" color="error" label class="font-weight-bold">
                  {{ log.code }}
                </v-chip>
                <span class="font-weight-bold text-subtitle-2">{{ log.title }}</span>
                <v-chip v-if="log.component" size="x-small" variant="outlined">
                  {{ log.component }}
                </v-chip>
              </div>
              <span class="text-caption opacity-50">{{ new Date(log.timestamp).toLocaleTimeString() }}</span>
            </div>

            <div class="mt-2 text-body-2 font-weight-regular text-pre-wrap font-monospace bg-black pa-2 rounded">
              {{ log.message }}
            </div>

            <div class="d-flex align-center justify-space-between mt-2">
              <span class="text-caption opacity-50 text-truncate" style="max-width: 400px;" :title="log.url">
                <v-icon size="14">mdi-link-variant</v-icon> {{ log.url }}
              </span>

              <v-btn
                  v-if="log.stack"
                  size="x-small"
                  variant="text"
                  color="info"
                  :append-icon="isExpanded(log.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  @click="toggleExpand(log.id)">
                {{ isExpanded(log.id) ? t('setting.log.collapseStack') : t('setting.log.expandStack') }}
              </v-btn>
            </div>

            <!-- 堆栈明细 S -->
            <v-expand-transition>
              <div v-if="isExpanded(log.id) && log.stack" class="mt-2">
                <v-divider class="my-2"></v-divider>
                <div class="text-caption opacity-70 mb-1 font-weight-bold">{{ t('setting.log.stackTraceTitle') }}</div>
                <pre class="pa-2 bg-grey-darken-4 rounded text-caption font-monospace overflow-x-auto" style="max-height: 250px;">{{ log.stack }}</pre>
              </div>
            </v-expand-transition>
            <!-- 堆栈明细 E -->
          </v-card>
        </div>
        <div v-else class="py-8">
          <EmptyView></EmptyView>
          <p class="text-center text-caption opacity-50 mt-2">{{ t('setting.log.emptyState') }}</p>
        </div>
        <!-- 日志条目 E -->

        <template v-slot:title>
          {{ t('setting.log.title') }} ({{ filteredLogs.length }})
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <!-- 日志明细列表 E -->
  </v-row>
</template>

<style scoped lang="less">
.font-monospace {
  font-family: monospace, 'Courier New', Courier;
}

.text-pre-wrap {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
