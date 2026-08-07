import { ref, computed } from 'vue';

export interface ErrorCodeInfo {
  code: string;
  category: 'network' | 'http' | 'javascript' | 'promise' | 'vue' | 'router' | 'storage' | 'worker' | 'resource' | 'data' | 'unknown';
  titleKey: string;
  descriptionKey: string;
  readonly title: string;
  readonly description: string;
}

export const ERROR_CODES: Record<string, ErrorCodeInfo> = {
  GP_NET_001: {
    code: 'gp-0000000001',
    category: 'network',
    titleKey: 'errorCodes.gp-0000000001.title',
    descriptionKey: 'errorCodes.gp-0000000001.description',
    get title() { return '网络连接异常'; },
    get description() { return '客户端无法连接网络或请求发送失败。'; }
  },
  GP_HTTP_4XX: {
    code: 'gp-0000000002',
    category: 'http',
    titleKey: 'errorCodes.gp-0000000002.title',
    descriptionKey: 'errorCodes.gp-0000000002.description',
    get title() { return 'HTTP 4xx 客户端请求错误'; },
    get description() { return '服务器拒绝了请求，请求路径不存在或认证失败。'; }
  },
  GP_HTTP_5XX: {
    code: 'gp-0000000003',
    category: 'http',
    titleKey: 'errorCodes.gp-0000000003.title',
    descriptionKey: 'errorCodes.gp-0000000003.description',
    get title() { return 'HTTP 5xx 服务端响应异常'; },
    get description() { return '后端服务器在处理请求时遭遇内部故障。'; }
  },
  GP_JS_UNCAUGHT: {
    code: 'gp-0000000004',
    category: 'javascript',
    titleKey: 'errorCodes.gp-0000000004.title',
    descriptionKey: 'errorCodes.gp-0000000004.description',
    get title() { return 'JS 未捕获运行时异常'; },
    get description() { return '前端 JavaScript 代码执行时触发了未捕获的 Error。'; }
  },
  GP_PROMISE_UNHANDLED: {
    code: 'gp-0000000005',
    category: 'promise',
    titleKey: 'errorCodes.gp-0000000005.title',
    descriptionKey: 'errorCodes.gp-0000000005.description',
    get title() { return 'Promise 未处理拒绝'; },
    get description() { return '异步任务 Promise 发生了 reject 但未能被 catch 捕获。'; }
  },
  GP_VUE_LIFECYCLE: {
    code: 'gp-0000000006',
    category: 'vue',
    titleKey: 'errorCodes.gp-0000000006.title',
    descriptionKey: 'errorCodes.gp-0000000006.description',
    get title() { return '组件渲染或生命周期错误'; },
    get description() { return '程序内部组件在 mount、update 或 render 过程中引发异常。'; }
  },
  GP_ROUTER_NAV: {
    code: 'gp-0000000007',
    category: 'router',
    titleKey: 'errorCodes.gp-0000000007.title',
    descriptionKey: 'errorCodes.gp-0000000007.description',
    get title() { return '路由导航跳转失败'; },
    get description() { return 'Vue Router 路由导航钩子异常或动态加载组件超时。'; }
  },
  GP_STORAGE_ACCESS: {
    code: 'gp-0000000008',
    category: 'storage',
    titleKey: 'errorCodes.gp-0000000008.title',
    descriptionKey: 'errorCodes.gp-0000000008.description',
    get title() { return '本地存储读写异常'; },
    get description() { return 'localStorage / sessionStorage 访问受限或配额耗尽。'; }
  },
  GP_WORKER_EXEC: {
    code: 'gp-0000000009',
    category: 'worker',
    titleKey: 'errorCodes.gp-0000000009.title',
    descriptionKey: 'errorCodes.gp-0000000009.description',
    get title() { return 'Web Worker 后台任务异常'; },
    get description() { return '检索或主进程 WebWorker 通信处理数据时报错。'; }
  },
  GP_RESOURCE_LOAD: {
    code: 'gp-0000000010',
    category: 'resource',
    titleKey: 'errorCodes.gp-0000000010.title',
    descriptionKey: 'errorCodes.gp-0000000010.description',
    get title() { return '静态资源加载失败'; },
    get description() { return '图片、样式表或 CDN 静态资源未能成功载入。'; }
  },
  GP_DATA_PARSE: {
    code: 'gp-0000000011',
    category: 'data',
    titleKey: 'errorCodes.gp-0000000011.title',
    descriptionKey: 'errorCodes.gp-0000000011.description',
    get title() { return '数据结构解析错误'; },
    get description() { return '对 JSON 或外部格式数据进行解包反序列化时结构不匹配。'; }
  },
  GP_UNKNOWN: {
    code: 'gp-0000000099',
    category: 'unknown',
    titleKey: 'errorCodes.gp-0000000099.title',
    descriptionKey: 'errorCodes.gp-0000000099.description',
    get title() { return '未定义通用应用异常'; },
    get description() { return '遇到非明确分类的系统应用运行错误。'; }
  }
};

