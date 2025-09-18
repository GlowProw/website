<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
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

  modsData.value.icon = imageMap[props.id]?.default || null
}
</script>

<template>
  <v-card
      tile
      border
      variant="text"
      :to="isClickOpenDetail ? `/display-cabinet/mod/${id}` : ''"
      :class="`pa-${props.padding} cursor-pointer`"
      height="100%"
      width="100%">
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
  background-color:  #d500002b !important;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}
</style>
