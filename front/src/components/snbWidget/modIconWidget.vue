<script setup lang="ts">

import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";

const modImages = import.meta.glob('@glow-prow-assets/modifications/*.*', {eager: true});
const
    props = withDefaults(defineProps<{
      id: string,
      isClickOpenDetail?: boolean,
      isShowOpenDetail?: boolean,
      isShowDescription?: boolean,
    }>(), {
      id: 'dhow',
      isClickOpenDetail: true,
      isShowOpenDetail: true,
      isShowDescription: true,
      padding: 3
    }),
    {t} = useI18n()

let modsData = ref({
  images: '',
  model: false,
  panel: {}
});

onMounted(() => {
  onReady()
})

const onReady = async () => {
  const imageMap = {};
  for (const path in modImages) {
    const key = path.split('/').pop()
        ?.toString()
        .replace('.webp', '')
        .replace('.png', '');
    imageMap[key] = modImages[path];
  }

  modsData.value.images = imageMap[props.id].default
}
</script>

<template>
  <v-card
      tile
      border
      variant="text"
      :to="isClickOpenDetail ? `/display-cabinet/modifications/${id}` : ''"
      :class="`pa-${props.padding} cursor-pointer`"
      height="100%"
      width="100%">
    <v-img :src="modsData.images" class="pointer-events-none"></v-img>
  </v-card>
</template>

<style scoped lang="less">
</style>
