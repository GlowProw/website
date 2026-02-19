<script setup lang="ts">
import {nextTick, onMounted, ref} from "vue";
import {useAssetsStore} from "~/stores/assetsStore";

const
    props = withDefaults(
        defineProps<{ id: string, size?: string | number, isBorder?: boolean }>(),
        {isBorder: true}
    ),
    damagesImages = import.meta.glob('@glow-prow-assets/damages/*', {eager: true}),
    modsImages = import.meta.glob('@glow-prow-assets/modifications/*', {eager: true}),
    images = {...damagesImages, ...modsImages},

    {serializationMap} = useAssetsStore(),
    // 属性字典
    damageDictionaries = {
      "fire": "burning"
    }

let icons = ref({})

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
  <v-card elevation="0"
          class="w-100 h-100 d-flex justify-center align-center bg-transparent prohibit-drag"
          variant="text"
          :border="isBorder">
    <v-img :src="icons[damageDictionaries[id] || id]" :width="size" :height="size"></v-img>
  </v-card>
</template>

<style scoped lang="less">

</style>
