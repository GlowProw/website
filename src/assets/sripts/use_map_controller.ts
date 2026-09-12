import { computed, ref, type Ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify';
import { useAssetsStore } from '~/stores/assetsStore';
import { useAuthStore } from '~/stores/userAccountStore';
import { useNoticeStore } from '~/stores/noticeStore';
import { useAppStore } from '~/stores/appStore';
import Storage from '@/assets/sripts/storage';
import { useMapApi } from '@/assets/sripts/api/map_service';
import { useI18nUtils } from "@/assets/sripts/i18n_util.js";
import { MapLocations } from "glow-prow-data";
import type { MapCollection, MapPoint } from '@/assets/types/Map';
import { ApiError } from "@/assets/types/Api";
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style } from 'ol/style';
import { pointerMove } from 'ol/events/condition';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import type { Feature as OLFeature } from 'ol';
import type { Geometry } from 'ol/geom';

/**
 * 地图控制器
 */
export function use_map_controller() {
    const mapImages = import.meta.glob('/src/assets/images/map/*.*', { eager: true });
    const { t } = useI18n();
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const notice = useNoticeStore();
    const api = useMapApi();
    const { asString } = useI18nUtils();
    const { mobile } = useDisplay();
    const { serializationMap } = useAssetsStore();
    const storageObj = new Storage();

    /**
     * 地图可视边界
     * 格式：[minLon, minLat, maxLon, maxLat]
     * 用户无法将地图中心拖出此范围之外
     */
    const MAP_BOUNDS: [number, number, number, number] = [-1.054679, 0.419639, -0.351548, 1.040574];

    const CATEGORY_GROUPS: Record<string, string[]> = {
        'pirateBases': ['den', 'outpost'],              // 海盗据点
        'settlements': ['settlement', 'capitalSettlement'], // 定居点
        'productionSites': ['foundry', 'lumberyard', 'weaver'], // 生产设施
        'fortifications': ['megafort', 'militaryBase'],  // 军事要塞
    };

    const mapInstance: Ref<Map | null> = ref(null);
    const vectorLayerRef: Ref<VectorLayer<VectorSource> | null> = ref(null);
    const mapCenterLocation: Ref<number[]> = ref([-0.667206, 0.626653]);
    const mapBounds = ref<[number, number, number, number]>(MAP_BOUNDS);
    const locations: Ref<any[]> = ref(Object.values(MapLocations));
    const icons: Ref<Record<string, string>> = ref({});
    const isFull = ref(false);
    const model = ref<boolean>(false);
    const selectedLocationData: Ref<Record<any, any>> = ref({});
    const showCoordinateInfo = ref<boolean>(false);
    const clickedCoordinate = ref({ longitude: 0, latitude: 0 });
    const hoveedCoordinate = ref({ longitude: 0, latitude: 0 });

    const targetLongitude = ref<number | undefined>();
    const targetLatitude = ref<number | undefined>();
    const targetLocationId = ref<string | undefined>();

    const searchQuery = ref(null);
    const searchInput = ref('');
    const searchSuggestions = ref<any[]>([]);

    /** 右键/长按上下文菜单状态 */
    const contextMenuState = ref({
        visible: false,
        x: 0,
        y: 0,
        pixel: [0, 0] as [number, number],
        coordinate: [0, 0] as [number, number],
        feature: null as OLFeature<Geometry> | null,
    });

    /** debug 模式下边界编辑是否激活 */
    const isEditingBounds = ref(false);

    const isShowMarkModel = ref(false);
    const layerVisibility: Ref<Record<string, boolean>> = ref({});
    const groupVisibility: Ref<Record<string, boolean>> = ref({});
    const allLayersVisible = ref(true);

    const userCollections = ref<MapCollection[]>([]);
    const selectedCollectionUuid = ref<string>('');
    const selectedLocationNearbyPoints = ref([]);
    const personalMarkers = ref<MapPoint[]>([]);
    const showCreateMarkerDialog = ref(false);
    const creatingMarker = ref(false);
    const selectedPoint = ref<MapPoint | null>(null);

    const markerFormRef = ref(null);
    const newMarkerData = ref({
        collectionUuid: '',
        title: '',
        description: '',
        longitude: 0,
        latitude: 0,
        address: '',
        tags: [] as string[],
        public: false,
        sharedUsers: [] as string[],
    });
    const editingMarker = ref(false);

    const availableCategories = computed(() => {
        const uniqueCategories = [...new Set(locations.value.map(loc => loc.category))];
        return uniqueCategories.map(category => ({
            value: category,
            text: t(`map.types.${category}.name`),
        }));
    });

    const groupedCategories = computed(() => {
        const result: Record<string, any[]> = {};

        Object.keys(CATEGORY_GROUPS).forEach(group => {
            result[group] = [];
        });

        result['other'] = [];

        availableCategories.value.forEach(category => {
            let foundGroup = false;
            for (const [groupTitle, categories] of Object.entries(CATEGORY_GROUPS)) {
                if (categories.includes(category.value)) {
                    result[groupTitle].push(category);
                    foundGroup = true;
                    break;
                }
            }
            if (!foundGroup) {
                result['other'].push(category);
            }
        });

        // 过滤空分组
        return Object.fromEntries(Object.entries(result).filter(([_, items]) => items.length > 0));
    });

    const personalMarkersCount = computed(() => personalMarkers.value.length);

    const userCollectionsSelect = computed(() => {
        return [{ title: t('none'), uuid: null }].concat(userCollections.value as []);
    });

    const appStore = useAppStore();
    const isDebug = computed(() => appStore.isDebug);

    watch(searchInput, (value) => {
        if (!value || !value.trim()) {
            searchSuggestions.value = [];
            return;
        }
        const filtered = locations.value.filter(location => {
            const displayName = getLocationDisplayName(location).toLowerCase();
            const locationId = location.id.toLowerCase();
            const searchTerm = value.toLowerCase().trim();
            return displayName.includes(searchTerm) || locationId.includes(searchTerm);
        }).slice(0, 10);
        searchSuggestions.value = filtered.map(location => ({ title: getLocationDisplayName(location), value: location.id, ...location }));
    });

    watch(searchQuery, (value) => {
        if (typeof value === 'object' && value !== null) {
            onSelectLocation(value);
        }
    });

    watch(selectedLocationData, async () => {
        if (!authStore.isLogin) return;

        if (model.value === true && selectedLocationData.value) {
            const { latitude, longitude } = selectedLocationData.value;
            if (latitude !== undefined && longitude !== undefined) {
                await onSearchNearbyPoints(latitude, longitude);
            }
        }
    });

    watch(selectedCollectionUuid, async (newCollectionUuid) => {
        if (!authStore.isLogin) return;

        if (newCollectionUuid) {
            storageObj.local.set('map.selectedCollection', newCollectionUuid);
            await loadCollectionPoints(newCollectionUuid);
        } else {
            storageObj.local.rem('map.selectedCollection');
            personalMarkers.value = [];
            onRemovePersonalMarkersFromMap();
        }
    });

    const onMapCreated = (map: Map) => {
        mapInstance.value = map;
        initializeMap(map);
    };

    const initializeMap = async (map: Map) => {
        const { x: queryX, y: queryY, key: queryKey, category: queryCategory } = route.query;

        initializeLayerVisibility();
        icons.value = serializationMap(mapImages);

        // debug 模式下添加边界编辑图层
        if (isDebug.value) {
            setupDebugBoundsLayer(map);
        }

        const vectorSource = new VectorSource({
            features: onCreateFeaturesFromLocations(locations.value),
        });

        const vectorLayer = new VectorLayer({
            source: vectorSource,
            zIndex: 100,
            style: (feature) => {
                const originalData = feature.get('originalData');
                const featureCategory = originalData?.category;

                if (featureCategory === 'shareLocation') {
                    const isPersonalVisible = layerVisibility.value.shareLocation;
                    return isPersonalVisible ? onCreatePersonalMarkerStyle() : null;
                }

                const isSystemVisible = layerVisibility.value[featureCategory];
                return isSystemVisible ? onCreateMarkerStyle(feature) : null;
            },
        } as any);

        vectorLayer.set('isMainVectorLayer', true);
        vectorLayerRef.value = vectorLayer;
        map.addLayer(vectorLayer);

        const hoverInteraction = new Select({
            condition: pointerMove,
            layers: [vectorLayer],
            hitTolerance: 10,
            style: null,
        });

        map.addInteraction(hoverInteraction);

        hoverInteraction.on('select', (event) => {
            const mapElement = map.getTargetElement();
            if (mapElement) {
                mapElement.style.cursor = event.selected.length > 0 ? 'pointer' : '';
            }
        });

        map.on('click', async (event) => {
            closeContextMenu();
            const feature = map.forEachFeatureAtPixel(event.pixel,
                (feature) => feature as OLFeature<Geometry>,
                { layerFilter: (l) => l.get('isMainVectorLayer') === true, hitTolerance: 10 }
            );

            if (feature) {
                const originalData = feature.get('originalData');
                if (!originalData) return;

                if (originalData?.category === 'shareLocation') {
                    selectedPoint.value = originalData;
                    selectedLocationData.value = { ...originalData, id: originalData.id, name: originalData.title, category: 'shareLocation' };
                    model.value = true;
                    showCoordinateInfo.value = false;
                    await router.push({ name: route.name, query: { ...route.query, key: originalData.id, category: 'shareLocation' } });
                    return;
                }

                selectedLocationData.value = originalData;
                model.value = true;
                showCoordinateInfo.value = false;
                await router.push({ name: route.name, query: { ...route.query, key: selectedLocationData.value?.id, category: selectedLocationData.value?.category } });
                return;
            }

            showCoordinateInfo.value = true;
            model.value = false;
            await router.push({ name: route.name, query: {} });
        });

        // 阻止浏览器默认右键菜单
        map.getTargetElement().addEventListener('contextmenu', (e) => e.preventDefault());

        // 右键菜单（桌面）
        map.getTargetElement().addEventListener('contextmenu', (e: MouseEvent) => {
            const pixel = map.getEventPixel(e);
            const feature = map.forEachFeatureAtPixel(pixel,
                (f) => f as OLFeature<Geometry>,
                { layerFilter: (l) => l.get('isMainVectorLayer') === true, hitTolerance: 15 }
            ) ?? null;
            const coord = toLonLat(map.getCoordinateFromPixel(pixel));
            openContextMenu(e.clientX, e.clientY, pixel as [number, number], coord as [number, number], feature);
        });

        // 触摸长按（移动设备）
        setupTouchLongPress(map);

        map.on('pointermove', (event) => {
            if (event.dragging) return;
            const lonLat = toLonLat(event.coordinate);
            hoveedCoordinate.value = { longitude: lonLat[0], latitude: lonLat[1] };
        });

        await onLoadUserCollections();

        if (queryKey) {
            await onHandleUrlParams(queryKey as string, queryX as string, queryY as string, queryCategory as string, vectorSource);
        }
    };

    /** 打开右键上下文菜单 */
    const openContextMenu = (
        clientX: number,
        clientY: number,
        pixel: [number, number],
        coordinate: [number, number],
        feature: OLFeature<Geometry> | null
    ) => {
        contextMenuState.value = {
            visible: true,
            x: clientX,
            y: clientY,
            pixel,
            coordinate,
            feature,
        };
    };

    /** 关闭右键菜单 */
    const closeContextMenu = () => {
        contextMenuState.value.visible = false;
    };

    /**
     * 触摸设备长按 500ms 触发右键菜单
     * 拖拽时取消，避免误触
     */
    const setupTouchLongPress = (map: Map) => {
        const el = map.getTargetElement();
        let touchTimer: ReturnType<typeof setTimeout> | null = null;
        let touchStartX = 0;
        let touchStartY = 0;
        const LONG_PRESS_MS = 500;
        const MOVE_THRESHOLD = 8;

        el.addEventListener('touchstart', (e: TouchEvent) => {
            if (e.touches.length !== 1) return;
            const t = e.touches[0];
            touchStartX = t.clientX;
            touchStartY = t.clientY;
            touchTimer = setTimeout(() => {
                const pixel = map.getEventPixel(e);
                const feature = map.forEachFeatureAtPixel(pixel,
                    (f) => f as OLFeature<Geometry>,
                    { layerFilter: (l) => l.get('isMainVectorLayer') === true, hitTolerance: 15 }
                ) ?? null;
                const coord = toLonLat(map.getCoordinateFromPixel(pixel));
                openContextMenu(t.clientX, t.clientY, pixel as [number, number], coord as [number, number], feature);
            }, LONG_PRESS_MS);
        }, { passive: true });

        el.addEventListener('touchmove', (e: TouchEvent) => {
            if (!touchTimer) return;
            const t = e.touches[0];
            const dx = Math.abs(t.clientX - touchStartX);
            const dy = Math.abs(t.clientY - touchStartY);
            if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
                clearTimeout(touchTimer);
                touchTimer = null;
            }
        }, { passive: true });

        el.addEventListener('touchend', () => {
            if (touchTimer) {
                clearTimeout(touchTimer);
                touchTimer = null;
            }
        });
    };

    /**
     * 右键菜单项列表（根据点击的 feature 和 debug 状态动态生成）
     */
    const contextMenuItems = computed(() => {
        const feature = contextMenuState.value.feature;
        const coord = contextMenuState.value.coordinate;
        const items: any[] = [];

        if (feature) {
            // 点击了地标
            const originalData = feature.get('originalData');
            const locId = originalData?.id || feature.get('id');
            const locName = getLocationDisplayName(originalData || { id: locId });
            items.push({
                label: `${t('map.contextMenu.openDetail') || '打开详情'}${locName ? ` (${locName})` : ''}`,
                action: () => openLocationDetail(locId),
            });
        }

        // 在此添加标记
        items.push({
            label: t('map.contextMenu.addMarker') || '在此添加标记',
            action: () => {
                clickedCoordinate.value = { longitude: coord[0], latitude: coord[1] };
                newMarkerData.value = {
                    collectionUuid: selectedCollectionUuid.value || (userCollections.value[0]?.uuid || ''),
                    title: '',
                    description: '',
                    longitude: coord[0],
                    latitude: coord[1],
                    address: '',
                    tags: [],
                    public: false,
                    sharedUsers: [],
                };
                editingMarker.value = false;
                showCoordinateInfo.value = true;
                model.value = false;
                showCreateMarkerDialog.value = true;
                router.push({ name: route.name, query: {} });
            },
        });

        // 复制坐标
        items.push({
            label: t('map.contextMenu.copyCoordinates') || '复制坐标',
            action: () => copyCoordinates(coord),
        });

        // 复制当前位置链接
        items.push({
            label: t('map.contextMenu.copyLocationLink') || '复制当前位置链接',
            action: () => copyLocationLink(coord, feature),
        });

        // debug 模式额外菜单项
        if (isDebug.value) {
            items.push({ type: 'divider' });
            items.push({
                label: isEditingBounds.value
                    ? (t('map.contextMenu.stopEditBounds') || '停止编辑边界')
                    : (t('map.contextMenu.editBounds') || '编辑地图边界'),
                badge: 'DEBUG',
                action: () => {
                    isEditingBounds.value = !isEditingBounds.value;
                },
            });
            if (isEditingBounds.value) {
                items.push({
                    label: t('map.contextMenu.fitBoundsToViewport') || '将边界定位至当前视口',
                    badge: 'DEBUG',
                    action: () => {
                        resetBoundsToCurrentViewport();
                    },
                });
            }
        }

        return items;
    });

    /** 复制经纬度坐标 */
    const copyCoordinates = async (coord: [number, number]) => {
        const text = `${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}`;
        try {
            await navigator.clipboard.writeText(text);
            notice.success(t('map.contextMenu.copiedCoordinatesTip'));
        } catch (e) {
            console.error('Copy failed', e);
        }
    };

    /** 复制当前位置 URL 链接 */
    const copyLocationLink = async (coord: [number, number], feature?: any) => {
        let url = `${window.location.origin}${route.path}`;
        if (feature) {
            const originalData = feature.get('originalData');
            const locId = originalData?.id || feature.get('id');
            const cat = originalData?.category || 'location';
            url += `?key=${locId}&x=${coord[0].toFixed(6)}&y=${coord[1].toFixed(6)}&category=${cat}`;
        } else {
            url += `?x=${coord[0].toFixed(6)}&y=${coord[1].toFixed(6)}`;
        }
        try {
            await navigator.clipboard.writeText(url);
            notice.success(t('map.contextMenu.copiedLinkTip'));
        } catch (e) {
            console.error('Copy failed', e);
        }
    };

    /** 将边界调整为当前视口显示区域 */
    const resetBoundsToCurrentViewport = () => {
        if (!mapInstance.value) return;
        const view = mapInstance.value.getView();
        const size = mapInstance.value.getSize();
        if (!size) return;
        const extent = view.calculateExtent(size);
        const sw = toLonLat([extent[0], extent[1]]);
        const ne = toLonLat([extent[2], extent[3]]);
        const newBounds: [number, number, number, number] = [
            sw[0],
            sw[1],
            ne[0],
            ne[1]
        ];
        mapBounds.value = newBounds;
        console.log('[MapBounds] 边界已重置为当前视口:', newBounds);
    };

    /** 跳转到地图位置详情页 */
    const openLocationDetail = (id: string) => {
        if (!id) return;
        router.push({ name: 'MapLocationDetail', params: { id } });
    };

    /**
     * Debug 模式：在地图上显示边界矩形 + 4个可拖拽角点
     * 拖拽后实时更新 mapBounds 并打印新值
     */
    const setupDebugBoundsLayer = (map: Map) => {
        const boundsSource = new VectorSource();

        const boundsLayer = new VectorLayer({
            source: boundsSource,
            zIndex: 200,
            style: (feature) => {
                const type = feature.get('boundsType');
                if (type === 'rect') {
                    return new Style({
                        stroke: new Stroke({ color: 'rgba(255, 200, 0, 0.9)', width: 2, lineDash: [6, 4] }),
                        fill: new Fill({ color: 'rgba(255, 200, 0, 0.07)' }),
                    });
                }
                // 四角控制手柄
                return new Style({
                    image: new CircleStyle({
                        radius: 7,
                        fill: new Fill({ color: 'rgba(255, 200, 0, 0.95)' }),
                        stroke: new Stroke({ color: '#000', width: 1.5 }),
                    }),
                });
            },
        } as any);

        map.addLayer(boundsLayer);

        const updateBoundsGeometries = ([minLon, minLat, maxLon, maxLat]: [number, number, number, number]) => {
            boundsSource.getFeatures().forEach(f => {
                const type = f.get('boundsType');
                if (type === 'rect') {
                    (f.getGeometry() as Polygon).setCoordinates([[
                        fromLonLat([minLon, minLat]),
                        fromLonLat([maxLon, minLat]),
                        fromLonLat([maxLon, maxLat]),
                        fromLonLat([minLon, maxLat]),
                        fromLonLat([minLon, minLat]),
                    ]]);
                } else if (type === 'corner') {
                    const corner = f.get('corner');
                    let targetCoord = [0, 0];
                    if (corner === 'SW') targetCoord = [minLon, minLat];
                    if (corner === 'SE') targetCoord = [maxLon, minLat];
                    if (corner === 'NE') targetCoord = [maxLon, maxLat];
                    if (corner === 'NW') targetCoord = [minLon, maxLat];
                    (f.getGeometry() as Point).setCoordinates(fromLonLat(targetCoord));
                }
            });
        };

        const rebuildBoundsFeatures = () => {
            boundsSource.clear();
            const [minLon, minLat, maxLon, maxLat] = mapBounds.value;

            // 矩形
            const rectFeature = new Feature({
                geometry: new Polygon([[
                    fromLonLat([minLon, minLat]),
                    fromLonLat([maxLon, minLat]),
                    fromLonLat([maxLon, maxLat]),
                    fromLonLat([minLon, maxLat]),
                    fromLonLat([minLon, minLat]),
                ]]),
                boundsType: 'rect',
            });

            // 4个角点（可拖拽）
            const cornerFeatures = [
                { lon: minLon, lat: minLat, corner: 'SW' },
                { lon: maxLon, lat: minLat, corner: 'SE' },
                { lon: maxLon, lat: maxLat, corner: 'NE' },
                { lon: minLon, lat: maxLat, corner: 'NW' },
            ].map(({ lon, lat, corner }) => new Feature({
                geometry: new Point(fromLonLat([lon, lat])),
                boundsType: 'corner',
                corner,
            }));

            boundsSource.addFeature(rectFeature as OLFeature<Geometry>);
            cornerFeatures.forEach(f => boundsSource.addFeature(f as OLFeature<Geometry>));
        };

        rebuildBoundsFeatures();

        // Modify 交互：拖拽角点
        const modifyInteraction = new Modify({ source: boundsSource });
        map.addInteraction(modifyInteraction);

        modifyInteraction.on('modifyend', (event: any) => {
            const modifiedFeatures = event.features.getArray();
            let [minLon, minLat, maxLon, maxLat] = mapBounds.value;

            modifiedFeatures.forEach((f: OLFeature<Geometry>) => {
                if (f.get('boundsType') === 'corner') {
                    const corner = f.get('corner');
                    const coord = toLonLat((f.getGeometry() as Point).getCoordinates());
                    if (corner === 'SW') {
                        minLon = coord[0];
                        minLat = coord[1];
                    } else if (corner === 'SE') {
                        maxLon = coord[0];
                        minLat = coord[1];
                    } else if (corner === 'NE') {
                        maxLon = coord[0];
                        maxLat = coord[1];
                    } else if (corner === 'NW') {
                        minLon = coord[0];
                        maxLat = coord[1];
                    }
                }
            });

            const realMinLon = Math.min(minLon, maxLon);
            const realMaxLon = Math.max(minLon, maxLon);
            const realMinLat = Math.min(minLat, maxLat);
            const realMaxLat = Math.max(minLat, maxLat);

            const newBounds: [number, number, number, number] = [
                Number(realMinLon.toFixed(6)),
                Number(realMinLat.toFixed(6)),
                Number(realMaxLon.toFixed(6)),
                Number(realMaxLat.toFixed(6)),
            ];
            mapBounds.value = newBounds;
            console.log('[MapBounds] 新边界 (EPSG:4326):', newBounds);
            updateBoundsGeometries(newBounds);
        });

        watch(mapBounds, (newB) => {
            updateBoundsGeometries(newB);
        });

        // 监听 isEditingBounds，控制 Modify 交互激活状态
        watch(isEditingBounds, (active) => {
            modifyInteraction.setActive(active);
            boundsLayer.setVisible(active);
        }, { immediate: true });
    };

    const onHandleUrlParams = async (queryKey: string, queryX: string, queryY: string, queryCategory: string, vectorSource: VectorSource): Promise<void> => {
        const existingLocation = locations.value.find(loc => loc.id === queryKey);

        if (existingLocation) {

            targetLocationId.value = existingLocation.id;
            selectedLocationData.value = existingLocation;
            model.value = true;

        } else if (queryX && queryY && queryCategory) {
            if (queryCategory === 'shareLocation') {
                const personalMarker = personalMarkers.value.find(marker => marker.id === queryKey);

                if (personalMarker) {
                    targetLongitude.value = personalMarker.longitude;
                    targetLatitude.value = personalMarker.latitude;
                    selectedLocationData.value = { ...personalMarker, category: 'shareLocation', id: personalMarker.id, name: personalMarker.title };
                    model.value = true;
                }
            } else {
                const loadLocation = {
                    name: queryKey as string,
                    id: queryKey as string,
                    latitude: parseFloat(queryY as string),
                    longitude: parseFloat(queryX as string),
                    category: queryCategory as string,
                    dateAdded: new Date().toISOString(),
                    lastUpdated: new Date().toISOString(),
                };
                const newFeature = onCreateFeatureFromLocation(loadLocation);
                vectorSource.addFeature(newFeature);

                if (!layerVisibility.value[queryCategory]) {
                    layerVisibility.value[queryCategory] = true;
                    onUpdateAllLayersVisibleState();
                }

                targetLongitude.value = parseFloat(queryX as string);
                targetLatitude.value = parseFloat(queryY as string);
                selectedLocationData.value = loadLocation;
                model.value = true;

                if (queryCategory === 'shareLocation') {
                    locations.value.push(loadLocation);
                }
            }
        }
    };

    const onLoadUserCollections = async (): Promise<void> => {
        try {
            if (!authStore.isLogin) return;

            const result = await api.getCollections();
            userCollections.value = result.data.data;

            const savedCollectionResp = storageObj.local.get('map.selectedCollection');
            const savedCollectionUuid = savedCollectionResp.code === 0 ? savedCollectionResp.data : null;

            if (savedCollectionUuid) {
                const exists = userCollections.value.some(col => col.uuid === savedCollectionUuid);
                if (exists) {
                    selectedCollectionUuid.value = savedCollectionUuid;
                } else {
                    storageObj.local.rem('map.selectedCollection');
                }
            }
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error(e);
        }
    };

    const loadCollectionPoints = async (collectionUuid: string): Promise<void> => {
        try {
            if (!authStore.isLogin && !collectionUuid) return;
            const result = await api.getCollectionPoints(collectionUuid);
            personalMarkers.value = result.data.points;
            onAddPersonalMarkersToMap(result.data.points);
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error(e);
        }
    };

    const onAddPersonalMarkersToMap = (points: MapPoint[]): void => {
        if (!mapInstance.value || !vectorLayerRef.value) return;
        const vectorSource = vectorLayerRef.value.getSource();
        if (!vectorSource) return;
        onRemovePersonalMarkersFromMap();
        points.forEach(point => {
            const feature = createPersonalFeature(point);
            vectorSource.addFeature(feature);
        });
        vectorLayerRef.value.changed();
    };

    const createPersonalFeature = (point: MapPoint): OLFeature<Geometry> => {
        return new Feature({
            geometry: new Point(fromLonLat([point.longitude, point.latitude])),
            id: point.id,
            name: point.title,
            originalData: { ...point, category: 'shareLocation' },
        }) as OLFeature<Geometry>;
    };

    const onRemovePersonalMarkersFromMap = (): void => {
        if (!vectorLayerRef.value) return;
        const vectorSource = vectorLayerRef.value.getSource();
        if (!vectorSource) return;
        const features = vectorSource.getFeatures();
        features.forEach(feature => {
            const originalData = feature.get('originalData');
            if (originalData && originalData.category === 'shareLocation') {
                vectorSource.removeFeature(feature);
            }
        });
    };

    const onCreateNewMarker = async (): Promise<void> => {
        if (!markerFormRef.value) return;
        const { valid } = await (markerFormRef.value as any).validate();
        if (!valid) return;
        creatingMarker.value = true;
        try {
            await api.createPoint({
                collectionUuid: newMarkerData.value.collectionUuid,
                title: newMarkerData.value.title,
                description: newMarkerData.value.description,
                latitude: newMarkerData.value.latitude,
                longitude: newMarkerData.value.longitude,
                address: newMarkerData.value.address,
                tags: newMarkerData.value.tags,
                public: newMarkerData.value.public,
                sharedUsers: newMarkerData.value.sharedUsers,
            });
            if (selectedCollectionUuid.value === newMarkerData.value.collectionUuid) {
                await loadCollectionPoints(selectedCollectionUuid.value);
            }
            showCreateMarkerDialog.value = false;
            onResetNewMarkerData();
        } catch (error) {
            console.error('创建标记失败:', error);
        } finally {
            creatingMarker.value = false;
        }
    };

    const onResetNewMarkerData = (): void => {
        newMarkerData.value = {
            collectionUuid: selectedCollectionUuid.value || '',
            title: '',
            description: '',
            longitude: 0,
            latitude: 0,
            address: '',
            tags: [],
            public: false,
            sharedUsers: [],
        };
        editingMarker.value = false;
    };

    const onCancelCreateMarker = (): void => {
        showCreateMarkerDialog.value = false;
        onResetNewMarkerData();
        selectedPoint.value = null;
    };

    const onTogglePersonalLayer = (): void => {
        if (!vectorLayerRef.value) return;
        vectorLayerRef.value.changed();
    };

    const onCreatePersonalMarkerStyle = (): Style => {
        return new Style({
            image: new Icon({
                src: getPersonalMarkerIcon(),
                scale: 0.1,
                anchor: [0.5, 1],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
            }),
        });
    };

    const getPersonalMarkerIcon = (): string => icons.value['shareLocation'];

    const onSearchNearbyPoints = async (latitude: number, longitude: number, radius: number = 10): Promise<void> => {
        try {
            selectedLocationNearbyPoints.value = [];
            const result = await api.getNearbyPoints({ latitude, longitude, radius, limit: 10 });
            selectedLocationNearbyPoints.value = result.data.points;
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error(e);
        }
    };

    const getCategoryCount = (category: string) => locations.value.filter(loc => loc.category === category).length;

    const getCategoryIcon = (category: string) => icons.value[category] || icons.value['default'];

    const onSelectLocation = (location: any) => {
        if (!location) return;
        targetLongitude.value = location.longitude;
        targetLatitude.value = location.latitude;
        selectedLocationData.value = location;
        model.value = true;
        showCoordinateInfo.value = false;
        searchQuery.value = null;
        searchInput.value = '';
        router.push({ name: route.name, query: { ...route.query, key: location.id, x: location.longitude, y: location.latitude, category: location.category } });
    };

    const handleSearch = () => {
        if (!searchInput.value.trim()) return;
        const foundLocation = locations.value.find(location => {
            const displayName = getLocationDisplayName(location).toLowerCase();
            const locationId = location.id.toLowerCase();
            const searchTerm = searchInput.value.toLowerCase().trim();
            return displayName === searchTerm || locationId === searchTerm;
        });
        if (foundLocation) {
            onSelectLocation(foundLocation);
        } else if (searchSuggestions.value.length > 0) {
            onSelectLocation(searchSuggestions.value[0]);
        }
    };

    const onInitVisibility = (payload: { layerVisibility: Record<string, boolean>; groupVisibility: Record<string, boolean> }) => {
        if (payload?.layerVisibility) {
            for (const [key, value] of Object.entries(payload.layerVisibility)) {
                layerVisibility.value[key] = value as boolean;
            }
        }
        if (payload?.groupVisibility) {
            for (const [key, value] of Object.entries(payload.groupVisibility)) {
                groupVisibility.value[key] = value as boolean;
            }
        }

        if (!vectorLayerRef.value) return;

        vectorLayerRef.value.setStyle((feature: any) => {
            const originalData = feature.get('originalData');
            const featureCategory = originalData?.category;
            if (originalData?.category === 'shareLocation') {
                const isPersonalVisible = layerVisibility.value.shareLocation;
                return isPersonalVisible ? onCreatePersonalMarkerStyle() : null;
            }
            const isSystemVisible = layerVisibility.value[featureCategory];
            return isSystemVisible ? onCreateMarkerStyle(feature) : null;
        });
        vectorLayerRef.value.changed();
        updateGroupVisibilityState();
        onUpdateAllLayersVisibleState();
    };

    const updateGroupVisibilityState = () => {
        Object.entries(CATEGORY_GROUPS).forEach(([groupName, categories]) => {
            let isGroupVisible = false;
            let groupHasCategory = false;
            for (const category of categories) {
                if (layerVisibility.value.hasOwnProperty(category)) {
                    groupHasCategory = true;
                    if (layerVisibility.value[category]) {
                        isGroupVisible = true;
                        break;
                    }
                }
            }
            if (groupHasCategory) {
                groupVisibility.value[groupName] = isGroupVisible;
            }
        });
    };

    const onToggleLayer = (payload?: { category: string; visible: boolean }) => {
        if (!vectorLayerRef.value) return;

        if (payload) {
            layerVisibility.value[payload.category] = payload.visible;
        }

        vectorLayerRef.value.setStyle((feature: any) => {
            const originalData = feature.get('originalData');
            const featureCategory = originalData?.category;
            if (originalData?.category === 'shareLocation') {
                const isPersonalVisible = layerVisibility.value.shareLocation;
                return isPersonalVisible ? onCreatePersonalMarkerStyle() : null;
            }
            const isSystemVisible = layerVisibility.value[featureCategory];
            return isSystemVisible ? onCreateMarkerStyle(feature) : null;
        });
        vectorLayerRef.value.changed();
        onUpdateAllLayersVisibleState();
        updateGroupVisibilityState();
    };

    const onToggleGroupLayer = (payload: { group: string; visible: boolean }) => {
        if (!vectorLayerRef.value) return;

        groupVisibility.value[payload.group] = payload.visible;

        if (CATEGORY_GROUPS[payload.group]) {
            CATEGORY_GROUPS[payload.group].forEach(category => {
                if (layerVisibility.value.hasOwnProperty(category)) {
                    layerVisibility.value[category] = payload.visible;
                }
            });
        }

        vectorLayerRef.value.setStyle((feature: any) => {
            const originalData = feature.get('originalData');
            const featureCategory = originalData?.category;
            if (originalData?.category === 'shareLocation') {
                const isPersonalVisible = layerVisibility.value.shareLocation;
                return isPersonalVisible ? onCreatePersonalMarkerStyle() : null;
            }
            const isSystemVisible = layerVisibility.value[featureCategory];
            return isSystemVisible ? onCreateMarkerStyle(feature) : null;
        });
        vectorLayerRef.value.changed();
        onUpdateAllLayersVisibleState();
    };

    const onToggleAllLayers = () => {
        if (!vectorLayerRef.value || !availableCategories.value.length) return;
        const newVisibility = !allLayersVisible.value;

        availableCategories.value.forEach(category => {
            layerVisibility.value[category.value] = newVisibility;
        });
        layerVisibility.value.shareLocation = newVisibility;
        allLayersVisible.value = newVisibility;
        vectorLayerRef.value.setStyle((feature: any) => {
            const originalData = feature.get('originalData');
            const featureCategory = originalData?.category;
            if (featureCategory === 'shareLocation') {
                return newVisibility ? onCreatePersonalMarkerStyle() : null;
            }
            return newVisibility ? onCreateMarkerStyle(feature) : null;
        });
        vectorLayerRef.value.changed();
        updateGroupVisibilityState();
    };

    const onUpdateAllLayersVisibleState = () => {
        const allCategories = availableCategories.value.map(cat => cat.value);

        allCategories.push('shareLocation');
        allLayersVisible.value = allCategories.every(category => layerVisibility.value[category]);
    };

    const initializeLayerVisibility = () => {
        const allCategories = [...new Set(locations.value.map(loc => loc.category))];

        allCategories.forEach(category => {
            if (layerVisibility.value[category] === undefined) {
                layerVisibility.value[category] = true;
            }
        });

        if (layerVisibility.value.shareLocation === undefined) {
            layerVisibility.value.shareLocation = true;
        }

        updateGroupVisibilityState();
    };

    const getLocationDisplayName = (data: any): string => {
        const location = data;

        if (!location.id) return '';

        return asString([location.id, `snb.mapLocations.${location.id}.name`], { backRawKey: false }) || location.id;
    };

    const onCreateMarkerStyle = (feature: OLFeature<Geometry>): Style => {
        const originalData = feature.get('originalData');

        return new Style({
            image: new Icon({
                src: getCategoryIcon(originalData.category),
                scale: 0.12,
                anchor: [0.5, 0.6],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
            }),
        });
    };

    const onCreateFeaturesFromLocations = (locations: any[]): OLFeature<Geometry>[] => {
        return locations.map(location => {
            return new Feature({
                geometry: new Point(fromLonLat([location.longitude, location.latitude])),
                id: location.id,
                name: location.name || `位置${location.id}`,
                originalData: location,
            }) as OLFeature<Geometry>;
        });
    };

    const onCreateFeatureFromLocation = (location: any): OLFeature<Geometry> => {
        return new Feature({
            geometry: new Point(fromLonLat([location.longitude, location.latitude])),
            id: location.id,
            name: location.name || `位置${location.id}`,
            originalData: location,
        }) as OLFeature<Geometry>;
    };

    const _onZoomIn = (): void => {
        if (mapInstance.value) {
            const view = mapInstance.value.getView();
            const currentZoom = view.getZoom() || 0;
            view.animate({ zoom: currentZoom + 1, duration: 250 });
        }
    };

    const _onZoomOut = (): void => {
        if (mapInstance.value) {
            const view = mapInstance.value.getView();
            const currentZoom = view.getZoom() || 0;
            view.animate({ zoom: currentZoom - 1, duration: 250 });
        }
    };

    const _onResetView = (): void => {
        if (mapInstance.value && locations.value.length > 0) {
            const view = mapInstance.value.getView();
            view.animate({ center: fromLonLat(mapCenterLocation.value), zoom: 13, duration: 500 });
        }
    };

    return {
        authStore,
        mobile,
        mapInstance,
        vectorLayerRef,
        mapCenterLocation,
        mapBounds,
        locations,
        icons,
        isFull,
        model,
        selectedLocationData,
        showCoordinateInfo,
        clickedCoordinate,
        hoveedCoordinate,
        targetLongitude,
        targetLatitude,
        targetLocationId,
        searchQuery,
        searchInput,
        searchSuggestions,
        isShowMarkModel,
        layerVisibility,
        groupVisibility,
        allLayersVisible,
        userCollections,
        selectedCollectionUuid,
        selectedLocationNearbyPoints,
        personalMarkers,
        showCreateMarkerDialog,
        creatingMarker,
        selectedPoint,
        markerFormRef,
        newMarkerData,
        editingMarker,
        availableCategories,
        groupedCategories,
        personalMarkersCount,
        userCollectionsSelect,
        isDebug,
        onMapCreated,
        onHandleUrlParams,
        onLoadUserCollections,
        loadCollectionPoints,
        onAddPersonalMarkersToMap,
        createPersonalFeature,
        onRemovePersonalMarkersFromMap,
        onCreateNewMarker,
        onResetNewMarkerData,
        onCancelCreateMarker,
        onTogglePersonalLayer,
        onCreatePersonalMarkerStyle,
        getPersonalMarkerIcon,
        onSearchNearbyPoints,
        getCategoryCount,
        getCategoryIcon,
        onSelectLocation,
        handleSearch,
        onToggleLayer,
        onToggleGroupLayer,
        onToggleAllLayers,
        onInitVisibility,
        onUpdateAllLayersVisibleState,
        initializeLayerVisibility,
        getLocationDisplayName,
        onCreateMarkerStyle,
        onCreateFeaturesFromLocations,
        onCreateFeatureFromLocation,
        _onZoomIn,
        _onZoomOut,
        _onResetView,
        contextMenuState,
        contextMenuItems,
        isEditingBounds,
        closeContextMenu,
        openLocationDetail,
    };
}
