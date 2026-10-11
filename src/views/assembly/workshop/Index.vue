<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, onMounted, type Ref, ref, toRaw, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {v6 as uuidv6} from "uuid";

import {apis, storageIntermediateTransfer} from "@/assets/sripts";
import {StorageIntermediateTransferSaveType} from "@/assets/sripts/storage_assembly";
import {useNoticeStore} from "~/stores/noticeStore";
import {useAppStore} from "~/stores/appStore";

import EmptyView from "@/components/EmptyView.vue";
import Silk from "@/components/Silk.vue";
import Loading from "@/components/Loading.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import AssemblyDataProcessing from "@/assets/sripts/assembly_data_processing";
import WheelDataProcessing from "@/assets/sripts/wheel_data_processing";
import WarehouseDataProcessing from "@/assets/sripts/warehouse_data_processing";
import MasteryDataProcessing from "@/assets/sripts/mastery_data_processing";
import AssemblyMainSubjectView from "@/components/AssemblyMainSubjectView.vue";
import Textarea from "@/components/textarea/index.vue";
import AssemblyTagsWidget from "@/components/AssemblyTagsWidget.vue";
import AssemblySettingWidget from "@/components/AssmblySettingWidget.vue";
import AssemblyTagChip from "@/components/AssemblyTagChip.vue";
import {handleApiError} from "@/assets/sripts/error_handler";
import AffixContainerView from "@/components/AffixContainerView.vue";

const {t, locale} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    notice = useNoticeStore(),
    noticeStore = useNoticeStore(),
    appStore = useAppStore();

