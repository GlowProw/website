/**
 * 活动提醒存储管理 (基于 storage.ts)
 * 每个任务以独立的 key 储存: task.{uuid}
 */
import Storage from './storage';
import type { ReminderTask } from '@/assets/types/Reminder';
import { REMINDER_PRESETS } from '@/config/reminderPresets';

export class StorageReminder extends Storage {
    private readonly TASK_PREFIX = 'task.';
    private readonly INDEX_KEY = 'tasks.index';
    private readonly MASTER_SWITCH_KEY = 'reminder.master_notification_enabled';

    /**
     * 获取所有任务列表
     */
    public getAllTasks(): ReminderTask[] {
        const tasks: ReminderTask[] = [];
        const seenIds = new Set<string>();

        // 先尝试从本地索引读取
        const indexRes = this.local.get(this.INDEX_KEY);
        const indexedIds: string[] = (indexRes.code === 0 && Array.isArray(indexRes.data?.value)) ? indexRes.data.value : [];

        for (const id of indexedIds) {
            const taskRes = this.local.get(`${this.TASK_PREFIX}${id}`);
            if (taskRes.code === 0 && taskRes.data?.value) {
                tasks.push(taskRes.data.value);
                seenIds.add(id);
            }
        }

        // 接着扫描 localStorage 进行容灾兜底（避免索引与实际键名不同步）
        try {
            const prefixFullName = this.local.name(this.TASK_PREFIX);
            for (const rawKey of this.local.keys()) {
                if (rawKey && rawKey.startsWith(prefixFullName)) {
                    const taskId = rawKey.slice(prefixFullName.length);
                    if (taskId && !seenIds.has(taskId)) {
                        const taskRes = this.local.get(`${this.TASK_PREFIX}${taskId}`);
                        if (taskRes.code === 0 && taskRes.data?.value) {
                            tasks.push(taskRes.data.value);
                            seenIds.add(taskId);
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Failed to scan localStorage for reminder tasks:', e);
        }

        // 按创建时间倒序或下一次触发时间排序
        return tasks.sort((a, b) => (b.createdTime || 0) - (a.createdTime || 0));
    }

    /**
     * 获取指定 ID 的任务
     */
    public getTask(id: string): ReminderTask | null {
        const res = this.local.get(`${this.TASK_PREFIX}${id}`);
        if (res.code === 0 && res.data?.value) {
            return res.data.value as ReminderTask;
        }
        return null;
    }

    /**
     * 保存或更新任务
     */
    public saveTask(task: ReminderTask): void {
        if (!task.id) return;
        
        task.updatedTime = Date.now();
        this.local.set(`${this.TASK_PREFIX}${task.id}`, task);

        // 更新索引
        this.updateIndex(task.id, 'add');
    }

    /**
     * 删除任务
     */
    public deleteTask(id: string): void {
        if (!id) return;
        this.local.rem(`${this.TASK_PREFIX}${id}`);
        this.updateIndex(id, 'remove');
    }

    /**
     * 切换任务开启/关闭状态
     */
    public toggleTask(id: string, enabled: boolean): ReminderTask | null {
        const task = this.getTask(id);
        if (task) {
            task.enabled = enabled;
            task.updatedTime = Date.now();
            this.saveTask(task);
            return task;
        }
        return null;
    }

    /**
     * 单独切换某个任务是否发送通知
     */
    public toggleTaskNotify(id: string, notifyEnabled: boolean): ReminderTask | null {
        const task = this.getTask(id);
        if (task) {
            task.notifyEnabled = notifyEnabled;
            task.updatedTime = Date.now();
            this.saveTask(task);
            return task;
        }
        return null;
    }

    /**
     * 更新最近触发时间
     */
    public updateLastTriggered(id: string, triggeredTime: number = Date.now()): ReminderTask | null {
        const task = this.getTask(id);
        if (task) {
            task.lastTriggeredTime = triggeredTime;
            // 如果是一次性任务，触发后自动停用
            if (task.scheduleType === 'once') {
                task.enabled = false;
            }
            this.saveTask(task);
            return task;
        }
        return null;
    }

    /**
     * 获取桌面通知总开关状态
     */
    public getMasterNotificationEnabled(): boolean {
        const res = this.local.get(this.MASTER_SWITCH_KEY);
        if (res.code === 0 && typeof res.data?.value === 'boolean') {
            return res.data.value;
        }
        return true; // 默认启用（若浏览器已授权）
    }

    /**
     * 设置桌面通知总开关
     */
    public setMasterNotificationEnabled(enabled: boolean): void {
        this.local.set(this.MASTER_SWITCH_KEY, enabled);
    }

    /**
     * 导入官方预设活动任务
     */
    public loadPresets(): ReminderTask[] {
        const created: ReminderTask[] = [];
        const existingTasks = this.getAllTasks();

        for (const preset of REMINDER_PRESETS) {
            // 避免重复导入同一个预设
            const alreadyExists = existingTasks.some(t => t.presetKey === preset.id || t.id === preset.id);
            if (!alreadyExists) {
                const newTask: ReminderTask = {
                    id: preset.id,
                    title: preset.title,
                    description: preset.description,
                    categories: preset.categories ? [...preset.categories] : ['activity'],
                    scheduleType: preset.scheduleType,
                    repeatType: preset.repeatType,
                    repeatDays: preset.repeatDays,
                    repeatTime: preset.repeatTime,
                    repeatIntervalUnit: preset.repeatIntervalUnit || 'hour',
                    repeatIntervalValue: preset.repeatIntervalValue ?? preset.repeatIntervalHours ?? 1,
                    repeatIntervalHours: preset.repeatIntervalHours,
                    targetTime: preset.targetTime,
                    advanceNoticeEnabled: preset.advanceNoticeEnabled,
                    advanceMinutes: preset.advanceMinutes,
                    validityType: preset.validityType || 'permanent',
                    validFrom: preset.validFrom,
                    validTo: preset.validTo,
                    note: preset.note,
                    enabled: true,
                    notifyEnabled: preset.notifyEnabled ?? true,
                    createdTime: Date.now(),
                    isPreset: true,
                    presetKey: preset.id
                };
                this.saveTask(newTask);
                created.push(newTask);
            }
        }
        return created;
    }

    /**
     * 更新索引集合
     */
    private updateIndex(id: string, action: 'add' | 'remove'): void {
        const indexRes = this.local.get(this.INDEX_KEY);
        let ids: string[] = (indexRes.code === 0 && Array.isArray(indexRes.data?.value)) ? [...indexRes.data.value] : [];

        if (action === 'add') {
            if (!ids.includes(id)) {
                ids.push(id);
            }
        } else if (action === 'remove') {
            ids = ids.filter(item => item !== id);
        }

        this.local.set(this.INDEX_KEY, ids);
    }
}

export const storageReminder = new StorageReminder();
export default storageReminder;
