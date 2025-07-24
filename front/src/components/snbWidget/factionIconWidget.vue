<script setup lang="ts">
import {onMounted, type Ref, ref} from "vue";
import ItemSlotBase from "./ItemSlotBase.vue";

const factionImages = import.meta.glob('@glow-prow-assets/factions/*.png', {eager: true});

let src: Ref<string | null> = ref(null)

const props = defineProps<{ name: string, size: string }>()

onMounted(() => {
  onImage()
})

const onImage = () => {
  const imageKey = `/node_modules/glow-prow-assets/factions/${props.name}.png`;

  if (factionImages[imageKey]) {
    src.value = factionImages[imageKey].default;
  } else {
    src.value = null;
  }
}

</script>

<template>
  <ItemSlotBase size="10" class="ma-1 ml-2 faction-icon" v-if="src">
    <v-img :src="src" lazy-src="@/assets/images/loading.gif" class="ma-n1"  :style="`height: ${size}; width: ${size};min-height: ${size}; min-width: ${size}`"></v-img>
  </ItemSlotBase>
</template>

<style scoped lang="less">
.faction-icon {
  user-select: none;

  * {
    -webkit-user-drag: none;
  }
}
</style>
