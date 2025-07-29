<script setup lang="ts">
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import {onMounted, ref} from "vue";

import {useI18nUtils} from "../../assets/sripts/i18nUtil";

import EmptyView from "../EmptyView.vue";
import ItemSlotBase from "./ItemSlotBase.vue";

const damagesImages = import.meta.glob('@glow-prow-assets/damages/*.*', {eager: true}),
    modsImages = import.meta.glob('@glow-prow-assets/modifications/*.*', {eager: true}),
    images = {...damagesImages, ...modsImages},
    props = withDefaults(defineProps<{ data }>(), {
      data: null
    }),
    damageIconImages = ref([]),
    route = useRoute(),
    {t} = useI18n(),
    {asArray, sanitizeString} = useI18nUtils()


onMounted(() => {
  onReady()
})

const onReady = () => {
  const imageMap = {};
  for (const path in images) {
    const key = path.split('/').pop()
        ?.toString()
        .replace('.webp', '')
        .replace('.png', '');
    imageMap[key] = images[path];
  }

  props.data.perks.forEach(i => {
    let key = sanitizeString(i).cleaned;
    if (imageMap[key])
      damageIconImages.value.push({
        src: imageMap[key].default || '',
        key
      });
  })
}

/**
 * 获取属性名
 * @param key
 */
const getTitle = (key) => {
  let keys = [
    `snb.perks.${sanitizeString(key).cleaned}.name`
  ];

  return asArray(keys)[0] || '';
}
</script>

<template>
  <v-card class="mt-4 bg-transparent d-flex ga-3" v-if="damageIconImages.length > 0">
    <ItemSlotBase padding="4" v-for="(i, index) in damageIconImages" :key="index"
         class="mr-1"
         v-tooltip="getTitle(i.key)">
      <v-img :src="i.src" width="30px" height="30px"></v-img>
    </ItemSlotBase>
  </v-card>
  <template v-else>
    <EmptyView></EmptyView>
  </template>
</template>

<style scoped lang="less">

</style>
