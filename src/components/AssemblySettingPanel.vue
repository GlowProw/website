<script setup lang="ts">
import {computed, ref, watch, Ref} from "vue";
import {useI18n} from "vue-i18n";
import {useHttpToken} from "@/assets/sripts/http_util";
import {apis} from "@/assets/sripts/index";
import {useNoticeStore} from "~/stores/noticeStore";
import {ApiError} from "@/assets/types/Api";
import {handleApiError} from "@/assets/sripts/error_handler";
import {PublishAssemblyData} from "@/assets/types";

import Loading from "@/components/Loading.vue";
import AssemblySettingWidget from "@/components/AssmblySettingWidget.vue"
import AssemblyDataProcessing from "@/assets/sripts/assembly_data_processing";
import VueJsonPretty from 'vue-json-pretty';
import WheelDataProcessing from "@/assets/sripts/wheel_data_processing";
import WarehouseDataProcessing from "@/assets/sripts/warehouse_data_processing";
import MasteryDataProcessing from "@/assets/sripts/mastery_data_processing";

import 'vue-json-pretty/lib/styles.css';

const {t, locale} = useI18n(),
    http = useHttpToken(),
    notice = useNoticeStore(),
    assemblyDataProcessing = new AssemblyDataProcessing(),
    wheelDataProcessing = new WheelDataProcessing(),
    warehouseDataProcessing = new WarehouseDataProcessing(),
    masteryDataProcessing = new MasteryDataProcessing()

const props = defineProps<{ id: string, data?: any }>(),
    emit = defineEmits(['change', 'import-data', 'update:data'])

let show = ref(false),
    getSettingLoading = ref(false),
    setSettingLoading = ref(false),
    tabValue = ref('conventional'),
    // 属性结构
    settingData: Ref<any> = ref({
      assembly: {
        visibility: 'publicly',
        attr: {
          password: '',
          language: [locale.value],
          isShowWeaponIconArray: false,
          isAnonymous: false,
          isComment: true,
          isLike: true,
          isAllowClone: true,
          isAllowSearch: true,
          assemblyUseVersion: AssemblyDataProcessing.nowVersion
        }
      },
      wheel: {
        attr: {
          wheelUseVersion: WheelDataProcessing.nowVersion
        }
      },
      warehouse: {
        attr: {
          warehouseUseVersion: WarehouseDataProcessing.nowVersion
        }
      },
      mastery: {
        attr: {
          masteryUseVersion: MasteryDataProcessing.nowVersion
        }
      }
    })

watch(() => show.value, (value) => {
  if (value)
    getAssemblySetting()
})

/**
 * 获取配装
 */
const getAssemblySetting = async () => {
  try {
    if (!props.id)
      return;

    getSettingLoading.value = true

    const result = await apis.assemblyApi().getAssemblyAttr(props.id),
        d = result.data

    settingData.value = Object.assign(settingData.value, d.data.data)
  } catch (e) {
    handleApiError(e, notice, t, { component: 'AssemblySettingPanel' })
  } finally {
    getSettingLoading.value = false
  }
}

/**
 * 获取配装
 */
const setAssemblySetting = async () => {
  try {
    if (!props.id)
      return;

    setSettingLoading.value = true

    if (settingData.value.assembly.attr && settingData.value.assembly.attr.password == null)
      settingData.value.assembly.attr.password = ''
    else if (settingData.value.assembly.attr && settingData.value.assembly.attr.password == '')
      delete settingData.value.assembly.attr.password

    const result = await apis.assemblyApi().editAssemblyAttr(props.id, settingData.value),
        d = result.data

    notice.success(t(`basic.tips.${d.code}`))
  } catch (e) {
    handleApiError(e, notice, t, { component: 'AssemblySettingPanel' })
  } finally {
    emit('change')

    show.value = false;
    setSettingLoading.value = false
  }
}

/**
 * 打开设置弹窗
 */
const open = () => {
  show.value = true
  getAssemblySetting()
}

/**
 * 关闭设置弹窗
 */
const close = () => {
  show.value = false
}

// 数据模块定义列表
const dataModules = [
  { key: 'assembly', labelKey: 'assembly.additions.assembly', icon: 'mdi-ship-wheel' },
  { key: 'mastery', labelKey: 'assembly.additions.mastery', icon: 'mdi-tree-outline' },
  { key: 'warehouse', labelKey: 'assembly.additions.warehouse', icon: 'mdi-package-variant-closed' },
  { key: 'wheel', labelKey: 'assembly.additions.wheel', icon: 'mdi-circle-slice-8' },
];

