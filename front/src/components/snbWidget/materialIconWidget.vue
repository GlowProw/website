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

const itemImages = import.meta.glob('@glow-prow-assets/items/*.png', {eager: true});

onMounted(() => {
  onImage()
})

const onImage = () => {
  const imageKey = `/node_modules/glow-prow-assets/items/${props.id}.png`;

  if (itemImages[imageKey]) {
    src.value = itemImages[imageKey].default;
  } else {
    src.value = '';
  }
}

</script>

<template>
  <ItemSlotBase :size="10" class="pa-0 material-icon">
    <img :src="src" :width="props.size || '20px'" lazy-src="@/assets/images/loading.gif" :height="props.size || '20px'"></img>
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
