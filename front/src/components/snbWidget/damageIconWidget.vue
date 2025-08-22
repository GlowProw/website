<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useItemAssetsStore} from "~/stores/itemAssetsStore";

const damagesImages = import.meta.glob('@glow-prow-assets/damages/*', {eager: true}),
    modsImages = import.meta.glob('@glow-prow-assets/modifications/*', {eager: true}),
    images = {...damagesImages, ...modsImages},
    props = defineProps<{ id: string, size?: string | number }>(),
    {serializationMap} = useItemAssetsStore()

let icons = ref({}),
    isShow = ref(true)

onMounted(() => {
  onReady()
})

const onReady = () => {
  icons.value = serializationMap(images)
  isShow.value = !!icons.value[props.id]
}

defineExpose({
  isShow,
})
</script>

<template>
  <v-card tile class="pa-1 w-100 h-100 bg-transparent d-flex justify-center align-center" border>
    <v-img :src="icons[id]" :width="size" :height="size"></v-img>
  </v-card>
</template>

<style scoped lang="less">

</style>
