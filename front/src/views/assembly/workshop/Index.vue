<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, nextTick, onMounted, type Ref, ref, toRaw, watch} from "vue";
import {useRoute, useRouter} from "vue-router";

import {api, storageAssembly} from "@/assets/sripts";

import ZoomableCanvas from "@/components/ZoomableCanvas.vue"
import AssemblyShowWidget from "@/components/AssemblyShowWidget.vue";
import {StorageAssemblyType} from "@/assets/sripts/storage_assembly";
import {v6 as uuidv6} from "uuid";
import {useAuthStore} from "@/../stores";
import EmptyView from "@/components/EmptyView.vue";
import Silk from "@/components/Silk.vue";
import Loading from "@/components/Loading.vue";
import {useHttpToken} from "@/assets/sripts/httpUtil";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import AssemblyDataProcessing from "@/assets/sripts/assemblyDataProcessing";

const {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    httpToken = useHttpToken(),
    authStore = useAuthStore()

let
    messages: Ref<string[]> = ref([]),

    assemblyLoading = ref(false),
    assemblyDetailData = ref({}),
    assemblyWorkshopRef = ref(null),                      // 配装工作区
    assemblyWorkshopZoomableAreaRef = ref(null),          // 配装缩放

    isSharePreview = ref(false),                          // 是否处于分享预览
    isWorkshopFillScreen = ref(false),
    draftModel = ref(false),
    draftNewSaveModel = ref(false),
    newDraftName = ref(''),
    draftList: Ref<[]> = ref([]),
    draftSaveQuickArchivingLoading = ref(false),
    draftSaveLoading = ref(false),
    workshopHeight = ref(700),
    shareData: Ref<any> = ref({
      name: '',
      description: ''
    })                                                          // 分享数据，包含配置集和分享数据

let isEditModel = computed(() => {
      switch (route.name) {
        case 'AssemblyEdit':
          return true
        default:
        case 'AssemblyWorkshop':
          return false
      }
    }),
    isAssemblyByUser = computed(() => isEditModel.value ? shareData.value.isOwner : true),
    verificationAssembly = computed(() => {
      if (assemblyWorkshopRef.value && assemblyDetailData.value)
        return assemblyWorkshopRef.value.verify()

      return null
    })

watch(() => route, async () => {
  await loadAssemblyData()
})

onMounted(() => {
  if (isEditModel.value)
    getAssemblyDetail()
})

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

    await loadAssemblyData()
  } finally {
    assemblyLoading.value = false;
  }
}

const loadAssemblyData = async () => {
  let assemblyData = assemblyDetailData.value

  await nextTick(() => {
    assemblyWorkshopRef.value
        .setSetting({
          isShowItemName: assemblyData.attr.isShowItemName,
          assemblyUseVersion: assemblyData.attr.assemblyUseVersion
        })
        .onLoad(assemblyData.assembly)
  })
}

/**
 * 编辑保存
 */
const onSaveAssemblyEdit = () => {
  if (!isAssemblyByUser)
    return;

  const {uuid} = assemblyDetailData.value;
  const saveResult = onSaveAssembly(StorageAssemblyType.Data, uuid)

  if (saveResult.code == 0 && uuid)
    router.push(`/assembly/edit/${uuid}`)
}

/**
 * 已发布数据
 */
const onSaveAssemblyPublish = () => {
  if (!isAssemblyByUser)
    return;

  const saveResult = onSaveAssembly(StorageAssemblyType.Data)

  if (saveResult.code == 0)
    router.push(`/assembly/publish/${saveResult.uid}`)
}

/**
 * 写入本地
 */
const onSaveAssembly = (type: StorageAssemblyType, uid?: string) => {
  const now = Date.now();

  // 合并数据
  shareData.value = {
    ...shareData.value,
    data: assemblyWorkshopRef.value.onExport(),
    localCreationTime: now,
    localUpdateTime: now,
  }

  return storageAssembly.updata(shareData.value, type, uid)
}

/**
 * 快速存档
 */
const onQuickArchiving = () => {
  draftSaveQuickArchivingLoading.value = true;

  storageAssembly.updata({
    ...shareData.value,
    data: assemblyWorkshopRef.value.onExport()
  }, StorageAssemblyType.Draft, 'quickArchiving')

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
  let d = storageAssembly.gets(StorageAssemblyType.Draft);

  if (d.code == 0)
    draftList.value = d.data;
}

const onSaveDraft = () => {
  let uid: string = uuidv6(),
      newDraftData = shareData.value

  newDraftData.name = newDraftName.value;

  draftSaveLoading.value = true
  storageAssembly.updata(newDraftData, StorageAssemblyType.Draft, uid)
  draftSaveLoading.value = false

  draftNewSaveModel.value = false

  messages.value.push('保存草稿成功')
}

/**
 * 重制画布位置
 */
const onWorkshopPos = () => {
  if (assemblyWorkshopZoomableAreaRef)
    assemblyWorkshopZoomableAreaRef.value.centerCanvas()
}

/**
 * 使用快速草稿
 * @param data
 */
