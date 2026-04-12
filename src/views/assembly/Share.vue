<script setup lang="ts">
import {computed, nextTick, onMounted, Ref, ref, watch} from "vue";
import {apis, storage_account} from "@/assets/sripts/index";
import {snapdom} from '@zumer/snapdom';
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {useNoticeStore} from "~/stores/noticeStore";
import {useGoTo} from "vuetify";
import AssemblyPoster from "@/components/AssemblyPoster.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import Silk from "@/components/Silk.vue";
import {ApiError} from "@/assets/types/Api";
import AdsWidget from "@/components/ads/google/index.vue";
import languagesConfig from "@/config/languages.json";

const route = useRoute(),
    router = useRouter(),
    goto = useGoTo(),
    notice = useNoticeStore(),
    {t, locale} = useI18n(),
    {mobile} = useDisplay()

let assemblyDetailData: Ref<any> = ref({}),
    generateImageValue: Ref<any> = ref({
      isShowEmptySlot: true,
      isShowItemName: true,
      isFullName: false,
      isShowHeader: true,
      isShowTitle: true,
      isShowTabs: true,
      isShowDescription: true,
      filename: '',
      width: 1200,
      format: 'jpg',
      quality: 1,
      background: '#000',
      language: locale.value,
    }),
    generateImageConfig = ref({
      widths: [1050, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 2048],
      formats: ['png', 'jpg', 'webp'],
      qualitys: [.6, .8, .9, 1],
      backgrounds: ['#1a1a1a', '#000', 'rgb(35,26,0)'],
      languages: languagesConfig.child
    }),
    captureRef = ref(null),
    assemblyLoading = ref(false),
    generatedLoading = ref(false),
    posterSwitch = ref(true),
    path = ref(""),
    webPath = computed(() => window.location.host)

watch(() => [
  generateImageValue.value.isFullName,
  generateImageValue.value.isShowItemName
], () => {
  loadAssemblyData()
})

watch(() => generateImageValue.value, (value) => {
  router.push({
    name: route.name as any,
    query: {...route.query, ...generateImageValue.value} as any,
  })

  // 保存海报配置
  if (value && posterSwitch.value) {
    storage_account.updateConfiguration('poster', 'poster.config', value)
  }
}, {deep: true})

watch(() => route, () => {
  getAssemblyDetail()
})

onMounted(() => {
  path.value = webPath.value + router.resolve({name: 'AssemblyDetail'}).path
  posterSwitch.value = storage_account.getConfigurationItem('poster', 'poster.switch')

  if (posterSwitch.value)
    generateImageValue.value = storage_account.getConfigurationItem('poster', 'poster.config', {
      defaultValue: generateImageValue.value
    })

  if (route.query) {
    const query = {...route.query} as any;
    const booleanKeys = ['isShowEmptySlot', 'isShowItemName', 'isFullName', 'isShowHeader', 'isShowTitle', 'isShowTabs', 'isShowDescription'];
    const numberKeys = ['width', 'quality'];

    booleanKeys.forEach(key => {
      if (query[key] !== undefined) {
        query[key] = query[key] === 'true';
      }
    });

    numberKeys.forEach(key => {
      if (query[key] !== undefined) {
        query[key] = Number(query[key]);
      }
    });

    generateImageValue.value = Object.assign(generateImageValue.value, query);
  }

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

    const result = await apis.assemblyApi().getAssemblyItem(<string>uuid, {password: <string>password}),
        d = result.data;

    assemblyDetailData.value = d.data;
    generateImageValue.value.filename = assemblyDetailData.value.name as string;

    await loadAssemblyData()
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    assemblyLoading.value = false
  }
}

/**
 * 装载配装数据
 */
const loadAssemblyData = async () => {
  await nextTick(() => {
    if (captureRef.value) {
      // @ts-ignore
      captureRef.value.loadAssemblyData();
    }
  })
}

/**
 * 确保所有图片已加载
 */
const ensureImagesLoaded = async (element: HTMLElement) => {
  const imgs = Array.from(element.querySelectorAll('img'));
  await Promise.all(imgs.map(async (img) => {
    try {
      if (img.complete) {
        await img.decode().catch(() => {});
        return;
      }
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      await img.decode().catch(() => {});
    } catch (e) {
      console.warn('Image load failed:', img.src);
    }
  }));
};

/**
 * 生成分享图片
 */
