<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useDisplay} from 'vuetify/framework';
import LZString from 'lz-string';
import {useReminderStore} from '~/stores/reminderStore';
import {useNoticeStore} from '~/stores/noticeStore';
import type {ReminderTask} from '@/assets/types/Reminder';
import {getLocalizedText} from '@/assets/sripts/reminder_calc';

import Silk from '@/components/Silk.vue';
import EmptyView from '@/components/EmptyView.vue';
import ReminderEditDialog from './ReminderEditDialog.vue';
import AffixContainerView from "@/components/AffixContainerView.vue";
import Textarea from "@/components/textarea/index.vue";

const {t, te} = useI18n();
const {mobile} = useDisplay();
const route = useRoute();
const router = useRouter();
const reminderStore = useReminderStore();
const noticeStore = useNoticeStore();

// 对话框与正在操作的任务状态
const editDialogVisible = ref(false);
const editingTask = ref<ReminderTask | null>(null);
const deleteDialogVisible = ref(false);
const deletingTask = ref<ReminderTask | null>(null);
const noteDetailDialogVisible = ref(false);
const detailTask = ref<ReminderTask | null>(null);
const botSubscribeDialogVisible = ref(false);
const botSubscribeTask = ref<ReminderTask | null>(null);

// 筛选面板控制与条件
const menuModel = ref(false);
const filterSearchInput = ref('');
const selectedScheduleTypes = ref<string[]>([]);
const selectedStatuses = ref<string[]>([]);
const selectedCategories = ref<string[]>([]);
const sortField = ref<'triggerTime' | 'createdTime' | 'title'>('triggerTime');
const sortOrder = ref<'asc' | 'desc'>('asc');

const categoryMetaMap: Record<string, { labelKey: string; icon: string; color: string }> = {
  favorite: {labelKey: 'reminder.categories.favorite', icon: 'mdi-heart', color: 'pink-lighten-1'},
  activity: {labelKey: 'reminder.categories.activity', icon: 'mdi-sword-cross', color: 'amber'},
  system: {labelKey: 'reminder.categories.system', icon: 'mdi-cog-outline', color: 'blue-lighten-2'}
};

const getCategoryLabel = (cat: string) => {
  if (categoryMetaMap[cat]) {
    return t(categoryMetaMap[cat].labelKey);
  }
  return cat;
};

const getCategoryIcon = (cat: string) => {
  return categoryMetaMap[cat]?.icon || 'mdi-tag-outline';
};

const getCategoryColor = (cat: string) => {
  return categoryMetaMap[cat]?.color || 'grey';
};

onMounted(() => {
  reminderStore.init();
  reminderStore.resumeWorker();
});

onUnmounted(() => {
  reminderStore.pauseWorker();
});

// 是否存在生效中的过滤条件
const hasActiveFilters = computed(() => {
  return (
      !!filterSearchInput.value.trim() ||
      selectedScheduleTypes.value.length > 0 ||
      selectedStatuses.value.length > 0 ||
      selectedCategories.value.length > 0 ||
      sortField.value !== 'triggerTime' ||
      sortOrder.value !== 'asc'
  );
});

// 重置全部筛选条件
const resetAllFilters = () => {
  filterSearchInput.value = '';
  selectedScheduleTypes.value = [];
  selectedStatuses.value = [];
  selectedCategories.value = [];
  sortField.value = 'triggerTime';
  sortOrder.value = 'asc';
};

// 搜索操作
const onSearch = () => {
  // 响应回车搜索
};

const onClearSearch = () => {
  filterSearchInput.value = '';
};

// 打开新建活动提醒窗口
const onCreateNew = () => {
  editingTask.value = null;
  editDialogVisible.value = true;
};

// 打开编辑窗口
const onEdit = (task: ReminderTask) => {
  editingTask.value = {...task};
  editDialogVisible.value = true;
};

// 保存新建或修改后的任务
const onSaveTask = (taskData: any) => {
  if (editingTask.value && editingTask.value.id) {
    reminderStore.updateTask({
      ...editingTask.value,
      ...taskData
    });
  } else {
    reminderStore.createTask(taskData);
  }
};

// 打开删除确认弹窗
const onDelete = (task: ReminderTask) => {
  deletingTask.value = task;
  deleteDialogVisible.value = true;
};

// 确认删除任务
const confirmDelete = () => {
  if (deletingTask.value) {
    reminderStore.deleteTask(deletingTask.value.id);
    deletingTask.value = null;
    deleteDialogVisible.value = false;
  }
};

// 查看备注详情完整内容
const onViewNote = (task: ReminderTask) => {
  detailTask.value = task;
  noteDetailDialogVisible.value = true;
};

// 快速申请浏览器桌面通知权限
const onRequestPermission = async () => {
  await reminderStore.requestPermission();
};

// 跳转至高级设置页面
const onGoToAdvanced = () => {
  router.push({ name: 'PortalSettingAdvanced', params: route.params });
};

