<script setup lang="ts">
import {computed} from 'vue'

const props = withDefaults(defineProps<{ size?: number | string }>(), {
  size: '20px'
})

const loadingSize = computed(() => props.size || '20px')
const isAutoSize = computed(() => props.size === 'auto')

defineOptions({
  name: 'Loading'
})
</script>

<template>
  <img
      src="@/assets/images/loading.gif"
      class="loading-img"
      :class="{ 'loading-img-auto': isAutoSize }"
      :width="isAutoSize ? undefined : loadingSize"
      :height="isAutoSize ? undefined : loadingSize"
      alt="loading"/>
</template>

<style scoped>
.loading-img-auto {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
