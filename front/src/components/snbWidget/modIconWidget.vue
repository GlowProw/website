<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";

const modImages = import.meta.glob('@/assets/images/snb/modTypeIcons/*.*', {eager: true});
const
    props = withDefaults(defineProps<{
      id: string,
      isClickOpenDetail?: boolean,
      isShowOpenDetail?: boolean,
      isShowDescription?: boolean,
      margin?: number,
      padding?: number
    }>(), {
      id: 'dhow',
      isClickOpenDetail: true,
      isShowOpenDetail: true,
      isShowDescription: true,
      margin: 1,
      padding: 1
    }),
    {t} = useI18n()

let modsData = ref({
  icon: null,
  model: false,
  panel: {}
});

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
        .replace('.png', '');
    imageMap[key] = modImages[path];
  }

  if (imageMap[props.id])
    modsData.value.icon = imageMap[props.id]?.default || null
  else {
    modsData.value.icon = `https://skullandbonestools.de/api/imagesservice?src=modifications%2F${props.id}&width=128`
  }
}
</script>

<template>
  <v-card
      :to="isClickOpenDetail ? `/codex/mod/${id}` : ''"
      target="_blank"
      width="100%"
      :class="[
          'prohibit-drag',
          `ma-${props.margin}`,
          `pa-${props.padding}`,
      ]">
    <template v-if="modsData.icon">
      <v-img :src="modsData.icon" class="pointer-events-none"></v-img>
    </template>
    <template v-else>
      <v-img class="error text-center">
        <template v-slot:default>
          <v-icon size="15" class="mt-n1">mdi-help</v-icon>
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
