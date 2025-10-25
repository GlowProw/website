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
import {useFullscreen} from '@/assets/sripts/useFullscreen'

const
    props = defineProps<{ viewRef?: any }>(),
    {
      isFullscreen,
      toggleFullscreen,
      isSupported
    } = useFullscreen(props.viewRef)

const handleToggle = async () => {
  await toggleFullscreen()
}
</script>

<style scoped>
</style>
