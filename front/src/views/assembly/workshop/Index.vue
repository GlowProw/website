<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, nextTick, onMounted, type Ref, ref, toRaw, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {v6 as uuidv6} from "uuid";

import {api, storageIntermediateTransfer} from "@/assets/sripts";
import {StorageIntermediateTransferSaveType} from "@/assets/sripts/storage_assembly";
import {useAuthStore} from "~/stores/userAccountStore";
import {useHttpToken} from "@/assets/sripts/http_util";
import {useNoticeStore} from "~/stores/noticeStore";

import EmptyView from "@/components/EmptyView.vue";
import Silk from "@/components/Silk.vue";
import Loading from "@/components/Loading.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import AssemblyDataProcessing from "@/assets/sripts/assembly_data_processing";
import AssemblyMainSubjectView from "@/components/AssemblyMainSubjectView.vue";

const {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    httpToken = useHttpToken(),
    authStore = useAuthStore(),
    noticeStore = useNoticeStore()

let
    assemblyLoading = ref(false),
    assemblyDetailData = ref({}),
    assemblyMainSubjectView: Ref<AssemblyMainSubjectView> = ref(null),

    draftModel = ref(false),
    draftNewSaveModel = ref(false),
    newDraftName = ref(''),
    draftList: Ref<[]> = ref([]),
    draftSaveQuickArchivingLoading = ref(false),
    draftSaveLoading = ref(false),
    shareData: Ref<any> = ref({
      assembly: {},
      warehouse: {},
      wheel: {}
    }),

    verificationWorkshop = ref({
      required: 0,
      verify: []
    }),

    isEditModel = computed(() => {
      switch (route.name) {
        case 'AssemblyEdit':
          return true
        default:
        case 'AssemblyWorkshop':
          return false
      }
    }),
    isAssemblyByUser = computed(() => isEditModel.value ? shareData.value.isOwner : true)


watch(() => shareData.value, async () => {
  await loadAssemblyData()
})

onMounted(() => {
  if (isEditModel.value)
    getAssemblyDetail()
})

/**
 * 工作台更新事件
 * 变动检查
 */
const onWorkshopUpdateEvent = (componentName: string) => {
  let verification = {
    required: 0,
    verify: []
  };

  const refs = assemblyMainSubjectView.value?.refs;
  if (!refs) {
    return verification;
  }

  // 执行验证逻辑
  const component = refs[componentName];
  if (component && typeof component.verify === 'function') {
    const componentVerify = component.verify();
    if (componentVerify) {
      verification.verify.push(...componentVerify.verify);
      verification.required += componentVerify.required;
    }
  }

  verificationWorkshop.value.required = verification.required;
  verificationWorkshop.value.verify = verification.verify;
}

/**
 * 获取配装详情
 */
const getAssemblyDetail = async () => {
  try {
    const {uid} = route.params;
    assemblyLoading.value = true;
    const result = await httpToken.get(api['assembly_item'], {
          params: {
            uuid: uid,
          },
        }),
        d = result.data;

    if (d.error == 1)
      return;

    assemblyDetailData.value = d.data;
    shareData.value = d.data;
  } finally {
    assemblyLoading.value = false;
  }
}

const loadAssemblyData = () => {
  const d = shareData.value

  assemblyMainSubjectView.value.refs.assembly
      .setSetting({
        isShowItemName: d.assembly?.attr?.isShowItemName || true,
        assemblyUseVersion: d.assembly?.attr?.assemblyUseVersion,
        isFullName: d.assembly?.attr?.isFullName
      })
      .onLoad(d.assembly.data)

  assemblyMainSubjectView.value.refs.wheel
      .setSetting({
        isShowItemName: d.wheel?.attr?.isShowItemName,
        assemblyUseVersion: d.wheel?.attr?.assemblyUseVersion
      })
      .onLoad(d.wheel.data)

  assemblyMainSubjectView.value.refs.warehouse
      .setSetting({
        isShowItemName: d.warehouse?.attr?.isShowItemName,
        assemblyUseVersion: d.warehouse?.attr?.assemblyUseVersion
      })
      .onLoad(d.warehouse.data)
}

/**
 * 编辑保存
 */
const onSaveAssemblyEdit = () => {
  if (!isAssemblyByUser)
    return;

  const {uuid} = assemblyDetailData.value;
  const saveResult = onSaveAssembly(StorageIntermediateTransferSaveType.Data, uuid)

  if (saveResult.code == 0 && uuid)
    router.push(`/assembly/edit/${uuid}`)
}

/**
 * 已发布数据
 */
const onSaveAssemblyPublish = () => {
  if (!isAssemblyByUser)
    return;

  const saveResult = onSaveAssembly(StorageIntermediateTransferSaveType.Data)

  if (saveResult.code == 0)
    router.push(`/assembly/publish/${saveResult.uid}`)
}

/**
 * 写入本地
 */
const onSaveAssembly = (saveType: StorageIntermediateTransferSaveType, uid?: string) => {
  // 合并数据
  shareData.value = {
    ...shareData.value,
    assembly: assemblyMainSubjectView.value.refs.assembly.onExport(),
    wheel: assemblyMainSubjectView.value.refs.wheel.onExport(),
    warehouse: assemblyMainSubjectView.value.refs.warehouse.onExport()
  }

  return storageIntermediateTransfer.update(shareData.value, {
    uid,
    saveType,
    category: 'assembly'
  })
}

/**
 * 快速存档
 */
const onQuickArchiving = () => {
  draftSaveQuickArchivingLoading.value = true;

  storageIntermediateTransfer.update({
    ...shareData.value,
    assembly: assemblyMainSubjectView.value.refs.assembly.onExport(),
    wheel: assemblyMainSubjectView.value.refs.wheel.onExport(),
    warehouse: assemblyMainSubjectView.value.refs.warehouse.onExport()
  }, {
    uid: 'quickArchiving',
    saveType: StorageIntermediateTransferSaveType.Draft,
    category: 'assembly'
  })

  setTimeout(() => {
    draftSaveQuickArchivingLoading.value = false;
  }, 500)
}

/**
 * 打开草稿面包
 */
const onPenDraftPanel = () => {
  draftModel.value = true;

  getDraftListData()
}

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
}

