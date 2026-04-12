<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import QRCode from "qrcode";

import AssemblyWidget from "@/components/AssemblyWidget.vue";
import Loading from "@/components/Loading.vue";
import Textarea from "@/components/textarea/index.vue";
import Logo from "@/components/Logo.vue";
import AssemblySvgIcon from "@/components/AssemblySvgIcon.vue";
import UserAvatar from "@/components/UserAvatar.vue";

const {t: rawT} = useI18n();
const {asString: rawAsString} = useI18nUtils();

const t = (key: string, ...args: any[]) => {
  if (props.generateImageValue.language) {
    return rawT(key, ...args, props.generateImageValue.language)
  }
  return rawT(key, ...args)
}

const asString = (keys: string[], options: any = {}) => {
  if (props.generateImageValue.language) {
    options.lang = props.generateImageValue.language
  }
  return rawAsString(keys, options)
}

const props = defineProps({
  assemblyDetailData: {
    type: Object,
    default: () => ({})
  },
  generateImageValue: {
    type: Object,
    default: () => ({
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
    })
  },
  path: {
    type: String,
    default: ""
  },
  webPath: {
    type: String,
    default: ""
  },
  assemblyLoading: {
    type: Boolean,
    default: false
  }
});

const captureRef = ref(null);
const assemblyDetailRef = ref(null);
const qrCanvasRef = ref(null);

watch(() => props.path, (newPath) => {
  if (newPath) onGenerateQRCode(newPath);
});

onMounted(() => {
  if (props.path) {
    onGenerateQRCode(props.path);
  }
});

const onGenerateQRCode = async (text: string) => {
  try {
    if (qrCanvasRef.value && text) {
      await QRCode.toCanvas(qrCanvasRef.value, text, {
        width: 100,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    }
  } catch (err) {
    console.error(err);
  }
};

const loadAssemblyData = async () => {
  await nextTick(() => {
    if (assemblyDetailRef.value) {
      // @ts-ignore
      assemblyDetailRef.value
          .setSetting({
            isShowItemName: props.generateImageValue.isShowItemName,
            isFullName: props.generateImageValue.isFullName,
            assemblyUseVersion: props.assemblyDetailData.assembly?.attr?.assemblyUseVersion
          })
          .onLoad(props.assemblyDetailData.data || props.assemblyDetailData.assembly?.data);
    }
  });
};

defineExpose({
  loadAssemblyData,
  posterEl: computed(() => captureRef.value?.$el || captureRef.value)
});
</script>

<template>
  <v-card id="capture" min-height="300" variant="text" ref="captureRef" class="share mx-auto pt-5" :style="`background: ${generateImageValue.background};width:${generateImageValue.width}px`">
    <v-row no-gutters class="px-5" align="center" v-if="generateImageValue.isShowHeader">
      <v-col cols="auto">
        <Logo></Logo>
      </v-col>
      <v-col class="d-flex">
        {{ t('name') }}
        <v-divider vertical inset class="mx-3" thickness="2" opacity=".3"></v-divider>
        {{ webPath }}
      </v-col>
      <v-col cols="auto" class="opacity-30">
        {{ assemblyDetailData?.uuid || '' }}
      </v-col>
    </v-row>

    <v-row class="px-10" :class="{'pt-5': !generateImageValue.isShowHeader}" v-if="assemblyDetailData.name && generateImageValue.isShowTitle">
      <b class="text-amber text-h4 w-100">{{ assemblyDetailData.name }}</b>
    </v-row>

    <!-- Assembly Preview S -->
    <v-card variant="text" v-if="assemblyDetailData.isVisibility">
      <AssemblyWidget ref="assemblyDetailRef" :readonly="true" :is-show-empty="generateImageValue.isShowEmptySlot" :perfect-display="true" :is-full-name="true" :locale="generateImageValue.language" :is-eager="true">
        <template v-slot:image v-if="assemblyDetailData.assembly?.attr?.backgroundPresentation">
          <v-img cover class="pointer-events-none" :src="assemblyDetailData.assembly.attr?.backgroundPresentation" eager></v-img>
        </template>
      </AssemblyWidget>
    </v-card>
    <!-- Assembly Preview E -->

    <div class="px-10">
      <div class="ga-2 mb-6 mt-4" v-if="assemblyDetailData.tags && generateImageValue.isShowTabs">
        <v-chip class="mr-2 mb-2 pt-1 pb-1 pl-5 pr-5" v-for="(i, index) in assemblyDetailData.tags" :key="index">
          {{
            asString([
              `${i}`,
              `assembly.tags.teamFormationMethods.${i.split('_')[1]}`,
              `assembly.tags.modes.${i.split('_')[0]}`,
              `codex.ships.archetypes.${i.split('_')[1]}.name`,
              `snb.seasons.${i.split('_')[1]}`,
            ], {backRawKey: true})
          }}
        </v-chip>
      </div>

      <Textarea class="mt-5" v-if="assemblyDetailData.description && generateImageValue.isShowDescription"
                readonly
                :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                :min-height="'0'"
                :model-value="assemblyDetailData.description"
                :locale="generateImageValue.language"></Textarea>

      <v-row class="opacity-80 mt-5 pb-5" v-show="!assemblyLoading">
        <v-col>
          <p v-if="assemblyDetailData.userAvatar" class="mb-1">
            <div class="d-inline-flex">
              <v-card class="mr-1">
                <UserAvatar size="25" :src="assemblyDetailData.userAvatar"></UserAvatar>
              </v-card>
              {{ assemblyDetailData.username || t('assembly.anonymous') }}
            </div>
          </p>

          <AssemblySvgIcon name="link"></AssemblySvgIcon>
          {{ path }}
        </v-col>
        <v-spacer></v-spacer>
        <v-col cols="auto">
          <canvas ref="qrCanvasRef" class="rounded-sm"></canvas>
        </v-col>
      </v-row>
    </div>

    <v-overlay :model-value="assemblyLoading" contained opacity="1" class="d-flex justify-center align-center">
      <Loading size="120"></Loading>
    </v-overlay>
  </v-card>
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
