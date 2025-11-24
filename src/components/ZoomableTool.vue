<template>
  <v-card elevation="10" class="zoomable-tool" width="40"
          :style="{'right': `calc(${mobile ? 40 : 0}px + 20px)`}">
    <v-btn elevation="0" tile block class="d-block" @click="emit('event-center')">
      <v-icon icon="mdi-image-filter-center-focus-weak" size="25"></v-icon>
    </v-btn>
    <v-divider class="mx-2 my-2"></v-divider>
    <v-btn elevation="0" tile block class="d-block" @click="emit('event-plus')">
      <v-icon icon="mdi-magnify-plus-outline" size="25"></v-icon>
    </v-btn>
    <v-btn elevation="0" tile block class="d-block" @click="emit('event-minus')">
      <v-icon icon="mdi-magnify-minus-outline" size="25"></v-icon>
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
import {useDisplay} from "vuetify/framework";

const emit = defineEmits(['event-center', 'event-plus', 'event-minus']),
    {mobile, lg} = useDisplay()
</script>

<style scoped lang="less">
.zoomable-tool {
  position: absolute;
  z-index: 20;
  top: 60px;
}
</style>