const onGeneratedShare = async () => {
  try {
    generatedLoading.value = true
    await nextTick()

    // await goto('#share-footer')

    let node = captureRef.value?.posterEl;
    if (!node) return;

    // await goto(0, {duration: 2000})

    // 临时设置样式以确保截图完整性 (主要解决视口过小导致的问题)
    const originalStyles = node.style.cssText;
    const width = generateImageValue.value.width;
    // 使用 fixed 和巨大的偏移量将其移出视角，但保持渲染
    node.style.cssText += `; position: fixed !important; left: -${width * 2}px !important; top: 0 !important; z-index: 99999 !important; width: ${width}px !important; min-width: ${width}px !important; opacity: 1 !important; visibility: visible !important; display: block !important;`;

    // 确保所有图片已加载并解码
    await ensureImagesLoaded(node);

    // 添加捕获中标记
    node.classList.add('is-capturing');

    // 等待两帧确保渲染管线同步
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const d = await snapdom(node, {
      width: generateImageValue.value.width,
      scale: mobile ? window.devicePixelRatio * 2 : window.devicePixelRatio,
      embedFonts: true,
      iconFonts: ['Material Design Icons', 'Material Icons'],
      quality: generateImageValue.value.quality,
      filter: (node: any) => {
        if (node instanceof HTMLElement) {
          return !(node.tagName === 'IMG' && node.classList.contains('ProseMirror-separator'))
        }
        return true;
      },
      // useProxy: 'https://proxy.corsfix.com/?',
      cacheBust: false
    } as any)

    await d.download({quality: generateImageValue.value.quality, format: generateImageValue.value.format, filename: `${generateImageValue.value.filename}.${generateImageValue.value.format}`} as any)

    // 移除标记并恢复原始样式
    node.classList.remove('is-capturing');
    node.style.cssText = originalStyles;
  } catch (e) {
    console.error(e)
    if (captureRef.value?.posterEl) {
      captureRef.value.posterEl.classList.remove('is-capturing');
    }
  } finally {
    setTimeout(() => {
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
    <AdsWidget class="my-5" id="none"></AdsWidget>

    <div class="position-relative">
      <AssemblyPoster
          ref="captureRef"
          :assembly-detail-data="assemblyDetailData"
          :generate-image-value="generateImageValue"
          :path="path"
          :web-path="webPath"
          :assembly-loading="assemblyLoading"
      />

    </div>
  </v-container>

  <v-overlay :model-value="generatedLoading" persistent class="blur-load d-flex align-center justify-center" opacity=".8">
    <v-card variant="text" min-height="400" class="text-center">
      <v-progress-circular indeterminate size="80" width="8" color="amber" class="mb-5"></v-progress-circular>
      <div class="text-h5 text-amber font-weight-bold" style="text-shadow: 0 2px 10px rgba(0,0,0,0.5)">
        {{ t('assembly.share.generating') }}
      </div>
      <div class="text-caption text-grey-lighten-1 mt-2">
        {{ t('assembly.share.generatingHint') }}
      </div>
    </v-card>
  </v-overlay>

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
                    <v-text-field v-model="generateImageValue.filename"></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <div class="mb-2">{{ t('assembly.share.width') }}</div>
                    <v-select
                        variant="filled"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="generateImageValue.width"
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
                        v-model="generateImageValue.format"
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
                        v-model="generateImageValue.quality"
                        :items="generateImageConfig.qualitys"
                        hide-details>
                    </v-select>
                  </v-col>
                  <v-col cols="6">
                    <div class="mb-2">{{ t('assembly.share.language') }}</div>
                    <v-select
                        variant="filled"
                        item-value="value"
                        item-title="label"
                        density="comfortable"
                        v-model="generateImageValue.language"
                        :items="generateImageConfig.languages"
                        hide-details>
                    </v-select>
                  </v-col>
                  <v-col cols="12">
                    <v-divider>{{ t('assembly.share.imageStyleTitle') }}</v-divider>
                  </v-col>
                  <v-col cols="12">
                    <div class="mb-2">{{ t('assembly.share.backgroundColor') }}</div>
                    <v-select
                        variant="filled"
                        item-value="value"
                        item-title="text"
                        density="comfortable"
                        v-model="generateImageValue.background"
                        :items="generateImageConfig.backgrounds"
                        hide-details>
                      <template v-slot:append>
                        <v-card border variant="text">
                          <ItemSlotBase size="50px" :padding="0" :style="`background: ${generateImageValue.background}`"></ItemSlotBase>
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
                    <v-row>
                      <v-col cols="6">
                        <v-switch
                            v-model="generateImageValue.isShowEmptySlot"
                            inset
                            hide-details>
                          <template v-slot:append>
                            <div>{{ t('assembly.share.showEmptySlot') }}</div>
                          </template>
                        </v-switch>
                      </v-col>
                      <v-col cols="6">
                        <v-switch
                            v-model="generateImageValue.isShowItemName"
                            inset
                            hide-details>
                          <template v-slot:append>
                            <div>{{ t('assembly.share.showItemName') }}</div>
                          </template>
                        </v-switch>
                      </v-col>
                      <v-col cols="6">
                        <v-switch
                            v-model="generateImageValue.isFullName"
                            inset
                            hide-details>
                          <template v-slot:append>
                            <div>{{ t('assembly.share.fullName') }}</div>
                          </template>
                        </v-switch>
                      </v-col>
                      <v-col cols="6">
                        <v-switch
                            v-model="generateImageValue.isShowTitle"
                            inset
                            hide-details>
                          <template v-slot:append>
                            <div>{{ t('assembly.share.showTitle') }}</div>
                          </template>
                        </v-switch>
                      </v-col>
                      <v-col cols="6">
                        <v-switch
                            v-model="generateImageValue.isShowHeader"
                            inset
                            hide-details>
                          <template v-slot:append>
                            <div>{{ t('assembly.share.showHeader') }}</div>
                          </template>
                        </v-switch>
                      </v-col>
                      <v-col cols="6">
                        <v-switch
                            v-model="generateImageValue.isShowTabs"
                            inset
                            hide-details>
                          <template v-slot:append>
                            <div>{{ t('assembly.share.showTabs') }}</div>
                          </template>
                        </v-switch>
                      </v-col>
                      <v-col cols="6">
                        <v-switch
                            v-model="generateImageValue.isShowDescription"
                            inset
                            hide-details>
                          <template v-slot:append>
                            {{ t('assembly.share.showDescription') }}
                          </template>
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

  <div id="share-footer"></div>
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
