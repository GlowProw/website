<template>
  <div class="map-container" ref="mapContainerRef"></div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, shallowRef, watch} from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import {fromLonLat, toLonLat, transformExtent} from 'ol/proj';
import {defaults as defaultControls} from 'ol/control';
import {defaults as defaultInteractions} from 'ol/interaction';
import DragPan from 'ol/interaction/DragPan';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import PinchZoom from 'ol/interaction/PinchZoom';
import DoubleClickZoom from 'ol/interaction/DoubleClickZoom';
import Storage from '@/assets/sripts/storage';
import {storage_account} from '@/assets/sripts/index';

const storage = new Storage();
const SAVED_CENTER_STORAGE_KEY = 'map.view.center';

const mapContainerRef = ref<HTMLElement | null>(null);
// OL Map 是类实例，不能被深层响应式代理，否则内部图层身份比较会失效
const mapInstance = shallowRef<Map | null>(null);

const emit = defineEmits(['map-created']);

const props = withDefaults(defineProps<{
  longitude?: number;
  latitude?: number;
  zoom?: number;
  locationId?: string;
  locations?: any[];
  draggable?: boolean;
  zoomable?: boolean;
  initialZoom?: number;
  animated?: boolean;
  /**
   * 地图边界 [minLon, minLat, maxLon, maxLat]，超出此范围将被约束回来
   */
  bounds?: [number, number, number, number];
  debug?: boolean;
  /**
   * 是否在开启“记录地图中心”配置时加载并记录中心坐标
   */
  rememberCenter?: boolean;
}>(), {
  locations: () => [],
  draggable: true,
  zoomable: true,
  initialZoom: 13,
  animated: true,
  bounds: undefined,
  debug: false,
  rememberCenter: false,
});

const dragPanInteraction = new DragPan();
const mouseWheelZoomInteraction = new MouseWheelZoom();
const pinchZoomInteraction = new PinchZoom();
const doubleClickZoomInteraction = new DoubleClickZoom();

/**
 * 将经纬度边界转换为 EPSG:3857 投影下的 extent
 */
const computedExtent = computed(() => {
  if (!props.bounds) return undefined;
  const [minLon, minLat, maxLon, maxLat] = props.bounds;
  return transformExtent([minLon, minLat, maxLon, maxLat], 'EPSG:4326', 'EPSG:3857');
});

/**
 * 按 draggable / zoomable 开关切换平移和缩放手势的启用状态
 */
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
    let centerCoords = [-0.667206, 0.626653];
    let initialZoomLevel = props.initialZoom;

    // 当 rememberCenter 为 true 且设置开启时，优先还原上次记录的中心坐标
    const isRememberCenterActive = props.rememberCenter && storage_account.getConfigurationItem('map', 'rememberMapCenter', {defaultValue: false});
    if (isRememberCenterActive && props.longitude === undefined && props.latitude === undefined && !props.locationId) {
      const saved = storage.local.get(SAVED_CENTER_STORAGE_KEY)?.data?.value;
      if (saved && Number.isFinite(saved.longitude) && Number.isFinite(saved.latitude)) {
        centerCoords = [saved.longitude, saved.latitude];
        if (saved.zoom !== undefined && Number.isFinite(saved.zoom)) {
          initialZoomLevel = saved.zoom;
        }
      }
    }

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
        center: fromLonLat(centerCoords),
        zoom: initialZoomLevel,
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

    // 开启记录中心时，地图移动停止后保存当前中心与缩放
    map.on('moveend', () => {
      if (props.rememberCenter && storage_account.getConfigurationItem('map', 'rememberMapCenter', {defaultValue: false})) {
        const view = map.getView();
        const center = view.getCenter();
        if (center) {
          const [lon, lat] = toLonLat(center);
          const currentZoom = view.getZoom();
          storage.local.set(SAVED_CENTER_STORAGE_KEY, {
            longitude: Number(lon.toFixed(6)),
            latitude: Number(lat.toFixed(6)),
            zoom: currentZoom !== undefined ? Number(currentZoom.toFixed(2)) : undefined,
          });
        }
      }
    });

    if (props.longitude !== undefined && props.latitude !== undefined) {
      panTo(props.longitude, props.latitude, props.zoom);
    } else if (props.locationId && props.locations?.length) {
      const location = props.locations.find(loc => loc.id === props.locationId || (loc as any).key === props.locationId || loc.category === props.locationId);
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

/**
 * 把地图中心移动到指定经纬度，传了 zoom 就连同缩放级别一起还原
 */
const panTo = (lon: number, lat: number, zoom?: number) => {
  if (mapInstance.value) {
    mapInstance.value.getView().animate({
      center: fromLonLat([lon, lat]),
      // 链接指定了缩放级别时与平移一起还原，未指定则只移动中心
      ...(zoom !== undefined ? {zoom} : {}),
      duration: props.animated ? 500 : 0,
    });
  }
};

watch(() => [props.longitude, props.latitude, props.zoom], ([lon, lat, zoom]) => {
  if (lon !== undefined && lat !== undefined) {
    panTo(lon, lat, zoom);
  }
});

watch(() => [props.locationId, props.locations], () => {
  if (props.locationId && props.locations?.length) {
    const location = props.locations.find(loc => loc.id === props.locationId || (loc as any).key === props.locationId || loc.category === props.locationId);
    if (location) {
      panTo(location.longitude, location.latitude, props.zoom ?? 14.5);
    }
  }
});

watch(() => [props.draggable, props.zoomable], () => {
  updateInteractions();
});

/**
 * 当 bounds 或 debug prop 变化时，动态更新地图 View 的约束
 */
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

defineOptions({
  name: 'MapView'
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
