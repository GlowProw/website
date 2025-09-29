<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";

const materialImages = import.meta.glob('@glow-prow-assets/materials/*.*', {eager: true});
const props = withDefaults(defineProps<{
      id: string | undefined,
      imageType?: string,
      size?: string | number
    }>(), {
      size: 20
    }),
    {t} = useI18n()

let src = ref('')

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
  <v-card :to="`/display-cabinet/material/${id}`" class="w-100 h-100"
          v-tooltip="t(`snb.materials.${id}.name`)"
          v-if="id">
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
