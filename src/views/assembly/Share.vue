<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {api, http} from "@/assets/sripts/index";
import {useGoTo} from "vuetify";
import {snapdom} from '@zumer/snapdom';
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useNoticeStore} from "~/stores/noticeStore";
import QRCode from "qrcode"

import AssemblyWidget from "@/components/AssemblyWidget.vue";
import Loading from "@/components/Loading.vue";
import Textarea from "@/components/textarea"
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import Logo from "@/components/Logo.vue";
import AssemblySvgIcon from "@/components/AssemblySvgIcon.vue";
import Silk from "@/components/Silk.vue";

const route = useRoute(),
    router = useRouter(),
    noticeStore = useNoticeStore(),
    {asString} = useI18nUtils(),
    {t} = useI18n(),
    {mobile} = useDisplay()

let assemblyDetailData = ref({}),
    generateImageConfig = ref({
      isShowEmptySlot: true,
      isShowItemName: true,
      isFullName: false,
      isShowHeader: true,
      isShowTitle: true,
      filename: '',
      width: 1200,
      widths: [1050, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 2048],
      format: 'jpg',
      formats: ['png', 'jpg', 'webp'],
      quality: 1,
      qualitys: [.6, .8, .9, 1],
      background: '#000',
      backgrounds: ['#1a1a1a', '#000', 'rgb(35,26,0)']
    }),
    captureRef = ref(null),
    qrCanvasRef = ref(null),
    assemblyLoading = ref(false),
    assemblyDetailRef = ref(null),
    generatedLoading = ref(false),
    path = ref(""),
    webPath = computed(() => window.location.host)

watch(() => [
  generateImageConfig.value.isFullName,
  generateImageConfig.value.isShowItemName
], () => {
  loadAssemblyData()
})

watch(() => route, () => {
  getAssemblyDetail()
})

onMounted(() => {
  path.value = webPath.value + router.resolve({name: 'AssemblyDetail'}).path

  onGenerateQRCode(path.value)
  getAssemblyDetail()
})

/**
 * 获取配装详情
 */
const getAssemblyDetail = async () => {
  try {
    const {uuid} = route.params;
    const {password} = route.query;

    assemblyLoading.value = true;

    const result = await http.get(api['assembly_item'], {
          params: {
            uuid,
            password
          },
        }),
        d = result.data;

    if (d.error == 1) {
      assemblyDetailData.value = d.data;
      return
    }

    assemblyDetailData.value = d.data;
    generateImageConfig.value.filename = assemblyDetailData.value.name;

    loadAssemblyData()
  } catch (e) {
    console.error(e)
    if (e instanceof Error)
      noticeStore.error(t(`basic.tips.${e.response.data.code}`, {
        context: e.response.data.code
      }))
  } finally {
    assemblyLoading.value = false
  }
}

/**
 * 装载配装数据
 */
const loadAssemblyData = async () => {
  await nextTick(() => {
    assemblyDetailRef.value
        .setSetting({
          isShowItemName: generateImageConfig.value.isShowItemName,
          isFullName: generateImageConfig.value.isFullName,
          assemblyUseVersion: assemblyDetailData.value.assembly.attr.assemblyUseVersion
        })
        .onLoad(assemblyDetailData.value.data || assemblyDetailData.value.assembly.data)
  })
}

/**
 * 生成分享图片
 */
const onGeneratedShare = async () => {
  try {
    generatedLoading.value = true

    let node = captureRef.value;

    const d = await snapdom(node, {
      width: generateImageConfig.value.width,
      embedFonts: true,
      localFonts: [
        {family: "Material Icons", src: "https://fonts.gstatic.com/s/materialicons/v145/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2", weight: "normal", style: "normal"},
        {family: "Material Design Icons", src: "https://fonts.gstatic.com/s/materialicons/v145/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2", weight: "normal", style: "normal"},
      ],
      iconFonts: ['Material Design Icons', 'Material Icons', 'Material Icons Round'],
      useProxy: 'https://proxy.corsfix.com/?',
      quality: generateImageConfig.value.quality,
      filter: (node) => {
        if (node instanceof HTMLElement) {
          return !(node.tagName === 'IMG' && node.classList.contains('ProseMirror-separator'));
        }
        return true;
      },
      cacheBust: false
    })

    await d.download({quality: generateImageConfig.value.quality, format: generateImageConfig.value.format, filename: `${generateImageConfig.value.filename}.${generateImageConfig.value.format}`});
  } catch (e) {
    console.error(e)
  } finally {
    setInterval(() => {
      generatedLoading.value = false
    }, 500)
  }
}

