<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { use_map_controller } from "@/assets/sripts/use_map_controller";
import MapView from "@/components/map/MapView.vue";
import type {ByMapWidgetProps} from "@/assets/types/Map";

const props = withDefaults(defineProps<ByMapWidgetProps>(), {
  draggable: true,
  zoomable: true,
  initialZoom: 14,
  animated: true,
  openInMapView: false,
});

const route = useRoute();
const router = useRouter();

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

const targetCoords = computed(() => {
  if (longitude.value !== undefined && latitude.value !== undefined) {
    return { lon: longitude.value, lat: latitude.value };
  }
  return undefined;
});

/**
 * 点击地图点位时跳到完整地图，并带上对应位置参数
 * 详情页只做一个缩略预览，真正的点位信息交回 /map/view 处理
 */
const openLocationInMapView = (location: any): boolean => {
  if (!props.openInMapView || !location) return false;
  const lang = route.params.lang;
  const query: Record<string, string | number> = {
    key: location.id,
    x: location.longitude,
    y: location.latitude,
    category: location.category,
  };
  router.push({name: 'mapView', params: lang ? {lang} : undefined, query});
  return true;
};

const {
  onMapCreated,
  locations
} = use_map_controller({
  highlightTargetKey: locationId,
  highlightCoords: targetCoords,
  // 内嵌小地图不加载用户地图集与个人标记
  loadUserMarkers: false,
  onLocationClick: openLocationInMapView,
});
</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">
    <slot></slot>
  </p>
  <v-card height="260" border>
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
