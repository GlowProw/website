import {defineStore} from "pinia";
import {Ref, ref} from "vue";

type NoticeTypeValue = 'success' | 'error' | 'info' | 'warning' | 'primary';

interface NoticeOptions {
    text: string
    timeout?: number
    color?: NoticeTypeValue
    showing?: boolean
}

const NoticeType = {
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
            text: options.text,
            timeout: options.timeout || 3000,
            color: options.color || 'primary',
            showing: false
        };

        messages.value.push(message)

        // 如果没有当前显示的消息，立即显示这条消息
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
        push({text, ...options, color: NoticeType.SUCCESS});
    };

    const error = (text: string, options: Partial<NoticeOptions> = {}) => {
        push({text, ...options, color: NoticeType.ERROR});
    };

    const info = (text: string, options: Partial<NoticeOptions> = {}) => {
        push({text, ...options, color: NoticeType.INFO});
    };

    const warning = (text: string, options: Partial<NoticeOptions> = {}) => {
        push({text, ...options, color: NoticeType.WARNING});
    };

    const primary = (text: string, options: Partial<NoticeOptions> = {}) => {
        push({text, ...options, color: NoticeType.PRIMARY});
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
