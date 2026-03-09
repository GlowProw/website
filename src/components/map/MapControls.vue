<template>
  <div class="map-controls">
    <v-btn class="control-btn" @click="emit('zoom-in')" variant="flat">
      <v-icon>mdi-plus</v-icon>
    </v-btn>
    <v-btn class="control-btn" @click="emit('zoom-out')" variant="flat">
      <v-icon>mdi-minus</v-icon>
    </v-btn>
    <v-btn class="control-btn" @click="emit('reset-view')" variant="flat">
      <v-icon>mdi-crosshairs-gps</v-icon>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['zoom-in', 'zoom-out', 'reset-view']);

defineOptions({ name: 'MapControls' });
</script>

<style scoped>
.map-controls {
  position: absolute;
  bottom: 45px;
  left: 30px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-btn {
  min-width: 40px !important;
  width: 40px;
  height: 40px;
}
</style>
