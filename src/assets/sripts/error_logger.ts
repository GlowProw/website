import { ref, computed } from 'vue';

export interface ErrorCodeInfo {
  code: string;
  category: 'network' | 'http' | 'javascript' | 'promise' | 'vue' | 'router' | 'storage' | 'worker' | 'resource' | 'data' | 'unknown';
  titleKey: string;
  descriptionKey: string;
}

export const ERROR_CODES: Record<string, ErrorCodeInfo> = {
  GP_NET_001: {
    code: 'gp-0000000001',
    category: 'network',
    titleKey: 'basic.errorCodes.gp-0000000001.title',
    descriptionKey: 'basic.errorCodes.gp-0000000001.description',
  },
  GP_HTTP_4XX: {
    code: 'gp-0000000002',
    category: 'http',
    titleKey: 'basic.errorCodes.gp-0000000002.title',
    descriptionKey: 'basic.errorCodes.gp-0000000002.description',
  },
  GP_HTTP_5XX: {
    code: 'gp-0000000003',
    category: 'http',
    titleKey: 'basic.errorCodes.gp-0000000003.title',
    descriptionKey: 'basic.errorCodes.gp-0000000003.description',
  },
  GP_JS_UNCAUGHT: {
    code: 'gp-0000000004',
    category: 'javascript',
    titleKey: 'basic.errorCodes.gp-0000000004.title',
    descriptionKey: 'basic.errorCodes.gp-0000000004.description',
  },
  GP_PROMISE_UNHANDLED: {
    code: 'gp-0000000005',
    category: 'promise',
    titleKey: 'basic.errorCodes.gp-0000000005.title',
    descriptionKey: 'basic.errorCodes.gp-0000000005.description',
  },
  GP_VUE_LIFECYCLE: {
    code: 'gp-0000000006',
    category: 'vue',
    titleKey: 'basic.errorCodes.gp-0000000006.title',
    descriptionKey: 'basic.errorCodes.gp-0000000006.description',
  },
  GP_ROUTER_NAV: {
    code: 'gp-0000000007',
    category: 'router',
    titleKey: 'basic.errorCodes.gp-0000000007.title',
    descriptionKey: 'basic.errorCodes.gp-0000000007.description',
  },
  GP_STORAGE_ACCESS: {
    code: 'gp-0000000008',
    category: 'storage',
    titleKey: 'basic.errorCodes.gp-0000000008.title',
    descriptionKey: 'basic.errorCodes.gp-0000000008.description',
  },
  GP_WORKER_EXEC: {
    code: 'gp-0000000009',
    category: 'worker',
    titleKey: 'basic.errorCodes.gp-0000000009.title',
    descriptionKey: 'basic.errorCodes.gp-0000000009.description',
  },
  GP_RESOURCE_LOAD: {
    code: 'gp-0000000010',
    category: 'resource',
    titleKey: 'basic.errorCodes.gp-0000000010.title',
    descriptionKey: 'basic.errorCodes.gp-0000000010.description',
  },
  GP_DATA_PARSE: {
    code: 'gp-0000000011',
    category: 'data',
    titleKey: 'basic.errorCodes.gp-0000000011.title',
    descriptionKey: 'basic.errorCodes.gp-0000000011.description',
  },
  GP_UNKNOWN: {
    code: 'gp-0000000099',
    category: 'unknown',
    titleKey: 'basic.errorCodes.gp-0000000099.title',
    descriptionKey: 'basic.errorCodes.gp-0000000099.description',
  }
};

export interface LogEntry {
  id: string;
  code: string;
  category: string;
  titleKey?: string;
  descriptionKey?: string;
  title?: string;
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  component?: string;
  context?: any;
}

import Storage from './storage';

const _storage = new Storage();

// 获取或创建持久客户端唯一标识 (Client ID)
function getOrCreateClientId(): string {
  const STORAGE_KEY = 'glow_prow_client_id';
  let clientId = _storage.local.get(STORAGE_KEY)?.data?.value;
  if (!clientId) {
    clientId = 'gp_cli_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      _storage.local.set(STORAGE_KEY, clientId);
    } catch (e) {
      console.warn('Storage unavailable for Client ID creation', e);
    }
  }
  return clientId;
}

// 会话 ID (Session ID)
function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'glow_prow_session_id';
  let sessionId = _storage.session.get(STORAGE_KEY)?.data?.value;
  if (!sessionId) {
    sessionId = 'gp_sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      _storage.session.set(STORAGE_KEY, sessionId);
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
    titleKey: errorCode.titleKey,
    descriptionKey: errorCode.descriptionKey,
    message: message || '',
    stack: stack || (new Error().stack || ''),
    timestamp: new Date().toISOString(),
    url: window.location.href,
    component: componentName,
    context
  };

  sessionLogs.value.unshift(newEntry);

  // 控制台调试输出
  console.error(`[${errorCode.code}]`, message, stack);
}

/**
 * 初始化全局错误捕获
 */
export function initGlobalErrorCapture(app?: any) {
  // window.onerror (全局脚本错误及静态资源加载错误)
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

  // window.unhandledrejection (Promise 未处理拒绝)
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

  // Vue app.config.errorHandler (Vue 全局异常处理)
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
      appName: 'Glow Prow',
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
