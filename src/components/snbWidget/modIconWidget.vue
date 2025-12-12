<script setup lang="ts">

import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useAssetsStore} from "~/stores/assetsStore";
import Loading from "@/components/Loading.vue";
import {useAppStore} from "~/stores/appStore";

const modImages = import.meta.glob('@/assets/images/snb/modTypeIcons/*.*', {eager: true})
const props = withDefaults(defineProps<{
      id: string,
      isOpenDetail?: boolean,
      isOpenNewWindow?: boolean,
      isShowDescription?: boolean,
      margin?: number,
      padding?: number
    }>(), {
      id: 'dhow',
      isOpenDetail: true,
      isOpenNewWindow: false,
      isShowDescription: true,
      margin: 1,
      padding: 1
    }),
    appStore = useAppStore(),
    {t} = useI18n(),
    {modifications: modAssets} = useAssetsStore()

let modsData = ref({
      icon: null,
      model: false,
      panel: {}
    }),
    isOpenNewWindow = computed({
      get: () => appStore.itemOpenNewWindow || props.isOpenNewWindow,
      set: (value) => appStore.toggleItemOpenNewWindow(value)
    })

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  const imageMap = {};
  for (const path in modImages) {
    const key = path.split('/').pop()
        ?.toString()
        .replace('.webp', '')
        .replace('.png', '')
    imageMap[key] = modImages[path];
  }

  if (modAssets[props.id])
    modsData.value.icon = modAssets[props.id] || ''
  else {
    modsData.value.icon = `https://skullandbonestools.de/api/imagesservice?src=items%2F${props.id}&width=128`
  }
}
</script>

<template>
  <v-card
      :to="isOpenDetail ? `/codex/mod/${id}` : ''"
      :target="isOpenNewWindow ? '_blank' : '_self'"
      target="_blank"
      width="100%"
      :class="[
          'prohibit-drag',
          `ma-${props.margin}`,
          `pa-${props.padding}`,
      ]">
    <template v-if="modsData.icon">
      <v-img :src="modsData.icon"
             class="pointer-events-none">
        <template v-slot:error>
          <div class="fill-height repeating-gradient d-flex justify-center align-center h-100">
            <v-icon icon="mdi-help" class="opacity-30"></v-icon>
          </div>
        </template>
        <template v-slot:placeholder>
          <div class="d-flex justify-center align-center h-100">
            <Loading size="40"/>
          </div>
        </template>
      </v-img>
    </template>
    <template v-else>
      <v-img class="error text-center">
        <template v-slot:error>
          <div class="fill-height repeating-gradient d-flex justify-center align-center h-100">
            <v-icon icon="mdi-help" class="opacity-30"></v-icon>
          </div>
        </template>
        <template v-slot:placeholder>
          <div class="d-flex justify-center align-center h-100">
            <Loading size="40"/>
          </div>
        </template>
      </v-img>
    </template>
  </v-card>
</template>

<style scoped lang="less">
.error {
  background-color: #d500002b !important;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}
</style>
