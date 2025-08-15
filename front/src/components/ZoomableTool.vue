<template>
  <v-card border class="zoomable-tool" width="40">
    <v-btn tile block class="d-block" @click="emit('event-center')">
      <v-icon icon="mdi-refresh" size="25"></v-icon>
    </v-btn>
    <v-divider></v-divider>
    <v-btn tile block class="d-block" @click="emit('event-plus')">
      <v-icon icon="mdi-magnify-plus-outline" size="25"></v-icon>
    </v-btn>
    <v-btn tile block class="d-block" @click="emit('event-minus')">
      <v-icon icon="mdi-magnify-minus-outline" size="25"></v-icon>
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
const emit = defineEmits(['event-center', 'event-plus', 'event-minus'])
</script>

<style scoped lang="less">
.zoomable-tool {
  position: absolute;
  z-index: 20;
  top: 30px;
  right: 30px;
}
</style>
