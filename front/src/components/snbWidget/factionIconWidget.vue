<script setup lang="ts">
import {onMounted, type Ref, ref, watch} from "vue";

const factionImages = import.meta.glob('@glow-prow-assets/factions/*.png', {eager: true});

let src: Ref<string | null> = ref(null)

const props = withDefaults(
    defineProps<{ name: string, size: string, class?: string }>(),
    {
      size: '20px'
    }
)

watch(() => props.name, () => {
  onImage()
})

onMounted(() => {
  onImage()
})

/**
 * 处理阵营图片
 */
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
  <v-card :class="props.class" class="w-100 h-100">
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
.faction-icon {
  user-select: none;

  * {
    -webkit-user-drag: none;
  }
}
</style>