// 获取任务标题：支持多语言对象或普通文本（优先按当前语言读取，缺失时按回退语言读取）
const getTaskTitle = (task?: ReminderTask | null) => {
  if (!task) return '';
  return getLocalizedText(task.title) || (task.titleKey && te(task.titleKey) ? t(task.titleKey) : '');
};

// 获取任务备注：支持多语言对象或普通文本
const getTaskNote = (task?: ReminderTask | null) => {
  if (!task) return '';
  return getLocalizedText(task.note || task.description) || (task.noteKey && te(task.noteKey) ? t(task.noteKey) : (task.descKey && te(task.descKey) ? t(task.descKey) : ''));
};

// 压缩任务数据为 LZString 编码
const generateReminderShareCode = (task: ReminderTask): string => {
  const payload = {
    v: 1,
    title: getTaskTitle(task),
    categories: task.categories || [],
    scheduleType: task.scheduleType,
    repeatType: task.repeatType,
    repeatDays: task.repeatDays,
    repeatTime: task.repeatTime,
    repeatIntervalUnit: task.repeatIntervalUnit || 'hour',
    repeatIntervalValue: task.repeatIntervalValue ?? task.repeatIntervalHours ?? 1,
    targetTime: task.targetTime,
    advanceNoticeEnabled: task.advanceNoticeEnabled,
    advanceMinutes: task.advanceMinutes,
    validityType: task.validityType,
    validFrom: task.validFrom,
    validTo: task.validTo,
    note: getTaskNote(task)
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
};

// 机器人订阅指令代码
const botSubscribeCode = computed(() => {
  if (!botSubscribeTask.value) return '';
  return generateReminderShareCode(botSubscribeTask.value);
});

const botSubscribeCommand = computed(() => {
  return `${t('reminder.bot.commandPrefix')} ${botSubscribeCode.value}`;
});

// 打开机器人订阅窗口
const onOpenBotSubscribe = (task: ReminderTask) => {
  botSubscribeTask.value = task;
  botSubscribeDialogVisible.value = true;
};

// 复制机器人订阅指令
const copyBotCommand = async () => {
  if (!botSubscribeCommand.value) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(botSubscribeCommand.value);
    } else {
      const el = document.createElement('textarea');
      el.value = botSubscribeCommand.value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    noticeStore.success(t('reminder.bot.copied'), {mode: 'minimal'});
  } catch (e) {
    console.error('Failed to copy bot subscribe command:', e);
  }
};

// 格式化重复星期文本
const formatRepeatDays = (days?: number[]) => {
  if (!days || days.length === 0) return t('reminder.weekdays.all');
  if (days.length === 7) return t('reminder.dialog.everyday');
  if (days.length === 5 && days.every(d => [1, 2, 3, 4, 5].includes(d))) return t('reminder.dialog.workdays');
  if (days.length === 2 && days.every(d => [6, 7].includes(d))) return t('reminder.dialog.weekends');

  const map: Record<number, string> = {
    1: t('reminder.weekdays.mon'), 2: t('reminder.weekdays.tue'), 3: t('reminder.weekdays.wed'), 4: t('reminder.weekdays.thu'), 5: t('reminder.weekdays.fri'), 6: t('reminder.weekdays.sat'), 7: t('reminder.weekdays.sun')
  };
  return days.map(d => map[d] || `${d}`).join('、');
};

// 格式化固定时间间隔规则文本
const formatIntervalRule = (task: ReminderTask) => {
  const unit = task.repeatIntervalUnit || 'hour';
  const val = task.repeatIntervalValue ?? task.repeatIntervalHours ?? 1;
  const unitKey = `reminder.units.${unit}`;
  const unitText = te(unitKey) ? t(unitKey) : unit;
  return t('reminder.fields.everyNUnits', {n: val, unit: unitText});
};

// 格式化提前提醒文本
const formatAdvanceText = (taskOrMinutes?: ReminderTask | number) => {
  if (!taskOrMinutes) return '';
  if (typeof taskOrMinutes === 'object') {
    const unit = taskOrMinutes.advanceUnit || 'minute';
    const val = taskOrMinutes.advanceValue ?? taskOrMinutes.advanceMinutes ?? 1;
    const unitKey = `reminder.units.${unit}`;
    const unitText = te(unitKey) ? t(unitKey) : (unit === 'second' ? '秒' : unit === 'hour' ? '小时' : '分钟');
    return t('reminder.fields.advanceNotice') + ` ${val} ${unitText}`;
  }
  return t('reminder.dialog.advanceNoticeDesc', {min: taskOrMinutes});
};

