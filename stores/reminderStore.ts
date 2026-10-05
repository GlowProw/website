import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import type { ReminderTask } from '@/assets/types/Reminder';
import { storageReminder } from '@/assets/sripts/storage_reminder';
import { calculateTaskNextTriggerInfo, calculateNextTriggerTime, formatCountdown, checkTaskPendingTriggers, getLocalizedText } from '@/assets/sripts/reminder_calc';
import { useNoticeStore } from '~/stores/noticeStore';
import ReminderWorker from '@/workers/reminder.worker.ts?worker';
import router from '../router';
import { useI18nUtils } from '@/assets/sripts/i18n_util';

export const useReminderStore = defineStore('reminder', () => {
    const noticeStore = useNoticeStore();
    const { t } = useI18nUtils();

    /**

     * 校验当前页面路由是否处于活动提醒页面 (/reminder 或 /reminder/...)
     */
    const isReminderRoute = (): boolean => {
        try {
            const path = router.currentRoute.value?.path;
            if (path) {
                return path === '/reminder' || path.startsWith('/reminder/') || path.startsWith('/reminder');
            }
        } catch {
            // fallback
        }
        if (typeof window !== 'undefined' && window.location) {
            const locPath = window.location.pathname || '';
            return locPath === '/reminder' || locPath.startsWith('/reminder/') || locPath.startsWith('/reminder');
        }
        return false;
    };

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
     * 播放提前提醒音效（轻快双音提示 Ding-Ding）
     */
    const playAdvanceNoticeSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const now = ctx.currentTime;

            // 音符 1: G5 (784Hz)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(783.99, now);
            gain1.gain.setValueAtTime(0.18, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.18);

            // 音符 2: C6 (1046.5Hz)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1046.50, now + 0.12);
            gain2.gain.setValueAtTime(0.22, now + 0.12);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.12);
            osc2.stop(now + 0.45);
        } catch (e) {
            // 用户尚未与页面产生手势交互前可能静音
        }
    };

    /**
     * 播放到期触发音效（饱满四音和弦提示 Ding-Dong-Ding-Dong）
     */
    const playTargetDueSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const now = ctx.currentTime;
            const notes = [
                { freq: 523.25, time: 0, dur: 0.2, gain: 0.18 },    // C5
                { freq: 659.25, time: 0.1, dur: 0.22, gain: 0.2 },  // E5
                { freq: 783.99, time: 0.2, dur: 0.25, gain: 0.22 }, // G5
                { freq: 1046.50, time: 0.3, dur: 0.55, gain: 0.25 } // C6
            ];

            for (const n of notes) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle'; // 温润明亮的和弦音
                osc.frequency.setValueAtTime(n.freq, now + n.time);
                gain.gain.setValueAtTime(n.gain, now + n.time);
                gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + n.time);
                osc.stop(now + n.time + n.dur);
            }
        } catch (e) {
            // 用户尚未与页面产生手势交互前可能静音
        }
    };

    /**
     * 播放提示音效（根据是否提前提醒分派对应音效）
     */
    const playNotificationSound = (isAdvance: boolean = false) => {
        if (isAdvance) {
            playAdvanceNoticeSound();
        } else {
            playTargetDueSound();
        }
    };

    /**
     * 驱动主线程时钟与倒计时
     */
    const startClock = () => {
        if (!clockInterval) {
            clockInterval = setInterval(() => {
                const now = Date.now();
                nowTime.value = now;
                checkMainThreadTriggers(now);
            }, 1000);
        }
    };

    /**
     * 停止主线程时钟
     */
    const stopClock = () => {
        if (clockInterval) {
            clearInterval(clockInterval);
            clockInterval = null;
        }
    };

    /**
     * 唤醒 Worker 线程定时器与主线程时钟（进入 /reminder 时调用）
     */
    const resumeWorker = () => {
        if (!worker) {
            initWorker();
        }
        if (worker) {
            worker.postMessage({
                type: 'start'
            });
        }
        startClock();
    };

    /**
     * 暂停 Worker 线程定时器与主线程时钟（离开 /reminder 时调用）
     */
    const pauseWorker = () => {
        if (worker) {
            worker.postMessage({
                type: 'stop'
            });
        }
        stopClock();
    };

    /**
     * 触发桌面通知和站内 Toast 提示
     */
    const sendDesktopNotification = async (
        task: ReminderTask,
        isAdvance: boolean = false,
        advanceMinutes: number = 0,
        advanceText?: string
    ) => {
        // 限制：仅在 /reminder 路由及其子页面下才触发播报声音和提示
        if (!isReminderRoute()) {
            return;
        }

        // 全局通知总开关关闭时，坚决不播报任何提示和声音
        if (!masterNotificationEnabled.value) {
            return;
        }

        // 任务自身已关闭或通知已停用时，坚决不播报
        if (!task || !task.enabled || task.notifyEnabled === false) {
            return;
        }

        // 核验 store 中最新的任务状态，防止异步通信期间用户已在界面关闭该任务或删除该任务
        const latestTask = tasks.value.find(t => t.id === task.id);
        if (!latestTask || !latestTask.enabled || latestTask.notifyEnabled === false) {
            return;
        }

        playNotificationSound(isAdvance);

        const rawTitle = getLocalizedText(task.title);
        const rawNote = getLocalizedText(task.note || task.description);
        const timeDesc = advanceText || (advanceMinutes ? `${advanceMinutes} 分钟` : '1 分钟');

        const titleText = isAdvance
            ? t('reminder.notification.advanceTitle', { title: rawTitle, time: timeDesc, minutes: advanceMinutes })
            : t('reminder.notification.mainTitle', { title: rawTitle });

        const defaultAdvanceMsg = t('reminder.notification.advanceDefaultMsg');
        const defaultAdvanceShort = t('reminder.notification.advanceDefaultShort', { time: timeDesc, minutes: advanceMinutes });
        const defaultMainMsg = t('reminder.notification.mainDefaultMsg');

        const notePreview = rawNote ? (rawNote.length > 100 ? rawNote.slice(0, 100) + '...' : rawNote) : '';
        const bodyText = isAdvance
            ? t('reminder.notification.advanceBody', { time: timeDesc, minutes: advanceMinutes, title: rawTitle, note: notePreview || defaultAdvanceMsg })
            : t('reminder.notification.mainBody', { title: rawTitle, note: notePreview || defaultMainMsg });

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
            const bodyContent = rawNote
                ? (rawNote.length > 150 ? rawNote.slice(0, 150) + '...' : rawNote)
                : (isAdvance ? defaultAdvanceShort : defaultMainMsg);

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
        // 限制：仅在 /reminder 路由及其子页面下才进行主线程触发检测
        if (!isReminderRoute()) return;
        if (!masterNotificationEnabled.value) return;

        for (const task of tasks.value) {
            if (!task || !task.enabled || task.notifyEnabled === false) continue;

            const pendingTriggers = checkTaskPendingTriggers(task, now, key => triggeredRecord.has(key));

            for (const trigger of pendingTriggers) {
                triggeredRecord.add(trigger.triggerKey);

                sendDesktopNotification(task, trigger.isAdvance, trigger.advanceMinutes, trigger.advanceText);

                storageReminder.updateLastTriggered(task.id, now);
                if (trigger.isAdvance) {
                    task.lastAdvanceTriggeredTime = now;
                } else {
                    task.lastTriggeredTime = now;
                    if (task.scheduleType === 'once') {
                        task.enabled = false;
                        storageReminder.toggleTask(task.id, false);
                        syncTasksToWorker();
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
                const { type, task, taskId, isAdvanceNotice, advanceMinutes, advanceText, triggerKey } = e.data || {};

                if (type === 'trigger' && task) {
                    // 限制：仅在 /reminder 路由及其子页面下才触发提示和声音
                    if (!isReminderRoute()) {
                        return;
                    }
                    if (!masterNotificationEnabled.value) {
                        return;
                    }

                    // 严密核验当前任务在 store 中的实时状态：若任务已关闭或关闭了通知，立即丢弃
                    const localTask = tasks.value.find(t => t.id === task.id);
                    if (!localTask || !localTask.enabled || localTask.notifyEnabled === false) {
                        return;
                    }

                    if (triggerKey && triggeredRecord.has(triggerKey)) {
                        return;
                    }
                    if (triggerKey) {
                        triggeredRecord.add(triggerKey);
                    }

                    sendDesktopNotification(localTask, !!isAdvanceNotice, advanceMinutes || 0, advanceText);
                    storageReminder.updateLastTriggered(task.id, Date.now());

                    if (isAdvanceNotice) {
                        localTask.lastAdvanceTriggeredTime = Date.now();
                    } else {
                        localTask.lastTriggeredTime = Date.now();
                        if (localTask.scheduleType === 'once') {
                            localTask.enabled = false;
                            storageReminder.toggleTask(localTask.id, false);
                            syncTasksToWorker();
                        }
                    }
                } else if (type === 'task_completed' && taskId) {
                    const localTask = tasks.value.find(t => t.id === taskId);
                    if (localTask) {
                        localTask.enabled = false;
                        storageReminder.toggleTask(taskId, false);
                        syncTasksToWorker();
                    }
                }
            };

            // 将现有任务列表推送到 Worker 线程，若当前处于 /reminder 路由则自动启动计时
            worker.postMessage({
                type: 'init',
                payload: JSON.parse(JSON.stringify(tasks.value)),
                autoStart: isReminderRoute()
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
        if (isInitialized.value) {
            if (isReminderRoute()) {
                resumeWorker();
            } else {
                pauseWorker();
            }
            return;
        }

        checkPermission();
        tasks.value = storageReminder.getAllTasks();

        // 首次使用时自动装载官方预设活动
        if (tasks.value.length === 0) {
            loadPresets();
        }

        initWorker();

        if (isReminderRoute()) {
            resumeWorker();
        } else {
            pauseWorker();
        }

        // 监听全局路由变化：只有处于 /reminder 路由才激活定时与播报，离开时立即暂停
        router.afterEach((to) => {
            if (to.path === '/reminder' || to.path.startsWith('/reminder/')) {
                resumeWorker();
            } else {
                pauseWorker();
            }
        });

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
        tasks.value = [...tasks.value];
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
        tasks.value = [...tasks.value];
        syncTasksToWorker();
    };

    /**
     * 发送测试通知
     */
    const triggerTestNotification = (customTask?: Partial<ReminderTask>) => {
        const testTask: ReminderTask = {
            id: 'test-notification',
            title: customTask?.title || t('reminder.notification.testTitle'),
            scheduleType: 'once',
            note: customTask?.note || t('reminder.notification.testNote'),
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
                getLocalizedText(t.title).toLowerCase().includes(q) ||
                getLocalizedText(t.note || t.description).toLowerCase().includes(q)
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
        sendDesktopNotification,
        isReminderRoute,
        resumeWorker,
        pauseWorker
    };
});
