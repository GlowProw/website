<script setup lang="ts">
import {computed, type Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Items} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";

import {StorageIntermediateTransferSaveType} from "@/assets/sripts/storage_assembly";
import {storageIntermediateTransfer} from "@/assets/sripts/index";

import Silk from "@/components/Silk.vue";
import RankingDesignedView from "@/components/RankingDesignedView.vue";
import ZoomableCanvas from "@/components/ZoomableCanvas.vue";

const {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    {mobile} = useDisplay(),
    items = Items

let
    shareData: Ref<any> = ref({
      ranking: {},
    }),

    workshopHeight = 700,

    rankingDesignedView = ref<any>(null),
    // 是否编辑模式
    isEditModel = computed(() => {
      switch (route.name) {
        case 'EditRankingDesignedItems':
          return true
        default:
        case 'PublishRankingDesignedItems':
          return false
      }
    }),
    isWorkshopFillScreen = ref(false),
    isAssemblyByUser = computed(() => isEditModel.value),
    assemblyDetailData = ref<any>({})

/**
 * 已发布数据
 */
const onSaveRankingDesignedPublish = () => {
  if (!isAssemblyByUser)
    return;

  const saveResult = onSaveAssembly(StorageIntermediateTransferSaveType.Data)

  if (saveResult.code == 0)
    router.push(`/ranking-designed-items/publish/${saveResult.uid}`)
}

/**
 * 写入本地
 */
const onSaveAssembly = (saveType: StorageIntermediateTransferSaveType, uid?: string) => {
  // 合并数据
  shareData.value = {
    ...shareData.value,
    ranking: rankingDesignedView.value.onExport(),
  }

  return storageIntermediateTransfer.update(shareData.value, {
    uid,
    saveType,
    category: 'ranking'
  })
}
</script>

<template>
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
          <v-breadcrumbs-item to="/ranking-designed-items">{{ t('rankingDesignedItems.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('rankingDesignedItems.workshop.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>
      </v-container>

      <v-container class="pa-7">
        <v-row no-gutters align="start">
          <v-col>
            <h1 class="text-amber">{{ !isEditModel ? t('basic.button.create') : t('basic.button.edit') }}</h1>
            <p class="opacity-80 mt-5">
              <template v-if="!isEditModel">{{ t('rankingDesignedItems.workshop.createTitle') }}</template>
              <template v-else>{{ t('rankingDesignedItems.workshop.editTitle') }} <u><b>{{ assemblyDetailData.name || 'none' }}</b></u></template>
            </p>
          </v-col>
          <v-col cols="auto">
            <v-btn class="mr-2" @click="router.go(-1)" v-if="isEditModel">
              {{ t('basic.button.cancel') }}
            </v-btn>
            <v-btn :color="`var(--main-color)`" @click="onSaveRankingDesignedPublish" v-if="!isEditModel">
              {{ t('basic.button.next') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </v-card>

  <!-- 工坊 开始 -->
  <ZoomableCanvas
      ref="zoomableAreaRef"
      :style="isWorkshopFillScreen ? 'height: calc(100vh)' : `height: ${mobile ? 300 : workshopHeight}px`"
      :min-scale="mobile ? .1 : .8"
      :max-scale="1.4"
      :default-scale="mobile ? .4 : 1"
      :is-show-tool="true"
      :boundary="mobile ? {
                left: -100,
                right: 100,
                top: -100,
                bottom: 100
              } : {
                left: -1500,
                right: 1500,
                top: -500,
                bottom: 500
              }">
    <RankingDesignedView ref="rankingDesignedView" :readonly="false"></RankingDesignedView>
  </ZoomableCanvas>
  <!-- 工坊 结束 -->

</template>

<style scoped lang="less">
</style>
