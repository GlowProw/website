import { ApiError } from "@/assets/types/Api";
import { logError, ERROR_CODES } from "@/assets/sripts/error_logger";

/**
 * 统一 API 错误处理工具函数
 *
 * 使用方式：
 *   import { handleApiError } from "@/assets/sripts/error_handler"
 *   import { useNoticeStore } from "~/stores/noticeStore"
 *   import { useI18n } from "vue-i18n"
 *
 *   const notice = useNoticeStore()
 *   const { t } = useI18n()
 *
 *   } catch (e) {
 *     handleApiError(e, notice, t)
 *   }
 */
export function handleApiError(
    e: unknown,
    notice: { error: (text: string, opts?: any) => void },
    t: (key: string, params?: any) => string,
    options: {
        /** i18n key 前缀，默认 'basic.tips' */
        tPrefix?: string;
        /** 自定义兜底 i18n key，默认 'basic.tips.error' */
        fallbackKey?: string;
        /** 额外 context 信息（会合并进日志 context） */
        component?: string;
    } = {}
) {
    const {
        tPrefix = 'basic.tips',
        fallbackKey = 'basic.tips.error',
        component
    } = options;

    if (e instanceof ApiError) {
        // API 业务错误 - 用 HTTP 4xx 类别记录
        const apiErr = e as ApiError;
        notice.error(t(`${tPrefix}.${apiErr.code}`, { context: apiErr }), { stack: apiErr, errorCode: ERROR_CODES.GP_HTTP_4XX });
        logError(
            ERROR_CODES.GP_HTTP_4XX,
            `[ApiError] ${apiErr.message} (code=${apiErr.code})`,
            apiErr.stack,
            component,
            { code: apiErr.code, error: apiErr.error, response: apiErr.response }
        );
    } else if (e instanceof TypeError || e instanceof ReferenceError || e instanceof SyntaxError) {
        // JS 运行时错误
        notice.error(t(fallbackKey), { stack: e, errorCode: ERROR_CODES.GP_JS_UNCAUGHT });
        logError(
            ERROR_CODES.GP_JS_UNCAUGHT,
            (e as Error).message,
            (e as Error).stack,
            component,
            e
        );
    } else if (isNetworkError(e)) {
        // 网络请求失败（fetch/axios network error）
        notice.error(t(fallbackKey), { stack: e, errorCode: ERROR_CODES.GP_NET_001 });
        logError(
            ERROR_CODES.GP_NET_001,
            getErrorMessage(e),
            getErrorStack(e),
            component,
            e
        );
    } else {
        // 未知/通用错误
        notice.error(t(fallbackKey), { stack: e, errorCode: ERROR_CODES.GP_UNKNOWN });
        logError(
            ERROR_CODES.GP_UNKNOWN,
            getErrorMessage(e),
            getErrorStack(e),
            component,
            e
        );
    }
}

function isNetworkError(e: unknown): boolean {
    if (!(e instanceof Error)) return false;
    const msg = e.message.toLowerCase();
    return (
        msg.includes('network error') ||
        msg.includes('failed to fetch') ||
        msg.includes('net::err') ||
        msg.includes('connection refused') ||
        msg.includes('timeout')
    );
}

function getErrorMessage(e: unknown): string {
    if (e instanceof Error) return e.message;
    if (typeof e === 'string') return e;
    try { return JSON.stringify(e); } catch { return String(e); }
}

function getErrorStack(e: unknown): string | undefined {
    if (e instanceof Error) return e.stack;
    return undefined;
}
