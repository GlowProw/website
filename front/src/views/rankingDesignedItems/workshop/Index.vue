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

    rankingDesignedView = ref(null),
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
    isAssemblyByUser = computed(() => isEditModel.value)

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
            <h1 class="text-amber">{{ !isEditModel ? '创建' : '编辑' }}</h1>
            <p class="opacity-80 mt-5">
              <template v-if="!isEditModel">创建自定义排名</template>
              <template v-else>编辑自定义排名 <u><b>{{ assemblyDetailData.name || 'none' }}</b></u></template>
            </p>
          </v-col>
          <v-col cols="auto">
            <!--            <v-btn-group density="compact" class="mr-2">-->
            <!--              <v-btn @click="onQuickArchiving" :loading="draftSaveQuickArchivingLoading" v-if="!isEditModel">-->
            <!--                <BtnWidget class="pl-2" :size="25" keyboard-shortcut="s" @action-complete="onQuickArchiving">-->
            <!--                  快速保存草稿-->
            <!--                </BtnWidget>-->
            <!--              </v-btn>-->
            <!--              <v-menu location="bottom right">-->
            <!--                <template v-slot:activator="{ props }">-->
            <!--                  <v-btn v-bind="props" v-if="!isEditModel">-->
            <!--                    <v-icon icon="mdi-dots-vertical"/>-->
            <!--                  </v-btn>-->
            <!--                </template>-->
            <!--                <v-list min-width="300">-->
            <!--                  <v-list-item>-->
            <!--                    <v-list-item-title @click="draftNewSaveModel = true">-->
            <!--                      另存草稿-->
            <!--                    </v-list-item-title>-->
            <!--                  </v-list-item>-->
            <!--                  <v-list-item>-->
            <!--                    <v-list-item-title @click="onPenDraftPanel">-->
            <!--                      加载草稿-->
            <!--                    </v-list-item-title>-->
            <!--                  </v-list-item>-->
            <!--                </v-list>-->
            <!--              </v-menu>-->
            <!--            </v-btn-group>-->
            <v-btn class="mr-2" @click="router.go(-1)" v-if="isEditModel">
              取消
            </v-btn>
            <v-btn :color="`var(--main-color)`" @click="onSaveRankingDesignedPublish" v-if="!isEditModel">
              下一步
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </v-card>

  <!-- Workshop S -->
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
    <RankingDesignedView ref="rankingDesignedView"></RankingDesignedView>
  </ZoomableCanvas>
  <!-- Workshop E -->

</template>

<style scoped lang="less">
</style>