const onSaveDraft = () => {
  let uid: string = uuidv6(),
      newDraftData = shareData.value

  newDraftData.name = newDraftName.value;

  draftSaveLoading.value = true

  storageIntermediateTransfer.update(newDraftData, {
    uid,
    saveType: StorageIntermediateTransferSaveType.Draft,
    category: 'assembly'
  })

  draftSaveLoading.value = false
  draftNewSaveModel.value = false

  noticeStore.success('保存草稿成功')
}

/**
 * 使用快速草稿
 * @param data
 */
const onUseDraft = (item) => {
  const assemblyData = item.assembly
  if (!assemblyData && Object.keys(assemblyData).length == 0) {
    return noticeStore.error('draft data null')
  }

  assemblyMainSubjectView.value.refs.assembly
      .setSetting({
        assemblyUseVersion: AssemblyDataProcessing.nowVersion,
        isShowItemName: false,
      })
      .onLoad(toRaw(assemblyData))
  draftModel.value = false
}

/**
 * 删除草稿
 * @param id
 */
const onDeleteDraft = (id) => {
  storageIntermediateTransfer.delete(id, {
    saveType: StorageIntermediateTransferSaveType.Draft,
    category: 'assembly'
  })
  getDraftListData()
}
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

      <v-container class="pa-7">
        <v-row no-gutters align="start">
          <v-col>
            <h1 class="text-amber">{{ !isEditModel ? '创建' : '编辑' }}</h1>
            <p class="opacity-80 mt-5">
              <template v-if="!isEditModel">创建配置</template>
              <template v-else>编辑配装 <u><b>{{ assemblyDetailData.name || 'none' }}</b></u></template>
            </p>
          </v-col>
          <v-col cols="auto">
            <v-btn-group density="compact" class="mr-2">
              <v-btn @click="onQuickArchiving" :loading="draftSaveQuickArchivingLoading" v-if="!isEditModel">
                <BtnWidget class="pl-2" :size="25" keyboard-shortcut="s" @action-complete="onQuickArchiving">
                  快速保存草稿
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
                      另存草稿
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title @click="onPenDraftPanel">
                      加载草稿
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-btn-group>
            <v-btn class="mr-2" @click="router.go(-1)" v-if="isEditModel">
              取消
            </v-btn>
            <v-tooltip location="left top" content-class="pa-0" :offset="[20, 0]" :disabled="verificationWorkshop && verificationWorkshop.verify <= 0">
              <template v-slot:activator="{props}">
                <span v-bind="props">
                  <v-btn :color="`var(--main-color)`" :disabled="!isAssemblyByUser || verificationWorkshop && verificationWorkshop.required >  0" @click="onSaveAssemblyPublish" v-if="!isEditModel">
                    下一步
                  </v-btn>
                  <v-btn :color="`var(--main-color)`" :disabled="!isAssemblyByUser || verificationWorkshop && verificationWorkshop.required > 0" @click="onSaveAssemblyEdit" v-if="isEditModel">
                    下一步
                  </v-btn>

                  <v-icon class="ml-2" icon="mdi-alert-circle-outline" color="red" v-if="verificationWorkshop && verificationWorkshop.required > 0"></v-icon>
                  <v-icon class="ml-2 text-green" icon="mdi-check" v-if="verificationWorkshop && verificationWorkshop.verify <= 0"></v-icon>
                </span>
              </template>

              <v-card width="100%">
                <v-alert type="warning">
                  <template v-if="verificationWorkshop && verificationWorkshop.required > 0">
                    <p class="mb-3 font-weight-bold">配装似乎缺少必要选项，请船长添加必要内容</p>
                  </template>
                  <ul v-if="verificationWorkshop">
                    <li v-for="(v, vIndex) in verificationWorkshop.verify" :key="vIndex">
                      <span v-html="`- ${t(`assembly.workshop.verifyTips.${v.message}`)}`"></span>
                    </li>
                  </ul>
                </v-alert>
              </v-card>

            </v-tooltip>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </v-card>

  <!-- Workshop S -->
  <AssemblyMainSubjectView
      ref="assemblyMainSubjectView"
      class="mt-n2 ml-n5 mr-n5"
      @ready="loadAssemblyData"
      @update:item-change="onWorkshopUpdateEvent"
      :readonly="false"
      :isShowFooterTool="true"
  ></AssemblyMainSubjectView>
  <!-- Workshop E -->

  <v-container class="pa-0">
    <v-dialog
        v-model="draftNewSaveModel">
      <v-card>
        <v-card-title>
          <v-row align="center" class="pa-2">
            草稿
            <v-spacer></v-spacer>
            <v-btn @click="draftNewSaveModel = false" :elevation="0" icon="mdi-close"></v-btn>
          </v-row>
        </v-card-title>
        <v-card-item>
          <v-text-field label="输入另存为草稿名称"
                        v-model="newDraftName"></v-text-field>
        </v-card-item>
        <v-card-actions>
          <v-btn :loading="draftSaveLoading" @click="onSaveDraft">
            {{ t('basic.button.submit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
        v-model="draftModel">
      <v-card>
        <v-card-title>
          <v-row align="center" class="pa-2">
            草稿
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
                      快速储存草稿
                    </template>
                    <template v-else>
                      {{ i.name || 'none' }}
                    </template>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn @click="onUseDraft(i)" variant="tonal" class="mr-2">
                      使用
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
