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

const mapContainerRef = ref<HTMLElement | null>(null);
const mapInstance = ref<Map | null>(null);

const emit = defineEmits(['map-created']);

const props = defineProps<{
  longitude?: number;
  latitude?: number;
  locationId?: string;
  locations: any[];
}>();

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
        doubleClickZoom: false,
      }),
      view: new View({
        center: fromLonLat([-0.667206, 0.626653]),
        zoom: 13,
        maxZoom: 15,
        minZoom: 12,
      }),
    });
    mapInstance.value = map;
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
      duration: 500,
    });
  }
};

watch(() => [props.longitude, props.latitude], ([lon, lat]) => {
  if (lon !== undefined && lat !== undefined) {
    panTo(lon, lat);
  }
});

watch(() => props.locationId, (id) => {
  if (id) {
    const location = props.locations.find(loc => loc.id === id);
    if (location) {
      panTo(location.longitude, location.latitude);
    }
  }
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
