<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, nextTick, onMounted, type Ref, ref} from "vue";
import {useRoute, useRouter} from "vue-router";

import {api, http, storageAssembly} from "../../../assets/sripts";

import ZoomableCanvas from "../../../components/ZoomableCanvas.vue"
import AssemblyShowWidget from "../../../components/AssemblyShowWidget.vue";
import {StorageAssemblyType} from "../../../assets/sripts/storage_assembly";
import {v6 as uuidv6} from "uuid";
import {useHttpToken} from "../../../assets/sripts/httpUtil";
import {useAuthStore} from "../../../../stores";

const {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    httpToken = useHttpToken(),
    authStore = useAuthStore()

let
    messages: Ref<string[]> = ref([]),

    assemblyDetailData = ref({}),
    assemblyWorkshopRef = ref(null),                      // 配装工作区
    assemblyWorkshopZoomableAreaRef = ref(null),          // 配装缩放

    isSharePreview = ref(false),                          // 是否处于分享预览
    isWorkshopFillScreen = ref(false),
    shareData: Ref<any> = ref({
      name: '',
      description: ''
    })                                // 分享数据，包含配置集和分享数据


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
 * 保存草稿
 */
const onSaveAssemblyDraft = () => {
  if (!isAssemblyByUser)
    return;

  let uid: string = uuidv6();

  onSaveAssembly(StorageAssemblyType.Draft, uid)

  messages.value.push('保存草稿成功')
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
 * 重制画布位置
 */
const onWorkshopPos = () => {
  if (assemblyWorkshopZoomableAreaRef)
    assemblyWorkshopZoomableAreaRef.value.centerCanvas()
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
    <v-row align="end">
      <v-col>
        <h1>{{ !isEditModel ? '创建' : '编辑' }}</h1>
        <p class="opacity-80">
          <template v-if="!isEditModel">创建配置</template>
          <template v-else>编辑配装 <u><b>{{ assemblyDetailData.name || 'none' }}</b></u></template>
        </p>
      </v-col>
      <v-col cols="auto">
        <v-btn class="mr-2" v-if="!isEditModel">
          加载草稿
        </v-btn>
        <v-btn class="mr-2" @click="onSaveAssemblyDraft" v-if="!isEditModel">
          保存草稿
        </v-btn>
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
        <v-card class="w-100 card-flavor workshop-ship">
          <ZoomableCanvas
              ref="assemblyWorkshopZoomableAreaRef"
              :style="isWorkshopFillScreen ? 'height: calc(100vh - 100px)' : 'height: 500px'"
              :minScale=".8"
              :max-scale="1.2"
              :boundary="{
                left: -1500,
                right: 1500,
                top: -500,
                bottom: 500
              }">
            <v-container>
              <AssemblyShowWidget ref="assemblyWorkshopRef"></AssemblyShowWidget>
            </v-container>
          </ZoomableCanvas>
          <v-divider></v-divider>
          <v-container>
            <v-row justify="center">
              <v-col cols="auto">
                <v-btn density="comfortable"
                       @click="onWorkshopPos"
                       icon="mdi-restore"></v-btn>

              </v-col>
              <v-col cols="auto">
                <v-btn density="comfortable"
                       @click="onWorkshopFullScreen"
                       :icon="`mdi-${!isWorkshopFillScreen ? 'fullscreen' : 'fullscreen-exit'}`"></v-btn>
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
