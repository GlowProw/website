/**
 * 应用级预加载状态机
 *
 * 用途：
 *   - 全局 loading overlay 控制（appLoading=true 时 App.vue 显示 v-progress-circular + phase 文案）
 *   - 扩展点：未来远程配置 / manifest / feature flags 等任务都可以注册到 task queue
 *   - 支持单任务失败后重试，错误自动写入 errors[] 供 UI 展示
 *
 * 设计模式参考 noticeStore.ts：defineStore + ref + 明确的 action API
 */
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import { logError, ERROR_CODES } from "@/assets/sripts/error_logger";

export type PreloadTaskStatus = 'pending' | 'running' | 'done' | 'failed';

export interface PreloadTask {
    /** 任务唯一标识，用于日志 */
    id: string;
    /** 人类可读名称（i18n key 或直接字符串），用于 UI 显示 */
    phase: string;
    /** 实际执行函数，返回 Promise<void> */
    run: () => Promise<void>;
    /** 当前状态 */
    status: PreloadTaskStatus;
    /** 最近一次错误（失败时填充） */
    lastError?: Error;
}

export interface PreloadErrorRecord {
    taskId: string;
    phase: string;
    message: string;
    timestamp: number;
}

export const usePreloadStore = defineStore('preload', () => {
    /** 全局 loading：true 时 App.vue 显示全屏遮罩 */
    const appLoading: Ref<boolean> = ref(false);

    /** 当前执行阶段文案 —— i18n key 或直接字符串 */
    const currentPhase: Ref<string> = ref('');

    /** 已注册的任务列表 */
    const tasks: Ref<PreloadTask[]> = ref([]);

    /** 最近失败记录（按时间倒序，最多保留 20 条） */
    const errors: Ref<PreloadErrorRecord[]> = ref([]);

    /** 注册一个预加载任务（应用初始化时调用一次即可） */
    const registerTask = (task: Omit<PreloadTask, 'status'>) => {
        const existing = tasks.value.find(t => t.id === task.id);
        if (existing) {
            // 已注册则只更新 phase/run，保留 status
            existing.phase = task.phase;
            existing.run = task.run;
            return existing;
        }
        const t: PreloadTask = { ...task, status: 'pending' };
        tasks.value.push(t);
        return t;
    };

    /** 运行所有 pending 任务（串行，不中断；失败会记录但继续下一个） */
    const runAll = async (): Promise<void> => {
        if (appLoading.value) return; // 防重入
        appLoading.value = true;
        currentPhase.value = '';

        for (const task of tasks.value) {
            task.status = 'running';
            currentPhase.value = task.phase;
            try {
                await task.run();
                task.status = 'done';
                task.lastError = undefined;
            } catch (err: any) {
                task.status = 'failed';
                task.lastError = err;
                const errMsg = err?.message || String(err);
                errors.value.unshift({
                    taskId: task.id,
                    phase: task.phase,
                    message: errMsg,
                    timestamp: Date.now()
                });
                if (errors.value.length > 20) errors.value.pop();

                // 写入 error_logger
                logError(
                    ERROR_CODES.GP_NET_001,
                    `[Preload:${task.id}] ${errMsg}`,
                    err?.stack,
                    'preloadStore',
                    { phase: task.phase }
                );
            }
        }

        currentPhase.value = '';
        appLoading.value = false;
    };

    /** 仅重试指定 task（id），可传空/未传则重试所有 failed 的 */
    const retry = async (taskId?: string): Promise<void> => {
        appLoading.value = true;
        if (taskId) {
            const t = tasks.value.find(x => x.id === taskId);
            if (!t) { appLoading.value = false; return; }
            try {
                currentPhase.value = t.phase;
                await t.run();
                t.status = 'done';
                t.lastError = undefined;
            } catch (err: any) {
                t.status = 'failed';
                t.lastError = err;
                errors.value.unshift({
                    taskId: t.id, phase: t.phase,
                    message: err?.message || String(err),
                    timestamp: Date.now()
                });
                if (errors.value.length > 20) errors.value.pop();
            }
        } else {
            // 串行重试所有 failed 的
            for (const t of tasks.value.filter(x => x.status === 'failed')) {
                try {
                    currentPhase.value = t.phase;
                    await t.run();
                    t.status = 'done';
                    t.lastError = undefined;
                } catch (err: any) {
                    t.status = 'failed';
                    t.lastError = err;
                    errors.value.unshift({
                        taskId: t.id, phase: t.phase,
                        message: err?.message || String(err),
                        timestamp: Date.now()
                    });
                    if (errors.value.length > 20) errors.value.pop();
                }
            }
        }
        currentPhase.value = '';
        appLoading.value = false;
    };

    /** 重置所有任务为 pending（切换 CDN source 等场景） */
    const resetAll = () => {
        tasks.value.forEach(t => { t.status = 'pending'; t.lastError = undefined; });
    };

    /** 失败任务列表（computed-like 过滤） */
    const failedTasks = () => tasks.value.filter(t => t.status === 'failed');

    /** 失败任务数 */
    const failedCount = () => tasks.value.filter(t => t.status === 'failed').length;

    return {
        // state
        appLoading,
        currentPhase,
        tasks,
        errors,

        // actions
        registerTask,
        runAll,
        retry,
        resetAll,
        failedTasks,
        failedCount
    };
});
