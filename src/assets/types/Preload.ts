/**
 * 首屏预加载状态机用到的类型
 */

export type PreloadTaskStatus = 'pending' | 'running' | 'done' | 'failed';

export interface PreloadTask {
    /**
     * 任务唯一标识，用于日志
     */
    id: string;
    /**
     * 人类可读名称（i18n key 或直接字符串），用于 UI 显示
     */
    phase: string;
    /**
     * 实际执行函数，返回 Promise<void>
     */
    run: () => Promise<void>;
    /**
     * 当前状态
     */
    status: PreloadTaskStatus;
    /**
     * 最近一次错误（失败时填充）
     */
    lastError?: Error;
}

export interface PreloadErrorRecord {
    taskId: string;
    phase: string;
    message: string;
    timestamp: number;
}
