import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import type { ReminderTask } from '@/assets/types/Reminder';
import { storageReminder } from '@/assets/sripts/storage_reminder';
import { calculateTaskNextTriggerInfo, calculateNextTriggerTime, formatCountdown, checkTaskPendingTriggers } from '@/assets/sripts/reminder_calc';
import { useNoticeStore } from '~/stores/noticeStore';
import ReminderWorker from '@/workers/reminder.worker.ts?worker';

export const useReminderStore = defineStore('reminder', () => {
    const noticeStore = useNoticeStore();

    // 核心状态数据
    const tasks = ref<ReminderTask[]>([]);
    const masterNotificationEnabled = ref<boolean>(storageReminder.getMasterNotificationEnabled());
    const permissionStatus = ref<NotificationPermission | 'unsupported'>('default');
    const nowTime = ref<number>(Date.now());
    const isInitialized = ref<boolean>(false);

    // 列表筛选与分页控制
    const filterType = ref<'all' | 'repeat' | 'once' | 'active' | 'paused'>('all');
    const searchQuery = ref<string>('');
    const currentPage = ref<number>(1);
    const pageSize = ref<number>(30); // 任务列表默认单页展示 30 条

    // 后台独立线程与实时时钟
    let worker: Worker | null = null;
    let clockInterval: ReturnType<typeof setInterval> | null = null;
    const triggeredRecord = new Set<string>();

    /**
     * 检查当前浏览器对桌面通知的支持及授权状态
     */
    const checkPermission = () => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            permissionStatus.value = 'unsupported';
            return 'unsupported';
        }
        permissionStatus.value = Notification.permission;
        return Notification.permission;
    };

    /**
     * 弹出系统授权窗口申请通知权限
     */
    const requestPermission = async (): Promise<boolean> => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            permissionStatus.value = 'unsupported';
            return false;
        }

        try {
            const res = await Notification.requestPermission();
            permissionStatus.value = res;
            if (res === 'granted') {
                return true;
            }
        } catch (e) {
            console.error('Failed to request notification permission:', e);
        }
        return false;
    };

    /**
     * 设置桌面通知总开关
     */
    const setMasterNotification = (val: boolean) => {
        masterNotificationEnabled.value = val;
        storageReminder.setMasterNotificationEnabled(val);
    };

    /**
     * 播放提示音效
     */
    const playNotificationSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch (e) {
            // 用户尚未与页面产生手势交互前可能静音
        }
    };

    /**
     * 触发桌面通知和站内 Toast 提示
     */
    const sendDesktopNotification = async (task: ReminderTask, isAdvance: boolean = false, advanceMinutes: number = 0) => {
        playNotificationSound();

        const titleText = isAdvance
            ? `⏰ 提前提醒: ${task.title} (将在 ${advanceMinutes} 分钟后开始)`
            : `⏰ 活动提醒: ${task.title}`;

        const notePreview = task.note ? (task.note.length > 100 ? task.note.slice(0, 100) + '...' : task.note) : '';
        const bodyText = isAdvance
            ? `【提前 ${advanceMinutes} 分钟】${task.title}: ${notePreview || '活动即将开始！'}`
            : `${task.title}: ${notePreview || '活动时间已到达！'}`;

        // 页面内消息提示
        noticeStore.primary(bodyText, {
            title: titleText,
            mode: 'minimal',
            timeout: 10000
        });

        // 操作系统原生桌面推送
        if (
            masterNotificationEnabled.value &&
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
        ) {
            const bodyContent = task.note
                ? (task.note.length > 150 ? task.note.slice(0, 150) + '...' : task.note)
                : (isAdvance ? `活动将在 ${advanceMinutes} 分钟后开始` : '活动时间已到达！');

            let swSuccess = false;
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    if (registration && typeof registration.showNotification === 'function') {
                        await registration.showNotification(titleText, {
                            body: bodyContent,
                            icon: '/favicon.png',
                            badge: '/favicon.png',
                            tag: `reminder-${task.id}-${isAdvance ? 'adv' : 'main'}-${Date.now()}`
                        });
                        swSuccess = true;
                    }
                } catch (swErr) {
                    // Fallback to standard Notification
                }
            }

            if (!swSuccess) {
                try {
                    const notification = new Notification(titleText, {
                        body: bodyContent,
                        icon: '/favicon.png',
                        tag: `reminder-${task.id}-${isAdvance ? 'adv' : 'main'}-${Date.now()}`,
                        requireInteraction: false
                    });

                    notification.onclick = () => {
                        window.focus();
                        notification.close();
                    };
                } catch (e) {
                    console.error('Error creating Notification instance:', e);
                }
            }
        }
    };

    /**
     * 主线程备用定时检测（保障即使 Worker 延迟或休眠也能准时触发）
     */
    const checkMainThreadTriggers = (now: number) => {
        for (const task of tasks.value) {
            if (!task || !task.enabled) continue;

            const pendingTriggers = checkTaskPendingTriggers(task, now, key => triggeredRecord.has(key));

            for (const trigger of pendingTriggers) {
                triggeredRecord.add(trigger.triggerKey);

                if (task.notifyEnabled !== false) {
                    sendDesktopNotification(task, trigger.isAdvance, trigger.advanceMinutes);
                }

                storageReminder.updateLastTriggered(task.id, now);
                if (trigger.isAdvance) {
                    task.lastAdvanceTriggeredTime = now;
                } else {
                    task.lastTriggeredTime = now;
                    if (task.scheduleType === 'once') {
                        task.enabled = false;
                        storageReminder.toggleTask(task.id, false);
                    }
                }
            }
        }
    };

    /**
     * 启动并在独立 Worker 线程中管理定时计算
     */
    const initWorker = () => {
        if (worker) return;

        try {
            worker = new ReminderWorker();
            worker.onmessage = (e: MessageEvent) => {
                const { type, task, taskId, isAdvanceNotice, advanceMinutes, triggerKey } = e.data || {};

                if (type === 'trigger' && task) {
                    if (triggerKey && triggeredRecord.has(triggerKey)) {
                        return;
                    }
                    if (triggerKey) {
                        triggeredRecord.add(triggerKey);
                    }

                    if (task.notifyEnabled !== false) {
                        sendDesktopNotification(task, !!isAdvanceNotice, advanceMinutes || 0);
                    }
                    storageReminder.updateLastTriggered(task.id, Date.now());
                    const localTask = tasks.value.find(t => t.id === task.id);
                    if (localTask) {
                        if (isAdvanceNotice) {
                            localTask.lastAdvanceTriggeredTime = Date.now();
                        } else {
                            localTask.lastTriggeredTime = Date.now();
                            if (localTask.scheduleType === 'once') {
                                localTask.enabled = false;
                            }
                        }
                    }
                } else if (type === 'task_completed' && taskId) {
                    const localTask = tasks.value.find(t => t.id === taskId);
                    if (localTask) {
                        localTask.enabled = false;
                        storageReminder.toggleTask(taskId, false);
                    }
                }
            };

            // 将现有任务列表推送到 Worker 线程
            worker.postMessage({
                type: 'init',
                payload: JSON.parse(JSON.stringify(tasks.value))
            });
        } catch (e) {
            console.error('Failed to initialize Reminder Web Worker:', e);
        }
    };

    /**
     * 同步最新任务列表至 Worker 线程
     */
    const syncTasksToWorker = () => {
        if (worker) {
            worker.postMessage({
                type: 'set_tasks',
                payload: JSON.parse(JSON.stringify(tasks.value))
            });
        }
    };

    /**
     * 初始化提醒系统，读取存储并启动后台引擎
     */
    const init = () => {
        if (isInitialized.value) return;

        checkPermission();
        tasks.value = storageReminder.getAllTasks();

        // 首次使用时自动装载官方预设活动
        if (tasks.value.length === 0) {
            loadPresets();
        }

        initWorker();

        // 每秒驱动主线程倒计时实时更新与双引擎检测
        if (!clockInterval) {
            clockInterval = setInterval(() => {
                const now = Date.now();
                nowTime.value = now;
                checkMainThreadTriggers(now);
            }, 1000);
        }

        isInitialized.value = true;
    };

    /**
     * 载入预设活动配置
     */
    const loadPresets = () => {
        const added = storageReminder.loadPresets();
        tasks.value = storageReminder.getAllTasks();
        syncTasksToWorker();
        return added;
    };

    /**
     * 创建新的提醒任务
     */
    const createTask = (taskData: Omit<ReminderTask, 'id' | 'createdTime'>): ReminderTask => {
        const newTask: ReminderTask = {
            ...taskData,
            id: uuidv4(),
            createdTime: Date.now(),
            enabled: taskData.enabled ?? true,
            notifyEnabled: taskData.notifyEnabled ?? true
        };

        storageReminder.saveTask(newTask);
        tasks.value = storageReminder.getAllTasks();
        syncTasksToWorker();
        return newTask;
    };

    /**
     * 更新已存在的提醒任务
     */
    const updateTask = (task: ReminderTask) => {
        storageReminder.saveTask(task);
        tasks.value = storageReminder.getAllTasks();
        syncTasksToWorker();
    };

    /**
     * 删除指定提醒任务
     */
    const deleteTask = (id: string) => {
        storageReminder.deleteTask(id);
        tasks.value = storageReminder.getAllTasks();
        syncTasksToWorker();
    };

    /**
     * 单独开启或停用某个活动的提醒计时
     */
    const toggleTask = (id: string, enabled: boolean) => {
        storageReminder.toggleTask(id, enabled);
        const target = tasks.value.find(t => t.id === id);
        if (target) {
            target.enabled = enabled;
        }
        syncTasksToWorker();
    };

    /**
     * 单独开启或关闭某个任务的通知播报
     */
    const toggleTaskNotify = (id: string, notifyEnabled: boolean) => {
        storageReminder.toggleTaskNotify(id, notifyEnabled);
        const target = tasks.value.find(t => t.id === id);
        if (target) {
            target.notifyEnabled = notifyEnabled;
        }
        syncTasksToWorker();
    };

    /**
     * 发送测试通知
     */
    const triggerTestNotification = (customTask?: Partial<ReminderTask>) => {
        const testTask: ReminderTask = {
            id: 'test-notification',
            title: customTask?.title || '测试活动提醒',
            scheduleType: 'once',
            note: customTask?.note || '这是一个测试通知。桌面通知功能正常运行中！',
            enabled: true,
            notifyEnabled: true,
            createdTime: Date.now()
        };
        sendDesktopNotification(testTask);
    };

    // 附带实时倒计时的任务列表
    const tasksWithCountdown = computed(() => {
        const now = nowTime.value;
        return tasks.value.map(task => {
            const countdown = calculateTaskNextTriggerInfo(task, now);
            return {
                ...task,
                nextTriggerTime: countdown.nextTriggerTime,
                countdown
            };
        });
    });

    // 经过筛选、搜索以及排序后的任务列表
    const filteredTasks = computed(() => {
        let result = tasksWithCountdown.value;

        if (filterType.value === 'repeat') {
            result = result.filter(t => t.scheduleType === 'repeat');
        } else if (filterType.value === 'once') {
            result = result.filter(t => t.scheduleType === 'once');
        } else if (filterType.value === 'active') {
            result = result.filter(t => t.enabled);
        } else if (filterType.value === 'paused') {
            result = result.filter(t => !t.enabled);
        }

        if (searchQuery.value.trim()) {
            const q = searchQuery.value.trim().toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(q) ||
                (t.note && t.note.toLowerCase().includes(q))
            );
        }

        // 排序规则：生效中的任务置顶，并按最近触发倒计时升序排序
        return result.sort((a, b) => {
            if (a.enabled && !b.enabled) return -1;
            if (!a.enabled && b.enabled) return 1;

            if (a.nextTriggerTime && b.nextTriggerTime) {
                return a.nextTriggerTime - b.nextTriggerTime;
            }
            if (a.nextTriggerTime) return -1;
            if (b.nextTriggerTime) return 1;
            return b.createdTime - a.createdTime;
        });
    });

    // 单页分页列表（每页 30 项）
    const paginatedTasks = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value;
        return filteredTasks.value.slice(start, start + pageSize.value);
    });

    const totalPages = computed(() => {
        return Math.ceil(filteredTasks.value.length / pageSize.value) || 1;
    });

    // 全局统计信息
    const stats = computed(() => {
        const total = tasks.value.length;
        const active = tasks.value.filter(t => t.enabled).length;
        const activeTasks = tasksWithCountdown.value.filter(t => t.enabled && t.nextTriggerTime && t.nextTriggerTime > nowTime.value);
        const nearest = activeTasks.sort((a, b) => (a.nextTriggerTime || 0) - (b.nextTriggerTime || 0))[0];

        return {
            total,
            active,
            paused: total - active,
            nearestTask: nearest || null
        };
    });

    return {
        // State
        tasks,
        masterNotificationEnabled,
        permissionStatus,
        nowTime,
        filterType,
        searchQuery,
        currentPage,
        pageSize,

        // Getters
        tasksWithCountdown,
        filteredTasks,
        paginatedTasks,
        totalPages,
        stats,

        // Actions
        init,
        checkPermission,
        requestPermission,
        setMasterNotification,
        createTask,
        updateTask,
        deleteTask,
        toggleTask,
        toggleTaskNotify,
        loadPresets,
        triggerTestNotification,
        sendDesktopNotification
    };
});