const onUseDraft = (data) => {
  assemblyWorkshopRef.value
      .setSetting({
        assemblyUseVersion: AssemblyDataProcessing.nowVersion,
        isShowItemName: false,
      })
      .onLoad(toRaw(data))
  draftModel.value = false
}

/**
 * 删除草稿
 * @param id
 */
const onDeleteDraft = (id) => {
  storageAssembly.delete(id, StorageAssemblyType.Draft)
  getDraftListData()
}

const onWorkshopFullScreen = () => {
  isWorkshopFillScreen.value = !isWorkshopFillScreen.value;
}

const onWorkshopDelete = () => {
  assemblyWorkshopRef.value.onErasure();
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
        <v-breadcrumbs class="pa-2">
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
            <v-tooltip location="bottom right" content-class="pa-0" :offset="[20, 0]" :disabled="verificationAssembly && verificationAssembly.verify <= 0">
              <template v-slot:activator="{props}">
                <span v-bind="props">
                  <v-btn :color="`var(--main-color)`" :disabled="!isAssemblyByUser || verificationAssembly && verificationAssembly.required >  0" @click="onSaveAssemblyPublish" v-if="!isEditModel">
                    下一步
                  </v-btn>
                  <v-btn :color="`var(--main-color)`" :disabled="!isAssemblyByUser || verificationAssembly && verificationAssembly.required > 0" @click="onSaveAssemblyEdit" v-if="isEditModel">
                    下一步
                  </v-btn>

                  <v-icon class="ml-2" icon="mdi-alert-circle-outline" color="red" v-if="verificationAssembly && verificationAssembly.required > 0"></v-icon>
                  <v-icon class="ml-2 text-green" icon="mdi-check" v-if="verificationAssembly && verificationAssembly.verify <= 0"></v-icon>
                </span>
              </template>

              <v-card width="100%">
                <v-alert type="warning">
                  <template v-if="verificationAssembly && verificationAssembly.required > 0">
                    <p class="mb-3 font-weight-bold">配装似乎缺少必要选项，请船长添加必要内容</p>
                  </template>
                  <p>配装似乎缺少一些内容:</p>
                  <ul v-if="verificationAssembly">
                    <li v-for="(v, vIndex) in verificationAssembly.verify" :key="vIndex">
                      - {{ t(`assembly.workshop.verifyTips.${v.message}`) }}
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
  <div class="mt-n5 ml-n5 mr-n5" style="z-index: 10" :class="[isWorkshopFillScreen ? 'fill-screen bg-black' : 'position-relative mb-n2']" v-show="!isSharePreview">
    <v-card class="w-100 pa-0 card-enlargement-flavor workshop-ship">
      <ZoomableCanvas
          style="animation: all 1s"
          ref="assemblyWorkshopZoomableAreaRef"
          :style="isWorkshopFillScreen ? 'height: calc(100vh - 50px)' : `height: ${workshopHeight}px`"
          :minScale=".8"
          :max-scale="1.2"
          :boundary="{
                left: -1500,
                right: 1500,
                top: -500,
                bottom: 500
              }">
        <AssemblyShowWidget ref="assemblyWorkshopRef"></AssemblyShowWidget>
      </ZoomableCanvas>
    </v-card>
  </div>
  <div class="position-fixed left-0 bottom-0 right-0 bg-black" style="z-index: 11">
    <v-divider></v-divider>
    <v-container>
      <v-row justify="center">
        <v-col cols="auto">
          <v-btn density="comfortable"
                 @click="onWorkshopPos"
                 icon="mdi-restore"></v-btn>

        </v-col>
        <v-col cols="auto" class="ml-4 mr-3">
          <v-btn @click="workshopHeight <= 1000 ? workshopHeight += 100 : null" density="comfortable" icon>
            <v-icon icon="mdi-arrow-expand-vertical"></v-icon>
          </v-btn>
          <v-btn density="comfortable"
                 class="ml-1 mr-1"
                 @click="onWorkshopFullScreen"
                 :icon="`mdi-${!isWorkshopFillScreen ? 'fullscreen' : 'fullscreen-exit'}`"></v-btn>
          <v-btn @click="workshopHeight >= 400 ? workshopHeight -= 100 : null" density="comfortable" icon>
            <v-icon icon="mdi-arrow-collapse-vertical"></v-icon>
          </v-btn>
        </v-col>
        <v-col cols="auto">
          <v-btn density="comfortable"
                 @click="onWorkshopDelete"
                 icon="mdi-delete"></v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
  <!-- Workshop E -->

  <v-dialog
      :width="600"
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
      max-width="600"
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
                  <v-btn @click="onUseDraft(i.data)" variant="tonal" class="mr-2">
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

  <v-snackbar-queue v-model="messages"></v-snackbar-queue>
</template>

<style scoped lang="less">
.assembly-variable-gradient {
  --gradient-start: rgba(0, 0, 0, 0);
  --gradient-end: #000000;

  background: linear-gradient(to right, var(--gradient-start), var(--gradient-end), var(--gradient-end));
}

.fill-screen {
  position: fixed;
  z-index: 10;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
}
</style>
