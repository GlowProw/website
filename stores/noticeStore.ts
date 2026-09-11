import { defineStore } from "pinia";
import { Ref, ref } from "vue";
import { logError, ERROR_CODES, type ErrorCodeInfo } from "@/assets/sripts/error_logger";

export type NoticeTypeValue = 'success' | 'error' | 'info' | 'warning' | 'primary';

/**
 * 展示模式：
 *  standard 标准：居中弹窗，含标题 / 错误码 / 堆栈详情，会阻断操作
 *  minimal  最小化：浏览器底部轻提示，仅保留文本，不拦截点击，约 3 秒自动消失
 */
export type NoticeMode = 'standard' | 'minimal';

export interface NoticeOptions {
    id?: string;
    text: string;
    timeout?: number;
    color?: NoticeTypeValue;
    showing?: boolean;
    title?: string;
    mode?: NoticeMode; // 展示模式，默认
    stack?: Error | unknown;
    errorCode?: string | ErrorCodeInfo; // 错误代码信息（如 gp-0000000001 或 ErrorCodeInfo）
}

export const NoticeType = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning',
    PRIMARY: 'primary'
} as const;

export const useNoticeStore = defineStore('notice', () => {
    const messages: Ref<NoticeOptions[]> = ref([])
    const currentMessage: Ref<NoticeOptions | null> = ref(null)
    // 全局默认模式（standard 阻断弹窗 / minimal 底部轻提示），单条消息可用 options.mode 覆盖
    const defaultMode = ref<NoticeMode>('standard')

    const setDefaultMode = (mode: NoticeMode) => {
        defaultMode.value = mode
    }

    // 添加消息到队列
    const push = (options: NoticeOptions) => {
        const mode: NoticeMode = options.mode || defaultMode.value
        const message: NoticeOptions = {
            id: 'notice_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            text: options.text,
            // 未显式指定时：标准 5 秒，最小化 3 秒
            timeout: options.timeout !== undefined
                ? options.timeout
                : (mode === 'minimal' ? 3000 : 5000),
            color: options.color || 'primary',
            showing: false,
            mode,
            title: options.title,
            // 最小化模式丢弃堆栈/错误码，只保留文本
            stack: mode === 'minimal' ? undefined : options.stack,
            errorCode: mode === 'minimal' ? undefined : options.errorCode
        };

        messages.value.push(message)

        // 如果没有当前显示的消息，立即显示下一条
        if (!currentMessage.value) {
            showNextMessage()
        }
    };

    // 显示下一条消息
    const showNextMessage = () => {
        if (messages.value.length > 0) {
            const nextMessage = messages.value.shift();
            if (nextMessage) {
                currentMessage.value = nextMessage;
                currentMessage.value.showing = true;
            }
        } else {
            currentMessage.value = null;
        }
    };

    // 清除当前消息
    const clearCurrent = () => {
        currentMessage.value = null;
        showNextMessage()
    };

    // 便捷方法
    const success = (text: string, options: Partial<NoticeOptions> = {}) => {
        push({ text, ...options, color: NoticeType.SUCCESS });
    };

    const error = (text: string, options: Partial<NoticeOptions> = {}) => {
        push({ text, ...options, color: NoticeType.ERROR });
        // 自动写入 session 日志，原始错误作为 context
        const rawErr = options.stack;
        const stackStr = rawErr instanceof Error
            ? rawErr.stack
            : (typeof rawErr === 'object' && rawErr !== null ? JSON.stringify(rawErr) : String(rawErr ?? ''));
        logError(
            ERROR_CODES.GP_HTTP_4XX,
            text,
            stackStr,
            undefined,
            rawErr
        );
    };

    const info = (text: string, options: Partial<NoticeOptions> = {}) => {
        push({ text, ...options, color: NoticeType.INFO });
    };

    const warning = (text: string, options: Partial<NoticeOptions> = {}) => {
        push({ text, ...options, color: NoticeType.WARNING });
        // warning 也记录日志
        const rawErr = options.stack;
        if (rawErr) {
            const stackStr = rawErr instanceof Error
                ? rawErr.stack
                : (typeof rawErr === 'object' && rawErr !== null ? JSON.stringify(rawErr) : String(rawErr));
            logError(
                ERROR_CODES.GP_UNKNOWN,
                text,
                stackStr,
                undefined,
                rawErr
            );
        }
    };

    const primary = (text: string, options: Partial<NoticeOptions> = {}) => {
        push({ text, ...options, color: NoticeType.PRIMARY });
    };

    /** 最小化底部轻提示（仅文本，不阻断操作，不记错误堆栈） */
    const minimal = (
        text: string,
        color: NoticeTypeValue = NoticeType.INFO,
        options: Partial<NoticeOptions> = {}
    ) => {
        push({ text, ...options, color, mode: 'minimal' });
    };

    return {
        messages,
        currentMessage,
        defaultMode,
        setDefaultMode,
        push,
        success,
        error,
        info,
        warning,
        primary,
        minimal,
        clearCurrent,
        showNextMessage
    };
})