export interface LogEntry {
  id: string;
  code: string;
  category: string;
  title: string;
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  component?: string;
  context?: any;
}

// 获取或创建持久客户端唯一标识 (Client ID)
function getOrCreateClientId(): string {
  const STORAGE_KEY = 'glow_prow_client_id';
  let clientId = localStorage.getItem(STORAGE_KEY);
  if (!clientId) {
    clientId = 'gp_cli_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      localStorage.setItem(STORAGE_KEY, clientId);
    } catch (e) {
      console.warn('LocalStorage unavailable for Client ID creation', e);
    }
  }
  return clientId;
}

// 会话 ID (Session ID)
function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'glow_prow_session_id';
  let sessionId = sessionStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = 'gp_sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      sessionStorage.setItem(STORAGE_KEY, sessionId);
    } catch (e) {
      console.warn('SessionStorage unavailable for Session ID creation', e);
    }
  }
  return sessionId;
}

const CLIENT_ID = getOrCreateClientId();
const SESSION_ID = getOrCreateSessionId();

// 会话日志数组 (仅存当前会话)
const sessionLogs = ref<LogEntry[]>([]);

/**
 * 记录日志
 */
export function logError(
  errorCode: ErrorCodeInfo = ERROR_CODES.GP_UNKNOWN,
  message: string,
  stack?: string,
  componentName?: string,
  context?: any
) {
  const newEntry: LogEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    code: errorCode.code,
    category: errorCode.category,
    title: errorCode.title,
    message: message || errorCode.description,
    stack: stack || (new Error().stack || ''),
    timestamp: new Date().toISOString(),
    url: window.location.href,
    component: componentName,
    context
  };

  sessionLogs.value.unshift(newEntry);

  // 控制台调试输出
  console.error(`[${errorCode.code}] ${errorCode.title}:`, message, stack);
}

/**
 * 初始化全局错误捕获
 */
export function initGlobalErrorCapture(app?: any) {
  // 1. window.onerror (全局脚本错误及静态资源加载错误)
  window.addEventListener('error', (event: ErrorEvent | Event) => {
    if (event instanceof ErrorEvent) {
      logError(
        ERROR_CODES.GP_JS_UNCAUGHT,
        event.message,
        event.error?.stack,
        undefined,
        { filename: event.filename, lineno: event.lineno, colno: event.colno }
      );
    } else {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        logError(
          ERROR_CODES.GP_RESOURCE_LOAD,
          `静态资源加载失败: <${target.tagName.toLowerCase()}> ${(target as any).src || (target as any).href || ''}`,
          undefined,
          undefined,
          { tagName: target.tagName }
        );
      }
    }
  }, true);

  // 2. window.unhandledrejection (Promise 未处理拒绝)
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    logError(
      ERROR_CODES.GP_PROMISE_UNHANDLED,
      message,
      stack,
      undefined,
      { reason }
    );
  });

  // 3. Vue app.config.errorHandler
  if (app && app.config) {
    app.config.errorHandler = (err: unknown, instance: any, info: string) => {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      const componentName = instance?.$options?.name || instance?.$options?.__name || 'VueComponent';
      logError(
        ERROR_CODES.GP_VUE_LIFECYCLE,
        message,
        stack,
        componentName,
        { info }
      );
    };
  }
}

/**
 * 导出会话日志 JSON 文件
 */
export function exportLogsJSON() {
  const exportPayload = {
    metadata: {
      appName: 'Glow Prow 闪耀船首',
      clientId: CLIENT_ID,
      sessionId: SESSION_ID,
      exportTimestamp: new Date().toISOString(),
      systemInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        onLine: navigator.onLine,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        devicePixelRatio: window.devicePixelRatio || 1,
        colorDepth: window.screen.colorDepth,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    },
    totalLogsCount: sessionLogs.value.length,
    logs: sessionLogs.value
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `glow_prow_logs_${CLIENT_ID.substring(0, 12)}_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 清空当前会话日志
 */
export function clearSessionLogs() {
  sessionLogs.value = [];
}

export function useErrorLogger() {
  return {
    CLIENT_ID,
    SESSION_ID,
    sessionLogs: computed(() => sessionLogs.value),
    logError,
    exportLogsJSON,
    clearSessionLogs,
    ERROR_CODES
  };
}
