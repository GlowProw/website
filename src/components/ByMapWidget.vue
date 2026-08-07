<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { use_map_controller } from "@/assets/sripts/use_map_controller";
import MapView from "@/components/map/MapView.vue";

interface Props {
  targetKey?: string;
  targetX?: number | string;
  targetY?: number | string;
  draggable?: boolean;
  zoomable?: boolean;
  initialZoom?: number;
  animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  draggable: true,
  zoomable: true,
  initialZoom: 13,
  animated: true,
});

const {
  onMapCreated,
  locations
} = use_map_controller();

const hasXY = computed(() => {
  return (props.targetX !== undefined && props.targetX !== '') || 
         (props.targetY !== undefined && props.targetY !== '');
});

const hasKey = computed(() => {
  return props.targetKey !== undefined && props.targetKey !== '';
});

watchEffect(() => {
  if (hasXY.value && hasKey.value) {
    console.warn('[ByMapWidget] (target-x, target-y) 与 target-key 不可共用，请二选一。');
  }
});

const longitude = computed<number | undefined>(() => {
  if (hasXY.value && props.targetX !== undefined && props.targetX !== '') {
    const val = typeof props.targetX === 'number' ? props.targetX : parseFloat(props.targetX);
    return isNaN(val) ? undefined : val;
  }
  return undefined;
});

const latitude = computed<number | undefined>(() => {
  if (hasXY.value && props.targetY !== undefined && props.targetY !== '') {
    const val = typeof props.targetY === 'number' ? props.targetY : parseFloat(props.targetY);
    return isNaN(val) ? undefined : val;
  }
  return undefined;
});

const locationId = computed<string | undefined>(() => {
  if (hasKey.value) {
    return props.targetKey;
  }
  return undefined;
});
</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">
    <slot></slot>
  </p>
  <v-card height="180" border>
    <MapView
        class="map-view"
        :longitude="longitude"
        :latitude="latitude"
        :location-id="locationId"
        :locations="locations"
        :draggable="props.draggable"
        :zoomable="props.zoomable"
        :initial-zoom="props.initialZoom"
        :animated="props.animated"
        @map-created="onMapCreated"/>
  </v-card>
</template>

<style scoped lang="less">

</style>

