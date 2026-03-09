<script setup lang="ts">

import {use_map_controller} from "@/assets/sripts/use_map_controller";
import MapView from "@/components/map/MapView.vue";

const props = defineProps<{ targetLocation?: string[] , targetX?: string, targetY?: string }>()

const {
  onMapCreated,
  targetLocationId,
  locations
} = use_map_controller();
</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">
    <slot></slot>
  </p>
  <v-card height="180" border>
    <MapView
        class="map-view"
        :location-id="targetLocationId"
        :locations="locations"
        @map-created="onMapCreated"/>
  </v-card>
</template>

<style scoped lang="less">

</style>
