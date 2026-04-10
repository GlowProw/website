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
      <v-container class="mt-4 position-relative">
        <v-breadcrumbs>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/apps">{{ t('apps.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('apps.detail') }}</v-breadcrumbs-item>
        </v-breadcrumbs>

        <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
          <v-icon icon="mdi-robot" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>

  <v-divider></v-divider>

  <v-container class="py-8">
    <v-row>
      <v-col cols="12" lg="6">
        <v-row>
          <v-col cols="auto">
            <v-img width="50" height="50" class="text-white" src="@/assets/images/apps/qqBot/icon-qqchat.svg"/>
          </v-col>
          <v-col>
            <h1 class="text-h3 font-weight-bold mb-4">{{ t('apps.qqBot.name') }}</h1>
          </v-col>
        </v-row>

        <p class="text-subtitle-1 text-medium-emphasis w-66">
          {{ t('apps.qqBot.description') }}
        </p>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="12" lg="auto">
        <div class="d-flex ga-2 align-center mt-3">
          <v-chip inline
                  v-for="(tag, tagIndex) in appApps.getAppData(id).tags"
                  :key="tagIndex"
                  class="badge-flavor text-center text-black">{{ tag }}
          </v-chip>
          <v-divider vertical inset></v-divider>
          <v-chip inline
                  class="badge-flavor text-center text-black">{{ t(`apps.qqBot.features.assembly.title`) }}
          </v-chip>
          <v-chip inline
                  class="badge-flavor text-center text-black">{{ t(`apps.qqBot.features.codex.title`) }}
          </v-chip>
        </div>

        <v-row class="mt-2" align="center" lg-justify="end">
          <v-col cols="auto">
            <p class="opacity-60 mb-1">搜索机器人id添加群组</p>
            <v-btn variant="tonal" density="compact" flat color="var(--main-color)">3889974138</v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card class="mb-12">
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-4">
              <v-icon icon="mdi-slash-forward" color="var(--main-color)" size="large" class="mr-2"></v-icon>
              <span class="text-h6 font-weight-medium">简单的斜杠命令设置</span>
            </div>
            <p>{{ t('apps.qqBot.features.command.description') }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <HorizontalScrollList :forceDraggable="true" :showControls="true">
      <v-card border width="400" height="500" class="bg-black" v-for="i in 3" :key="i">
        <v-img height="100%" :src="getUseImage(String(i))"></v-img>
      </v-card>
    </HorizontalScrollList>
  </v-container>
</template>

<script setup lang="ts">
import Silk from "@/components/Silk.vue";
import {useI18n} from "vue-i18n";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import {appApps} from "@/assets/sripts/index";
import {onMounted, ref} from "vue";
import {useAssetsStore} from "~/stores/assetsStore";
import ZoomableCanvas from "@/components/ZoomableCanvas.vue";
import RankingDesignedView from "@/components/RankingDesignedView.vue";

const images = import.meta.glob('@/assets/images/apps/qqBot/*', {eager: true});
const {t} = useI18n(),
    {serializationMap} = useAssetsStore()

let id = ref('qqBot'),
    contentImages = ref({})

onMounted(() => {
  contentImages.value = serializationMap(images)
})

/**
 * 获取图片
 * @param id
 */
const getUseImage = (id: string) => {
  return contentImages.value[`use-${id}`]
}
</script>

<style scoped lang="less">
.header-card {
  :deep(.v-card__image) {
    background-color: black;
  }
}
</style>
