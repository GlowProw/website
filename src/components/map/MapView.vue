<template>
  <div class="map-container" ref="mapContainerRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
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
}>(), {
  locations: () => [],
  draggable: true,
  zoomable: true,
  initialZoom: 13,
  animated: true,
});

const dragPanInteraction = new DragPan();
const mouseWheelZoomInteraction = new MouseWheelZoom();
const pinchZoomInteraction = new PinchZoom();
const doubleClickZoomInteraction = new DoubleClickZoom();

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
        maxZoom: 15,
        minZoom: 12,
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
