<script setup lang="ts">
import {onMounted, ref} from "vue";
import ItemSlotBase from "./ItemSlotBase.vue";

const props = defineProps<{
  id: string,
  imageType?: string,
  itemType: string,
  size?: string
}>()

let src = ref('')

const itemImages = import.meta.glob('@glow-prow-assets/items/*.*', {eager: true});

onMounted(() => {
  onImage()
})

const onImage = () => {
  const imageMap = {};
  for (const path in itemImages) {
    const key = path.split('/').pop()
        ?.toString()
        .replace('.webp', '')
        .replace('.png', '');
    imageMap[key] = itemImages[path];
  }

  src.value = imageMap[props.id].default
}

</script>

<template>
  <ItemSlotBase :size="10" class="pa-0 material-icon">
    <v-img :src="src" :width="props.size || '20px'" cover lazy-src="@/assets/images/loading.gif" :height="props.size || '20px'"></v-img>
  </ItemSlotBase>
</template>

<style scoped lang="less">
.material-icon {
  user-select: none;

  * {
    -webkit-user-drag: none;
  }
}
</style>
