/**
 * 活动提醒管理 Web Worker
 * 在独立浏览器线程中运行高精度定时器并计算触发时机
 */
import type { ReminderTask } from '../assets/types/Reminder';
import { checkTaskPendingTriggers } from '../assets/sripts/reminder_calc';

let tasks: ReminderTask[] = [];
let timerId: ReturnType<typeof setInterval> | null = null;
const triggeredRecord = new Map<string, number>();

/**
 * 清理 24 小时前的旧触发记录，防止内存堆积
 */
function cleanupOldRecords(now: number) {
    if (triggeredRecord.size > 500) {
        for (const [k, timestamp] of triggeredRecord.entries()) {
            if (now - timestamp > 86400000) {
                triggeredRecord.delete(k);
            }
        }
    }
}

/**
 * 定时检查所有任务
 */
function tick() {
    const now = Date.now();
    cleanupOldRecords(now);

    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        if (!task || !task.enabled || task.notifyEnabled === false) continue;

        const pendingTriggers = checkTaskPendingTriggers(task, now, key => triggeredRecord.has(key));

        for (const trigger of pendingTriggers) {
            triggeredRecord.set(trigger.triggerKey, now);

            if (trigger.isAdvance) {
                task.lastAdvanceTriggeredTime = now;
            } else {
                task.lastTriggeredTime = now;
            }

            // 向主线程发送触发消息
            self.postMessage({
                type: 'trigger',
                taskId: task.id,
                task: JSON.parse(JSON.stringify(task)),
                isAdvanceNotice: trigger.isAdvance,
                advanceMinutes: trigger.advanceMinutes,
                triggerKey: trigger.triggerKey,
                timestamp: now
            });

            // 如果是一次性任务且为主事件触发完毕，则自动停用
            if (task.scheduleType === 'once' && !trigger.isAdvance) {
                task.enabled = false;
                self.postMessage({
                    type: 'task_completed',
                    taskId: task.id
                });
            }
        }
    }
}

/**
 * 启动计时器
 */
function startTimer() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(tick, 1000);
}

/**
 * 停止计时器
 */
function stopTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

// 消息监听
self.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data || {};

    switch (type) {
        case 'init':
        case 'set_tasks':
            tasks = Array.isArray(payload) ? payload : [];
            if (e.data?.autoStart) {
                startTimer();
            }
            break;

        case 'update_task':
            if (payload && payload.id) {
                const index = tasks.findIndex(t => t.id === payload.id);
                if (index >= 0) {
                    tasks[index] = payload;
                } else {
                    tasks.push(payload);
                }
            }
            break;

        case 'remove_task':
            if (payload) {
                tasks = tasks.filter(t => t.id !== payload);
                triggeredRecord.delete(payload);
            }
            break;

        case 'toggle_task':
            if (payload && payload.id) {
                const task = tasks.find(t => t.id === payload.id);
                if (task) {
                    task.enabled = !!payload.enabled;
                }
            }
            break;

        case 'check_now':
            tick();
            break;

        case 'start':
            startTimer();
            break;

        case 'stop':
            stopTimer();
            break;

        default:
            break;
    }
};
