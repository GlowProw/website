import { computed, ref, type Ref, type ComputedRef, watch, onUnmounted } from 'vue';
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
import { isCategoryVisibleAtZoom, getCategoryScale } from "@/assets/sripts/map_zoom_config";
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
import { pointerMove, primaryAction } from 'ol/events/condition';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import Translate from 'ol/interaction/Translate';
import type { Feature as OLFeature } from 'ol';
import type { Geometry } from 'ol/geom';

export interface UseMapControllerOptions {
    highlightTargetKey?: Ref<string | undefined> | ComputedRef<string | undefined> | string;
    highlightCoords?: Ref<{ lon: number; lat: number } | undefined> | ComputedRef<{ lon: number; lat: number } | undefined>;
}

/**
 * 地图控制器
 */
export function use_map_controller(options: UseMapControllerOptions = {}) {
    const highlightTargetKey = computed(() => {
        if (!options.highlightTargetKey) return undefined;
        return typeof options.highlightTargetKey === 'string' ? options.highlightTargetKey : options.highlightTargetKey.value;
    });

    const highlightCoords = computed(() => {
        if (!options.highlightCoords) return undefined;
        return typeof options.highlightCoords === 'object' && 'value' in options.highlightCoords ? (options.highlightCoords as any).value : options.highlightCoords;
    });
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
        'fortifications': ['megafort', 'militaryBase', 'guardTower'],  // 军事要塞
        'shipwrecks': ['shipwreck'],                   // 失事船只
        'collectibles': ['archive', 'treasureMap'],    // 调查档案
        'resources': ['abaka', 'coconut', 'durian', 'hemp', 'jute', 'linen', 'ndizi', 'ramie', 'roselle', 'screwpine', 'sisal'], // 原料资源
        'wood': ['acacia', 'greenheart', 'iroko', 'ironwood', 'juniper', 'mopane', 'teak'], // 木材资源
        'ore': ['bogIron', 'cobalt', 'copper', 'magnetite', 'nickel', 'pureIron', 'zinc'], // 矿石资源
        'wildlife': ['crocodile', 'hippopotamus', 'shark'], // 野生动物
    };

    const mapInstance: Ref<Map | null> = ref(null);
    const vectorLayerRef: Ref<VectorLayer<VectorSource> | null> = ref(null);
    const mapCenterLocation: Ref<number[]> = ref([-0.667206, 0.626653]);
    const mapBounds = ref<[number, number, number, number]>(MAP_BOUNDS);
    const locations: Ref<any[]> = ref(Object.values(MapLocations));
    const icons: Ref<Record<string, string>> = ref(serializationMap(mapImages));
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

    /** debug 模式下是否允许拖拽标记 */
    const isMarkerDraggingEnabled = ref(true);
    /** 是否正在拖拽标记中（用于避免拖拽松开时误触发 click） */
    const isDraggingFeature = ref(false);

    /** debug 模式下标记编辑弹窗状态 */
    const showEditMarkerDialog = ref(false);
    const editingMarkerData = ref<any>(null);
    const editingOriginalId = ref<string>('');

    const isShowMarkModel = ref(false);
    const isShowSettings = ref(false);
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

    /**
     * 各标记分类动画过渡状态 (透明度 0.0 ~ 1.0)
     */
    interface CategoryAnimState {
        currentOpacity: number;
        targetOpacity: number;
    }

    const categoryAnimState: Record<string, CategoryAnimState> = {};
    const categoryStyleCache: Record<string, Style[] | null> = {};
    const categoryTargetStyleCache: Record<string, Style[] | null> = {};
    const categoryDimmedStyleCache: Record<string, Style[] | null> = {};
    let animFrameId: number | null = null;

    /**
     * 获取当前地图视图的实际 Zoom
     */
    const getCurrentZoom = (): number => {
        const view = mapInstance.value?.getView();
        return view?.getZoom() ?? 13;
    };

    /**
     * 判断特定分类点位在当前地图 zoom 下是否处于可显示范围
     */
    const isFeatureVisibleAtCurrentZoom = (featureCategory: string): boolean => {
        if (isDebug.value) return true;
        const currentZoom = getCurrentZoom();
        return isCategoryVisibleAtZoom(featureCategory, currentZoom, isDebug.value);
    };

    /**
     * 构建/更新指定分类在当前透明度与 Zoom 下的 OpenLayers Style 样式
     * - 标准样式
     * - 目标放大高亮样式 (targetKey 对应标记，放大 1.6 倍)
     * - 其他非目标半透明样式 (半透明 0.28)
     */
    const updateCategoryStyle = (category: string, opacity: number, zoom: number) => {
        if (opacity <= 0.01) {
            categoryStyleCache[category] = null;
            categoryTargetStyleCache[category] = null;
            categoryDimmedStyleCache[category] = null;
            return;
        }

        const baseScale = getCategoryScale(category, zoom);
        // 缩放弹性过渡动画：淡入时尺寸从 70% 放大到 100%，淡出时缩小到 70%
        const scale = baseScale * (0.7 + 0.3 * opacity);
        const borderScale = scale * 1.2;

        // 目标高亮标记尺寸：放大 1.65 倍
        const targetScale = scale * 1.65;
        const targetBorderScale = targetScale * 1.22;

        // 非目标标记半透明度 (0.28)
        const dimmedOpacity = opacity * 0.28;
        const dimmedScale = scale * 0.95;
        const dimmedBorderScale = dimmedScale * 1.15;

        const isShare = category === 'shareLocation';
        const anchor: [number, number] = isShare ? [0.5, 1] : [0.5, 0.6];
        const iconSrc = isShare ? getPersonalMarkerIcon() : getCategoryIcon(category);

        if (!iconSrc) {
            categoryStyleCache[category] = null;
            categoryTargetStyleCache[category] = null;
            categoryDimmedStyleCache[category] = null;
            return;
        }

        // 1. 标准样式
        categoryStyleCache[category] = [
            new Style({
                image: new Icon({
                    src: iconSrc,
                    color: '#000000',
                    scale: borderScale,
                    opacity: opacity * 0.2,
                    anchor,
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                }),
                zIndex: 1,
            }),
            new Style({
                image: new Icon({
                    src: iconSrc,
                    scale,
                    opacity,
                    anchor,
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                }),
                zIndex: 2,
            })
        ];

        // 2. 目标放大高亮样式 (放大 1.65x, zIndex 500)
        categoryTargetStyleCache[category] = [
            new Style({
                image: new Icon({
                    src: iconSrc,
                    color: '#000000',
                    scale: targetBorderScale,
                    opacity: opacity * 0.35,
                    anchor,
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                }),
                zIndex: 499,
            }),
            new Style({
                image: new Icon({
                    src: iconSrc,
                    scale: targetScale,
                    opacity: Math.min(1.0, opacity * 1.0),
                    anchor,
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                }),
                zIndex: 500,
            })
        ];

        // 3. 其他非目标半透明样式 (半透明 0.28, zIndex 1)
        categoryDimmedStyleCache[category] = [
            new Style({
                image: new Icon({
                    src: iconSrc,
                    color: '#000000',
                    scale: dimmedBorderScale,
                    opacity: dimmedOpacity * 0.2,
                    anchor,
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                }),
                zIndex: 1,
            }),
            new Style({
                image: new Icon({
                    src: iconSrc,
                    scale: dimmedScale,
                    opacity: dimmedOpacity,
                    anchor,
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                }),
                zIndex: 2,
            })
        ];
    };

    /**
     * 更新所有分类的目标透明度 targetOpacity (0.0 或 1.0)
     */
    const updateAllTargetOpacities = () => {
        const currentZoom = getCurrentZoom();
        const allCategories = new Set<string>();
        locations.value.forEach(loc => {
            if (loc.category) allCategories.add(loc.category);
        });
        allCategories.add('shareLocation');
        allCategories.add('default');

        allCategories.forEach(category => {
            const isVisibleByLayer = category === 'shareLocation'
                ? (layerVisibility.value.shareLocation ?? true)
                : (layerVisibility.value[category] ?? true);

            const isVisibleByZoom = isDebug.value || isCategoryVisibleAtZoom(category, currentZoom, isDebug.value);
            const target = (isVisibleByLayer && isVisibleByZoom) ? 1.0 : 0.0;

            let state = categoryAnimState[category];
            if (!state) {
                state = { currentOpacity: target, targetOpacity: target };
                categoryAnimState[category] = state;
            } else {
                state.targetOpacity = target;
            }
        });
    };

    /**
     * 触发平滑过渡动画循环
     * @param immediate 是否无动画立即应用（例如初始化）
     */
    const triggerTransitionAnimation = (immediate: boolean = false) => {
        updateAllTargetOpacities();
        const currentZoom = getCurrentZoom();

        if (immediate) {
            if (animFrameId !== null) {
                cancelAnimationFrame(animFrameId);
                animFrameId = null;
            }
            Object.entries(categoryAnimState).forEach(([category, state]) => {
                state.currentOpacity = state.targetOpacity;
                updateCategoryStyle(category, state.currentOpacity, currentZoom);
            });
            if (vectorLayerRef.value) {
                vectorLayerRef.value.changed();
            }
            return;
        }

        if (animFrameId !== null) return;

        const animate = () => {
            let isStillAnimating = false;
            const zoom = getCurrentZoom();

            Object.entries(categoryAnimState).forEach(([category, state]) => {
                const diff = state.targetOpacity - state.currentOpacity;
                if (Math.abs(diff) > 0.015) {
                    state.currentOpacity += diff * 0.22;
                    isStillAnimating = true;
                } else {
                    state.currentOpacity = state.targetOpacity;
                }
                updateCategoryStyle(category, state.currentOpacity, zoom);
            });

            if (vectorLayerRef.value) {
                vectorLayerRef.value.changed();
            }

            if (isStillAnimating) {
                animFrameId = requestAnimationFrame(animate);
            } else {
                animFrameId = null;
            }
        };

        animFrameId = requestAnimationFrame(animate);
    };

    /**
     * 判断某个 feature 数据是否属于高亮目标
     */
    const isTargetFeatureData = (originalData: any): boolean => {
        const targetKey = highlightTargetKey.value;
        if (targetKey) {
            if (originalData?.id === targetKey) return true;
            if (originalData?.key === targetKey) return true;
            if (originalData?.category === targetKey) return true;
        }

        const coords = highlightCoords.value;
        if (coords && typeof originalData?.longitude === 'number' && typeof originalData?.latitude === 'number') {
            const dLon = Math.abs(originalData.longitude - coords.lon);
            const dLat = Math.abs(originalData.latitude - coords.lat);
            if (dLon < 0.0001 && dLat < 0.0001) {
                return true;
            }
        }

        return false;
    };

    /**
     * 生成统一的 Marker 样式计算函数（从动画样式缓存中极速获取）
     */
    const createMarkerStyleFn = () => (feature: any) => {
        const originalData = feature.get('originalData');
        const featureCategory = originalData?.category || 'default';

        const hasTargetHighlight = Boolean(highlightTargetKey.value || highlightCoords.value);
        if (hasTargetHighlight) {
            if (isTargetFeatureData(originalData)) {
                return categoryTargetStyleCache[featureCategory] ?? categoryStyleCache[featureCategory] ?? null;
            } else {
                return categoryDimmedStyleCache[featureCategory] ?? categoryStyleCache[featureCategory] ?? null;
            }
        }

        return categoryStyleCache[featureCategory] ?? null;
    };

    watch([highlightTargetKey, highlightCoords], () => {
        if (vectorLayerRef.value) {
            vectorLayerRef.value.changed();
        }
    });

    watch(isDebug, () => {
        triggerTransitionAnimation();
    });

    const onConfigChanged = () => {
        triggerTransitionAnimation(true);
    };

    onUnmounted(() => {
        if (animFrameId !== null) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    });

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

        // 首次初始化动画状态与样式缓存（立即应用无延迟）
        triggerTransitionAnimation(true);

        const vectorLayer = new VectorLayer({
            source: vectorSource,
            zIndex: 100,
            style: createMarkerStyleFn(),
        } as any);

        vectorLayer.set('isMainVectorLayer', true);
        vectorLayerRef.value = vectorLayer;
        map.addLayer(vectorLayer);

        // 监听缩放变化，动态切换不同分类标记的平滑过渡动画
        map.getView().on('change:resolution', () => {
            triggerTransitionAnimation();
        });

        const hoverInteraction = new Select({
            condition: pointerMove,
            layers: [vectorLayer],
            hitTolerance: 10,
            style: null,
        });

        map.addInteraction(hoverInteraction);

        // Debug 模式：标记拖拽交互（仅允许鼠标左键/触屏拖拽，禁止右键触发）
        const translateInteraction = new Translate({
            layers: [vectorLayer],
            hitTolerance: 15,
            condition: primaryAction,
        });
        map.addInteraction(translateInteraction);

        const updateTranslateActive = () => {
            const active = isDebug.value && isMarkerDraggingEnabled.value;
            translateInteraction.setActive(active);
        };

        updateTranslateActive();
        watch([isDebug, isMarkerDraggingEnabled], () => {
            updateTranslateActive();
        });

        translateInteraction.on('translatestart', () => {
            isDraggingFeature.value = true;
        });

        translateInteraction.on('translateend', (event: any) => {
            setTimeout(() => {
                isDraggingFeature.value = false;
            }, 100);

            const features = event.features.getArray();
            features.forEach((feature: OLFeature<Geometry>) => {
                const originalData = feature.get('originalData');
                if (!originalData) return;
                const geom = feature.getGeometry() as Point;
                if (!geom) return;
                const coords = toLonLat(geom.getCoordinates());
                const newLon = Number(coords[0].toFixed(6));
                const newLat = Number(coords[1].toFixed(6));

                const oldLon = originalData.longitude;
                const oldLat = originalData.latitude;

                // 坐标未发生实质变动时不触发更新
                if (oldLon !== undefined && oldLat !== undefined) {
                    if (Math.abs(oldLon - newLon) < 1e-6 && Math.abs(oldLat - newLat) < 1e-6) {
                        return;
                    }
                }

                originalData.longitude = newLon;
                originalData.latitude = newLat;
                originalData.lastUpdated = new Date().toISOString();

                // 同步更新 locations 列表
                const itemInList = locations.value.find(loc => loc.id === originalData.id);
                if (itemInList) {
                    itemInList.longitude = newLon;
                    itemInList.latitude = newLat;
                    itemInList.lastUpdated = originalData.lastUpdated;
                }

                // 若当前正在查看该地标卡片，同步更新卡片数据
                if (selectedLocationData.value?.id === originalData.id) {
                    selectedLocationData.value = {
                        ...selectedLocationData.value,
                        longitude: newLon,
                        latitude: newLat,
                        lastUpdated: originalData.lastUpdated,
                    };
                }

                console.log(`[Debug] 标记拖拽更新: ${originalData.id} -> [${newLon}, ${newLat}]`);
                notice.success(`${t('map.contextMenu.markerUpdatedTip', { id: originalData.id || '' })} [${newLon}, ${newLat}]`, { mode: 'minimal' });
            });
        });

        hoverInteraction.on('select', (event) => {
            const selected = event.selected.filter(f => {
                const cat = f.get('originalData')?.category || 'default';
                const anim = categoryAnimState[cat];
                return anim ? anim.currentOpacity > 0.05 : true;
            });
            const mapElement = map.getTargetElement();
            if (mapElement) {
                mapElement.style.cursor = selected.length > 0 ? 'pointer' : '';
            }
        });

        map.on('click', async (event) => {
            if (isDraggingFeature.value) {
                return;
            }
            closeContextMenu();
            const feature = map.forEachFeatureAtPixel(event.pixel,
                (feature) => feature as OLFeature<Geometry>,
                { layerFilter: (l) => l.get('isMainVectorLayer') === true, hitTolerance: 10 }
            );

            if (feature) {
                const originalData = feature.get('originalData');
                if (!originalData) return;

                const cat = originalData.category || 'default';
                const anim = categoryAnimState[cat];
                if (anim && anim.currentOpacity <= 0.05) {
                    return;
                }

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
            let feature = map.forEachFeatureAtPixel(pixel,
                (f) => f as OLFeature<Geometry>,
                { layerFilter: (l) => l.get('isMainVectorLayer') === true, hitTolerance: 15 }
            ) ?? null;
            if (feature) {
                const cat = feature.get('originalData')?.category || 'default';
                const anim = categoryAnimState[cat];
                if (anim && anim.currentOpacity <= 0.05) {
                    feature = null;
                }
            }
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
                let feature = map.forEachFeatureAtPixel(pixel,
                    (f) => f as OLFeature<Geometry>,
                    { layerFilter: (l) => l.get('isMainVectorLayer') === true, hitTolerance: 15 }
                ) ?? null;
                if (feature) {
                    const cat = feature.get('originalData')?.category || 'default';
                    const anim = categoryAnimState[cat];
                    if (anim && anim.currentOpacity <= 0.05) {
                        feature = null;
                    }
                }
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
                icon: 'mdi-information-outline',
                label: `${t('map.contextMenu.openDetail') || '打开详情'}${locName ? ` (${locName})` : ''}`,
                action: () => openLocationDetail(locId),
            });

            // DEBUG 模式下地标专属操作
            if (isDebug.value) {
                items.push({
                    icon: 'mdi-pencil',
                    label: t('map.contextMenu.editMarker') || '编辑标记',
                    badge: 'DEBUG',
                    action: () => openEditMarker(feature),
                });
                items.push({
                    icon: 'mdi-content-copy',
                    label: t('map.contextMenu.cloneMarker') || '在此克隆此标记',
                    badge: 'DEBUG',
                    action: () => cloneMarker(originalData || feature, coord),
                });
                items.push({
                    icon: 'mdi-code-json',
                    label: t('map.contextMenu.copyMarkerJson') || '复制标记 JSON',
                    badge: 'DEBUG',
                    action: () => copyMarkerJson(originalData || feature),
                });
                items.push({
                    icon: 'mdi-crosshairs-gps',
                    label: t('map.contextMenu.copyMarkerCoordinates') || '复制标记坐标',
                    badge: 'DEBUG',
                    action: () => copyMarkerCoordinates(originalData || feature),
                });
            }
        }

        // 在此添加标记
        items.push({
            icon: 'mdi-map-marker-plus',
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
            icon: 'mdi-crosshairs-gps',
            label: t('map.contextMenu.copyCoordinates') || '复制坐标',
            action: () => copyCoordinates(coord),
        });

        // 复制当前位置链接
        items.push({
            icon: 'mdi-link-variant',
            label: t('map.contextMenu.copyLocationLink') || '复制当前位置链接',
            action: () => copyLocationLink(coord, feature),
        });

        // debug 模式额外菜单项
        if (isDebug.value) {
            items.push({ type: 'divider' });

            // 切换标记拖拽
            items.push({
                icon: 'mdi-cursor-move',
                label: isMarkerDraggingEnabled.value
                    ? (t('map.contextMenu.disableDragMarker') || '关闭标记拖拽')
                    : (t('map.contextMenu.toggleDragMarker') || '开启标记拖拽'),
                badge: 'DEBUG',
                action: () => {
                    isMarkerDraggingEnabled.value = !isMarkerDraggingEnabled.value;
                    notice.info(isMarkerDraggingEnabled.value
                        ? (t('map.contextMenu.dragMarkerNotice') || '已开启标记拖拽模式，可直接按住标记拖动位置')
                        : (t('map.contextMenu.dragMarkerDisabledNotice') || '已关闭标记拖拽模式')
                    );
                },
            });

            // 编辑地图边界
            items.push({
                icon: 'mdi-vector-polygon',
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
                    icon: 'mdi-fit-to-screen-outline',
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
            notice.success(t('map.contextMenu.copiedCoordinatesTip'), { mode: 'minimal' });
        } catch (e) {
            console.error('Copy failed', e);
        }
    };

    /** 复制标记 JSON */
    const copyMarkerJson = async (target: any) => {
        const raw = target?.get ? target.get('originalData') : target;
        if (!raw) return;
        const text = JSON.stringify(raw, null, 2);
        try {
            await navigator.clipboard.writeText(text);
            notice.success(t('map.contextMenu.copiedMarkerJsonTip'), { mode: 'minimal' });
        } catch (e) {
            console.error('Copy JSON failed', e);
        }
    };

    /** 复制标记坐标 */
    const copyMarkerCoordinates = async (target: any) => {
        const raw = target?.get ? target.get('originalData') : target;
        if (!raw) return;
        const text = `${raw.longitude?.toFixed(6)}, ${raw.latitude?.toFixed(6)}`;
        try {
            await navigator.clipboard.writeText(text);
            notice.success(t('map.contextMenu.copiedCoordinatesTip'), { mode: 'minimal' });
        } catch (e) {
            console.error('Copy coordinates failed', e);
        }
    };

    /** 克隆标记 */
    const cloneMarker = (target: any, targetCoord?: [number, number]) => {
        const raw = target?.get ? target.get('originalData') : target;
        if (!raw) return;

        const originalId = raw.id || 'marker';
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const newId = `${originalId}_clone_${randomSuffix}`;

        const lon = targetCoord ? Number(targetCoord[0].toFixed(6)) : Number((raw.longitude + 0.005).toFixed(6));
        const lat = targetCoord ? Number(targetCoord[1].toFixed(6)) : Number((raw.latitude + 0.005).toFixed(6));

        const clonedData = {
            ...JSON.parse(JSON.stringify(raw)),
            id: newId,
            name: raw.name ? `${raw.name} (Clone)` : undefined,
            longitude: lon,
            latitude: lat,
            dateAdded: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
        };

        const newFeature = onCreateFeatureFromLocation(clonedData);
        if (vectorLayerRef.value) {
            const vectorSource = vectorLayerRef.value.getSource();
            vectorSource?.addFeature(newFeature);
        }
        locations.value.push(clonedData);

        selectedLocationData.value = clonedData;
        model.value = true;
        showCoordinateInfo.value = false;

        triggerTransitionAnimation(true);
        notice.success(t('map.contextMenu.markerClonedTip', { id: newId }), { mode: 'minimal' });
        return clonedData;
    };

    /** 打开标记编辑弹窗 */
    const openEditMarker = (target: any) => {
        const raw = target?.get ? target.get('originalData') : target;
        if (!raw) return;
        editingOriginalId.value = raw.id;
        editingMarkerData.value = JSON.parse(JSON.stringify(raw));
        showEditMarkerDialog.value = true;
    };

    /** 保存标记编辑 */
    const saveEditMarker = (updatedData: any) => {
        if (!updatedData || !updatedData.id) return;
        const oldId = editingOriginalId.value || updatedData.id;

        // 1. 更新 locations.value 列表
        const idx = locations.value.findIndex(loc => loc.id === oldId);
        if (idx !== -1) {
            locations.value[idx] = { ...updatedData, lastUpdated: new Date().toISOString() };
        } else {
            locations.value.push({ ...updatedData, lastUpdated: new Date().toISOString() });
        }

        // 2. 更新 vectorLayer 中的 feature
        if (vectorLayerRef.value) {
            const vectorSource = vectorLayerRef.value.getSource();
            if (vectorSource) {
                const features = vectorSource.getFeatures();
                const feature = features.find(f => {
                    const orig = f.get('originalData');
                    return (orig && orig.id === oldId) || f.get('id') === oldId;
                });

                if (feature) {
                    feature.set('id', updatedData.id);
                    feature.set('name', updatedData.name || updatedData.id);
                    feature.set('originalData', { ...updatedData, lastUpdated: new Date().toISOString() });
                    const geom = feature.getGeometry() as Point;
                    if (geom && updatedData.longitude !== undefined && updatedData.latitude !== undefined) {
                        geom.setCoordinates(fromLonLat([updatedData.longitude, updatedData.latitude]));
                    }
                    feature.changed();
                }
            }
        }

        // 3. 若当前卡片正在查看该标记，同步更新卡片
        if (selectedLocationData.value?.id === oldId || selectedLocationData.value?.id === updatedData.id) {
            selectedLocationData.value = { ...updatedData, lastUpdated: new Date().toISOString() };
        }

        showEditMarkerDialog.value = false;
        triggerTransitionAnimation(true);
        notice.success(t('map.contextMenu.markerSavedTip', { id: updatedData.id }), { mode: 'minimal' });
    };

    /** 取消标记编辑 */
    const onCancelEditMarker = () => {
        showEditMarkerDialog.value = false;
        editingMarkerData.value = null;
        editingOriginalId.value = '';
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
            notice.success(t('map.contextMenu.copiedLinkTip'), { mode: 'minimal' });
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
        triggerTransitionAnimation(true);
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
        triggerTransitionAnimation();
    };

    const onCreatePersonalMarkerStyle = (): Style[] | Style => {
        const currentZoom = getCurrentZoom();
        const scale = getCategoryScale('shareLocation', currentZoom);
        const borderScale = scale * 1.16;
        const iconSrc = getPersonalMarkerIcon();

        const bgStyle = new Style({
            image: new Icon({
                src: iconSrc,
                color: '#000000',
                scale: borderScale,
                opacity: 0.9,
                anchor: [0.5, 1],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
            }),
            zIndex: 1,
        });
        const fgStyle = new Style({
            image: new Icon({
                src: iconSrc,
                scale,
                anchor: [0.5, 1],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
            }),
            zIndex: 2,
        });
        return [bgStyle, fgStyle];
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

    const getCategoryIcon = (category: string) => {
        if (!icons.value || Object.keys(icons.value).length === 0) {
            icons.value = serializationMap(mapImages);
        }
        return icons.value[category] || icons.value['default'] || icons.value['miscellaneous'] || '';
    };

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

        updateGroupVisibilityState();
        onUpdateAllLayersVisibleState();
        triggerTransitionAnimation();
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
        if (payload) {
            layerVisibility.value[payload.category] = payload.visible;
        }

        onUpdateAllLayersVisibleState();
        updateGroupVisibilityState();
        triggerTransitionAnimation();
    };

    const onToggleGroupLayer = (payload: { group: string; visible: boolean }) => {
        groupVisibility.value[payload.group] = payload.visible;

        if (CATEGORY_GROUPS[payload.group]) {
            CATEGORY_GROUPS[payload.group].forEach(category => {
                if (layerVisibility.value.hasOwnProperty(category)) {
                    layerVisibility.value[category] = payload.visible;
                }
            });
        }

        onUpdateAllLayersVisibleState();
        triggerTransitionAnimation();
    };

    const onToggleAllLayers = () => {
        if (!availableCategories.value.length) return;
        const newVisibility = !allLayersVisible.value;

        availableCategories.value.forEach(category => {
            layerVisibility.value[category.value] = newVisibility;
        });
        layerVisibility.value.shareLocation = newVisibility;
        allLayersVisible.value = newVisibility;
        updateGroupVisibilityState();
        triggerTransitionAnimation();
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

    const onCreateMarkerStyle = (feature: OLFeature<Geometry>): Style[] | Style | null => {
        const originalData = feature.get('originalData');
        const category = originalData?.category || 'default';
        const iconSrc = getCategoryIcon(category);
        if (!iconSrc) {
            return null;
        }

        const currentZoom = getCurrentZoom();
        const scale = getCategoryScale(category, currentZoom);
        const borderScale = scale * 1.16;

        const bgStyle = new Style({
            image: new Icon({
                src: iconSrc,
                color: '#000000',
                scale: borderScale,
                opacity: 0.9,
                anchor: [0.5, 0.6],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
            }),
            zIndex: 1,
        });
        const fgStyle = new Style({
            image: new Icon({
                src: iconSrc,
                scale,
                anchor: [0.5, 0.6],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
            }),
            zIndex: 2,
        });
        return [bgStyle, fgStyle];
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
        isShowSettings,
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
        isMarkerDraggingEnabled,
        showEditMarkerDialog,
        editingMarkerData,
        openEditMarker,
        saveEditMarker,
        onCancelEditMarker,
        cloneMarker,
        copyMarkerJson,
        copyMarkerCoordinates,
        closeContextMenu,
        openLocationDetail,
        onConfigChanged,
    };
}