// 当前选中的数据子标签页
const dataTabValue = ref('assembly');

// 判断是否存在任一模块的可展示数据
const hasAssemblyData = computed(() => {
  return Boolean(
    props?.data?.assembly?.data ||
    props?.data?.mastery?.data ||
    props?.data?.warehouse?.data ||
    props?.data?.wheel?.data
  );
});

// 计算当前子标签页导出的规范化 JSON 数据
const currentExportedData = computed(() => {
  const key = dataTabValue.value;
  const raw = props.data?.[key]?.data;
  if (!raw) return raw ?? null;
  try {
    if (key === 'assembly') return assemblyDataProcessing.export(raw);
    if (key === 'mastery') return masteryDataProcessing.export(raw);
    if (key === 'warehouse') return warehouseDataProcessing.export(Array.isArray(raw) ? raw : []);
    if (key === 'wheel') return wheelDataProcessing.export(Array.isArray(raw) ? raw : []);
  } catch (e) {
    console.error('Export error for ' + key, e);
    return raw;
  }
  return raw;
});

// 当前子标签页名称国际化标签
const currentTabLabel = computed(() => {
  const mod = dataModules.find(m => m.key === dataTabValue.value);
  return mod ? t(mod.labelKey) : '';
});

/**
 * 复制当前选中模块的 JSON 数据到剪贴板
 */
const onCopyCurrentData = async () => {
  try {
    const data = currentExportedData.value;
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    notice.success(t('basic.tips.copySuccess') || '复制成功');
  } catch (e) {
    notice.error('复制失败');
  }
};

/**
 * 导出并下载当前选中模块的 JSON 文件
 */
const onDownloadCurrentData = () => {
  try {
    const data = currentExportedData.value;
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assembly-${props.id || 'export'}-${dataTabValue.value}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notice.success(t('basic.tips.downloadSuccess') || '导出下载成功');
  } catch (e) {
    notice.error('导出失败');
  }
};

// 导入弹窗显示标记
const importDialog = ref(false);
// 导入输入内容文本
const importInputText = ref('');
// 文件选择器 DOM 引用
const fileInputRef = ref<HTMLInputElement | null>(null);

/**
 * 打开导入弹窗并清空输入
 */
const openImportDialog = () => {
  importInputText.value = '';
  importDialog.value = true;
};

/**
 * 选择本地 JSON 文件并载入内容
 * @param event 文件变更事件
 */
const onSelectFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    importInputText.value = String(e.target?.result || '');
  };
  reader.readAsText(file);
};

/**
 * 确认导入数据，仅变更前端内存并通知父级，不提交后端
 */
const confirmImport = () => {
  if (!importInputText.value.trim()) {
    notice.warning('请输入或上传 JSON 数据');
    return;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(importInputText.value.trim());
  } catch (e) {
    notice.error('JSON 格式无效，请检查语法');
    return;
  }

  try {
    const key = dataTabValue.value;
    let imported: any;
    if (key === 'assembly') {
      imported = assemblyDataProcessing.import(parsed);
    } else if (key === 'mastery') {
      imported = masteryDataProcessing.import(parsed);
    } else if (key === 'warehouse') {
      imported = warehouseDataProcessing.import(parsed);
    } else if (key === 'wheel') {
      imported = wheelDataProcessing.import(parsed);
    } else {
      imported = parsed;
    }

    if (props.data) {
      if (!props.data[key]) {
        props.data[key] = {};
      }
      props.data[key].data = imported;
    }

    emit('import-data', { type: key, data: imported });
    emit('update:data', props.data);

    importDialog.value = false;
    importInputText.value = '';
    notice.success(`${currentTabLabel.value}数据导入成功（仅前端生效）`);
  } catch (e) {
    notice.error('数据导入解析失败，请检查数据结构');
  }
};

defineExpose({
  open,
  close,
  show
})

defineOptions({ name: 'AssemblySettingPanel' })
</script>

