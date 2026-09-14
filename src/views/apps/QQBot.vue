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
          <v-img width="120" height="120" class="text-white" src="@/assets/images/apps/qqBot/icon-qqchat.svg"/>
        </div>
      </v-container>
    </template>
  </v-card>

  <v-divider></v-divider>

  <v-container class="py-8">
    <v-row>
      <v-col cols="12" lg="6">
        <v-row>
          <v-col>
          </v-col>
        </v-row>

        <p class="text-subtitle-1 text-medium-emphasis">
          {{ t('apps.qqBot.description') }} <br/>
          {{ t('apps.qqBot.features.command.description') }}
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
      </v-col>
    </v-row>
  </v-container>

  <v-card class="px-10 bg-black" title>
    <v-container>
      <StylizedLineBackground
          :offset-x="0"
          :offset-y="0">
        <v-row align="center">
          <v-col>
            <h1 class="text-h2 text-amber-accent-4 font-weight-bold mb-4">{{ t('apps.qqBot.name') }}</h1>

            <div class="my-5">
              <div class="d-flex align-center text-h4">
                <u class="u">@{{ t('name') }}</u>
                <v-icon icon="mdi-slash-forward" color="var(--main-color)" class="mr-n2"></v-icon>
                <span class="font-weight-medium">{ {{ t('apps.qqBot.commandPlaceholder') }} }</span>
              </div>
              <p class="mt-1 opacity-60">{{ t('apps.qqBot.invokeFeature') }}</p>
            </div>
          </v-col>
          <v-col cols="12" lg="5">
            <v-btn variant="tonal"
                   block
                   size="large"
                   @click="model = true"
                   color="var(--main-color)">
              {{ t('apps.qqBot.addBot') }}
            </v-btn>

            <v-dialog v-model="model">
              <v-card border class="mx-auto">
                <v-card-title class="py-10 text-center bg-black mb-4">
                  <v-icon size="80">mdi-bookmark-multiple</v-icon>
                </v-card-title>
                <v-card-text class="py-3 px-10">
                  <p class="mb-4">{{ t('apps.qqBot.dialog.description') }}</p>
                  <v-row align="end">
                    <v-col cols="6" lg="4" class="text-center">
                      <v-btn border block href="https://bot.q.qq.com/s/v4A7C5CJ9Y" class="bg-amber">
                        {{ t('apps.qqBot.dialog.linkButton') }}
                      </v-btn>
                      <p class="mt-2 mx-4 text-caption opacity-60">{{ t('apps.qqBot.dialog.linkDesc') }}</p>
                      <p class="mt-2">{{ t('apps.qqBot.dialog.accountIdentifier') }}</p>
                    </v-col>
                    <v-col cols="6" lg="4" class="text-center">
                      <p class="u text-amber text-h5">3889974138</p>
                      <p class="mt-2 mx-4 text-caption opacity-60">{{ t('apps.qqBot.dialog.qqIdDesc') }}</p>
                      <p class="mt-2">{{ t('apps.qqBot.dialog.accountIdentifier') }}</p>
                    </v-col>
                    <v-col cols="12" lg="4" class="text-center">
                      <v-card border class="mx-auto pa-1 bg-white d-inline-flex">
                        <v-img src="@/assets/images/app-qq-bot-qr.png" width="100"/>
                      </v-card>

                      <p class="mt-2">{{ t('apps.qqBot.dialog.qrCode') }}</p>
                    </v-col>
                  </v-row>

                  <v-row style="margin-top: -60px" class="opacity-10" dense>
                    <v-col cols="4" class="text-center">
                      <h5 class="text-h1 opacity-60">{{ number.intToRoman(1) }}</h5>
                    </v-col>
                    <v-col cols="4" class="text-center">
                      <h5 class="text-h1 opacity-60">{{ number.intToRoman(2) }}</h5>
                    </v-col>
                    <v-col cols="4" class="text-center">
                      <h5 class="text-h1 opacity-60">{{ number.intToRoman(3) }}</h5>
                    </v-col>
                  </v-row>

                  <v-divider></v-divider>
                  <div class="my-3">
                    <p class="mb-1">{{ t('apps.qqBot.dialog.tipsTitle') }}</p>
                    <ul class="text-caption opacity-60">
                      <li>{{ t('apps.qqBot.dialog.tip1') }}</li>
                      <li>{{ t('apps.qqBot.dialog.tip2') }}</li>
                      <li>{{ t('apps.qqBot.dialog.tip3') }}</li>
                      <li>{{ t('apps.qqBot.dialog.tip4') }}</li>
                    </ul>
                  </div>
                </v-card-text>
              </v-card>
            </v-dialog>
          </v-col>
        </v-row>
      </StylizedLineBackground>
    </v-container>
  </v-card>

  <v-container>
    <HorizontalScrollList :forceDraggable="true" :showControls="true">
      <v-card border width="300" height="500" class="bg-black" v-for="i in 3" :key="i">
        <v-img height="100%" :src="getUseImage(String(i))"></v-img>
      </v-card>
    </HorizontalScrollList>
  </v-container>
</template>

<script setup lang="ts">
import Silk from "@/components/Silk.vue";
import {useI18n} from "vue-i18n";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";
import {appApps, number} from "@/assets/sripts/index";
import {onMounted, ref} from "vue";
import {useAssetsStore} from "~/stores/assetsStore";
import StylizedLineBackground from "@/components/StylizedLineBackground.vue";

const images = import.meta.glob('@/assets/images/apps/qqBot/*', {eager: true});
const {t} = useI18n(),
    {serializationMap} = useAssetsStore()

let id = ref('qqBot'),
    contentImages = ref({}),
    model = ref(false)

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
