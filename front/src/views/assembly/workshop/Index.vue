<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, nextTick, onMounted, type Ref, ref, toRaw} from "vue";
import {useRoute, useRouter} from "vue-router";

import {api, http, storageAssembly} from "../../../assets/sripts";

import ZoomableCanvas from "../../../components/ZoomableCanvas.vue"
import AssemblyShowWidget from "../../../components/AssemblyShowWidget.vue";
import {StorageAssemblyType} from "../../../assets/sripts/storage_assembly";
import {v6 as uuidv6} from "uuid";
import {useAuthStore} from "../../../../stores";
import EmptyView from "../../../components/EmptyView.vue";

const {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    authStore = useAuthStore()

let
    messages: Ref<string[]> = ref([]),

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
    workshopHeight = ref(500),
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
    isAssemblyByUser = computed(() => isEditModel.value ? authStore.user.userId == shareData.value.userId : true)

onMounted(() => {
  if (isEditModel.value)
    getAssemblyDetail()
})

/**
 * 获取配装详情
 */
const getAssemblyDetail = async () => {
  const {uid} = route.params;

  const result = await http.get(api['assembly_item'], {
        params: {
          uuid: uid,
        },
      }),
      d = result.data;

  if (d.error == 1)
    return;

  assemblyDetailData.value = d.data;
  shareData.value = d.data;

  await nextTick(() => {
    assemblyWorkshopRef.value.onLoadJson(d.data.assembly)
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
    data: assemblyWorkshopRef.value.onExpostJson(),
    localCreationTime: now,
    localUpdateTime: now,
  }

  const updata = storageAssembly.updata(shareData.value, type, uid);

  return updata
}

/**
 * 快速存档
 */
const onQuickArchiving = () => {
  draftSaveQuickArchivingLoading.value = true;

  storageAssembly.updata({
    ...shareData.value,
    data: assemblyWorkshopRef.value.onExpostJson()
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
  assemblyWorkshopRef.value.onLoadJson(toRaw(data))
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
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('assembly.workshop.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container>
    <v-row align="start">
      <v-col>
        <h1>{{ !isEditModel ? '创建' : '编辑' }}</h1>
        <p class="opacity-80">
          <template v-if="!isEditModel">创建配置</template>
          <template v-else>编辑配装 <u><b>{{ assemblyDetailData.name || 'none' }}</b></u></template>
        </p>
      </v-col>
      <v-col cols="auto">
        <v-btn-group density="compact" class="mr-2">
          <v-btn @click="onQuickArchiving" :loading="draftSaveQuickArchivingLoading" v-if="!isEditModel">
            快速保存草稿
          </v-btn>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" v-if="!isEditModel">
                <v-icon icon="mdi-dots-vertical"/>
              </v-btn>
            </template>
            <v-list>
              <v-list-item>
                <v-list-item-title @click="draftNewSaveModel = true">另存草稿</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <v-list-item-title @click="onPenDraftPanel">加载草稿</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-btn-group>
        <v-btn :color="`var(--main-color)`" :disabled="!isAssemblyByUser" @click="onSaveAssemblyPublish" v-if="!isEditModel">
          下一步
        </v-btn>
        <v-btn :color="`var(--main-color)`" :disabled="!isAssemblyByUser" @click="onSaveAssemblyEdit" v-if="isEditModel">
          下一步
        </v-btn>
      </v-col>
    </v-row>
  </v-container>

  <!-- Workshop S -->
  <div max-width="100%" :class="[isWorkshopFillScreen ? 'fill-screen' : '']" v-show="!isSharePreview">
    <v-row class="mt-1 mb-5">
      <v-col cols="12">
        <v-card class="w-100 card-enlargement-flavor workshop-ship">
          <ZoomableCanvas
              style="animation: all 1s"
              ref="assemblyWorkshopZoomableAreaRef"
              :style="isWorkshopFillScreen ? 'height: calc(100vh - 100px)' : `height: ${workshopHeight}px`"
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
          <v-divider></v-divider>
          <v-container>
            <v-row justify="center">
              <v-col cols="auto">
                <v-btn density="comfortable"
                       @click="onWorkshopPos"
                       icon="mdi-restore"></v-btn>

              </v-col>
              <v-col cols="auto" class="ml-4 mr-3">
                <v-btn @click="workshopHeight <= 600 ? workshopHeight += 100 : null" density="comfortable" icon>
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
        </v-card>
      </v-col>
    </v-row>
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
          确定
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
  z-index: 100;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
}
</style>

<style>
.introjs-tooltipbuttons {
  border: none;
}
</style>
