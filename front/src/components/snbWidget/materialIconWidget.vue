<script setup lang="ts">
import {onMounted, ref, watch} from "vue";

const props = withDefaults(defineProps<{
  id: string,
  imageType?: string,
  size?: string
}>(), {
  size: 20
})

let src = ref('')

const materialImages = import.meta.glob('@glow-prow-assets/materials/*.*', {eager: true});

watch(() => props.id, () => {
  onImage()
})

onMounted(() => {
  onImage()
})

const onImage = () => {
  const imageMap = {};
  for (const path in materialImages) {
    const key = path.split('/').pop()
        ?.toString()
        .replace('.webp', '')
        .replace('.png', '');
    imageMap[key] = materialImages[path];
  }

  if (imageMap[props.id] && imageMap[props.id].default) {
    src.value = imageMap[props.id].default
  } else {
    src.value = `https://skullandbonestools.de/api/imagesservice?src=materials%2F${props.id}&width=128`
  }
}

</script>

<template>
  <v-card :to="`/display-cabinet/material/${id}`" class="w-100 h-100">
    <v-img :src="src"
           width="100%"
           height="100%"
           cover
           lazy-src="@/assets/images/loading.gif">
      <template v-slot:error>
        <v-icon>mdi-error</v-icon>
      </template>
    </v-img>
  </v-card>
</template>

<style scoped lang="less">
.material-icon {
  user-select: none;

  * {
    -webkit-user-drag: none;
  }
}
</style>
