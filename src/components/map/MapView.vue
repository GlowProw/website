<template>
  <div class="map-container" ref="mapContainerRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, transformExtent } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import DragPan from 'ol/interaction/DragPan';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import PinchZoom from 'ol/interaction/PinchZoom';
import DoubleClickZoom from 'ol/interaction/DoubleClickZoom';

const mapContainerRef = ref<HTMLElement | null>(null);
const mapInstance = ref<Map | null>(null);

const emit = defineEmits(['map-created']);

const props = withDefaults(defineProps<{
  longitude?: number;
  latitude?: number;
  locationId?: string;
  locations?: any[];
  draggable?: boolean;
  zoomable?: boolean;
  initialZoom?: number;
  animated?: boolean;
  /** 地图边界 [minLon, minLat, maxLon, maxLat]，超出此范围将被约束回来 */
  bounds?: [number, number, number, number];
  /** debug 模式，开启后解除缩放限制 */
  debug?: boolean;
}>(), {
  locations: () => [],
  draggable: true,
  zoomable: true,
  initialZoom: 13,
  animated: true,
  bounds: undefined,
  debug: false,
});

const dragPanInteraction = new DragPan();
const mouseWheelZoomInteraction = new MouseWheelZoom();
const pinchZoomInteraction = new PinchZoom();
const doubleClickZoomInteraction = new DoubleClickZoom();

/** 将经纬度边界转换为 EPSG:3857 投影下的 extent */
const computedExtent = computed(() => {
  if (!props.bounds) return undefined;
  const [minLon, minLat, maxLon, maxLat] = props.bounds;
  return transformExtent([minLon, minLat, maxLon, maxLat], 'EPSG:4326', 'EPSG:3857');
});

const updateInteractions = () => {
  const dragEnabled = props.draggable;
  const zoomEnabled = props.zoomable;
  dragPanInteraction.setActive(dragEnabled);
  mouseWheelZoomInteraction.setActive(zoomEnabled);
  pinchZoomInteraction.setActive(zoomEnabled);
  doubleClickZoomInteraction.setActive(zoomEnabled);
};

onMounted(() => {
  if (mapContainerRef.value) {
    const map = new Map({
      target: mapContainerRef.value,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://tiles.mapgenie.io/games/skull-and-bones/indian-ocean/default-v1/{z}/{y}/{x}.jpg',
            crossOrigin: 'anonymous',
          }),
        }),
      ],
      controls: defaultControls({
        zoom: false,
        rotate: false,
      }),
      interactions: defaultInteractions({
        dragPan: false,
        mouseWheelZoom: false,
        pinchZoom: false,
        doubleClickZoom: false,
      }).extend([
        dragPanInteraction,
        mouseWheelZoomInteraction,
        pinchZoomInteraction,
        doubleClickZoomInteraction,
      ]),
      view: new View({
        center: fromLonLat([-0.667206, 0.626653]),
        zoom: props.initialZoom,
        maxZoom: props.debug ? 28 : 15,
        minZoom: props.debug ? 1 : 12,
        // 边界约束：非 debug 模式下严格限制不能划出边界；debug 模式无视边界约束
        ...(!props.debug && computedExtent.value ? {
          extent: computedExtent.value,
        } : {}),
      }),
    });
    mapInstance.value = map;
    updateInteractions();

    if (props.longitude !== undefined && props.latitude !== undefined) {
      panTo(props.longitude, props.latitude);
    } else if (props.locationId && props.locations?.length) {
      const location = props.locations.find(loc => loc.id === props.locationId);
      if (location) {
        panTo(location.longitude, location.latitude);
      }
    }

    emit('map-created', map);
  }
});

onUnmounted(() => {
  if (mapInstance.value) {
    mapInstance.value.setTarget(undefined);
    mapInstance.value = null;
  }
});

const panTo = (lon: number, lat: number) => {
  if (mapInstance.value) {
    mapInstance.value.getView().animate({
      center: fromLonLat([lon, lat]),
      duration: props.animated ? 500 : 0,
    });
  }
};

watch(() => [props.longitude, props.latitude], ([lon, lat]) => {
  if (lon !== undefined && lat !== undefined) {
    panTo(lon, lat);
  }
});

watch(() => [props.locationId, props.locations], () => {
  if (props.locationId && props.locations?.length) {
    const location = props.locations.find(loc => loc.id === props.locationId);
    if (location) {
      panTo(location.longitude, location.latitude);
    }
  }
});

watch(() => [props.draggable, props.zoomable], () => {
  updateInteractions();
});

/** 当 bounds 或 debug prop 变化时，动态更新地图 View 的约束 */
watch(() => [props.bounds, props.debug], () => {
  if (!mapInstance.value) return;
  const oldView = mapInstance.value.getView();
  const currentCenter = oldView.getCenter();
  const currentZoom = oldView.getZoom();

  const newView = new View({
    center: currentCenter,
    zoom: currentZoom,
    maxZoom: props.debug ? 28 : 15,
    minZoom: props.debug ? 1 : 12,
    ...(!props.debug && computedExtent.value ? {
      extent: computedExtent.value,
    } : {}),
  });
  mapInstance.value.setView(newView);
});

defineExpose({
  map: mapInstance,
});

defineOptions({ name: 'MapView' });
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
