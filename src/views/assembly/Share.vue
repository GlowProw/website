<script setup lang="ts">
import {nextTick, onMounted, ref, watch} from "vue";
import {api, http} from "@/assets/sripts/index";
import {useGoTo} from "vuetify";
import domToImage from "dom-to-image"
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import QRCode from "qrcode"

import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useNoticeStore} from "~/stores/noticeStore";
import AssemblyWidget from "@/components/AssemblyWidget.vue";
import Loading from "@/components/Loading.vue";
import Textarea from "@/components/textarea"

const route = useRoute(),
    router = useRouter(),
    noticeStore = useNoticeStore(),
    goto = useGoTo(),
    {asString} = useI18nUtils(),
    {t} = useI18n()

let assemblyDetailData = ref({}),
    capture = ref(null),
    assemblyLoading = ref(false),
    assemblyDetailRef = ref(null),
    generatedLoading = ref(false),
    qrCanvas = ref(null),
    path = ref("")

watch(() => route, () => {
  getAssemblyDetail()
})

onMounted(() => {
  path.value = window.location.host + router.resolve({name: 'AssemblyDetail'}).path

  generateQRCode(path.value)
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

    let node = capture.value;
    await goto(0, {duration: 3000})

    const dataUrl = await domToImage.toBlob(node, {
      filter: (node) => {
        if (node instanceof HTMLElement) {
          return !(node.tagName === 'IMG' && node.classList.contains('ProseMirror-separator'));
        }
        return true;
      }
    })

    downloadBlob(dataUrl, `${assemblyDetailData.value.name}.png`)
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
 * 下载Blob数据
 * @param blob
 * @param filename
 */
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * 生成二维码
 * @param text
 */
const generateQRCode = async (text) => {
  try {
    await QRCode.toCanvas(qrCanvas.value, text, {
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
      <v-spacer></v-spacer>
      <v-col cols="auto">
        <v-btn @click="onBackDetail" class="mr-3">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn class="bg-amber" :loading="generatedLoading" :disabled="generatedLoading || assemblyDetailData.uuid == null" @click="onGeneratedShare">
          {{ t('assembly.share.createPoster') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
  <v-divider></v-divider>

  <v-container class="my-5 position-relative">
    <div class="bg-black share ml-n6 mr-n6" ref="capture">
      <!-- Assembly Preview S -->
      <v-card class="card-enlargement-flavor mt-n3" v-if="assemblyDetailData.isVisibility">
        <AssemblyWidget ref="assemblyDetailRef" :readonly="true" :perfect-display="true" :is-full-name="true">
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
              ], true)
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
            <canvas ref="qrCanvas" class="rounded-sm"></canvas>
          </v-col>
        </v-row>
      </div>

      <v-overlay v-model="assemblyLoading" contained class="d-flex justify-center align-center">
        <Loading size="120"></Loading>
      </v-overlay>

      <div id="share-footer"></div>
    </div>
  </v-container>
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