/**
 * 返回
 */
const onBackDetail = () => {
  router.push({name: 'AssemblyDetail'})
}

/**
 * 生成二维码
 * @param text
 */
const onGenerateQRCode = async (text) => {
  try {
    await QRCode.toCanvas(qrCanvasRef.value, text, {
      width: 100,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  } catch (err) {
    console.error(err)
  }
}
</script>

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
          <v-breadcrumbs-item :to="{name:'AssemblyDetail'}">{{ t('assembly.detail.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('assembly.share.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>

        <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
          <v-icon icon="mdi-share-variant-outline" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider></v-divider>

  <v-container class="my-5 position-relative overflow-auto">
    <div ref="captureRef" class="share mx-auto pt-5" :style="`background: ${generateImageConfig.background};width:${generateImageConfig.width}px`">
      <v-row no-gutters class="px-5" align="center" v-if="generateImageConfig.isShowHeader">
        <v-col cols="auto">
          <Logo></Logo>
        </v-col>
        <v-col class="d-flex">
          {{ t('name') }}
          <v-divider vertical inset class="mx-3" thickness="2" opacity=".3"></v-divider>
          {{ webPath }}
        </v-col>
        <v-col cols="auto" class="opacity-30">
          {{ assemblyDetailData.uuid }}
        </v-col>
      </v-row>

      <v-row class="px-10" :class="{'pt-5': !generateImageConfig.isShowHeader}" v-if="assemblyDetailData.name && generateImageConfig.isShowTitle">
        <b class="text-amber text-h4 w-100">{{ assemblyDetailData.name }}</b>
      </v-row>

      <!-- Assembly Preview S -->
      <v-card class="mt-n10" variant="text" v-if="assemblyDetailData.isVisibility">
        <AssemblyWidget ref="assemblyDetailRef" :readonly="true" :is-show-empty="generateImageConfig.isShowEmptySlot" :perfect-display="true" :is-full-name="true">
          <template v-slot:image v-if="assemblyDetailData.assembly.attr.backgroundPresentation">
            <v-img cover class="pointer-events-none" :src="assemblyDetailData.assembly.attr.backgroundPresentation"></v-img>
          </template>
        </AssemblyWidget>
      </v-card>
      <!-- Assembly Preview E -->

      <div class="px-10 mx-10">
        <div class="ga-2 mb-6 mt-4" v-if="assemblyDetailData.tags">
          <v-chip class="mr-2 mb-2 pt-1 pb-1 pl-5 pr-5" v-for="(i, index) in assemblyDetailData.tags" :key="index">
            {{
              asString([
                `${i}`,
                `assembly.tags.teamFormationMethods.${i.split('_')[1]}`,
                `assembly.tags.archetypes.${i.split('_')[1]}`,
                `assembly.tags.modes.${i.split('_')[0]}`,
                `assembly.tags.damageTypes.${i.split('_')[1]}`,
                `snb.seasons.${i.split('_')[1]}`,
              ], {backRawKey: true})
            }}
          </v-chip>
        </div>

        <Textarea class="mt-5" v-if="assemblyDetailData.description"
                  :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                  readonly v-model="assemblyDetailData.description"></Textarea>

        <v-row class="opacity-80 mt-5 pb-5" v-show="!assemblyLoading">
          <v-col>
            <AssemblySvgIcon name="link"></AssemblySvgIcon>
            {{ path }}
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <canvas ref="qrCanvasRef" class="rounded-sm"></canvas>
          </v-col>
        </v-row>
      </div>

      <v-overlay v-model="assemblyLoading" contained opacity="1" class="d-flex justify-center align-center">
        <Loading size="120"></Loading>
      </v-overlay>
    </div>
  </v-container>

  <div class="position-fixed bottom-0 w-100 bg-black" style="z-index: 120">
    <v-divider thickness="2" opacity=".3"></v-divider>
    <v-container class="2">
      <v-row>
        <v-col>
          <v-btn height="50" @click="getAssemblyDetail" class="mr-3" :loading="assemblyLoading">
            <v-icon icon="mdi-refresh" size="20" :class="[assemblyLoading ? 'spin-icon-load' : '']"/>
          </v-btn>
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="auto">
          <v-btn height="50" @click="onBackDetail" class="mr-3">{{ t('basic.button.cancel') }}</v-btn>

          <v-btn-group>
            <v-btn height="50" class="bg-amber" :loading="generatedLoading" :disabled="generatedLoading || assemblyDetailData.uuid == null" @click="onGeneratedShare">
              {{ t('assembly.share.createPoster') }}
            </v-btn>
            <v-divider vertical></v-divider>
            <v-menu open-on-click :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-btn height="50" class="bg-amber" icon v-bind="props">
                  <v-icon>mdi-cog</v-icon>
                </v-btn>
              </template>

              <v-card border class="pa-5" :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 580">
                <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
                  <v-icon size="80">mdi-cog</v-icon>
                </v-card-title>

                <p class="text-caption mb-5">{{ t('assembly.share.configHint') }}</p>

                <v-row>
                  <v-col cols="12">
                    <div class="mb-2">{{ t('assembly.share.filename') }}</div>
                    <v-text-field v-model="generateImageConfig.filename"></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <div class="mb-2">{{ t('assembly.share.width') }}</div>
                    <v-select
                        variant="filled"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="generateImageConfig.width"
                        :items="generateImageConfig.widths"
                        hide-details>
                    </v-select>
                  </v-col>
                  <v-col cols="6">
                    <div class="mb-2">{{ t('assembly.share.format') }}</div>
                    <v-select
                        variant="filled"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="generateImageConfig.format"
                        :items="generateImageConfig.formats"
                        hide-details>
                    </v-select>
                  </v-col>
                  <v-col cols="6">
                    <div class="mb-2">{{ t('assembly.share.quality') }}</div>
                    <v-select
                        variant="filled"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="generateImageConfig.quality"
                        :items="generateImageConfig.qualitys"
                        hide-details>
                    </v-select>
                  </v-col>
                  <v-col cols="12">
                    <div class="mb-2">{{ t('assembly.share.backgroundColor') }}</div>
                    <v-select
                        variant="filled"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="generateImageConfig.background"
                        :items="generateImageConfig.backgrounds"
                        hide-details>
                      <template v-slot:prepend>
                        <v-card border variant="text">
                          <ItemSlotBase size="50px" :padding="0" :style="`background: ${generateImageConfig.background}`"></ItemSlotBase>
                        </v-card>
                      </template>
                      <template v-slot:item="{props, item}">
                        <v-list-item v-bind="props">
                          <template v-slot:append>
                            <ItemSlotBase size="30px" :padding="0" :style="`background: ${item.raw}`">
                            </ItemSlotBase>
                          </template>
                        </v-list-item>
                      </template>
                    </v-select>
                  </v-col>
                  <v-col cols="12">
                    <v-row align="center" no-gutters>
                      <v-col>
                        <div>{{ t('assembly.share.showEmptySlot') }}</div>
                      </v-col>
                      <v-col cols="auto">
                        <v-switch
                            v-model="generateImageConfig.isShowEmptySlot"
                            hide-details>
                        </v-switch>
                      </v-col>
                    </v-row>

                    <v-row align="center" no-gutters>
                      <v-col>
                        <div>{{ t('assembly.share.showItemName') }}</div>
                      </v-col>
                      <v-col cols="auto">
                        <v-switch
                            v-model="generateImageConfig.isShowItemName"
                            hide-details>
                        </v-switch>
                      </v-col>
                    </v-row>

                    <v-row align="center" no-gutters>
                      <v-col>
                        <div>{{ t('assembly.share.fullName') }}</div>
                      </v-col>
                      <v-col cols="auto">
                        <v-switch
                            v-model="generateImageConfig.isFullName"
                            hide-details>
                        </v-switch>
                      </v-col>
                    </v-row>

                    <v-row align="center" no-gutters>
                      <v-col>
                        <div>{{ t('assembly.share.showTitle') }}</div>
                      </v-col>
                      <v-col cols="auto">
                        <v-switch
                            v-model="generateImageConfig.isShowTitle"
                            hide-details>
                        </v-switch>
                      </v-col>
                    </v-row>

                    <v-row align="center" no-gutters>
                      <v-col>
                        <div>{{ t('assembly.share.showHeader') }}</div>
                      </v-col>
                      <v-col cols="auto">
                        <v-switch
                            v-model="generateImageConfig.isShowHeader"
                            hide-details>
                        </v-switch>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-card>
            </v-menu>
          </v-btn-group>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/icon";

.share {
  pointer-events: none;
  user-select: none;

  &:after {
    content: "";
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
</style>
