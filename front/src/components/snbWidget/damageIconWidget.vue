<script setup lang="ts">
import {nextTick, onMounted, ref} from "vue";
import {useAssetsStore} from "~/stores/assetsStore";

const damagesImages = import.meta.glob('@glow-prow-assets/damages/*', {eager: true}),
    modsImages = import.meta.glob('@glow-prow-assets/modifications/*', {eager: true}),
    images = {...damagesImages, ...modsImages},
    props = withDefaults(
        defineProps<{ id: string, size?: string | number, isBorder?: boolean }>(),
        {isBorder: true}
    ),
    {serializationMap} = useAssetsStore()

let icons = ref({})

/**
 * 是否有图标
 * @param id
 */
const hasIconAssets = (id) => {
  return !!icons.value[id]
}

onMounted(() => {
  onReady()
})

const onReady = () => {
  nextTick(() => {
    icons.value = serializationMap(images)
  })
}
</script>

<template>
  <v-card elevation="0" class="w-100 h-100 d-flex justify-center align-center" variant="text" :border="isBorder" v-if="hasIconAssets(id)">
    <v-img :src="icons[id]" :width="size" :height="size"></v-img>
  </v-card>
</template>

<style scoped lang="less">

</style>
