import {defineStore} from "pinia";
import {ref} from "vue";

type NoticeType = 'success' | 'error' | 'info' | 'warning' | 'primary' | any

interface NoticeOptions {
    text: string
    timeout?: number
    color?: NoticeType
}

const NoticeType = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning',
    PRIMARY: 'primary'
};

export const useNoticeStore = defineStore('notice', () => {
    const messages = ref([]);
    const currentMessage = ref(null);

    // 添加消息到队列
    const push = (options) => {
        const message = {
            text: options.text,
            timeout: options.timeout || 3000,
            color: options.color || 'primary',
        };

        messages.value.push(message);

        // 如果没有当前显示的消息，立即显示这条消息
        if (!currentMessage.value) {
            showNextMessage();
        }
    };

    // 显示下一条消息
    const showNextMessage = () => {
        if (messages.value.length > 0) {
            currentMessage.value = messages.value.shift();
            currentMessage.value.showing = true;
        } else {
            currentMessage.value = null;
        }
    };

    // 清除当前消息
    const clearCurrent = () => {
        currentMessage.value = null;
        showNextMessage();
    };

    // 便捷方法
    const success = (text, options = {}) => {
        push({text, ...options, color: NoticeType.SUCCESS});
    };

    const error = (text, options = {}) => {
        push({text, ...options, color: NoticeType.ERROR});
    };

    const info = (text, options = {}) => {
        push({text, ...options, color: NoticeType.INFO});
    };

    const warning = (text, options = {}) => {
        push({text, ...options, color: NoticeType.WARNING});
    };

    const primary = (text, options = {}) => {
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
