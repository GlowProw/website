/**
 * 全站通知状态机用到的类型
 */
import type { ErrorCodeInfo } from "@/assets/types/Error";

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
    mode?: NoticeMode;
    isHtml?: boolean;
    stack?: Error | unknown;
    // 错误代码信息（如 gp-0000000001 或 ErrorCodeInfo）
    errorCode?: string | ErrorCodeInfo;
}
