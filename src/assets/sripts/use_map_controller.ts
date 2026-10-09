import { computed, nextTick, ref, shallowRef, type Ref, type ComputedRef, watch, onUnmounted } from 'vue';
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
import type { MapCollection, MapPoint, MapShape, MapShapeType, PointFormData, SharedCollectionInfo, ShapeFormData, ShapeGeometry, ShapeStyle } from '@/assets/types/Map';
import { parseShapeGeometry, parseShapeStyle, parseShapeTags } from '@/assets/types/Map';
import {
    DEFAULT_PATH_COLOR,
    DEFAULT_REGION_COLOR,
    DEFAULT_LINE_OPACITY,
    DEFAULT_FILL_OPACITY,
    resolveShapeStyle,
    isDraftUuid,
    MapDrawController,
    createVertexHandleStyles,
    type DrawShapeMode,
} from '@/assets/sripts/map_draw_controller';
import { ApiError } from "@/assets/types/Api";
import Map from 'ol/Map';
import Collection from 'ol/Collection';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat, toLonLat } from 'ol/proj';
import { containsXY, createOrUpdateEmpty, extend as extendExtent, isEmpty as isExtentEmpty } from 'ol/extent';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style } from 'ol/style';
import { always as alwaysCondition, pointerMove, primaryAction } from 'ol/events/condition';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import Translate from 'ol/interaction/Translate';
import DragBox from 'ol/interaction/DragBox';
import DragPan from 'ol/interaction/DragPan';
import type { Feature as OLFeature } from 'ol';
import type { Geometry, SimpleGeometry } from 'ol/geom';

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

    // 必须使用 shallowRef：OpenLayers 的 Map/Layer 是带内部状态的类实例，
    // 若被深层响应式代理包裹，layer === renderLayer 等身份比较会在代理对象上失效
    const mapInstance: Ref<Map | null> = shallowRef(null);
    // 同为 OL 类实例，禁止深层响应式代理
    const vectorLayerRef: Ref<VectorLayer<VectorSource> | null> = shallowRef(null);
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
        shapeUuid: null as string | null,
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

    /** 正式的个人标记编辑弹窗（右键编辑） */
    const showPointEditDialog = ref(false);
    const savingPointEdit = ref(false);
    const pointEditFormRef = ref(null);
    const pointEditForm = ref<PointFormData>({
        title: '',
        description: '',
        longitude: '',
        latitude: '',
        address: '',
        collectionUuid: null,
        tags: [],
        public: false,
    });

    /** 通用删除确认弹窗 */
    const confirmState = ref({ visible: false, message: '', danger: true });
    let pendingConfirmAction: (() => Promise<void> | void) | null = null;

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

    /* =========================== 路径/区域图形 =========================== */
    const userShapes = ref<MapShape[]>([]);
    const showShapeDialog = ref(false);
    const shapeDialogMode = ref<'create' | 'edit'>('create');
    const shapeDialogType = ref<DrawShapeMode>('path');
    const savingShape = ref(false);
    const shapeFormRef = ref(null);
    const selectedShapeUuid = ref<string | null>(null);
    /** 选中的图形对象（信息卡用） */
    const selectedShape = computed<MapShape | null>(() =>
        userShapes.value.find(s => s.uuid === selectedShapeUuid.value) || null
    );
    /** 弹窗实时表单 */
    const shapeFormData = ref<ShapeFormData>({
        title: '',
        description: '',
        collectionUuid: null,
        tags: [],
        public: false,
        style: {},
    });
    /** 提交弹窗当前对应的草稿几何 */
    let draftShapeGeometry: ShapeGeometry | null = null;
    /** 提交弹窗当前对应的草稿 uuid（保存成功后据此移除该草稿） */
    let submittingDraftUuid: string | null = null;
    /** 正在编辑属性的已保存图形 uuid */
    let editingShapeUuid: string | null = null;
    /** 顶点编辑后待保存的几何 */
    let pendingShapeGeometry: ShapeGeometry | null = null;

    /** 编辑模式：创建路径/区域后进入，可连续绘制未提交图形并悬停再编辑 */
    const shapeEditMode = ref(false);
    /** 编辑模式下被拖动过、尚未保存的已提交图形（dirtyShapeVersion 驱动菜单响应式刷新） */
    const dirtyShapeUuids = new Set<string>();
    const dirtyShapeVersion = ref(0);
    const markShapeDirty = (uuid: string): void => {
        dirtyShapeUuids.add(uuid);
        dirtyShapeVersion.value++;
    };
    const unmarkShapeDirty = (uuid: string): void => {
        if (dirtyShapeUuids.delete(uuid)) dirtyShapeVersion.value++;
    };

    /* ======================== 分享地图集（链接导入/只读） ======================== */
    const showShareCollectionDialog = ref(false);
    const sharedCollectionInfo = ref<SharedCollectionInfo | null>(null);
    const importingSharedCollection = ref(false);
    /** 非空表示当前地图正在只读浏览他人公开集合（顶部横幅用） */
    const sharedCollectionPreview = ref<SharedCollectionInfo | null>(null);

    const drawController = new MapDrawController(() => mapInstance.value, {
        onModifyEnd: (uuid, geometry) => onShapeVerticesModified(uuid, geometry),
        onEscapeKey: () => exitShapeEditMode(),
    });
    /** 工具栏绘制按钮高亮状态 */
    const drawMode = drawController.activeMode;

    /* =========================== 框选（拖框多选） =========================== */
    /** 框选模式开关（开启后屏蔽地图平移，按住拖框选中自己的标记/路径/区域） */
    const marqueeMode = ref(false);
    const marqueeSelection = ref<{ points: MapPoint[]; shapes: MapShape[] }>({ points: [], shapes: [] });
    const marqueeCount = computed(() => marqueeSelection.value.points.length + marqueeSelection.value.shapes.length);
    /** 交给 Translate 的要素集合：真实要素 + 高亮虚影，拖动任意一个整组一起动 */
    const marqueeFeatures = new Collection<OLFeature<Geometry>>();
    const marqueeGhostSource = new VectorSource({ wrapX: false });
    let marqueeGhostLayer: VectorLayer<VectorSource> | null = null;
    let marqueeGhostFeatures: OLFeature<Geometry>[] = [];
    let dragBox: DragBox | null = null;
    let marqueeTranslate: Translate | null = null;
    /** 一次整组平移开始时各要素的首个投影坐标，松手时据此算位移并持久化 */
    let marqueeDragSnapshot: Record<string, number[]> | null = null;

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

    // “船长笔记”大类：当前地图集/未分组下已保存的路径、区域数量
    const pathShapesCount = computed(() => userShapes.value.filter(s => s.shapeType === 'path').length);
    const regionShapesCount = computed(() => userShapes.value.filter(s => s.shapeType === 'region').length);

    // 图层面板的路径/区域开关 → 同步到图形绘制控制器（即时显隐 + 命中/框选跳过）
    watch(
        () => [layerVisibility.value.shapePath !== false, layerVisibility.value.shapeRegion !== false] as const,
        ([pathVisible, regionVisible]) => {
            drawController.setTypeVisibility('path', pathVisible);
            drawController.setTypeVisibility('region', regionVisible);
        },
    );

    const userCollectionsSelect = computed(() => {
        return [{ title: t('map.noCollection'), uuid: null }].concat(userCollections.value as []);
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

    watch([highlightTargetKey, highlightCoords], () => {
        if (vectorLayerRef.value) {
            vectorLayerRef.value.changed();
        }
    });

    watch(isDebug, () => {
        triggerTransitionAnimation();
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

        const uuid = newCollectionUuid || null;
        if (uuid) {
            storageObj.local.set('map.selectedCollection', uuid);
        } else {
            storageObj.local.rem('map.selectedCollection');
        }
        // 用户切回自己的集合，退出他人集合的只读预览
        sharedCollectionPreview.value = null;
        await runCollectionLoad(uuid);
    });

    onUnmounted(() => {
        if (animFrameId !== null) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        drawController.dispose();
    });

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

        // 标准样式
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

        // 高亮样式
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

        // 其他透明样式
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
     * 更新所有分类的目标透明度
     * targetOpacity (0.0 或 1.0)
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

    const onConfigChanged = () => {
        triggerTransitionAnimation(true);
    };

    const onMapCreated = (map: Map) => {
        mapInstance.value = map;
        initializeMap(map).then(r => r);
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

        // 路径/区域绘制图层与交互
        drawController.attach();

        // 框选拖框 / 整组平移交互（默认未激活，由工具栏开关打开）
        setupMarqueeInteractions(map);

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
            // 框选整组平移进行中时关掉 debug 单点拖拽，避免两个 Translate 各挪一倍
            const active = isDebug.value && isMarkerDraggingEnabled.value && marqueeCount.value === 0;
            translateInteraction.setActive(active);
        };

        updateTranslateActive();
        watch([isDebug, isMarkerDraggingEnabled, marqueeCount], () => {
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

            // 框选模式下单击不做点位/图形选中（清空框选结果由 DragBox 的零面积 boxend 负责）
            if (marqueeMode.value) {
                selectedShapeUuid.value = null;
                model.value = false;
                showCoordinateInfo.value = false;
                return;
            }

            // 绘制模式下的点击全部交给 Draw 交互
            if (drawController.isActive()) return;

            // 优先命中路径/区域图形（未提交草稿不支持单击选中卡片，仅右键可提交/删除）
            let hitShapeUuid: string | null = null;
            drawController.forEachShapeAtPixel(event.pixel, (uuid) => {
                hitShapeUuid = uuid;
            });
            if (hitShapeUuid && !isDraftUuid(hitShapeUuid)) {
                selectedShapeUuid.value = hitShapeUuid;
                showCoordinateInfo.value = false;
                model.value = false;
                return;
            }
            selectedShapeUuid.value = null;

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

        // 右键菜单（桌面）；绘制图形过程中菜单里只保留“退出绘制模式”，不做命中检测
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
            let hitShapeUuid: string | null = null;
            drawController.forEachShapeAtPixel(pixel as [number, number], (uuid) => {
                // 编辑模式下未提交草稿也需要右键提交/删除
                hitShapeUuid = uuid;
            });
            const coord = toLonLat(map.getCoordinateFromPixel(pixel));
            openContextMenu(e.clientX, e.clientY, pixel as [number, number], coord as [number, number], feature, hitShapeUuid);
        });

        // 触摸长按（移动设备）
        setupTouchLongPress(map);

        map.on('pointermove', (event) => {
            if (event.dragging) return;
            const lonLat = toLonLat(event.coordinate);
            hoveedCoordinate.value = { longitude: lonLat[0], latitude: lonLat[1] };
        });

        await onLoadUserCollections();

        // watcher 非 immediate，无本地缓存集合（未分组）时不会触发加载，这里无条件首载一次
        await runCollectionLoad(selectedCollectionUuid.value || null);

        // /account/maps 管理页跳转联动（draw/focus/edit）
        await handleMapActionQuery();

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
        feature: OLFeature<Geometry> | null,
        shapeUuid: string | null = null
    ) => {
        // 右键个人标记时直接把卡片对准这个点，让"右键的目标就是这个点"
        const pointData = feature?.get('originalData');
        if (pointData?.category === 'shareLocation') {
            selectedPoint.value = pointData as MapPoint;
            selectedLocationData.value = {
                ...pointData,
                id: pointData.id,
                name: pointData.title,
                category: 'shareLocation',
            };
            model.value = true;
            showCoordinateInfo.value = false;
            selectedShapeUuid.value = null;
        }
        contextMenuState.value = {
            visible: true,
            x: clientX,
            y: clientY,
            pixel,
            coordinate,
            feature,
            shapeUuid,
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
                // 绘制图形过程中长按不弹菜单，避免打断绘图
                if (drawController.isActive()) return;
                // 框选模式下静止长按（移动超过 8px 会取消计时器，不影响拖框）照常弹菜单，
                // 触屏端需要靠它退出框选模式
                const pixel = map.getEventPixel({ clientX: t.clientX, clientY: t.clientY });
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
                let hitShapeUuid: string | null = null;
                drawController.forEachShapeAtPixel(pixel as [number, number], (uuid) => {
                    // 编辑模式下未提交草稿也需要右键提交/删除
                    hitShapeUuid = uuid;
                });
                const coord = toLonLat(map.getCoordinateFromPixel(pixel));
                openContextMenu(t.clientX, t.clientY, pixel as [number, number], coord as [number, number], feature, hitShapeUuid);
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
     * 右键菜单项列表
     * 根据点击的 feature 和 debug 状态动态生成
     */
    const contextMenuItems = computed(() => {
        // ref 解包会把 Feature 类结构化成丢失私有字段的类型，这里还原回类类型
        const feature = contextMenuState.value.feature as OLFeature<Geometry> | null;
        const coord = contextMenuState.value.coordinate;
        const items: any[] = [];

        // 正在绘制一笔时右键只给一个安全出口，避免其它操作打断绘图
        if (drawController.isActive()) {
            items.push({
                icon: 'mdi-close',
                label: t('map.contextMenu.exitDrawMode') || '退出绘制模式',
                action: () => drawController.cancelDraw(),
            });
            items.push({
                icon: 'mdi-exit-to-app',
                color: 'amber',
                label: t('map.contextMenu.exitEditMode') || '退出编辑模式',
                action: () => exitShapeEditMode(),
            });
            return items;
        }

        // 编辑模式：置顶退出入口（未提交内容会在退出前弹确认）
        if (shapeEditMode.value) {
            items.push({
                icon: 'mdi-exit-to-app',
                color: 'amber',
                label: t('map.contextMenu.exitEditMode') || '退出编辑模式',
                action: () => exitShapeEditMode(),
            });
            items.push({ type: 'divider' });
        }

        // 单图形顶点编辑中：置顶保存与退出（图形信息卡上也有同样按钮）
        if (drawController.editingShapeUuid.value) {
            const editingUuid = drawController.editingShapeUuid.value;
            items.push({
                icon: 'mdi-content-save-check-outline',
                label: t('map.contextMenu.saveVertices') || '保存顶点修改',
                action: () => void saveShapeVertexEdit(editingUuid),
            });
            items.push({
                icon: 'mdi-close',
                label: t('map.contextMenu.exitVertexMode') || '退出编辑模式',
                action: () => cancelShapeVertexEdit(),
            });
            items.push({ type: 'divider' });
        }

        // 框选模式：置顶退出与清空选择
        if (marqueeMode.value) {
            if (marqueeCount.value > 0) {
                items.push({
                    icon: 'mdi-close-box-outline',
                    label: t('map.marquee.cancel') || '取消选择',
                    action: () => clearMarqueeSelection(),
                });
            }
            items.push({ type: 'divider' });
        }

        if (feature) {
            const originalData = feature.get('originalData');

            if (originalData?.category === 'shareLocation') {
                // 个人标记：属主右键置顶「编辑」直接弹出编辑窗口，另有查看卡片/删除
                const point = originalData as MapPoint;
                const pointName = point.title || point.id;
                const pointOwned = point.userId === authStore.user?.userId;
                if (pointOwned) {
                    items.push({
                        icon: 'mdi-pencil',
                        color: 'amber',
                        label: t('map.contextMenu.editThisMarker') || '编辑此标记',
                        action: () => onOpenPointEdit(feature),
                    });
                }
                items.push({
                    icon: 'mdi-information-outline',
                    label: `${t('map.contextMenu.viewPoint') || '查看标记'}${pointName ? ` (${pointName})` : ''}`,
                    action: () => focusPointFeature(feature),
                });
                if (pointOwned) {
                    items.push({
                        icon: 'mdi-delete-outline',
                        label: t('map.contextMenu.deletePoint') || '删除标记',
                        danger: true,
                        action: () => onDeletePointFromMenu(feature),
                    });
                }
                items.push({ type: 'divider' });
            } else {
                // 游戏内置地标
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
        }

        // 点击了路径/区域图形（可能是未提交草稿）
        if (contextMenuState.value.shapeUuid) {
            const shapeUuid = contextMenuState.value.shapeUuid;
            const draft = isDraftUuid(shapeUuid);
            const draftRender = draft ? drawController.getRenderFeature(shapeUuid) : null;
            const draftType = draftRender?.get('shapeType') as MapShapeType | undefined;
            const shape = draft ? null : userShapes.value.find(s => s.uuid === shapeUuid);
            const draftOwner = draftRender?.get('userId') as string | null | undefined;
            const isOwner = draft
                ? draftOwner === authStore.user?.userId
                : shape?.userId === authStore.user?.userId;
            const typeName = (draft ? draftType : shape?.shapeType) === 'region'
                ? (t('map.region') || '区域')
                : (t('map.path') || '路径');

            if (draft) {
                // 未提交草稿：提交或删除（编辑模式本人图形才会出现在这里）
                if (isOwner) {
                    items.push({
                        icon: 'mdi-upload-outline',
                        color: 'amber',
                        label: t('map.contextMenu.submitDraft') || '提交未提交图形',
                        action: () => submitDraftShape(shapeUuid),
                    });
                    items.push({
                        icon: 'mdi-delete-outline',
                        label: t('map.contextMenu.deleteDraft') || '删除未提交图形',
                        danger: true,
                        action: () => deleteDraftShape(shapeUuid),
                    });
                    items.push({ type: 'divider' });
                }
            } else if (shape) {
                const shapeName = shape.title || typeName;
                // 图形信息面板已在展示该图形时，菜单里不提供「图形信息」
                // if (selectedShapeUuid.value !== shapeUuid) {
                //     items.push({
                //         icon: 'mdi-information-outline',
                //         label: `${t('map.contextMenu.shapeInfo') || '查看图形'} (${shapeName})`,
                //         action: () => {
                //             selectedShapeUuid.value = shapeUuid;
                //         },
                //     });
                // }

                // 属主右键置顶「编辑此路径/编辑此区域」，直接弹出对应编辑窗口
                if (isOwner) {
                    items.push({
                        icon: 'mdi-pencil',
                        color: 'amber',
                        label: shape.shapeType === 'region'
                            ? (t('map.contextMenu.editThisRegion') || '编辑此区域')
                            : (t('map.contextMenu.editThisPath') || '编辑此路径'),
                        action: () => openShapeEdit(shapeUuid),
                    });
                }
                // 编辑类操作仅属主可见，分享/公开场景只保留查看
                if (isOwner) {
                    // 读取 dirty 版本号，使顶点被拖动后菜单能即时刷新出保存/还原项
                    void dirtyShapeVersion.value;
                    const dirty = dirtyShapeUuids.has(shapeUuid);
                    if (dirty && shapeEditMode.value) {
                        items.push({
                            icon: 'mdi-content-save-check-outline',
                            color: 'amber',
                            label: t('map.contextMenu.saveVertices') || '保存顶点修改',
                            action: () => void saveShapeVertexEdit(shapeUuid),
                        });
                        items.push({
                            icon: 'mdi-undo',
                            label: t('map.contextMenu.revertVertices') || '还原顶点修改',
                            action: () => revertDirtyShape(shapeUuid),
                        });
                    }
                    items.push({
                        icon: 'mdi-vector-square-edit',
                        label: t('map.contextMenu.editShapeVertices') || '编辑路径顶点',
                        action: () => beginShapeVertexEdit(shapeUuid),
                    });
                    items.push({
                        icon: 'mdi-delete-outline',
                        label: t('map.contextMenu.deleteShape') || '删除图形',
                        danger: true,
                        action: () => {
                            selectedShapeUuid.value = shapeUuid;
                            void deleteShape(shapeUuid);
                        },
                    });
                }
                items.push({ type: 'divider' });
            }
        }

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

        // 登录用户：在右键菜单里创建路径/区域、批量清除当前地图上的路径/区域
        if (authStore.isLogin) {
            items.push({ type: 'divider' });
            // 在此添加标记
            items.push({
                icon: 'mdi-map-marker-plus',
                label: t('map.contextMenu.addMarker') || '在此添加标记',
                action: () => {
                    clickedCoordinate.value = { longitude: coord[0], latitude: coord[1] };
                    newMarkerData.value = {
                        collectionUuid: selectedCollectionUuid.value || null,
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
            items.push({
                icon: 'mdi-vector-polyline',
                label: t('map.contextMenu.createPath') || '创建路径',
                action: () => onStartDraw('path'),
            });
            items.push({
                icon: 'mdi-vector-polygon',
                label: t('map.contextMenu.createRegion') || '创建区域',
                action: () => onStartDraw('region'),
            });

            items.push({ type: 'divider' });
            if (marqueeMode.value) {
                items.push({
                    icon: 'mdi-selection-drag',
                    color: 'amber',
                    label: t('map.contextMenu.exitMarqueeMode') || '退出框选模式',
                    action: () => setMarqueeMode(false),
                });
            } else {
                items.push({
                    icon: 'mdi-selection-drag',
                    color: 'amber',
                    label: t('map.contextMenu.enterMarqueeMode') || '框选模式',
                    action: () => setMarqueeMode(true),
                });
            }

            // 当前地图上本人的已提交路径/区域
            const ownedShapesOnMap = drawController.getShapeUuids()
                .filter(uuid => uuid && !isDraftUuid(uuid))
                .map(uuid => userShapes.value.find(s => s.uuid === uuid))
                .filter((s): s is MapShape => !!s && s.userId === authStore.user?.userId);
            const ownedPaths = ownedShapesOnMap.filter(s => s.shapeType === 'path');
            const ownedRegions = ownedShapesOnMap.filter(s => s.shapeType === 'region');

            // 当前地图上本人的未提交草稿（仅编辑模式存在）
            const draftPaths = drawController.getDraftUuids()
                .filter(uuid => drawController.getRenderFeature(uuid)?.get('shapeType') === 'path');
            const draftRegions = drawController.getDraftUuids()
                .filter(uuid => drawController.getRenderFeature(uuid)?.get('shapeType') === 'region');

            /** 构建某类图形的「删除」二级菜单：所有 / 已提交 / 未提交 */
            const buildDeleteShapeSubmenu = (
                shapeType: MapShapeType,
                parentIcon: string,
                submitted: MapShape[],
                drafts: string[],
            ): any => {
                const isRegion = shapeType === 'region';
                const total = submitted.length + drafts.length;
                return {
                    icon: parentIcon,
                    danger: true,
                    disabled: total === 0,
                    label: `${isRegion
                        ? (t('map.contextMenu.deleteRegions') || '删除区域')
                        : (t('map.contextMenu.deletePaths') || '删除路径')} (${total})`,
                    children: [
                        {
                            icon: 'mdi-delete-sweep-outline',
                            danger: true,
                            disabled: total === 0,
                            label: `${isRegion
                                ? (t('map.contextMenu.deleteAllRegions') || '删除所有地图上区域')
                                : (t('map.contextMenu.deleteAllPaths') || '删除所有地图上路径')} (${total})`,
                            action: () => onClearShapesByType(shapeType, 'all'),
                        },
                        {
                            icon: 'mdi-cloud-check-outline',
                            danger: true,
                            disabled: submitted.length === 0,
                            label: `${isRegion
                                ? (t('map.contextMenu.deleteSubmittedRegions') || '删除已提交区域')
                                : (t('map.contextMenu.deleteSubmittedPaths') || '删除已提交路径')} (${submitted.length})`,
                            action: () => onClearShapesByType(shapeType, 'submitted'),
                        },
                        {
                            icon: 'mdi-pencil-ruler',
                            danger: true,
                            disabled: drafts.length === 0,
                            label: `${isRegion
                                ? (t('map.contextMenu.deleteDraftRegions') || '删除未提交区域')
                                : (t('map.contextMenu.deleteDraftPaths') || '删除未提交路径')} (${drafts.length})`,
                            action: () => onClearShapesByType(shapeType, 'draft'),
                        },
                    ],
                };
            };

            items.push({ type: 'divider' });
            items.push(buildDeleteShapeSubmenu('path', 'mdi-vector-line-remove', ownedPaths, draftPaths));
            items.push(buildDeleteShapeSubmenu('region', 'mdi-vector-polygon-remove', ownedRegions, draftRegions));
        }

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

    /**
     * 复制经纬度坐标
     * @param coord
     */
    const copyCoordinates = async (coord: [number, number]) => {
        const text = `${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}`;
        try {
            await navigator.clipboard.writeText(text);
            notice.success(t('map.contextMenu.copiedCoordinatesTip'), { mode: 'minimal' });
        } catch (e) {
            console.error('Copy failed', e);
        }
    };

    /**
     * 复制标记 JSON
     * @param target
     */
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

    /**
     * 克隆标记
     * @param target
     * @param targetCoord
     */
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

    /**
     * 打开标记编辑弹窗
     * @param target
     */
    const openEditMarker = (target: any) => {
        const raw = target?.get ? target.get('originalData') : target;
        if (!raw) return;
        editingOriginalId.value = raw.id;
        editingMarkerData.value = JSON.parse(JSON.stringify(raw));
        showEditMarkerDialog.value = true;
    };

    /**
     * 保存标记编辑
     * @param updatedData
     */
    const saveEditMarker = (updatedData: any) => {
        if (!updatedData || !updatedData.id) return;
        const oldId = editingOriginalId.value || updatedData.id;

        // 更新 locations.value 列表
        const idx = locations.value.findIndex(loc => loc.id === oldId);
        if (idx !== -1) {
            locations.value[idx] = { ...updatedData, lastUpdated: new Date().toISOString() };
        } else {
            locations.value.push({ ...updatedData, lastUpdated: new Date().toISOString() });
        }

        // 更新 vectorLayer 中的 feature
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

        // 若当前卡片正在查看该标记，同步更新卡片
        if (selectedLocationData.value?.id === oldId || selectedLocationData.value?.id === updatedData.id) {
            selectedLocationData.value = { ...updatedData, lastUpdated: new Date().toISOString() };
        }

        showEditMarkerDialog.value = false;
        triggerTransitionAnimation(true);
        notice.success(t('map.contextMenu.markerSavedTip', { id: updatedData.id }), { mode: 'minimal' });
    };

    /**
     * 取消标记编辑
     */
    const onCancelEditMarker = () => {
        showEditMarkerDialog.value = false;
        editingMarkerData.value = null;
        editingOriginalId.value = '';
    };

    /**
     * 复制当前位置 URL 链接
     * @param coord
     * @param feature
     */
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

    /**
     * 将边界调整为当前视口显示区域
     */
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

    /**
     * 跳转到地图位置详情页
     * @param id
     */
    const openLocationDetail = (id: string) => {
        if (!id) return;

        router.push({name: 'MapLocationDetail', params: {id}}).then(r => r);
     };

    /**
     * Debug 模式：在地图上显示边界矩形 + 4个可拖拽角点
     * 拖拽后实时更新 mapBounds 并打印新值
     * @param map
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

        // Modify 交互：拖拽角点（手柄统一使用主题色 var(--main-color)）
        const modifyInteraction = new Modify({
            source: boundsSource,
            style: () => createVertexHandleStyles(),
        });
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

    /**
     * 处理连接参数
     * @param queryKey
     * @param queryX
     * @param queryY
     * @param queryCategory
     * @param vectorSource
     */
    const onHandleUrlParams = async (queryKey: string, queryX: string, queryY: string, queryCategory: string, vectorSource: VectorSource): Promise<void> => {
        const lon = Number.parseFloat(queryX as string);
        const lat = Number.parseFloat(queryY as string);
        const hasCoord = Number.isFinite(lon) && Number.isFinite(lat)
            && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
        const key = typeof queryKey === 'string' ? queryKey : '';
        const category = typeof queryCategory === 'string' ? queryCategory : '';

        // 无论哪种链接，只要带了合法坐标，打开就先定位过去
        if (hasCoord) {
            targetLongitude.value = lon;
            targetLatitude.value = lat;
        }

        const existingLocation = key ? locations.value.find(loc => loc.id === key) : undefined;

        if (existingLocation) {
            targetLocationId.value = existingLocation.id;
            selectedLocationData.value = existingLocation;
            model.value = true;
            return;
        }

        if (key && category === 'shareLocation') {
            const personalMarker = personalMarkers.value.find(marker => marker.id === key);
            if (personalMarker) {
                selectedPoint.value = personalMarker;
                selectedLocationData.value = { ...personalMarker, category: 'shareLocation', id: personalMarker.id, name: personalMarker.title };
                model.value = true;
                return;
            }
            // 标记可能在别的集合里、本地尚未加载，直接按 uuid 拉详情（无权限则只保留定位）
            if (authStore.isLogin) {
                try {
                    const resp = await api.getPointDetail(key);
                    const point = resp.data.point as MapPoint;
                    ensurePointFeatureVisible(point);
                    selectedPoint.value = point;
                    selectedLocationData.value = { ...point, id: point.id, name: point.title, category: 'shareLocation' };
                    model.value = true;
                } catch {
                    // 拉取失败不打断，地图仍已定位到链接坐标
                }
            }
            return;
        }

        if (key && category && hasCoord) {
            const loadLocation = {
                name: key,
                id: key,
                latitude: lat,
                longitude: lon,
                category,
                dateAdded: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
            };
            const newFeature = onCreateFeatureFromLocation(loadLocation);
            vectorSource.addFeature(newFeature);

            if (!layerVisibility.value[category]) {
                layerVisibility.value[category] = true;
                onUpdateAllLayersVisibleState();
            }

            selectedLocationData.value = loadLocation;
            model.value = true;

            if (category === 'shareLocation') {
                locations.value.push(loadLocation);
            }
            return;
        }

        // 裸坐标链接（?x=&y=）：没有标记信息，定位并展示坐标卡片即可
        if (hasCoord && !key) {
            clickedCoordinate.value = { longitude: lon, latitude: lat };
            showCoordinateInfo.value = true;
        }
    };

    /**
     * 加载用户集合
     */
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

    /**
     * 加载当前集合（或未分组）的用户标记点
     * @param collectionUuid null=未分组
     */
    let pointsLoadSeq = 0;
    const loadCurrentPoints = async (collectionUuid: string | null): Promise<void> => {
        if (!authStore.isLogin) return;
        const seq = ++pointsLoadSeq;
        try {
            const result = collectionUuid
                ? await api.getCollectionPoints(collectionUuid, {page: 1, pageSize: 100})
                : await api.getOrphanPoints({page: 1, pageSize: 100});
            // 快速切换集合时只认最后一次请求，防止旧响应覆盖新数据
            if (seq !== pointsLoadSeq) return;
            personalMarkers.value = result.data.points;
            onAddPersonalMarkersToMap(result.data.points);
        } catch (e) {
            if (seq !== pointsLoadSeq) return;
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error(e);
        }
    };

    /** 兼容旧调用名 */
    const loadCollectionPoints = async (collectionUuid: string): Promise<void> => {
        await loadCurrentPoints(collectionUuid);
    };

    /* ============================== 路径/区域 ============================== */

    /**
     * 加载某集合（或未分组）的全部图形并渲染。
     * preserveEditMode：编辑模式内保存/删除后的局部刷新置 true，只差量同步已提交图形，
     * 保留未提交草稿、触控带与编辑模式本身；切换集合/退出编辑则全量重建。
     */
    let shapesLoadSeq = 0;
    const loadCollectionShapes = async (
        collectionUuid: string | null,
        preserveEditMode = false,
    ): Promise<void> => {
        // 切换地图集时编辑模式一并结束，未提交草稿不属于新集合
        if (shapeEditMode.value && !preserveEditMode) {
            drawController.setEditMode(false);
            shapeEditMode.value = false;
            drawController.removeDraft();
            dirtyShapeUuids.clear();
            dirtyShapeVersion.value++;
        }
        if (!authStore.isLogin) {
            drawController.clearShapes();
            userShapes.value = [];
            return;
        }
        const seq = ++shapesLoadSeq;
        try {
            const result = collectionUuid
                ? await api.getCollectionShapes(collectionUuid)
                : await api.getOrphanShapes();
            if (seq !== shapesLoadSeq) return;
            const serverShapes = result.data.shapes || [];
            userShapes.value = serverShapes;

            if (shapeEditMode.value && preserveEditMode) {
                // 编辑模式内的静默刷新：差量更新已提交图形，未提交草稿一律保留
                const serverUuids = new Set(serverShapes.map(s => s.uuid));
                drawController.getShapeUuids().forEach(uuid => {
                    if (!isDraftUuid(uuid) && !serverUuids.has(uuid)) {
                        drawController.removeShape(uuid);
                    }
                });
                serverShapes.forEach(shape => {
                    // 正在单图形顶点编辑、或已有未保存顶点修改的要素不重建，避免打断/覆盖本地状态
                    if (drawController.editingShapeUuid.value === shape.uuid) return;
                    if (dirtyShapeUuids.has(shape.uuid)) return;
                    drawController.upsertShape(shape);
                });
                return;
            }

            drawController.clearShapes();
            serverShapes.forEach(shape => drawController.upsertShape(shape));
            selectedShapeUuid.value = null;
        } catch (e) {
            if (seq !== shapesLoadSeq) return;
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error(e);
        }
    };

    /** 最近一次"点位 + 图形"成对加载，供初始化与 query 联动等待收口 */
    let currentCollectionLoad: Promise<void> = Promise.resolve();
    /** 在途的同集合加载（初始化与 watcher 可能同时触发同一集合，避免重复请求） */
    let inflightCollectionLoad: { uuid: string | null; promise: Promise<void> } | null = null;
    const runCollectionLoad = (uuid: string | null): Promise<void> => {
        if (inflightCollectionLoad && inflightCollectionLoad.uuid === uuid) {
            currentCollectionLoad = inflightCollectionLoad.promise;
            return inflightCollectionLoad.promise;
        }
        const promise = Promise.all([
            loadCurrentPoints(uuid),
            loadCollectionShapes(uuid),
        ]).then(() => undefined);
        inflightCollectionLoad = { uuid, promise };
        promise.finally(() => {
            if (inflightCollectionLoad?.promise === promise) inflightCollectionLoad = null;
        });
        currentCollectionLoad = promise;
        return promise;
    };

    /** 统一兜底为完整样式，避免取色器拿到空值时显示/写入黑色 */
    const buildDefaultShapeStyle = (mode: DrawShapeMode): ShapeStyle => ({
        color: mode === 'region' ? DEFAULT_REGION_COLOR : DEFAULT_PATH_COLOR,
        opacity: DEFAULT_LINE_OPACITY,
        width: 4,
        dashed: false,
        smoothed: false,
        fillColor: mode === 'region' ? DEFAULT_REGION_COLOR : DEFAULT_PATH_COLOR,
        fillOpacity: DEFAULT_FILL_OPACITY,
    });

    /** 工具栏/右键点击：进入编辑模式并开始一笔绘制（编辑模式下可连续画多个未提交图形） */
    const onStartDraw = (mode: DrawShapeMode): void => {
        if (!authStore.isLogin) return;
        setMarqueeMode(false);
        drawController.attach();
        if (!shapeEditMode.value) {
            enterShapeEditMode();
        }
        drawController.startDraw(mode);
    };

    /** 进入编辑模式：本人全部图形（已提交+未提交）悬停即可拖顶点再编辑 */
    const enterShapeEditMode = (): void => {
        drawController.setEditMode(true, authStore.user?.userId);
        shapeEditMode.value = true;
    };

    /** 右键未提交草稿 → 提交：打开属性弹窗，保存后转为正式图形 */
    const submitDraftShape = (draftUuid: string): void => {
        const render = drawController.getRenderFeature(draftUuid);
        if (!render) return;
        const rawGeometry = render.get('rawGeometry') as ShapeGeometry | undefined;
        if (!rawGeometry) return;
        const shapeType = render.get('shapeType') as DrawShapeMode;
        const style = resolveShapeStyle(
            (render.get('shapeStyle') as ShapeStyle | null) || buildDefaultShapeStyle(shapeType),
            shapeType,
        );

        submittingDraftUuid = draftUuid;
        draftShapeGeometry = rawGeometry;
        editingShapeUuid = null;
        pendingShapeGeometry = null;
        shapeDialogMode.value = 'create';
        shapeDialogType.value = shapeType;
        shapeFormData.value = {
            title: '',
            description: '',
            collectionUuid: selectedCollectionUuid.value || null,
            tags: [],
            public: false,
            style,
        };
        showShapeDialog.value = true;
    };

    /** 右键未提交草稿 → 删除（仅本地，不调接口） */
    const deleteDraftShape = (draftUuid: string): void => {
        drawController.removeDraft(draftUuid);
        if (selectedShapeUuid.value === draftUuid) selectedShapeUuid.value = null;
    };

    /** 是否存在未提交草稿或已提交图形的未保存顶点修改 */
    const hasPendingShapeEdits = (): boolean =>
        drawController.getDraftUuids().length > 0 || dirtyShapeUuids.size > 0;

    /** 退出编辑模式：存在未提交内容时先请用户确认 */
    const exitShapeEditMode = (): void => {
        // 属性弹窗或确认框打开时，ESC 交给弹窗自身处理，不叠加触发退出
        if (showShapeDialog.value || confirmState.value.visible) return;
        if (drawController.isActive()) {
            drawController.cancelDraw();
        }
        if (hasPendingShapeEdits()) {
            askConfirm(t('map.contextMenu.confirmExitEditMode'), () => doExitShapeEditMode());
            return;
        }
        void doExitShapeEditMode();
    };

    /** 实际退出：丢弃全部草稿、回滚已提交图形的未保存顶点修改 */
    const doExitShapeEditMode = async (): Promise<void> => {
        drawController.setEditMode(false);
        shapeEditMode.value = false;
        drawController.removeDraft();
        dirtyShapeUuids.clear();
        dirtyShapeVersion.value++;
        selectedShapeUuid.value = null;
        await loadCollectionShapes(selectedCollectionUuid.value || null);
    };

    /** 弹窗表单实时变化（草稿样式预览） */
    const onShapeFormChange = (data: ShapeFormData): void => {
        shapeFormData.value = data;
        if (shapeDialogMode.value === 'create' && draftShapeGeometry && submittingDraftUuid) {
            drawController.previewDraftStyle(
                submittingDraftUuid, shapeDialogType.value, draftShapeGeometry, data.style,
            );
        }
    };

    /** 保存（新建或编辑属性） */
    const onSaveShape = async (): Promise<void> => {
        const formRef = (shapeFormRef.value as any)?.formRef;
        if (!formRef) return;
        const { valid } = await formRef.validate();
        if (!valid) return;

        savingShape.value = true;
        try {
            const f = shapeFormData.value;
            if (shapeDialogMode.value === 'create') {
                if (!draftShapeGeometry || !submittingDraftUuid) return;
                await api.createShape({
                    shapeType: shapeDialogType.value,
                    title: f.title,
                    description: f.description,
                    collectionUuid: f.collectionUuid || null,
                    geometry: draftShapeGeometry,
                    style: f.style,
                    tags: f.tags,
                    public: f.public,
                });
                // 提交成功：只移除对应草稿，其他未提交草稿保留
                drawController.removeDraft(submittingDraftUuid);
                notice.success(t('basic.tips.map.createSuccess'));
            } else if (editingShapeUuid) {
                await api.updateShape(editingShapeUuid, {
                    title: f.title,
                    description: f.description,
                    collectionUuid: f.collectionUuid || null,
                    ...(pendingShapeGeometry ? { geometry: pendingShapeGeometry } : {}),
                    style: f.style,
                    tags: f.tags,
                    public: f.public,
                });
                drawController.endEditVertices();
                unmarkShapeDirty(editingShapeUuid);
                notice.success(t('basic.tips.map.updateSuccess'));
            }
            draftShapeGeometry = null;
            submittingDraftUuid = null;
            editingShapeUuid = null;
            pendingShapeGeometry = null;
            showShapeDialog.value = false;
            // 与服务器保持一致（保存到其他集合 / 顶点修改等场景）；编辑模式内保留其他草稿
            await loadCollectionShapes(selectedCollectionUuid.value || null, shapeEditMode.value);
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error('保存图形失败:', e);
        } finally {
            savingShape.value = false;
        }
    };

    /** 取消弹窗：新建仅关闭窗口，未提交草稿保留在编辑模式；编辑回滚未保存的顶点修改 */
    const onCancelShapeDialog = (): void => {
        if (shapeDialogMode.value === 'create') {
            // 草稿保留，用户仍可在右键菜单中提交或删除
        } else {
            drawController.endEditVertices();
        }
        draftShapeGeometry = null;
        submittingDraftUuid = null;
        editingShapeUuid = null;
        pendingShapeGeometry = null;
        showShapeDialog.value = false;
        if (shapeDialogMode.value === 'edit') {
            void loadCollectionShapes(selectedCollectionUuid.value || null, shapeEditMode.value);
        }
    };

    /** 打开已保存图形的属性/样式编辑弹窗 */
    const openShapeEdit = (uuid: string): void => {
        const shape = userShapes.value.find(s => s.uuid === uuid);
        if (!shape) return;
        drawController.endEditVertices();
        editingShapeUuid = uuid;
        pendingShapeGeometry = null;
        shapeDialogMode.value = 'edit';
        shapeDialogType.value = shape.shapeType;
        shapeFormData.value = {
            title: shape.title,
            description: shape.description || '',
            collectionUuid: shape.collectionId || null,
            tags: parseShapeTags(shape),
            public: shape.public === 1,
            // 补全为完整样式：旧数据缺字段时取色器与滑块也能显示真实有效值
            style: resolveShapeStyle(parseShapeStyle(shape), shape.shapeType),
        };
        showShapeDialog.value = true;
    };

    /**
     * 顶点拖拽修改回调：
     * 未提交草稿的修改只存在本地，无需暂存；单图形属性编辑中挂到 pending；
     * 编辑模式下悬停拖动的已提交图形标记为 dirty，退出前需保存或回滚
     */
    const onShapeVerticesModified = (uuid: string, geometry: ShapeGeometry): void => {
        if (isDraftUuid(uuid)) return;
        if (editingShapeUuid === uuid) {
            pendingShapeGeometry = geometry;
            return;
        }
        if (shapeEditMode.value) {
            markShapeDirty(uuid);
        }
    };

    /** 进入单图形顶点编辑模式（信息卡按钮 / 右键菜单） */
    const beginShapeVertexEdit = (uuid: string): void => {
        setMarqueeMode(false);
        selectedShapeUuid.value = uuid;
        drawController.beginEditVertices(uuid);
    };

    /** 放弃顶点编辑并恢复（编辑模式下悬停修改的回滚走 revertDirtyShape） */
    const cancelShapeVertexEdit = (): void => {
        drawController.endEditVertices();
        void loadCollectionShapes(selectedCollectionUuid.value || null, shapeEditMode.value);
    };

    /** 直接保存顶点编辑结果（信息卡快捷保存；编辑模式下悬停拖动后也走这里） */
    const saveShapeVertexEdit = async (uuid: string): Promise<void> => {
        const geometry = drawController.getEditingGeometry(uuid);
        drawController.endEditVertices();
        if (!geometry) return;
        try {
            await api.updateShape(uuid, { geometry });
            unmarkShapeDirty(uuid);
            notice.success(t('basic.tips.map.updateSuccess'));
            await loadCollectionShapes(selectedCollectionUuid.value || null, shapeEditMode.value);
            selectedShapeUuid.value = uuid;
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error(e);
        }
    };

    /** 编辑模式下放弃某个已提交图形的悬停顶点修改，恢复到服务器版本 */
    const revertDirtyShape = (uuid: string): void => {
        unmarkShapeDirty(uuid);
        void loadCollectionShapes(selectedCollectionUuid.value || null, true);
    };

    /** 删除图形 */
    const deleteShape = async (uuid: string): Promise<void> => {
        try {
            await api.deleteShape(uuid);
            unmarkShapeDirty(uuid);
            drawController.removeShape(uuid);
            userShapes.value = userShapes.value.filter(s => s.uuid !== uuid);
            if (selectedShapeUuid.value === uuid) selectedShapeUuid.value = null;
            if (marqueeSelection.value.shapes.some(s => s.uuid === uuid)) {
                removeFromMarqueeSelection('shape', uuid);
            }
            notice.success(t('basic.tips.map.deleteSuccess'));
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error(e);
        }
    };

    const closeShapeCard = (): void => {
        selectedShapeUuid.value = null;
    };

    /* ========================= 个人标记：右键编辑/删除 ========================= */

    /** 解析后端返回的 tags JSON 字符串 */
    const parsePointTags = (raw: string | undefined | null): string[] => {
        if (!raw) return [];
        try {
            const v = JSON.parse(raw);
            return Array.isArray(v) ? v : [];
        } catch {
            return [];
        }
    };

    /** 在主图层里按 uuid 找个人标记要素 */
    const findPointFeatureByUuid = (uuid: string): OLFeature<Geometry> | null => {
        const source = vectorLayerRef.value?.getSource();
        if (!source) return null;
        return source.getFeatures().find(f => f.get('originalData')?.uuid === uuid) || null;
    };

    /** 右键菜单"查看标记"：卡片对准该点 */
    const focusPointFeature = (feature: OLFeature<Geometry>): void => {
        const raw = feature.get('originalData') as MapPoint | undefined;
        if (!raw) return;
        selectedPoint.value = raw;
        selectedLocationData.value = { ...raw, id: raw.id, name: raw.title, category: 'shareLocation' };
        model.value = true;
        showCoordinateInfo.value = false;
    };

    /** 打开个人标记编辑弹窗 */
    const onOpenPointEdit = (feature: OLFeature<Geometry>): void => {
        const raw = feature.get('originalData') as MapPoint | undefined;
        if (!raw?.uuid) return;
        pointEditForm.value = {
            uuid: raw.uuid,
            title: raw.title,
            description: raw.description || '',
            longitude: raw.longitude,
            latitude: raw.latitude,
            address: raw.address || '',
            collectionUuid: raw.collectionId || null,
            tags: parsePointTags(raw.tags),
            public: raw.public === 1,
        };
        showPointEditDialog.value = true;
    };

    const onPointEditFormChange = (data: PointFormData): void => {
        pointEditForm.value = data;
    };

    /** 保存个人标记编辑 */
    const onSavePointEdit = async (): Promise<void> => {
        const formRef = (pointEditFormRef.value as any)?.formRef;
        if (!formRef) return;
        const { valid } = await formRef.validate();
        if (!valid) return;

        const f = pointEditForm.value;
        if (!f.uuid) return;
        savingPointEdit.value = true;
        try {
            const longitude = Number(f.longitude);
            const latitude = Number(f.latitude);
            const collectionUuid = f.collectionUuid || null;
            await api.updatePoint(f.uuid, {
                title: f.title,
                description: f.description || undefined,
                longitude,
                latitude,
                address: f.address || undefined,
                collectionUuid,
                tags: f.tags,
                public: f.public,
            });

            // 同步地图要素
            const feature = findPointFeatureByUuid(f.uuid);
            if (feature) {
                const old = feature.get('originalData') as MapPoint;
                const updated: MapPoint = {
                    ...old,
                    title: f.title,
                    description: f.description || '',
                    longitude,
                    latitude,
                    address: f.address || '',
                    collectionId: collectionUuid || '',
                    tags: JSON.stringify(f.tags),
                    public: f.public ? 1 : 0,
                };
                feature.set('name', f.title);
                feature.set('originalData', { ...updated, category: 'shareLocation' });
                (feature.getGeometry() as Point).setCoordinates(fromLonLat([longitude, latitude]));
                feature.changed();
            }

            // 同步列表 / 卡片 / 框选结果
            const idx = personalMarkers.value.findIndex(p => p.uuid === f.uuid);
            if (idx !== -1) {
                personalMarkers.value[idx] = {
                    ...personalMarkers.value[idx],
                    title: f.title,
                    description: f.description || '',
                    longitude,
                    latitude,
                    address: f.address || '',
                    collectionId: collectionUuid || '',
                    tags: JSON.stringify(f.tags),
                    public: f.public ? 1 : 0,
                };
            }
            if (selectedPoint.value?.uuid === f.uuid) {
                selectedPoint.value = { ...selectedPoint.value, title: f.title };
            }
            if (selectedLocationData.value?.uuid === f.uuid) {
                selectedLocationData.value = {
                    ...selectedLocationData.value,
                    name: f.title,
                    title: f.title,
                    longitude,
                    latitude,
                };
            }
            const selectedPointIdx = marqueeSelection.value.points.findIndex(p => p.uuid === f.uuid);
            if (selectedPointIdx !== -1 && feature) {
                marqueeSelection.value.points[selectedPointIdx] = feature.get('originalData') as MapPoint;
            }

            showPointEditDialog.value = false;
            notice.success(t('basic.tips.map.updateSuccess'));
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error('更新标记失败:', e);
        } finally {
            savingPointEdit.value = false;
        }
    };

    const onCancelPointEdit = (): void => {
        showPointEditDialog.value = false;
    };

    /** 右键删除个人标记（带确认） */
    const onDeletePointFromMenu = (feature: OLFeature<Geometry>): void => {
        const raw = feature.get('originalData') as MapPoint | undefined;
        if (!raw?.uuid) return;
        askConfirm(t('map.confirmDeletePoint', { title: raw.title || raw.id }), async () => {
            await api.deletePoint(raw.uuid);
            const source = vectorLayerRef.value?.getSource();
            if (source && feature) source.removeFeature(feature);
            personalMarkers.value = personalMarkers.value.filter(p => p.uuid !== raw.uuid);
            if (selectedPoint.value?.uuid === raw.uuid) selectedPoint.value = null;
            if (selectedLocationData.value?.uuid === raw.uuid) {
                selectedLocationData.value = {};
                model.value = false;
            }
            removeFromMarqueeSelection('point', raw.uuid);
            notice.success(t('basic.tips.map.deleteSuccess'));
        });
    };

    /* ============================= 通用确认弹窗 ============================= */

    const askConfirm = (message: string, action: () => Promise<void> | void, danger = true): void => {
        pendingConfirmAction = action;
        confirmState.value = { visible: true, message, danger };
    };

    const onConfirmDialog = async (): Promise<void> => {
        const action = pendingConfirmAction;
        pendingConfirmAction = null;
        confirmState.value.visible = false;
        if (!action) return;
        try {
            await action();
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            } else {
                console.error(e);
            }
        }
    };

    const onCancelConfirmDialog = (): void => {
        pendingConfirmAction = null;
        confirmState.value.visible = false;
    };

    /* ===================== 右键菜单：删除当前地图线/区域（所有/已提交/未提交） ===================== */

    const onClearShapesByType = (
        type: MapShapeType,
        scope: 'all' | 'submitted' | 'draft' = 'all',
    ): void => {
        if (!authStore.isLogin) return;

        // 已提交图形（走接口批量删除）
        const submittedTargets = scope === 'draft' ? [] : drawController.getShapeUuids()
            .filter(uuid => uuid && !isDraftUuid(uuid))
            .map(uuid => userShapes.value.find(s => s.uuid === uuid))
            .filter((s): s is MapShape =>
                !!s && s.userId === authStore.user?.userId && s.shapeType === type);

        // 未提交草稿（仅本地移除）
        const draftTargets = scope === 'submitted' ? [] : drawController.getDraftUuids()
            .filter(uuid => drawController.getRenderFeature(uuid)?.get('shapeType') === type);

        if (submittedTargets.length === 0 && draftTargets.length === 0) return;

        const typeName = type === 'path' ? (t('map.path') || '路径') : (t('map.region') || '区域');
        askConfirm(
            t('map.confirmClearShapes', {
                type: typeName,
                count: submittedTargets.length + draftTargets.length,
            }),
            async () => {
                // 未提交草稿：直接清本地
                draftTargets.forEach(uuid => drawController.removeDraft(uuid));
                if (selectedShapeUuid.value && draftTargets.includes(selectedShapeUuid.value)) {
                    selectedShapeUuid.value = null;
                }

                // 已提交图形：批量调接口
                if (submittedTargets.length > 0) {
                    const uuids = submittedTargets.map(s => s.uuid);
                    await api.batchDeleteShapes(uuids);
                    submittedTargets.forEach(s => {
                        unmarkShapeDirty(s.uuid);
                        drawController.removeShape(s.uuid);
                    });
                    userShapes.value = userShapes.value.filter(s => !uuids.includes(s.uuid));
                    if (selectedShapeUuid.value && uuids.includes(selectedShapeUuid.value)) {
                        selectedShapeUuid.value = null;
                    }
                    clearMarqueeSelection();
                }
                notice.success(t('basic.tips.map.deleteSuccess'));
            },
        );
    };

    /* ================================ 框选逻辑 ================================ */

    /** 选中标记/图形的高亮虚影样式 */
    const createMarqueePointGhostStyle = (): Style => new Style({
        image: new CircleStyle({
            radius: 15,
            stroke: new Stroke({ color: '#ffd54f', width: 3 }),
            fill: new Fill({ color: 'rgba(255,213,79,0.12)' }),
        }),
    });

    const createMarqueeShapeGhostStyle = (): Style => new Style({
        stroke: new Stroke({ color: '#ffd54f', width: 4, lineDash: [10, 7] }),
        fill: new Fill({ color: 'rgba(255,213,79,0.08)' }),
    });

    /** 清理高亮虚影（同步移出 Translate 集合） */
    const clearMarqueeGhosts = (): void => {
        marqueeGhostFeatures.forEach(g => marqueeFeatures.remove(g));
        marqueeGhostFeatures = [];
        marqueeGhostSource.clear();
    };

    /** 清空框选结果 */
    const clearMarqueeSelection = (): void => {
        clearMarqueeGhosts();
        marqueeFeatures.clear();
        marqueeSelection.value = { points: [], shapes: [] };
    };

    /** 删除某一项后从框选集合摘除（保留其余选中状态） */
    const removeFromMarqueeSelection = (kind: 'point' | 'shape', uuid: string): void => {
        if (kind === 'point') {
            const feature = findPointFeatureByUuid(uuid);
            if (feature) marqueeFeatures.remove(feature);
            marqueeSelection.value.points = marqueeSelection.value.points.filter(p => p.uuid !== uuid);
        } else {
            const render = drawController.getRenderFeature(uuid);
            if (render) marqueeFeatures.remove(render);
            marqueeSelection.value.shapes = marqueeSelection.value.shapes.filter(s => s.uuid !== uuid);
        }
        rebuildMarqueeGhosts();
    };

    /** 按当前选中结果重建虚影（平移结束后几何已变，需要重画） */
    const rebuildMarqueeGhosts = (): void => {
        clearMarqueeGhosts();
        marqueeSelection.value.points.forEach(point => {
            const ghost = new Feature({
                geometry: new Point(fromLonLat([point.longitude, point.latitude])),
            }) as OLFeature<Geometry>;
            ghost.setStyle(createMarqueePointGhostStyle());
            marqueeGhostSource.addFeature(ghost);
            marqueeFeatures.push(ghost);
            marqueeGhostFeatures.push(ghost);
        });
        marqueeSelection.value.shapes.forEach(shape => {
            const render = drawController.getRenderFeature(shape.uuid);
            const geometry = render?.getGeometry();
            if (!geometry) return;
            const ghost = new Feature({ geometry: geometry.clone() }) as OLFeature<Geometry>;
            ghost.setStyle(createMarqueeShapeGhostStyle());
            marqueeGhostSource.addFeature(ghost);
            marqueeFeatures.push(ghost);
            marqueeGhostFeatures.push(ghost);
        });
    };

    /** 应用一次框选结果：填状态、把真实要素+虚影塞进 Translate 集合 */
    const applyMarqueeSelection = (points: MapPoint[], shapes: MapShape[]): void => {
        clearMarqueeGhosts();
        marqueeFeatures.clear();
        marqueeSelection.value = { points, shapes };

        points.forEach(point => {
            const feature = findPointFeatureByUuid(point.uuid);
            if (feature) marqueeFeatures.push(feature);
        });
        shapes.forEach(shape => {
            const render = drawController.getRenderFeature(shape.uuid);
            if (render) marqueeFeatures.push(render);
        });
        rebuildMarqueeGhosts();
    };

    /** 拖框结束：用投影范围圈中自己的标记与图形 */
    const onMarqueeBoxEnd = (): void => {
        if (!marqueeMode.value || !dragBox || !vectorLayerRef.value) return;
        const extent = dragBox.getGeometry().getExtent();
        // 视为单击（没拖出面积）时清空已有选择
        if (extent[2] - extent[0] < 3 || extent[3] - extent[1] < 3) {
            clearMarqueeSelection();
            return;
        }

        const userId = authStore.user?.userId;
        const points: MapPoint[] = [];
        if (userId) {
            vectorLayerRef.value.getSource()?.forEachFeature(feature => {
                const raw = feature.get('originalData');
                if (!raw || raw.category !== 'shareLocation' || raw.userId !== userId) return;
                const geom = feature.getGeometry() as Point | null;
                if (!geom) return;
                const [x, y] = geom.getCoordinates();
                if (containsXY(extent, x, y)) points.push(raw as MapPoint);
            });
        }

        const shapes: MapShape[] = [];
        drawController.forEachShapeInExtent(extent, (uuid) => {
            if (isDraftUuid(uuid) || shapes.some(s => s.uuid === uuid)) return;
            const shape = userShapes.value.find(s => s.uuid === uuid);
            if (shape) {
                if (shape.userId === userId) shapes.push(shape);
                return;
            }
            // 列表里没有（如图形接口曾失败、本会话刚保存尚未回灌）时，直接以渲染要素上的
            // 归属和原始几何兜底，保证框选不会因为状态没同步而漏选
            const render = drawController.getRenderFeature(uuid);
            if (render?.get('userId') === userId) {
                const rawGeometry = render.get('rawGeometry') as ShapeGeometry | undefined;
                if (rawGeometry) {
                    shapes.push({
                        uuid,
                        userId,
                        shapeType: render.get('shapeType') as MapShapeType,
                        geometry: JSON.stringify(rawGeometry),
                        style: render.get('shapeStyle') ? JSON.stringify(render.get('shapeStyle')) : null,
                    } as MapShape);
                }
            }
        });

        applyMarqueeSelection(points, shapes);
    };

    /** 整组平移开始：记下各要素起始坐标 */
    const onMarqueeTranslateStart = (): void => {
        marqueeDragSnapshot = {};
        marqueeSelection.value.points.forEach(point => {
            const feature = findPointFeatureByUuid(point.uuid);
            const geom = feature?.getGeometry() as Point | undefined;
            if (geom && marqueeDragSnapshot) marqueeDragSnapshot[`point:${point.uuid}`] = geom.getCoordinates();
        });
        marqueeSelection.value.shapes.forEach(shape => {
            const render = drawController.getRenderFeature(shape.uuid);
            const geom = render?.getGeometry() as SimpleGeometry | undefined;
            if (geom && marqueeDragSnapshot) marqueeDragSnapshot[`shape:${shape.uuid}`] = geom.getFirstCoordinate();
        });
    };

    /** 整组平移结束：算位移、逐对象持久化，再重建虚影 */
    const onMarqueeTranslateEnd = async (): Promise<void> => {
        const snapshot = marqueeDragSnapshot;
        marqueeDragSnapshot = null;
        if (!snapshot) return;

        const tasks: Promise<unknown>[] = [];

        marqueeSelection.value.points.forEach(point => {
            const feature = findPointFeatureByUuid(point.uuid);
            const geom = feature?.getGeometry() as Point | undefined;
            const start = snapshot[`point:${point.uuid}`];
            if (!geom || !start) return;
            const end = geom.getCoordinates();
            if (Math.abs(end[0] - start[0]) < 1e-7 && Math.abs(end[1] - start[1]) < 1e-7) return;

            const [longitude, latitude] = toLonLat(end);
            const lon = Number(longitude.toFixed(6));
            const lat = Number(latitude.toFixed(6));

            const raw = feature!.get('originalData') as MapPoint;
            feature!.set('originalData', { ...raw, longitude: lon, latitude: lat, category: 'shareLocation' });
            const idx = personalMarkers.value.findIndex(p => p.uuid === point.uuid);
            if (idx !== -1) {
                personalMarkers.value[idx] = { ...personalMarkers.value[idx], longitude: lon, latitude: lat };
            }
            if (selectedLocationData.value?.uuid === point.uuid) {
                selectedLocationData.value = { ...selectedLocationData.value, longitude: lon, latitude: lat };
            }
            tasks.push(api.updatePoint(point.uuid, { longitude: lon, latitude: lat }));
        });

        marqueeSelection.value.shapes.forEach(shape => {
            const render = drawController.getRenderFeature(shape.uuid);
            const geom = render?.getGeometry() as SimpleGeometry | undefined;
            const start = snapshot[`shape:${shape.uuid}`];
            if (!render || !geom || !start) return;
            const end = geom.getFirstCoordinate();
            const dx = end[0] - start[0];
            const dy = end[1] - start[1];
            if (Math.abs(dx) < 1e-7 && Math.abs(dy) < 1e-7) return;

            const shifted = drawController.applyShapeTranslation(shape.uuid, dx, dy);
            if (!shifted) return;
            const target = userShapes.value.find(s => s.uuid === shape.uuid);
            if (target) target.geometry = JSON.stringify(shifted);
            render.set('rawGeometry', shifted);
            tasks.push(api.updateShape(shape.uuid, { geometry: shifted }));
        });

        const results = await Promise.allSettled(tasks);
        rebuildMarqueeGhosts();

        if (results.some(r => r.status === 'rejected')) {
            const rejected = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
            const e = rejected?.reason;
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            } else {
                notice.error(t('map.marquee.saveFailed') || '部分对象位置保存失败');
            }
            console.error('框选平移持久化失败:', e);
        } else if (tasks.length > 0) {
            notice.success(t('basic.tips.map.updateSuccess'));
        }
    };

    /** 框选结果批量删除（带确认） */
    const onDeleteMarqueeSelection = (): void => {
        const { points, shapes } = marqueeSelection.value;
        if (points.length === 0 && shapes.length === 0) return;
        askConfirm(
            t('map.confirmDeleteMarquee', { count: points.length + shapes.length }),
            async () => {
                const pointUuids = points.map(p => p.uuid);
                const shapeUuids = shapes.map(s => s.uuid);
                await Promise.all([
                    pointUuids.length ? api.batchDeletePoints(pointUuids) : Promise.resolve(),
                    shapeUuids.length ? api.batchDeleteShapes(shapeUuids) : Promise.resolve(),
                ]);
                pointUuids.forEach(uuid => {
                    const feature = findPointFeatureByUuid(uuid);
                    if (feature) vectorLayerRef.value?.getSource()?.removeFeature(feature);
                });
                personalMarkers.value = personalMarkers.value.filter(p => !pointUuids.includes(p.uuid));
                shapeUuids.forEach(uuid => drawController.removeShape(uuid));
                userShapes.value = userShapes.value.filter(s => !shapeUuids.includes(s.uuid));
                if (selectedShapeUuid.value && shapeUuids.includes(selectedShapeUuid.value)) {
                    selectedShapeUuid.value = null;
                }
                clearMarqueeSelection();
                notice.success(t('basic.tips.map.deleteSuccess'));
            },
        );
    };

    /** 地图初始化时装载框选交互 */
    const setupMarqueeInteractions = (map: Map): void => {
        marqueeGhostLayer = new VectorLayer({
            source: marqueeGhostSource,
            zIndex: 52,
        });
        map.addLayer(marqueeGhostLayer);

        dragBox = new DragBox({
            className: 'map-marquee-box',
            condition: alwaysCondition,
        });
        dragBox.setActive(false);
        map.addInteraction(dragBox);
        dragBox.on('boxend', onMarqueeBoxEnd);

        marqueeTranslate = new Translate({
            features: marqueeFeatures,
            hitTolerance: 12,
            condition: primaryAction,
        });
        marqueeTranslate.setActive(false);
        map.addInteraction(marqueeTranslate);
        marqueeTranslate.on('translatestart', onMarqueeTranslateStart);
        marqueeTranslate.on('translateend', () => {
            void onMarqueeTranslateEnd();
        });
    };

    /** 真正切换框选开关（屏蔽/恢复地图平移，关掉互斥的绘制与顶点编辑） */
    const applyMarqueeMode = (on: boolean): void => {
        marqueeMode.value = on;
        if (on) {
            drawController.cancelDraw();
            drawController.endEditVertices();
        }
        const map = mapInstance.value;
        if (map) {
            dragBox?.setActive(on);
            map.getInteractions().forEach(interaction => {
                if (interaction instanceof DragPan) interaction.setActive(!on);
            });
            map.getTargetElement().style.cursor = on ? 'crosshair' : '';
        }
        if (!on) clearMarqueeSelection();
    };

    const setMarqueeMode = (on: boolean): void => {
        if (on && !authStore.isLogin) return;
        // 框选与编辑模式互斥：进入框选前先退出编辑模式，未提交内容需用户确认
        if (on && shapeEditMode.value) {
            if (hasPendingShapeEdits()) {
                askConfirm(t('map.contextMenu.confirmExitEditMode'), () => {
                    void doExitShapeEditMode().then(() => applyMarqueeMode(true));
                });
                return;
            }
            void doExitShapeEditMode().then(() => applyMarqueeMode(true));
            return;
        }
        applyMarqueeMode(on);
    };

    const onToggleMarqueeMode = (): void => {
        setMarqueeMode(!marqueeMode.value);
    };

    // 选中结果非空才允许整组拖动
    watch(marqueeCount, (count) => {
        marqueeTranslate?.setActive(marqueeMode.value && count > 0);
    });

    /* ===================== /map query 联动（管理页跳转） ===================== */

    /** 清除 /map 上的联动 query 参数 */
    const clearMapActionQuery = (): void => {
        router.replace({ name: route.name ?? undefined, query: {} }).catch(() => { /* ignore */ });
    };

    /** 地图视野聚焦到某经纬度 */
    const focusMapAtLonLat = (lonLat: number[], zoom?: number): void => {
        const map = mapInstance.value;
        if (!map) return;
        const view = map.getView();
        view.animate({
            center: fromLonLat(lonLat),
            zoom: zoom ?? Math.max(view.getZoom() ?? 10, 13),
            duration: 400,
        });
    };

    /** 确保定位到的标记 feature 存在于主图层（可能属于其他集合） */
    const ensurePointFeatureVisible = (point: MapPoint): void => {
        const source = vectorLayerRef.value?.getSource();
        if (!source) return;
        const exists = source.getFeatures().some(f => f.get('id') === point.id);
        if (!exists) source.addFeature(createPersonalFeature(point));
    };

    /** 确保定位/编辑的图形已加载渲染（可能属于其他集合） */
    const ensureShapeLoaded = (shape: MapShape): boolean => {
        if (parseShapeGeometry(shape) === null) return false;
        if (!userShapes.value.some(s => s.uuid === shape.uuid)) {
            userShapes.value.push(shape);
            drawController.upsertShape(shape);
        }
        return true;
    };

    /** 定位标记 */
    const focusPointByUuid = async (uuid: string): Promise<void> => {
        try {
            const resp = await api.getPointDetail(uuid);
            const point = resp.data.point as MapPoint;
            ensurePointFeatureVisible(point);
            focusMapAtLonLat([point.longitude, point.latitude]);
            selectedPoint.value = point;
            selectedLocationData.value = {
                ...point,
                id: point.id,
                name: point.title,
                category: 'shareLocation',
            };
            model.value = true;
            showCoordinateInfo.value = false;
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error(e);
        }
    };

    /** 拉取图形并确保已渲染 */
    const fetchShapeForAction = async (uuid: string): Promise<MapShape | null> => {
        const existing = userShapes.value.find(s => s.uuid === uuid);
        if (existing) return existing;
        try {
            const resp = await api.getShapeDetail(uuid);
            const shape = resp.data.shape as MapShape;
            return ensureShapeLoaded(shape) ? shape : null;
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error(e);
            return null;
        }
    };

    /** 定位图形（缩放到其范围并选中） */
    const focusShapeByUuid = async (uuid: string): Promise<void> => {
        const shape = await fetchShapeForAction(uuid);
        if (!shape) return;
        selectedShapeUuid.value = uuid;
        model.value = false;
        showCoordinateInfo.value = false;
        const extent = drawController.getShapeExtent(uuid);
        const view = mapInstance.value?.getView();
        if (extent && view) {
            view.fit(extent, { duration: 400, padding: [100, 100, 100, 100], maxZoom: 15 });
        }
    };

    /** 打开分享链接：拉取公开地图集信息，弹窗让用户选择导入或只读浏览 */
    const openSharedCollectionDialog = async (uuid: string): Promise<void> => {
        try {
            const resp = await api.getSharedCollection(uuid);
            sharedCollectionInfo.value = resp.data.collection as SharedCollectionInfo;
            showShareCollectionDialog.value = true;
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error(e);
        }
    };

    /** 只读浏览：直接渲染他人公开集合的点位与图形，不改动当前选择的集合 */
    const loadSharedCollectionPreview = async (info: SharedCollectionInfo): Promise<void> => {
        try {
            const [pointsResp, shapesResp] = await Promise.all([
                api.getCollectionPoints(info.uuid, { page: 1, pageSize: 100 }),
                api.getCollectionShapes(info.uuid),
            ]);
            const points = (pointsResp.data.points || []) as MapPoint[];
            const shapes = (shapesResp.data.shapes || []) as MapShape[];

            drawController.endEditVertices();
            personalMarkers.value = points;
            onAddPersonalMarkersToMap(points);
            userShapes.value = shapes;
            drawController.clearShapes();
            shapes.forEach(shape => drawController.upsertShape(shape));
            selectedShapeUuid.value = null;
            sharedCollectionPreview.value = info;

            // 视野缩放到整个集合的范围
            const view = mapInstance.value?.getView();
            if (view) {
                const extent = createOrUpdateEmpty();
                points.forEach(p => extendExtent(
                    extent,
                    new Point(fromLonLat([p.longitude, p.latitude])).getExtent(),
                ));
                shapes.forEach(s => {
                    const shapeExtent = drawController.getShapeExtent(s.uuid);
                    if (shapeExtent) extendExtent(extent, shapeExtent);
                });
                if (!isExtentEmpty(extent)) {
                    view.fit(extent, { duration: 400, padding: [100, 100, 100, 100], maxZoom: 15 });
                }
            }
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error(e);
        }
    };

    /** 弹窗：仅阅读浏览 */
    const onPreviewSharedCollection = (): void => {
        const info = sharedCollectionInfo.value;
        showShareCollectionDialog.value = false;
        if (info) void loadSharedCollectionPreview(info);
    };

    /** 弹窗：导入到我的账户（克隆一份私有副本并切换过去） */
    const onImportSharedCollection = async (): Promise<void> => {
        const info = sharedCollectionInfo.value;
        if (!info) return;
        importingSharedCollection.value = true;
        try {
            const resp = await api.importSharedCollection(info.uuid);
            showShareCollectionDialog.value = false;
            sharedCollectionPreview.value = null;
            await onLoadUserCollections();
            // 切到新集合，watcher 会完成点位/图形加载
            selectedCollectionUuid.value = resp.data.collectionUuid as string;
            await nextTick();
            await currentCollectionLoad;
            notice.success(t('basic.tips.map.importSuccess'));
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, { context: e.code }));
            }
            console.error(e);
        } finally {
            importingSharedCollection.value = false;
        }
    };

    const onCancelShareDialog = (): void => {
        showShareCollectionDialog.value = false;
    };

    /** 退出只读预览，回到自己当前集合的数据 */
    const exitSharedPreview = (): void => {
        sharedCollectionPreview.value = null;
        void runCollectionLoad(selectedCollectionUuid.value || null);
    };

    /**
     * 处理 /map 的联动参数（来自 /account/maps 或分享链接）
     * draw=marker|path|region[&collectionUuid=]
     * focus=point:uuid | shape:uuid
     * edit=shape:uuid
     * shareCollection=uuid（公开地图集分享）
     */
    const handleMapActionQuery = async (): Promise<void> => {
        if (!authStore.isLogin) return;
        const { draw, focus, edit, collectionUuid, shareCollection } = route.query;

        // 分享链接优先：先让用户选择导入或只读，不干扰当前集合状态
        if (typeof shareCollection === 'string' && shareCollection) {
            clearMapActionQuery();
            await openSharedCollectionDialog(shareCollection);
            return;
        }

        // 可选：先切换到目标集合
        if (typeof collectionUuid === 'string' && collectionUuid) {
            const exists = userCollections.value.some(c => c.uuid === collectionUuid);
            if (exists && (selectedCollectionUuid.value || null) !== collectionUuid) {
                selectedCollectionUuid.value = collectionUuid;
                // 加载由 watcher 统一发起，等它排程并完成，避免后续绘图/聚焦抢在数据之前
                await nextTick();
                await currentCollectionLoad;
            }
        }

        if (draw === 'path' || draw === 'region') {
            clearMapActionQuery();
            onStartDraw(draw);
            return;
        }
        if (draw === 'marker') {
            const view = mapInstance.value?.getView();
            const center = view?.getCenter() ? toLonLat(view.getCenter()!) : mapCenterLocation.value;
            onResetNewMarkerData();
            newMarkerData.value.longitude = center[0];
            newMarkerData.value.latitude = center[1];
            showCreateMarkerDialog.value = true;
            clearMapActionQuery();
            return;
        }

        if (typeof edit === 'string' && edit.startsWith('shape:')) {
            const uuid = edit.slice('shape:'.length);
            const shape = await fetchShapeForAction(uuid);
            clearMapActionQuery();
            if (shape) beginShapeVertexEdit(uuid);
            return;
        }

        if (typeof focus === 'string') {
            clearMapActionQuery();
            if (focus.startsWith('point:')) {
                await focusPointByUuid(focus.slice('point:'.length));
            } else if (focus.startsWith('shape:')) {
                await focusShapeByUuid(focus.slice('shape:'.length));
            }
        }
    };

    /**
     * 添加标记
     * @param points
     */
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

    /**
     * 移除标记
     */
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
        // 模板 ref 指向弹窗组件实例，真正的 v-form 在其 expose 的 markerFormRef 上
        const formRef = (markerFormRef.value as any)?.markerFormRef;
        if (!formRef) return;
        const { valid } = await formRef.validate();
        if (!valid) return;
        creatingMarker.value = true;
        try {
            const collectionUuid = newMarkerData.value.collectionUuid || null;
            await api.createPoint({
                collectionUuid,
                title: newMarkerData.value.title,
                description: newMarkerData.value.description,
                latitude: newMarkerData.value.latitude,
                longitude: newMarkerData.value.longitude,
                address: newMarkerData.value.address,
                tags: newMarkerData.value.tags,
                public: newMarkerData.value.public,
                sharedUsers: newMarkerData.value.sharedUsers,
            });
            if ((selectedCollectionUuid.value || null) === collectionUuid) {
                await loadCurrentPoints(collectionUuid);
            }
            showCreateMarkerDialog.value = false;
            onResetNewMarkerData();
            notice.success(t('basic.tips.map.createSuccess'));
        } catch (error) {
            if (error instanceof ApiError) {
                notice.error(t(`basic.tips.${error.code}`, { context: error.code }));
            }
            console.error('创建标记失败:', error);
        } finally {
            creatingMarker.value = false;
        }
    };

    const onResetNewMarkerData = (): void => {
        newMarkerData.value = {
            collectionUuid: selectedCollectionUuid.value || null,
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
        // “船长笔记”：个人标记 + 路径 + 区域 随全部显示/隐藏一起切换
        layerVisibility.value.shareLocation = newVisibility;
        layerVisibility.value.shapePath = newVisibility;
        layerVisibility.value.shapeRegion = newVisibility;
        allLayersVisible.value = newVisibility;
        updateGroupVisibilityState();
        triggerTransitionAnimation();
    };

    const onUpdateAllLayersVisibleState = () => {
        const allCategories = availableCategories.value.map(cat => cat.value);

        // “船长笔记”三项也计入全选状态
        allCategories.push('shareLocation');
        allCategories.push('shapePath');
        allCategories.push('shapeRegion');
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

        // “船长笔记”大类：路径 / 区域图形图层（个人标记 shareLocation 已在上方）
        if (layerVisibility.value.shapePath === undefined) {
            layerVisibility.value.shapePath = true;
        }
        if (layerVisibility.value.shapeRegion === undefined) {
            layerVisibility.value.shapeRegion = true;
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
        userShapes,
        selectedShape,
        selectedShapeUuid,
        showCreateMarkerDialog,
        creatingMarker,
        selectedPoint,
        markerFormRef,
        newMarkerData,
        editingMarker,
        availableCategories,
        groupedCategories,
        personalMarkersCount,
        pathShapesCount,
        regionShapesCount,
        userCollectionsSelect,
        isDebug,

        drawMode,
        shapeVertexEditingUuid: drawController.editingShapeUuid,
        showShapeDialog,
        shapeDialogMode,
        shapeDialogType,
        savingShape,
        shapeFormRef,
        shapeFormData,

        showShareCollectionDialog,
        sharedCollectionInfo,
        importingSharedCollection,
        sharedCollectionPreview,
        onPreviewSharedCollection,
        onImportSharedCollection,
        onCancelShareDialog,
        exitSharedPreview,

        contextMenuState,
        contextMenuItems,
        isEditingBounds,
        isMarkerDraggingEnabled,
        showEditMarkerDialog,
        editingMarkerData,

        showPointEditDialog,
        savingPointEdit,
        pointEditFormRef,
        pointEditForm,
        confirmState,
        marqueeMode,
        marqueeSelection,
        marqueeCount,

        onMapCreated,
        onHandleUrlParams,
        onLoadUserCollections,
        loadCollectionPoints,
        loadCollectionShapes,
        onStartDraw,
        onShapeFormChange,
        onSaveShape,
        onCancelShapeDialog,
        openShapeEdit,
        beginShapeVertexEdit,
        cancelShapeVertexEdit,
        saveShapeVertexEdit,
        deleteShape,
        closeShapeCard,
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
        openEditMarker,
        saveEditMarker,
        onCancelEditMarker,
        cloneMarker,
        copyMarkerJson,
        copyMarkerCoordinates,
        closeContextMenu,
        openLocationDetail,
        onConfigChanged,

        onOpenPointEdit,
        onPointEditFormChange,
        onSavePointEdit,
        onCancelPointEdit,
        onDeletePointFromMenu,
        onConfirmDialog,
        onCancelConfirmDialog,
        onClearShapesByType,
        onToggleMarqueeMode,
        clearMarqueeSelection,
        onDeleteMarqueeSelection,
    };
}
