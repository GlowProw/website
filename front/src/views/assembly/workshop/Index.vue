<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {onMounted, type Ref, ref} from "vue";
import {useRoute, useRouter} from "vue-router";

import {storageAssembly} from "../../../assets/sripts";

import ZoomableCanvas from "../../../components/ZoomableCanvas.vue"
import AssemblyShowWidget from "../../../components/AssemblyShowWidget.vue";
import {StorageAssemblyType} from "../../../assets/sripts/storage_assembly";
import {v6 as uuidv6} from "uuid";

const {t} = useI18n(),
    route = useRoute(),
    router = useRouter()

let
    messages: Ref<string[]> = ref([]),

    assemblyWorkshopData = ref({}),
    assemblyWorkshopRef = ref(null),                      // 配装工作区
    assemblyWorkshopZoomableAreaRef = ref(null),          // 配装缩放
    assemblyWorkshopShareRef = ref(null),                 // 配装分享配装展示，只读
    assemblyShareShowImage = ref(null),                   // 配装分享配装内图片展示，可自定义背景

    isSharePreview = ref(false),                          // 是否处于分享预览
    shareData: Ref<any> = ref({
      name: '',
      description: ''
    })                                // 分享数据，包含配置集和分享数据

onMounted(() => {
})


/**
 * 保存草稿
 */
const onSaveAssemblyDraft = () => {
  let uid: string = uuidv6();

  onSaveAssembly(StorageAssemblyType.Draft, uid)

  messages.value.push('保存草稿成功')
}

/**
 * 已发布数据
 */
const onSaveAssemblyPublish = () => {
  const saveResult = onSaveAssembly(StorageAssemblyType.Data)

  console.log(saveResult)
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
    ...{
      opinion: {
        // 'background-src': '',
        // 'background-image-position': assemblyShareShowImage.value.position
      }
    }
  }

  const updata = storageAssembly.updata(shareData.value, type, uid);

  return updata
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
    <v-row>
      <v-col>
        <h1>{{ isSharePreview ? '预览' : '编辑' }}</h1>
        <p class="opacity-80" v-if="!isSharePreview">创建配置</p>
      </v-col>
      <v-col cols="auto">
        <v-btn-group>
          <v-btn @click="onSaveAssemblyDraft">
            保存草稿
          </v-btn>
          <v-btn :color="`var(--main-color)`" @click="onSaveAssemblyPublish">
            创建
          </v-btn>
        </v-btn-group>
      </v-col>
    </v-row>
  </v-container>

  <!-- Workshop S -->
  <div max-width="100%" v-show="!isSharePreview">
    <v-row class="mt-1 mb-5">
      <v-col cols="12">
        <v-card class="w-100 card-flavor workshop-ship">
          <ZoomableCanvas
              ref="assemblyWorkshopZoomableAreaRef"
              style="height: 500px"
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
                       @click="() => assemblyWorkshopRef.value.centerCanvas()"
                       icon="mdi-restore"></v-btn>
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
</style>
