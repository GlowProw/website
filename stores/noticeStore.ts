import { defineStore } from "pinia";
import { Ref, ref } from "vue";
import { logError, ERROR_CODES, type ErrorCodeInfo } from "@/assets/sripts/error_logger";

export type NoticeTypeValue = 'success' | 'error' | 'info' | 'warning' | 'primary';

export interface NoticeOptions {
    id?: string;
    text: string;
    timeout?: number;
    color?: NoticeTypeValue;
    showing?: boolean;
    title?: string;
    /** 原始错误对象，用于在弹窗中展示堆栈详情 */
    stack?: Error | unknown;
    /** 错误代码信息（如 gp-0000000001 或 ErrorCodeInfo） */
    errorCode?: string | ErrorCodeInfo;
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

    // 添加消息到队列
    const push = (options: NoticeOptions) => {
        const message: NoticeOptions = {
            id: 'notice_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            text: options.text,
            timeout: options.timeout !== undefined ? options.timeout : 5000,
            color: options.color || 'primary',
            showing: false,
            title: options.title,
            stack: options.stack,
            errorCode: options.errorCode
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

    return {
        messages,
        currentMessage,
        push,
        success,
        error,
        info,
        warning,
        primary,
        clearCurrent,
        showNextMessage
    };
})