<template>
  <span @click="show = !show">
      <slot></slot>
  </span>
  <v-dialog v-model="show">
    <v-container>
      <v-card border class="position-relative">
        <v-card-title class="pa-5">
          <div class="text-h5 font-weight-bold text-amber">{{ t('assembly.setting.title') }}</div>
        </v-card-title>

        <v-overlay :model-value="getSettingLoading"
                   contained
                   disabled
                   class="align-center justify-center">
          <Loading size="30"></Loading>
        </v-overlay>

        <v-divider></v-divider>
        <div class="d-flex flex-row">
          <v-tabs
              class="v-col-2 pa-0"
              v-model="tabValue"
              direction="vertical">
            <v-tab prepend-icon="mdi-cog" :text="t('assembly.setting.tagCommon')" value="conventional"></v-tab>
            <v-tab prepend-icon="mdi-database" :text="t('assembly.setting.tagData')" value="data" v-if="hasAssemblyData"></v-tab>
          </v-tabs>
          <v-divider vertical></v-divider>

          <v-card elevation="0" class="overflow-auto v-col-10 flex-1 w-100">
            <v-tabs-window v-model="tabValue">
              <v-tabs-window-item value="conventional">
                <AssemblySettingWidget v-model="settingData"></AssemblySettingWidget>
              </v-tabs-window-item>

              <v-tabs-window-item value="data">
                <div class="w-100 pa-1">
                  <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
                    <v-tabs v-model="dataTabValue" density="compact" color="amber">
                      <v-tab v-for="mod in dataModules" :key="mod.key" :value="mod.key" :prepend-icon="mod.icon">
                        {{ t(mod.labelKey) }}
                      </v-tab>
                    </v-tabs>

                    <div class="d-flex align-center ga-2">
                      <v-btn
                          size="small"
                          variant="tonal"
                          prepend-icon="mdi-content-copy"
                          @click="onCopyCurrentData">
                        {{ t('basic.button.copy') || '复制' }}
                      </v-btn>
                      <v-btn
                          size="small"
                          variant="tonal"
                          prepend-icon="mdi-download"
                          @click="onDownloadCurrentData">
                        {{ t('basic.button.export') || '导出' }}
                      </v-btn>
                      <v-btn
                          size="small"
                          variant="flat"
                          color="amber"
                          class="text-black font-weight-bold"
                          prepend-icon="mdi-upload"
                          @click="openImportDialog">
                        {{ t('basic.button.import') || '导入' }}
                      </v-btn>
                    </div>
                  </div>

                  <v-card elevation="0" border min-height="240" max-height="58vh" class="pa-2 overflow-auto">
                    <VueJsonPretty
                        theme="dark"
                        showLine
                        showIcon
                        showDoubleQuotes
                        :data="currentExportedData"/>
                  </v-card>
                </div>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card>
        </div>

        <v-divider></v-divider>
        <v-card-actions class="pa-5">
          <v-spacer></v-spacer>
          <v-btn @click="show = !show">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn :loading="setSettingLoading" @click="setAssemblySetting" class="bg-amber text-black">{{ t('basic.button.submit') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </v-dialog>

  <!-- 数据导入弹窗（仅前端生效） -->
  <v-dialog v-model="importDialog" max-width="600">
    <v-card border>
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <span class="text-h6 font-weight-bold">
          {{ t('basic.button.import') || '导入' }} - {{ currentTabLabel }}
        </span>
        <v-btn icon="mdi-close" variant="text" density="compact" @click="importDialog = false"></v-btn>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pa-4">
        <v-alert
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
            icon="mdi-information-outline">
          注意：此导入仅在当前前端页面内存临时生效，不会上传或修改服务器数据库记录。
        </v-alert>

        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-caption text-medium-emphasis">可粘贴 JSON 字符串或选择本地文件载入：</span>
          <v-btn
              size="x-small"
              variant="outlined"
              prepend-icon="mdi-file-upload-outline"
              @click="fileInputRef?.click()">
            选择文件
          </v-btn>
          <input
              ref="fileInputRef"
              type="file"
              accept=".json,application/json,text/plain"
              style="display: none"
              @change="onSelectFile" />
        </div>

        <v-textarea
            v-model="importInputText"
            rows="10"
            variant="outlined"
            density="comfortable"
            hide-details
            placeholder="请在此粘贴对应模块的 JSON 数据..."
            class="font-monospace text-caption"></v-textarea>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="importDialog = false">
          {{ t('basic.button.cancel') }}
        </v-btn>
        <v-btn
            color="amber"
            class="text-black font-weight-bold"
            variant="flat"
            :disabled="!importInputText.trim()"
            @click="confirmImport">
          {{ t('basic.button.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">

</style>