let
    assemblyLoading = ref(false),
    submitLoading = ref(false),
    assemblyDetailData: Ref<any> = ref({}),
    assemblyMainSubjectView: Ref<any> = ref(null),

    draftModel = ref(false),
    draftNewSaveModel = ref(false),
    newDraftName = ref(''),
    draftList: Ref<any[]> = ref([]),
    draftSaveQuickArchivingLoading = ref(false),
    draftSaveLoading = ref(false),
    shareData: Ref<any> = ref({
      assembly: {},
      warehouse: {},
      wheel: {},
      mastery: {}
    }),

    publishData = ref<any>({
      uuid: '',
      name: '',
      description: '',
      assembly: {
        visibility: 'publicly',
        tags: [],
        attr: {
          password: '',
          assemblyUseVersion: AssemblyDataProcessing.nowVersion,
          language: locale.value,
          isComment: true,
          isLike: true
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
    }),

    formRules = {
      name: [
        (v: any) => !!(v && v.trim()) || t('basic.assembly.publish.nameRequired')
      ]
    },

    verificationWorkshop = ref<{ required: number; verify: Array<{ required: boolean; message: string; title?: string }> }>({
      required: 0,
      verify: []
    }),

    isEditModel = computed(() => {
      switch (route.name) {
        case 'AssemblyEdit':
        case 'EditAssembly':
          return true;
        default:
          return Boolean(route.params.uid);
      }
    }),
    isAssemblyByUser = computed(() => isEditModel.value ? (shareData.value.isOwner !== false) : true),
    currentWorkshopAssembly = computed(() => {
      const live = assemblyMainSubjectView.value?.refs?.assembly?.onExport?.();
      if (live) return live;
      return shareData.value?.assembly?.data || shareData.value?.assembly || null;
    }),

    requiredVerifyList = computed(() => verificationWorkshop.value.verify.filter((v: any) => v.required)),
    optionalVerifyList = computed(() => verificationWorkshop.value.verify.filter((v: any) => !v.required));

/**
 * 校验工坊全部数据（包含名称与各子组件要求）
 */
const runWorkshopVerify = () => {
  const verification: { required: number; verify: Array<{ required: boolean; message: string; title?: string }> } = {
    required: 0,
    verify: []
  };

  // 1. 验证配置名称（必选项）
  if (!publishData.value?.name || !publishData.value.name.trim()) {
    verification.verify.push({
      required: true,
      message: 'nameRequired',
      title: t('basic.assembly.publish.name')
    });
    verification.required += 1;
  }

  // 2. 验证各个工坊组件 (assembly, wheel, warehouse, mastery)
  const refs = assemblyMainSubjectView.value?.refs;
  if (refs) {
    const checkComponents = ['assembly', 'wheel', 'warehouse', 'mastery'];
    for (const compName of checkComponents) {
      const comp = refs[compName];
      if (comp && typeof comp.verify === 'function') {
        const compVerify = comp.verify();
        if (compVerify && compVerify.verify && compVerify.verify.length > 0) {
          verification.verify.push(...compVerify.verify);
          verification.required += (compVerify.required || 0);
        }
      }
    }
  }

  verificationWorkshop.value = verification;
  return verification;
};

const getVerifyMessage = (v: { required: boolean; message: string; title?: string }) => {
  if (v.message === 'nameRequired') {
    return t('basic.assembly.publish.nameRequired');
  }
  const tipKey = `assembly.workshop.verifyTips.${v.message}`;
  const translated = t(tipKey);
  if (translated && translated !== tipKey) {
    return translated;
  }
  return v.message;
};

/**
 * 工作台更新事件
 */
const onWorkshopUpdateEvent = () => {
  runWorkshopVerify();
};

/**
 * 监听配装属性变化，同步更新配装视图
 */
watch(() => publishData.value.assembly?.attr, () => {
  const comp = assemblyMainSubjectView.value?.refs?.assembly;
  if (comp && typeof comp.setSetting === 'function') {
    comp.setSetting({
      assemblyUseVersion: publishData.value.assembly.attr?.assemblyUseVersion || AssemblyDataProcessing.nowVersion,
      isShowItemName: publishData.value.assembly.attr?.isShowItemName ?? true,
      isShowWeaponIconArray: publishData.value.assembly.attr?.isShowWeaponIconArray ?? false
    });
  }
}, {deep: true});

/**
 * 监听名称变化，实时更新验证器
 */
watch(() => publishData.value.name, () => {
  runWorkshopVerify();
});

/**
 * 监听共享数据变化，重新装载工坊视图
 */
watch(() => shareData.value, async () => {
  loadAssemblyData();
});

/**
 * 编辑模式下挂载时拉取配装详情
 */
onMounted(async () => {
  if (isEditModel.value) {
    await getAssemblyDetail();
  }
});

/**
 * 获取配装详情
 */
const getAssemblyDetail = async () => {
  const {uid} = route.params;
  if (!uid) return;

  try {
    assemblyLoading.value = true;
    const {password} = route.query;
    const result = await apis.assemblyApi().getAssemblyItem(<string>uid, {
      password: <string>password
    });
    const d = result.data;
    if (d && d.data) {
      assemblyDetailData.value = d.data;
      shareData.value = d.data;

      // 填充发布信息
      publishData.value.uuid = d.data.uuid;
      publishData.value.name = d.data.name || '';
      publishData.value.description = d.data.description || '';
      publishData.value.assembly.tags = d.data.tags || d.data.assembly?.tags || [];
      if (d.data.assembly?.visibility) {
        publishData.value.assembly.visibility = d.data.assembly.visibility;
      }
      if (d.data.assembly?.attr) {
        publishData.value.assembly.attr = {
          ...publishData.value.assembly.attr,
          ...d.data.assembly.attr
        };
      }
      if (d.data.wheel?.attr) {
        publishData.value.wheel.attr = {
          ...publishData.value.wheel.attr,
          ...d.data.wheel.attr
        };
      }
      if (d.data.warehouse?.attr) {
        publishData.value.warehouse.attr = {
          ...publishData.value.warehouse.attr,
          ...d.data.warehouse.attr
        };
      }
      if (d.data.mastery?.attr) {
        publishData.value.mastery.attr = {
          ...publishData.value.mastery.attr,
          ...d.data.mastery.attr
        };
      }

      loadAssemblyData();
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'AssemblyWorkshop'});
  } finally {
    assemblyLoading.value = false;
  }
};

/**
 * 装载配装、轮盘、船仓、精通数据到工坊各子视图
 */
const loadAssemblyData = () => {
  const d = shareData.value;
  const refs = assemblyMainSubjectView.value?.refs;
  if (!refs) return;

  if (refs.assembly && d.assembly) {
    refs.assembly
        .setSetting({
          isShowItemName: d.assembly?.attr?.isShowItemName ?? true,
          assemblyUseVersion: d.assembly?.attr?.assemblyUseVersion,
          isFullName: d.assembly?.attr?.isFullName,
          isShowWeaponIconArray: d.assembly?.attr?.isShowWeaponIconArray ?? false
        })
        .onLoad(d.assembly.data || d.assembly);
  }

  if (refs.wheel && d.wheel) {
    refs.wheel
        .setSetting({
          isShowItemName: d.wheel?.attr?.isShowItemName,
          assemblyUseVersion: d.wheel?.attr?.assemblyUseVersion
        })
        .onLoad(d.wheel.data || d.wheel);
  }

  if (refs.warehouse && d.warehouse) {
    refs.warehouse
        .setSetting({
          isShowItemName: d.warehouse?.attr?.isShowItemName,
          assemblyUseVersion: d.warehouse?.attr?.assemblyUseVersion
        })
        .onLoad(d.warehouse.data || d.warehouse);
  }

  if (refs.mastery && d.mastery) {
    refs.mastery
        ?.setSetting?.({
      masteryUseVersion: d.mastery?.attr?.masteryUseVersion
    })
        ?.onLoad?.(d.mastery.data || d.mastery);
  }

  runWorkshopVerify();
};

const onSubjectViewReady = async () => {
  loadAssemblyData();
};

/**
 * 提交发布或编辑保存
 */
const onSubmit = async () => {
  const verifyResult = runWorkshopVerify();
  if (verifyResult.required > 0) {
    noticeStore.warning(t('assembly.workshop.missingRequiredFields') || '请先完善必选项');
    return;
  }
  if (!isAssemblyByUser.value) {
    noticeStore.error('无权限编辑该配装');
    return;
  }

  try {
    submitLoading.value = true;
    const exportAssembly = assemblyMainSubjectView.value?.refs?.assembly?.onExport?.() || shareData.value?.assembly?.data || shareData.value?.assembly;
    const exportWheel = assemblyMainSubjectView.value?.refs?.wheel?.onExport?.() || shareData.value?.wheel?.data || shareData.value?.wheel;
    const exportWarehouse = assemblyMainSubjectView.value?.refs?.warehouse?.onExport?.() || shareData.value?.warehouse?.data || shareData.value?.warehouse;
    const exportMastery = assemblyMainSubjectView.value?.refs?.mastery?.onExport?.() || shareData.value?.mastery?.data || shareData.value?.mastery;

    const payload: any = {
      ...publishData.value,
      name: publishData.value.name?.trim(),
      description: publishData.value.description,
      assembly: {
        ...publishData.value.assembly,
        data: exportAssembly
      },
      wheel: {
        ...publishData.value.wheel,
        data: exportWheel
      },
      warehouse: {
        ...publishData.value.warehouse,
        data: exportWarehouse
      },
      mastery: {
        ...publishData.value.mastery,
        data: exportMastery
      }
    };

    if (isEditModel.value) {
      payload.uuid = publishData.value.uuid || route.params.uid || assemblyDetailData.value?.uuid;
      const result = await apis.assemblyApi().editAssembly(payload);
      const d = result.data;
      if (payload.uuid) {
        storageIntermediateTransfer.delete(payload.uuid, {
          saveType: StorageIntermediateTransferSaveType.Data,
          category: 'assembly'
        });
      }
      notice.success(t(`basic.tips.${d.code}`) || '保存成功');
      await router.push(`/assembly/browse/${payload.uuid}/detail`);
    } else {
      const result = await apis.assemblyApi().publishAssembly(payload);
      const d = result.data;
      const newUuid = d.data?.['assembly.uuid'] || d.data?.uuid;
      notice.success(t(`basic.tips.${d.code}`) || '发布成功');
      if (newUuid) {
        await router.push(`/assembly/browse/${newUuid}/detail`);
      } else {
        await router.push(`/assembly/browse`);
      }
    }
  } catch (e) {
    handleApiError(e, notice, t, {component: 'AssemblyWorkshop'});
  } finally {
    submitLoading.value = false;
  }
};

/**
 * 快速存档（将配装和发布信息一并存入草稿）
 */
const onQuickArchiving = () => {
  draftSaveQuickArchivingLoading.value = true;

  const currentAssembly = assemblyMainSubjectView.value?.refs?.assembly?.onExport?.() || shareData.value?.assembly?.data || shareData.value?.assembly;
  const currentWheel = assemblyMainSubjectView.value?.refs?.wheel?.onExport?.() || shareData.value?.wheel?.data || shareData.value?.wheel;
  const currentWarehouse = assemblyMainSubjectView.value?.refs?.warehouse?.onExport?.() || shareData.value?.warehouse?.data || shareData.value?.warehouse;
  const currentMastery = assemblyMainSubjectView.value?.refs?.mastery?.onExport?.() || shareData.value?.mastery?.data || shareData.value?.mastery;

  const draftPayload = {
    ...shareData.value,
    name: publishData.value.name || t('assembly.workshop.quickArchiving'),
    description: publishData.value.description || '',
    tags: publishData.value.assembly?.tags || [],
    visibility: publishData.value.assembly?.visibility || 'publicly',
    attr: publishData.value.assembly?.attr || {},
    publishData: JSON.parse(JSON.stringify(publishData.value)),
    assembly: currentAssembly,
    wheel: currentWheel,
    warehouse: currentWarehouse,
    mastery: currentMastery
  };

  storageIntermediateTransfer.update(draftPayload, {
    uid: 'quickArchiving',
    saveType: StorageIntermediateTransferSaveType.Draft,
    category: 'assembly'
  });

  setTimeout(() => {
    draftSaveQuickArchivingLoading.value = false;
    noticeStore.success('快速保存草稿成功');
  }, 400);
};

/**
 * 打开草稿面板
 */
const onPenDraftPanel = () => {
  draftModel.value = true;
  getDraftListData();
};

/**
 * 读取草稿数据
 */
const getDraftListData = () => {
  let d = storageIntermediateTransfer.gets({
    saveType: StorageIntermediateTransferSaveType.Draft,
    category: 'assembly'
  });

  if (d.code == 0)
    draftList.value = d.data;
};

/**
 * 保存新命名草稿（将配装和发布信息一并存入草稿）
 */
const onSaveDraft = () => {
  if (!newDraftName.value.trim()) {
    noticeStore.warning(t('assembly.workshop.inputDraftName'));
    return;
  }

  let uid: string = uuidv6();
  draftSaveLoading.value = true;

  const currentAssembly = assemblyMainSubjectView.value?.refs?.assembly?.onExport?.() || shareData.value?.assembly?.data || shareData.value?.assembly;
  const currentWheel = assemblyMainSubjectView.value?.refs?.wheel?.onExport?.() || shareData.value?.wheel?.data || shareData.value?.wheel;
  const currentWarehouse = assemblyMainSubjectView.value?.refs?.warehouse?.onExport?.() || shareData.value?.warehouse?.data || shareData.value?.warehouse;
  const currentMastery = assemblyMainSubjectView.value?.refs?.mastery?.onExport?.() || shareData.value?.mastery?.data || shareData.value?.mastery;

  const draftPayload = {
    ...shareData.value,
    name: newDraftName.value,
    description: publishData.value.description || '',
    tags: publishData.value.assembly?.tags || [],
    visibility: publishData.value.assembly?.visibility || 'publicly',
    attr: publishData.value.assembly?.attr || {},
    publishData: {
      ...JSON.parse(JSON.stringify(publishData.value)),
      name: newDraftName.value
    },
    assembly: currentAssembly,
    wheel: currentWheel,
    warehouse: currentWarehouse,
    mastery: currentMastery
  };

  storageIntermediateTransfer.update(draftPayload, {
    uid,
    saveType: StorageIntermediateTransferSaveType.Draft,
    category: 'assembly'
  });

  draftSaveLoading.value = false;
  draftNewSaveModel.value = false;
  newDraftName.value = '';

  noticeStore.success('保存草稿成功');
};

/**
 * 使用草稿（恢复配装与发布信息）
 */
const onUseDraft = (item: any) => {
  const assemblyData = item.assembly?.data || item.assembly;
  if (!assemblyData || Object.keys(assemblyData).length == 0) {
    return noticeStore.error('草稿数据为空');
  }

  // 恢复发布信息
  if (item.name && item.id !== 'quickArchiving') {
    publishData.value.name = item.name;
  } else if (item.publishData?.name) {
    publishData.value.name = item.publishData.name;
  }
  if (item.description !== undefined) {
    publishData.value.description = item.description;
  } else if (item.publishData?.description !== undefined) {
    publishData.value.description = item.publishData.description;
  }
  if (item.tags || item.publishData?.assembly?.tags) {
    publishData.value.assembly.tags = item.tags || item.publishData?.assembly?.tags || [];
  }
  if (item.visibility || item.publishData?.assembly?.visibility) {
    publishData.value.assembly.visibility = item.visibility || item.publishData?.assembly?.visibility || 'publicly';
  }
  if (item.attr || item.publishData?.assembly?.attr) {
    publishData.value.assembly.attr = {
      ...publishData.value.assembly.attr,
      ...(item.attr || item.publishData?.assembly?.attr)
    };
  }

  // 恢复子视图数据
  const refs = assemblyMainSubjectView.value?.refs;
  if (refs?.assembly) {
    refs.assembly
        .setSetting({
          assemblyUseVersion: publishData.value.assembly.attr?.assemblyUseVersion || AssemblyDataProcessing.nowVersion,
          isShowItemName: publishData.value.assembly.attr?.isShowItemName ?? true,
        })
        .onLoad(toRaw(assemblyData));
  }
  if (refs?.wheel && (item.wheel || item.wheel?.data)) {
    refs.wheel.onLoad(toRaw(item.wheel?.data || item.wheel));
  }
  if (refs?.warehouse && (item.warehouse || item.warehouse?.data)) {
    refs.warehouse.onLoad(toRaw(item.warehouse?.data || item.warehouse));
  }
  if (refs?.mastery && (item.mastery || item.mastery?.data)) {
    refs.mastery?.onLoad?.(toRaw(item.mastery?.data || item.mastery));
  }

  draftModel.value = false;
  runWorkshopVerify();
  noticeStore.success('草稿加载成功');
};

/**
 * 删除草稿
 */
const onDeleteDraft = (id: string) => {
  storageIntermediateTransfer.delete(id, {
    saveType: StorageIntermediateTransferSaveType.Draft,
    category: 'assembly'
  });
  getDraftListData();
};
</script>

<template>
  <v-overlay
      :model-value="assemblyLoading"
      transition
      scrim
      class="align-center justify-center background-flavor">
    <Loading size="120"></Loading>
  </v-overlay>

  <v-card height="250px">
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
          <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('assembly.workshop.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>
      </v-container>

      <v-container class="pa-5">
        <v-row no-gutters align="start">
          <v-col>
            <h1 class="text-amber">{{ !isEditModel ? t('basic.button.create') : t('basic.button.edit') }}</h1>
            <p class="opacity-60 mt-2">
              <template v-if="!isEditModel">{{ t('assembly.workshop.createTitle') }}</template>
              <template v-else>{{ t('assembly.workshop.editTitle') }} <u><b>{{ publishData.name || assemblyDetailData.name || 'none' }}</b></u></template>
            </p>
          </v-col>
          <v-col cols="auto">
            <div class="d-flex align-start ga-2">
              <v-btn-group class="mr-2">
                <v-btn @click="onQuickArchiving" :loading="draftSaveQuickArchivingLoading" v-if="!isEditModel" size="large">
                  <BtnWidget class="pl-2" :size="25" keyboard-shortcut="s" @action-complete="onQuickArchiving">
                    {{ t('assembly.workshop.quickSaveDraft') }}
                  </BtnWidget>
                </v-btn>
                <v-menu location="bottom right">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" v-if="!isEditModel">
                      <v-icon icon="mdi-dots-vertical"/>
                    </v-btn>
                  </template>
                  <v-list min-width="300">
                    <v-list-item>
                      <v-list-item-title @click="draftNewSaveModel = true">
                        {{ t('assembly.workshop.saveAsDraft') }}
                      </v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title @click="onPenDraftPanel">
                        {{ t('assembly.workshop.loadDraft') }}
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-btn-group>

              <v-tooltip location="left top"
                         content-class="pa-0"
                         :offset="[20, 0]"
                         :disabled="verificationWorkshop.verify.length <= 0">
                <template v-slot:activator="{props}">
                  <div v-bind="props" class="d-inline-flex ga-2 align-center">
                    <v-btn
                        :color="`var(--main-color)`"
                        :disabled="!isAssemblyByUser || verificationWorkshop.required > 0"
                        :loading="submitLoading"
                        @click="onSubmit"
                        size="large"
                        class="bg-amber d-flex align-center"
                        variant="tonal">

                      <v-icon
                          v-if="verificationWorkshop.verify.length <= 0 && verificationWorkshop.required <= 0"
                          class="text-blue mr-1"
                          icon="mdi-check-circle"
                          size="22">
                      </v-icon>

                      {{ isEditModel ? (t('basic.button.save') || t('basic.button.commit')) : t('basic.button.commit') }}

                      <p class="ml-2 text-red"  v-if="verificationWorkshop.required > 0">
                        <v-icon icon="mdi-alert-circle" size="22"></v-icon>
                        {{ verificationWorkshop.required }} 项必选未完成
                      </p>
                    </v-btn>
                  </div>
                </template>

                <v-card border min-width="300" class="overflow-hidden elevation-24">
                  <v-card-text v-if="requiredVerifyList.length > 0" class="bg-red-darken-4 text-white pa-3">
                    <div class="d-flex align-center mb-2 font-weight-bold">
                      <v-icon icon="mdi-alert-circle" size="18" class="mr-1"></v-icon>
                      <span>{{ t('assembly.workshop.missingRequiredFields') }} ({{ requiredVerifyList.length }})</span>
                    </div>
                    <ul class="pl-4 mb-0" style="font-size: 13px; line-height: 1.6;">
                      <li v-for="(v, vIndex) in requiredVerifyList" :key="'req-' + vIndex">
                        <span class="text-white font-weight-bold" v-html="getVerifyMessage(v)"></span>
                      </li>
                    </ul>
                  </v-card-text>

                  <v-card-text v-if="optionalVerifyList.length > 0" class="pa-3 bg-grey-darken-4 text-white">
                    <div class="d-flex align-center mb-2 text-amber font-weight-bold">
                      <v-icon icon="mdi-information-outline" size="16" class="mr-1"></v-icon>
                      <span>建议完善项 ({{ optionalVerifyList.length }})</span>
                    </div>
                    <ul class="pl-4 mb-0 opacity-80">
                      <li v-for="(v, vIndex) in optionalVerifyList" :key="'opt-' + vIndex">
                        <span v-html="getVerifyMessage(v)"></span>
                      </li>
                    </ul>
                  </v-card-text>
                </v-card>
              </v-tooltip>

              <v-btn size="large" @click="router.go(-1)" v-if="isEditModel">
                {{ t('basic.button.cancel') }}
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </v-card>

  <!-- 工坊 S -->
  <AssemblyMainSubjectView
      ref="assemblyMainSubjectView"
      class="mt-n2 ml-n5 mr-n5"
      @ready="onSubjectViewReady"
      @update:item-change="onWorkshopUpdateEvent"
      :readonly="false"
  ></AssemblyMainSubjectView>
  <!-- 工坊 E -->

  <!-- 配装发布与设置 S -->
  <v-container class="mt-4 mb-10" id="info">
    <v-form>
      <v-row>
        <v-col cols="12" lg="8" sm="12">
          <v-row>
            <v-col cols="12">
              <v-text-field
                  v-model="publishData.name"
                  :rules="formRules.name"
                  :label="t('basic.assembly.publish.name')"
                  size="l-large"
                  hide-details="auto"
                  :placeholder="t('basic.assembly.publish.namePlaceholder')"
                  variant="underlined">
              </v-text-field>
            </v-col>
            <v-col cols="12">
              <div class="mt-4 mb-3 font-weight-bold">{{ t('basic.assembly.publish.description') }}</div>

              <v-card :color="`hsl(from var(--main-color) h s calc(l * 0.01))`" border class="pl-3 pr-3">
                  <Textarea v-model="publishData.description"
                            :maxlength="10000"
                            class="mt-3 mb-2"
                            :placeholder="t('basic.assembly.publish.descriptionPlaceholder')"></Textarea>
                <template v-if="appStore.isDebug">
                  {{ publishData.description }}
                </template>
              </v-card>
            </v-col>
            <v-col cols="12">
              <v-divider class="my-4">{{ t('basic.assembly.publish.extra') }}</v-divider>
              <AssemblySettingWidget v-model="publishData" :is-show-delete="false"></AssemblySettingWidget>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" lg="4" sm="12">
          <div class="mb-5">
            <v-combobox
                v-model="publishData.assembly.tags"
                :counter="100"
                :hide-no-data="true"
                hide-details
                hide-selected
                :details="false"
                chips
                clearable
                item-title="label"
                item-value="value"
                :label="t('basic.assembly.publish.tags')"
                multiple
                :placeholder="t('basic.assembly.publish.tagsPlaceholder')"
                variant="underlined">
              <template v-slot:prepend v-if="publishData.assembly.tags <= 0">
                <v-icon>mdi-tag-multiple</v-icon>
              </template>
              <template v-slot:chip="{item}">
                <AssemblyTagChip color="var(--main-color)" :tag="item.raw" size="x-large"/>
              </template>
            </v-combobox>
          </div>

          <AssemblyTagsWidget
              v-model="publishData.assembly.tags"></AssemblyTagsWidget>
        </v-col>
      </v-row>
    </v-form>

    <AffixContainerView :offset-bottom="0">
      <v-divider class="my-5"></v-divider>
      <v-row align="center" justify="end" no-gutters>
        <v-btn v-if="isEditModel" class="mr-3" @click="router.go(-1)">
          {{ t('basic.button.cancel') }}
        </v-btn>
        <v-btn
            :color="`var(--main-color)`"
            :disabled="!isAssemblyByUser || verificationWorkshop.required > 0"
            :loading="submitLoading"
            class="text-black"
            variant="elevated"
            @click="onSubmit">
          {{ isEditModel ? (t('basic.button.save') || t('basic.button.commit')) : t('basic.button.commit') }}
        </v-btn>
      </v-row>
    </AffixContainerView>
  </v-container>
  <!-- 配装发布与设置 E -->

  <v-container class="pa-0">
    <v-dialog
        v-model="draftNewSaveModel">
      <v-card>
        <v-card-title>
          <v-row align="center" class="pa-2">
            {{ t('assembly.workshop.draft') }}
            <v-spacer></v-spacer>
            <v-btn @click="draftNewSaveModel = false" :elevation="0" icon="mdi-close"></v-btn>
          </v-row>
        </v-card-title>
        <v-card-item>
          <v-text-field :label="t('assembly.workshop.inputDraftName')"
                        v-model="newDraftName"></v-text-field>
        </v-card-item>
        <v-card-actions>
          <v-btn :loading="draftSaveLoading" @click="onSaveDraft">
            {{ t('basic.button.submit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="draftModel">
      <v-card>
        <v-card-title>
          <v-row align="center" class="pa-2">
            {{ t('assembly.workshop.draft') }}
            <v-spacer></v-spacer>
            <v-btn @click="draftModel = false" :elevation="0" icon="mdi-close"></v-btn>
          </v-row>
        </v-card-title>
        <v-card-item>
          <v-list density="compact" v-if="draftList.length > 0">
            <v-list-item slim density="compact" v-for="(i, index) in draftList" :key="index">
              <v-list-item-title>
                <v-row no-gutters>
                  <v-col>
                    <template v-if="i.id == 'quickArchiving'">
                      {{ t('assembly.workshop.quickArchiving') }}
                    </template>
                    <template v-else>
                      {{ i.name || 'none' }}
                    </template>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn @click="onUseDraft(i)" variant="tonal" class="mr-2">
                      {{ t('basic.button.use') }}
                    </v-btn>
                    <v-btn icon density="compact" @click="onDeleteDraft(i.id)">
                      <v-icon icon="mdi-delete"></v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-list-item-title>
              <v-list-item-subtitle>
                <p class="opacity-40" v-if="i.id != 'quickArchiving'">{{ i.id }}</p>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <EmptyView v-else></EmptyView>
        </v-card-item>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped lang="less">
</style>