// 格式化日期与时间显示
const formatTargetTime = (target?: number | string) => {
  if (!target) return '';
  const d = new Date(target);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// 经过筛选与排序后的任务列表
const processedTasks = computed(() => {
  let result = reminderStore.tasksWithCountdown;

  // 定时类型过滤
  if (selectedScheduleTypes.value.length > 0) {
    result = result.filter(t => selectedScheduleTypes.value.includes(t.scheduleType));
  }

  // 状态过滤 (生效中 / 已停用)
  if (selectedStatuses.value.length > 0) {
    result = result.filter(t => {
      if (selectedStatuses.value.includes('active') && t.enabled) return true;
      if (selectedStatuses.value.includes('paused') && !t.enabled) return true;
      return false;
    });
  }

  // 分类过滤
  if (selectedCategories.value.length > 0) {
    result = result.filter(t => {
      const cats = Array.isArray(t.categories) && t.categories.length > 0 ? t.categories : ['uncategorized'];
      return selectedCategories.value.some(c => cats.includes(c));
    });
  }

  // 搜索关键字过滤
  if (filterSearchInput.value.trim()) {
    const q = filterSearchInput.value.trim().toLowerCase();
    result = result.filter(t => {
      const title = getTaskTitle(t).toLowerCase();
      const note = getTaskNote(t).toLowerCase();
      return title.includes(q) || note.includes(q);
    });
  }

  // 排序
  return result.sort((a, b) => {
    let factor = sortOrder.value === 'asc' ? 1 : -1;

    if (sortField.value === 'triggerTime') {
      if (a.enabled && !b.enabled) return -1;
      if (!a.enabled && b.enabled) return 1;

      if (a.nextTriggerTime && b.nextTriggerTime) {
        return (a.nextTriggerTime - b.nextTriggerTime) * factor;
      }
      if (a.nextTriggerTime) return -1;
      if (b.nextTriggerTime) return 1;
      return (b.createdTime - a.createdTime) * factor;
    } else if (sortField.value === 'createdTime') {
      return (a.createdTime - b.createdTime) * factor;
    } else if (sortField.value === 'title') {
      return getTaskTitle(a).localeCompare(getTaskTitle(b)) * factor;
    }
    return 0;
  });
});

export interface TaskCategoryGroup {
  key: string;
  title?: string;
  icon?: string;
  color?: string;
  showTitle: boolean;
  tasks: (ReminderTask & { nextTriggerTime: number | null; countdown: any })[];
}

// 分类分组列表（包含栏目分割，无分类置于末尾且不显示标题）
const categorizedGroups = computed<TaskCategoryGroup[]>(() => {
  const all = processedTasks.value;
  if (all.length === 0) return [];

  const definedCategories = [
    {key: 'favorite', title: t('reminder.categories.favorite'), icon: 'mdi-heart', color: 'pink-lighten-1'},
    {key: 'activity', title: t('reminder.categories.activity'), icon: 'mdi-sword-cross', color: 'amber'},
    {key: 'system', title: t('reminder.categories.system'), icon: 'mdi-cog-outline', color: 'blue-lighten-2'}
  ];

  const groups: TaskCategoryGroup[] = [];

  // 已定义分类分组
  for (const cat of definedCategories) {
    if (selectedCategories.value.length > 0 && !selectedCategories.value.includes(cat.key)) {
      continue;
    }
    const catTasks = all.filter(t => Array.isArray(t.categories) && t.categories.includes(cat.key));
    if (catTasks.length > 0) {
      groups.push({
        key: cat.key,
        title: cat.title,
        icon: cat.icon,
        color: cat.color,
        showTitle: true,
        tasks: catTasks
      });
    }
  }

  // 自定义其它分类分组 (若存在)
  const standardKeys = new Set(definedCategories.map(c => c.key));
  const otherKeys = new Set<string>();
  all.forEach(t => {
    if (Array.isArray(t.categories)) {
      t.categories.forEach(c => {
        if (!standardKeys.has(c)) otherKeys.add(c);
      });
    }
  });

  for (const otherKey of otherKeys) {
    if (selectedCategories.value.length > 0 && !selectedCategories.value.includes(otherKey)) {
      continue;
    }
    const catTasks = all.filter(t => Array.isArray(t.categories) && t.categories.includes(otherKey));
    if (catTasks.length > 0) {
      groups.push({
        key: otherKey,
        title: otherKey,
        icon: 'mdi-tag-outline',
        color: 'grey',
        showTitle: true,
        tasks: catTasks
      });
    }
  }

  //无分类任务统一放最后，且不显示分类标题
  if (selectedCategories.value.length === 0 || selectedCategories.value.includes('uncategorized')) {
    const uncategorizedTasks = all.filter(t => !Array.isArray(t.categories) || t.categories.length === 0);
    if (uncategorizedTasks.length > 0) {
      groups.push({
        key: 'uncategorized',
        showTitle: false,
        tasks: uncategorizedTasks
      });
    }
  }

  return groups;
});

// 分页列表（单页最多 30 个任务）
const paginatedTasks = computed(() => {
  const start = (reminderStore.currentPage - 1) * reminderStore.pageSize;
  return processedTasks.value.slice(start, start + reminderStore.pageSize);
});

const totalPages = computed(() => {
  return Math.ceil(processedTasks.value.length / reminderStore.pageSize) || 1;
});
</script>

<template>
  <v-card height="200px">
    <template v-slot:image>
      <Silk
          :speed="3"
          :scale=".7"
          :color="'#1c1c1c'"
          :noise-intensity="0.1"
          :rotation="-.6"
          class="bg-black">
      </Silk>
    </template>
    <template v-slot:default>
      <v-container class="pa-2 mt-4 position-relative">
        <v-breadcrumbs>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('reminder.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>

        <div class="ml-4 opacity-60">
          {{ t('reminder.description') }}
        </div>

        <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
          <v-icon icon="mdi-bell-ring" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider></v-divider>

  <AffixContainerView :offsetTop="56">
    <div class="bg-black">
      <v-container>
        <v-row class="text-center" align="center">
          <v-col>
            <!-- 概览指标卡片 -->
            <v-row class="singe-line">
              <v-col cols="12" sm="4">
                <div class="rounded-xl d-flex align-center">
                  <div>
                    <div class="text-caption text-medium-emphasis">
                      {{ t('reminder.stats.total') }}
                    </div>
                    <div class="text-h5 font-weight-bold text-white">
                      {{ reminderStore.stats.total }}
                    </div>
                  </div>
                </div>
              </v-col>
              <v-divider vertical inset></v-divider>
              <v-col cols="12" sm="4">
                <div class="rounded-xl d-flex align-center">
                  <div>
                    <div class="text-caption text-medium-emphasis">
                      {{ t('reminder.stats.active') }}:
                    </div>
                    <div class="text-h5 font-weight-bold text-white">
                      {{ reminderStore.stats.active }}
                    </div>
                  </div>
                </div>
              </v-col>
              <v-divider vertical inset v-if="true"></v-divider>
              <v-col cols="12" sm="4" v-if="true">
                <div class="rounded-xl d-flex align-center">
                  <div>
                    <div class="text-caption text-medium-emphasis">
                      {{ t('reminder.stats.nextTrigger') }}
                    </div>
                    <div class="text-h5 font-weight-bold text-white singe-line">
                      {{ getTaskTitle(reminderStore.stats.nearestTask) }}
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-btn color="amber"
                   @click="onCreateNew">
              {{ t('reminder.createNew') }}
            </v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn
                icon
                variant="text"
                :color="reminderStore.masterNotificationEnabled ? 'amber' : 'grey'"
                :title="reminderStore.masterNotificationEnabled ? t('reminder.notificationEnabled') : t('reminder.notificationDisabled')"
                @click="reminderStore.setMasterNotification(!reminderStore.masterNotificationEnabled)">
              <v-icon size="22">
                {{ reminderStore.masterNotificationEnabled ? 'mdi-bell-ring-outline' : 'mdi-bell-off-outline' }}
              </v-icon>
            </v-btn>
          </v-col>
          <v-col cols="auto">
            <v-menu
                v-model="menuModel"
                open-on-click
                :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <div v-bind="props" class="cursor-pointer d-flex align-center">
                  <v-icon :color="hasActiveFilters ? 'amber' : ''">
                    {{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}
                  </v-icon>
                  <v-icon>mdi-dots-vertical</v-icon>
                </div>
              </template>

              <v-card border :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 540">
                <v-card-title class="py-8 text-center bg-black mb-4">
                  <v-icon size="64" :color="hasActiveFilters ? 'amber' : ''">
                    {{ hasActiveFilters ? 'mdi-filter' : 'mdi-filter-outline' }}
                  </v-icon>
                </v-card-title>
                <div class="pa-5">
                  <v-row>
                    <!-- 搜索关键字输入 -->
                    <v-col cols="12">
                      <v-text-field
                          :placeholder="t('basic.button.search')"
                          hide-details
                          variant="filled"
                          density="comfortable"
                          clearable
                          @keydown.enter="onSearch"
                          @click:clear="onClearSearch"
                          v-model="filterSearchInput">
                        <template v-slot:append-inner>
                          <v-btn @click="onSearch" icon variant="text" density="comfortable">
                            <v-icon icon="mdi-magnify"></v-icon>
                          </v-btn>
                        </template>
                      </v-text-field>
                    </v-col>

                    <!-- 分类筛选 -->
                    <v-col cols="12">
                      <div class="mb-2 text-caption font-weight-bold">{{ t('reminder.categories.filter') }}</div>
                      <v-select
                          variant="filled"
                          density="comfortable"
                          v-model="selectedCategories"
                          :items="[
                          { value: 'favorite', text: t('reminder.categories.favorite') },
                          { value: 'activity', text: t('reminder.categories.activity') },
                          { value: 'system', text: t('reminder.categories.system') },
                          { value: 'uncategorized', text: t('reminder.categories.uncategorized') }
                        ]"
                          item-value="value"
                          item-title="text"
                          multiple
                          chips
                          clearable
                          hide-details
                          :placeholder="t('reminder.categories.all')"
                      ></v-select>
                    </v-col>

                    <!-- 定时类型筛选 (周期重复 / 一次性) -->
                    <v-col cols="12">
                      <div class="mb-2 text-caption font-weight-bold">{{ t('reminder.fields.type') }}</div>
                      <v-select
                          variant="filled"
                          density="comfortable"
                          v-model="selectedScheduleTypes"
                          :items="[
                          { value: 'repeat', text: t('reminder.fields.typeRepeat') },
                          { value: 'once', text: t('reminder.fields.typeOnce') }
                        ]"
                          item-value="value"
                          item-title="text"
                          multiple
                          chips
                          clearable
                          hide-details
                          :placeholder="t('reminder.filter.all')"
                      ></v-select>
                    </v-col>

                    <!-- 状态筛选 (生效中 / 已停用) -->
                    <v-col cols="12">
                      <div class="mb-2 text-caption font-weight-bold">{{ t('reminder.fields.enabled') }}</div>
                      <v-select
                          variant="filled"
                          density="comfortable"
                          v-model="selectedStatuses"
                          :items="[
                          { value: 'active', text: t('reminder.status.active') },
                          { value: 'paused', text: t('reminder.status.paused') }
                        ]"
                          item-value="value"
                          item-title="text"
                          multiple
                          chips
                          clearable
                          hide-details
                          :placeholder="t('reminder.filter.all')"
                      ></v-select>
                    </v-col>

                    <!-- 排序方式配置 -->
                    <v-col cols="12">
                      <div class="mb-2 text-caption font-weight-bold">{{ t('reminder.filter.sortTitle') }}</div>
                      <v-row>
                        <v-col cols="6">
                          <v-select
                              variant="filled"
                              density="comfortable"
                              v-model="sortField"
                              item-value="value"
                              item-title="text"
                              :items="[
                              { value: 'triggerTime', text: t('reminder.filter.sortTriggerTime') },
                              { value: 'createdTime', text: t('reminder.filter.sortCreatedTime') },
                              { value: 'title', text: t('reminder.filter.sortTitleField') }
                            ]"
                              hide-details
                          ></v-select>
                        </v-col>
                        <v-col cols="6">
                          <v-select
                              variant="filled"
                              density="comfortable"
                              v-model="sortOrder"
                              item-value="value"
                              item-title="text"
                              :items="[
                              { value: 'asc', text: t('reminder.filter.sortAsc') },
                              { value: 'desc', text: t('reminder.filter.sortDesc') }
                            ]"
                              hide-details
                          ></v-select>
                        </v-col>
                      </v-row>
                    </v-col>
                  </v-row>

                  <!-- 底部操作按钮 -->
                  <v-card-actions class="mx-n4 mt-4 px-4">
                    <v-row>
                      <v-spacer></v-spacer>
                      <v-col cols="auto" class="text-right d-flex ga-2">
                        <v-btn @click="menuModel = false">
                          {{ t('basic.button.cancel') }}
                        </v-btn>
                        <v-btn
                            @click="resetAllFilters"
                            variant="outlined"
                            color="error"
                            :disabled="!hasActiveFilters"
                            prepend-icon="mdi-refresh">
                          {{ t('basic.button.reset') }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-card-actions>
                </div>
              </v-card>
            </v-menu>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </AffixContainerView>

  <div class="reminder-view-page">
    <v-container class="py-6">
      <!-- 浏览器桌面通知权限状态提示 -->
      <v-alert
          v-if="reminderStore.permissionStatus !== 'granted'"
          type="warning"
          variant="tonal"
          density="comfortable"
          icon="mdi-alert-circle-outline"
          class="mb-6">
        <div class="d-flex flex-wrap align-center justify-space-between ga-2">
          <div>
            <span class="font-weight-bold">{{ t('reminder.permissionWarning') }}</span>
          </div>
          <div class="d-flex ga-2">
            <v-btn size="small" color="amber" variant="flat" @click="onRequestPermission">
              {{ t('setting.advanced.notification.requestPermission') }}
            </v-btn>
            <v-btn size="small" variant="outlined" @click="onGoToAdvanced">
              {{ t('reminder.goToSettings') }}
            </v-btn>
          </div>
        </div>
      </v-alert>

      <!-- 已生效筛选标签栏 -->
      <div v-if="hasActiveFilters" class="d-flex flex-wrap align-center ga-2 mb-4">
        <span class="text-caption opacity-60">{{ t('reminder.filter.activeConditions') }}:</span>
        <v-chip
            v-if="filterSearchInput"
            size="small"
            closable
            @click:close="filterSearchInput = ''">
          {{ t('reminder.filter.keyword') }}: {{ filterSearchInput }}
        </v-chip>
        <v-chip
            v-for="cat in selectedCategories"
            :key="cat"
            size="small"
            :color="getCategoryColor(cat)"
            variant="tonal"
            closable
            @click:close="selectedCategories = selectedCategories.filter(c => c !== cat)">
          <v-icon :icon="getCategoryIcon(cat)" size="14" class="mr-1"></v-icon>
          {{ getCategoryLabel(cat) }}
        </v-chip>
        <v-chip
            v-for="st in selectedScheduleTypes"
            :key="st"
            size="small"
            color="amber"
            variant="tonal"
            closable
            @click:close="selectedScheduleTypes = selectedScheduleTypes.filter(s => s !== st)">
          {{ st === 'repeat' ? t('reminder.fields.typeRepeat') : t('reminder.fields.typeOnce') }}
        </v-chip>
        <v-chip
            v-for="status in selectedStatuses"
            :key="status"
            size="small"
            color="info"
            variant="tonal"
            closable
            @click:close="selectedStatuses = selectedStatuses.filter(s => s !== status)">
          {{ status === 'active' ? t('reminder.status.active') : t('reminder.status.paused') }}
        </v-chip>
        <v-btn size="x-small" variant="text" color="error" @click="resetAllFilters">
          {{ t('reminder.filter.clearAll') }}
        </v-btn>
      </div>

      <!-- 提醒任务卡片列表 (按分类分栏展示，无分类置于最后且不显示分类标题) -->
      <div v-if="categorizedGroups.length > 0">
        <div
            v-for="(group, gIdx) in categorizedGroups"
            :key="group.key"
            class="category-group-section mb-6">
          <!-- 分类标题栏目 (没有分类的不显示标题) -->
          <v-row v-if="group.showTitle"
                 align="center"
                 class="category-section-header ga-2"
                 :class="{'mt-8': gIdx > 0}">
            <v-col cols="auto" class="d-flex align-center">
              <p class="text-subtitle-1  singe-line">
                {{ group.title }}
              </p>
            </v-col>
            <v-col>
              <v-divider></v-divider>
            </v-col>
            <v-col cols="auto">
              <v-chip size="x-small" :color="group.color" variant="tonal" class="font-weight-bold">
                {{ group.tasks.length }}
              </v-chip>
            </v-col>
          </v-row>
          <div v-else-if="gIdx > 0" class="my-6">
            <v-divider></v-divider>
          </div>

          <v-row>
            <v-col
                v-for="task in group.tasks"
                :key="`${group.key}-${task.id}`"
                cols="12"
                md="6"
                lg="4">
              <v-card
                  class="reminder-card h-100 d-flex flex-column transition-swing bg-black"
                  :class="{
                    'reminder-card--paused': !task.enabled,
                    'reminder-card--imminent': task.countdown.status === 'imminent' && task.enabled,
                    'border-amber': task.enabled
                  }">
                <!-- 卡片头部标题与单独开关 -->
                <div class="pa-4 pb-2 d-flex align-center justify-space-between">
                  <div class="d-flex align-center singe-line mr-2">
                    <div class="singe-line">
                      <h3 class="text-h5 text-amber font-weight-bold singe-line" :title="getTaskTitle(task)">
                        {{ getTaskTitle(task) }}
                      </h3>
                    </div>
                  </div>

                  <!-- 任务单独通知与计时总开关 -->
                  <div class="d-flex align-center">
                    <!-- 单独是否通知按钮 -->
                    <v-btn
                        icon
                        size="x-small"
                        variant="text"
                        :color="task.notifyEnabled !== false && reminderStore.masterNotificationEnabled ? 'amber' : 'grey'"
                        :title="task.notifyEnabled !== false ? t('reminder.notificationEnabled') : t('reminder.notificationDisabled')"
                        @click.stop="reminderStore.toggleTaskNotify(task.id, task.notifyEnabled === false)">
                      <v-icon size="18">
                        {{ task.notifyEnabled !== false && reminderStore.masterNotificationEnabled ? 'mdi-bell-ring-outline' : 'mdi-bell-off-outline' }}
                      </v-icon>
                    </v-btn>

                    <v-divider vertical inset class="mx-3"></v-divider>

                    <!-- 任务计时总开关 -->
                    <v-switch
                        :model-value="task.enabled"
                        @update:model-value="(val) => reminderStore.toggleTask(task.id, !!val)"
                        hide-details
                        density="compact"
                        inset
                        color="amber">
                    </v-switch>
                  </div>
                </div>

                <!-- 实时倒计时状态条 -->
                <div class="px-4">
                  <v-row class="countdown-badges"
                         align="center"
                         :class="{
                          'pulse-animation': task.countdown.status === 'imminent' && task.enabled,
                        }">
                    <v-col cols="auto" class="d-flex align-center">
                      <v-icon class="mr-1">
                        {{
                          !task.enabled ? 'mdi-pause-circle-outline' :
                              task.countdown.status === 'expired' ? 'mdi-clock-alert-outline' :
                                  task.countdown.status === 'not_started' ? 'mdi-clock-start' :
                                      task.countdown.status === 'imminent' ? 'mdi-alarm-light' :
                                          task.countdown.isAdvanceNotice ? 'mdi-bell-ring-outline' : 'mdi-timer-outline'
                        }}
                      </v-icon>
                      <span>
                        {{
                          !task.enabled ? t('reminder.status.paused') :
                              task.countdown.status === 'expired' ? t('reminder.status.expired') :
                                  task.countdown.status === 'not_started' ? t('reminder.status.notStarted') :
                                      task.countdown.status === 'imminent' ? t('reminder.status.imminent') :
                                          task.countdown.isAdvanceNotice ? `${t('reminder.countdown.advanceBadge')} (${task.countdown.advanceText || (task.countdown.advanceMinutes + 'm')})` :
                                              t('reminder.countdown.remaining')
                        }}
                      </span>
                    </v-col>

                    <v-col>
                      <v-divider></v-divider>
                    </v-col>

                    <v-col cols="auto" class="font-weight-black font-mono text-h6 u">
                      {{ task.countdown.formattedCountdown }}
                    </v-col>
                  </v-row>
                </div>

                <!-- 计划规则与备注预览 -->
                <v-card-text class="flex-grow-1">
                  <!-- 规则概要 -->
                  <v-row class="mb-1" align="center">
                    <v-col cols="auto">
                      <v-icon>mdi-calendar-clock</v-icon>
                    </v-col>
                    <v-col>
                      <v-divider></v-divider>
                    </v-col>
                    <v-col cols="auto" class="text-h6">
                      <template v-if="task.scheduleType === 'repeat'">
                      <span v-if="task.repeatType === 'interval'" class="u">
                        {{ formatIntervalRule(task) }}
                      </span>
                        <span v-else class="u">
                        {{ formatRepeatDays(task.repeatDays) }} {{ task.repeatTime }}
                      </span>
                      </template>
                      <template v-else>
                        <span class="u">{{ formatTargetTime(task.targetTime) }}</span>
                      </template>
                    </v-col>
                  </v-row>

                  <!-- 有效期概要 (区间) -->
                  <div v-if="task.validityType === 'range'" class="text-caption d-flex align-center opacity-70 mb-2">
                    <v-icon size="14" class="mr-1">mdi-calendar-range</v-icon>
                    <span>{{ task.validFrom || t('reminder.dialog.immediately') }} ~ {{ task.validTo }}</span>
                  </div>

                  <!-- 备注内容预览 -->
                  <div v-if="getTaskNote(task)"
                       class="note-preview-box mt-1 cursor-pointer"
                       @click="onViewNote(task)"
                       :title="getTaskNote(task)">
                    <p class="mb-0 text-truncate-2">
                      <Textarea readonly :value="getTaskNote(task)"></Textarea>
                    </p>
                  </div>
                  <div v-else class="text-caption opacity-40 italic">
                    {{ t('reminder.noNote') }}
                  </div>

                  <v-chip-group class="mt-4" :column="true" variant="tonal"
                                base-color="amber"
                                color="amber">
                    <v-chip size="small" variant="tonal" :color="task.scheduleType === 'repeat' ? 'amber' : 'info'">
                      {{ task.scheduleType === 'repeat' ? t('reminder.fields.typeRepeat') : t('reminder.fields.typeOnce') }}
                    </v-chip>

                    <!-- 任务分类标识 -->
                    <v-chip
                        v-for="cat in (task.categories || [])"
                        :key="cat"
                        size="small"
                        variant="tonal"
                        :color="getCategoryColor(cat)">
                      <v-icon :icon="getCategoryIcon(cat)" size="12" class="mr-1"></v-icon>
                      {{ getCategoryLabel(cat) }}
                    </v-chip>

                    <!-- 提前提醒标识 -->
                    <v-chip
                        v-if="task.advanceNoticeEnabled && (task.advanceValue || task.advanceMinutes)"
                        size="small"
                        variant="tonal"
                        color="amber"
                        prepend-icon="mdi-bell-badge">
                      {{ formatAdvanceText(task) }}
                    </v-chip>
                  </v-chip-group>
                </v-card-text>

                <v-divider></v-divider>

                <!-- 卡片底部快捷操作 -->
                <v-card-actions class="pa-3 bg-surface d-flex align-center flex-wrap ga-1">

                  <!-- 静音通知标识 -->
                  <v-chip
                      v-if="task.notifyEnabled === false || !reminderStore.masterNotificationEnabled"
                      size="small"
                      variant="tonal"
                      color="grey"
                      prepend-icon="mdi-bell-off">
                    {{ t('reminder.muted') }}
                  </v-chip>

                  <v-chip v-if="task.isPreset" size="small" variant="tonal" color="amber">
                    {{ t('reminder.presetBadge') }}
                  </v-chip>
                  <v-spacer></v-spacer>
                  <v-btn icon="mdi-pencil-outline" size="small" variant="text" color="amber" :title="t('reminder.edit')" @click="onEdit(task)"></v-btn>
                  <v-menu location="bottom end">
                    <template v-slot:activator="{ props: menuProps }">
                      <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="menuProps"></v-btn>
                    </template>
                    <v-list density="compact" class="pa-1" border rounded="lg" bg-color="surface">
                      <v-list-item
                          prepend-icon="mdi-robot"
                          :title="t('reminder.bot.addToBot')"
                          @click="onOpenBotSubscribe(task)">
                      </v-list-item>
                      <v-divider class="my-1"></v-divider>
                      <v-list-item
                          prepend-icon="mdi-delete-outline"
                          :title="t('reminder.delete')"
                          class="text-error"
                          @click="onDelete(task)">
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- 分页组件 (当任务数量超过 30 条时展示) -->
        <div v-if="totalPages > 1" class="d-flex justify-center mt-8">
          <v-pagination
              v-model="reminderStore.currentPage"
              :length="totalPages"
              rounded="circle"
              color="amber">
          </v-pagination>
        </div>
      </div>

      <!-- 空列表占位 -->
      <v-card v-else border class="pa-12 text-center bg-surface">
        <EmptyView>
          <template v-slot:title>
            <p class="text-body-1 mt-4 mb-4">
              {{ t('reminder.empty') }}
            </p>
          </template>
          <template v-slot:description>
            <div class="d-flex justify-center ga-3">
              <v-btn color="amber" variant="flat" @click="onCreateNew">
                {{ t('reminder.createNew') }}
              </v-btn>
            </div>
          </template>
        </EmptyView>
      </v-card>
    </v-container>

    <!-- 创建与编辑对话框 -->
    <ReminderEditDialog
        v-model="editDialogVisible"
        :edit-task="editingTask"
        @save="onSaveTask">
    </ReminderEditDialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialogVisible" max-width="420">
      <v-card class="pa-4 border">
        <v-card-title class="d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          {{ t('reminder.delete') }}
        </v-card-title>
        <v-card-text class="text-body-2">
          {{ t('reminder.deleteConfirm', {title: deletingTask ? getTaskTitle(deletingTask) : ''}) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialogVisible = false">
            {{ t('reminder.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">
            {{ t('reminder.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 备注完整内容查看对话框 -->
    <v-dialog v-model="noteDetailDialogVisible" max-width="1024" scrollable>
      <v-card class="border">
        <v-toolbar color="surface" density="compact">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            {{ detailTask ? getTaskTitle(detailTask) : '' }} - {{ t('reminder.fields.note') }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" size="small" @click="noteDetailDialogVisible = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-5" v-if="detailTask">
          <Textarea readonly :value="getTaskNote(detailTask)"></Textarea>
        </v-card-text>
        <v-card-actions class="pa-3 border-t bg-surface">
          <v-spacer></v-spacer>
          <v-btn color="amber" variant="text" @click="noteDetailDialogVisible = false">
            {{ t('basic.button.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 添加到机器人通知对话框 -->
    <v-dialog v-model="botSubscribeDialogVisible" max-width="560">
      <v-card border>
        <v-toolbar color="surface" density="compact" class="border-b">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            {{ t('reminder.bot.dialogTitle') }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" size="small" @click="botSubscribeDialogVisible = false"></v-btn>
        </v-toolbar>

        <v-card-text class="pa-5">
          <!-- 描述 -->
          <v-alert type="info" class="d-flex align-center ga-2 mb-4 pa-3 rounded border">
            <div class="text-body-2 font-weight-medium">
              {{ t('reminder.bot.description') }}
            </div>
          </v-alert>

          <div v-if="botSubscribeTask" class="mb-3 d-flex align-center ga-2">
            <span class="text-caption opacity-70">{{ t('reminder.bot.targetTask') }}:</span>
            <span class="font-weight-bold text-body-2 text-amber">{{ getTaskTitle(botSubscribeTask) }}</span>
          </div>

          <div class="text-caption opacity-70 mb-2">
            {{ t('reminder.bot.hint') }}
          </div>

          <!-- 指令代码框 -->
          <div class="bot-code-box pa-3 rounded border bg-black d-flex align-center justify-space-between ga-2 cursor-pointer mb-2"
               @click="copyBotCommand"
               :title="t('reminder.bot.clickToCopy')">
            <code class="text-amber font-mono text-body-2 text-break flex-grow-1 select-all">
              {{ botSubscribeCommand }}
            </code>
            <v-btn
                icon="mdi-content-copy"
                size="small"
                variant="tonal"
                color="amber"
                @click.stop="copyBotCommand">
            </v-btn>
          </div>
        </v-card-text>

        <v-card-actions class="pa-3 border-t bg-surface">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="botSubscribeDialogVisible = false">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-btn color="amber" variant="flat" prepend-icon="mdi-content-copy" @click="copyBotCommand">
            {{ t('reminder.bot.copyCommand') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped lang="less">
.reminder-card {
  border-radius: 12px;
  position: relative;
  overflow: hidden;

  &--paused {
    opacity: 0.30;
    filter: grayscale(0.2);
  }
}

.countdown-badge {
  letter-spacing: 0.5px;
}

.font-mono {
  font-family: 'Roboto Mono', monospace, sans-serif;
}

.note-preview-box {
  max-height: 60px;
  overflow: hidden;
  transition: background-color 0.2s ease;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bot-code-box {
  word-break: break-all;
  border-color: rgba(255, 193, 7, 0.3) !important;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:hover {
    border-color: rgba(255, 193, 7, 0.7) !important;
    background-color: rgba(255, 193, 7, 0.05) !important;
  }
}
</style>
