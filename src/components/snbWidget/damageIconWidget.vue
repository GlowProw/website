<script setup lang="ts">
import {computed, nextTick, onMounted, ref} from "vue";
import {useAssetsStore} from "~/stores/assetsStore";

const props = withDefaults(
        defineProps<{ id: string, iconType?: "aggressivity"| "armor", size?: string | number, isBorder?: boolean }>(),
        {iconType: "armor", isBorder: true}
    ),
    damagesAggressivityImages = import.meta.glob(`@glow-prow-assets/damages/aggressivity/*.*`, {eager: true}),
    damagesArmorImages = import.meta.glob(`@glow-prow-assets/damages/armor/*.*`, {eager: true}),
    modsImages = import.meta.glob('@glow-prow-assets/modifications/*', {eager: true}),

    emit = defineEmits(['read-end']),
    {serializationMap} = useAssetsStore(),

    // 属性字典
    damageDictionaries = {
      "fire": "burning"
    }

let icons = ref({}),
    images = ref({...modsImages}),
    getIcon = computed(() => icons.value[damageDictionaries[props.id] || props.id]),
    isHasIcon = computed(() => !!getIcon.value)

onMounted(() => {
  onReady()
})


const onReady = () => {
  switch (props.iconType) {
    case "aggressivity":
      images.value = {...images.value, ...damagesAggressivityImages}
      break;
    case "armor":
      images.value = {...images.value,...damagesArmorImages}
      break;
  }

  nextTick(() => {
    icons.value = serializationMap(images.value)

    emit('read-end', isHasIcon.value)
  })
}

defineExpose({
  damageDictionaries,
})
</script>

<template>
  <v-card elevation="0"
          class="w-100 h-100 d-flex justify-center align-center bg-transparent prohibit-drag"
          variant="text"
          :border="isBorder">
    <v-img :src="getIcon" :width="size" :height="size"></v-img>
  </v-card>
</template>

<style scoped lang="less">

</style>
