<script setup lang="ts">
import {nextTick, onMounted, ref, watch} from "vue";
import {api, http} from "@/assets/sripts/index";
import {useGoTo} from "vuetify";
import {snapdom} from '@zumer/snapdom';

import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import QRCode from "qrcode"

import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useNoticeStore} from "~/stores/noticeStore";
import AssemblyWidget from "@/components/AssemblyWidget.vue";
import Loading from "@/components/Loading.vue";
import Textarea from "@/components/textarea"
import {useDisplay} from "vuetify/framework";

const route = useRoute(),
    router = useRouter(),
    noticeStore = useNoticeStore(),
    goto = useGoTo(),
    {asString} = useI18nUtils(),
    {t} = useI18n(),
    {mobile} = useDisplay()

let assemblyDetailData = ref({}),
    generateImageConfig = ref({
      filename: '',
      width: 1200,
      widths: [1024, 1200, 2048],
      format: 'jpg',
      formats: ['png', 'jpg', 'webp'],
      quality: 1,
      qualitys: [.6, .8, .9, 1]
    }),
    captureRef = ref(null),
    qrCanvasRef = ref(null),
    assemblyLoading = ref(false),
    assemblyDetailRef = ref(null),
    generatedLoading = ref(false),
    path = ref("")

watch(() => route, () => {
  getAssemblyDetail()
})

onMounted(() => {
  path.value = window.location.host + router.resolve({name: 'AssemblyDetail'}).path

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

    await nextTick(() => {
      assemblyDetailRef.value
          .setSetting({
            isShowItemName: true, // force display
            assemblyUseVersion: d.data.assembly.attr.assemblyUseVersion
          })
          .onLoad(d.data.data || d.data.assembly.data)
    })
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
 * 生成分享图片
 */
const onGeneratedShare = async () => {
  try {
    generatedLoading.value = true
    await goto('#share-footer')

    let node = captureRef.value;
    await goto(0, {duration: 2000})

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

    await d.download({quality: generateImageConfig.value.quality, format: generateImageConfig.value.format, filename: generateImageConfig.value.filename});
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
  <v-container class="mb-10 mt-10">
    <v-row align="center">
      <v-col>
        <h1 class="text-amber">{{ t('assembly.share.title') }}</h1>
      </v-col>
    </v-row>
  </v-container>
  <v-divider></v-divider>

  <v-container class="my-5 position-relative">
    <div ref="captureRef" class="bg-black">
      <v-icon icon="$cog"></v-icon>
    </div>

    <div class="bg-black share ml-n6 mr-n6" >
      <!-- Assembly Preview S -->
      <v-card class="card-enlargement-flavor mt-n3" v-if="assemblyDetailData.isVisibility">
        <AssemblyWidget ref="assemblyDetailRef" :readonly="true" :is-show-empty="true" :perfect-display="true" :is-full-name="true">
          <template v-slot:image v-if="assemblyDetailData.assembly.attr.backgroundPresentation">
            <v-img cover class="pointer-events-none" :src="assemblyDetailData.assembly.attr.backgroundPresentation"></v-img>
          </template>
        </AssemblyWidget>
      </v-card>
      <!-- Assembly Preview E -->

      <div class="px-10 mx-10">
        <b class="text-amber text-h2 w-100">{{ assemblyDetailData.name }}</b>
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

        <v-row class="opacity-80 mt-5" v-show="!assemblyLoading">
          <v-col>
            <v-icon>mdi-link</v-icon>
            {{ path }}
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <canvas ref="qrCanvasRef" class="rounded-sm"></canvas>
          </v-col>
        </v-row>
      </div>

      <v-overlay v-model="assemblyLoading" contained class="d-flex justify-center align-center">
        <Loading size="120"></Loading>
      </v-overlay>

      <div id="share-footer"></div>
    </div>
  </v-container>

  <div class="position-fixed bottom-0 w-100 bg-black" style="z-index: 120">
    <v-divider thickness="2" opacity=".3"></v-divider>
    <v-container class="2">
      <v-row>
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
.share {
  pointer-events: none;
  user-select: none;
  min-width: 1024px;
  min-height: 300px;

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
