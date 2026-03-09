<script lang="ts">
export default { name: 'FullscreenBtn' }
</script>

<template>
  <v-btn tile stacked density="compact"
         v-if="isSupported"
         class="fullscreen-toggle"
         :class="{ 'fullscreen-active': isFullscreen }"
         @click="handleToggle">
    <span class="fullscreen-icon">
      <v-icon v-if="!isFullscreen">mdi-fullscreen</v-icon>
      <v-icon v-else>mdi-fullscreen-exit</v-icon>
    </span>
  </v-btn>
</template>

<script setup lang="ts">
import {use_full_screen} from '@/assets/sripts/use_full_screen'
import {watch} from "vue";
import {onBeforeRouteLeave, useRoute} from "vue-router";

const props = defineProps<{ viewRef?: any }>(),
    {
      isFullscreen,
      toggleFullscreen,
      isSupported
    } = use_full_screen(props.viewRef),
    route = useRoute(),
    emit = defineEmits(['update:isFull'])

onBeforeRouteLeave((to, from, next) => {
  if (isFullscreen.value) {
    toggleFullscreen().then(() => {
      next()
    })
  } else {
    next()
  }
})

watch(() => isFullscreen.value, (value) => {
  emit('update:isFull', value)
})

const handleToggle = async () => {
  await toggleFullscreen()
}
</script>

<style scoped>
</style>
