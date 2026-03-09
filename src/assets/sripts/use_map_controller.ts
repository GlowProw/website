import {computed, ref, type Ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useDisplay} from 'vuetify';
import {useAssetsStore} from '~/stores/assetsStore';
import {useAuthStore} from '~/stores/userAccountStore';
import {useNoticeStore} from '~/stores/noticeStore';
import {useMapApi} from '@/assets/sripts/api/map_service';
import {useI18nUtils} from "@/assets/sripts/i18n_util.js";
import {MapLocations} from "glow-prow-data";
import type {MapCollection, MapPoint} from '@/assets/types/Map';
import {ApiError} from "@/assets/types/Api";
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {fromLonLat, toLonLat} from 'ol/proj';
import {Icon, Style} from 'ol/style';
import {pointerMove} from 'ol/events/condition';
import Select from 'ol/interaction/Select';
import type {Feature as OLFeature} from 'ol';
import type {Geometry} from 'ol/geom';

/**
 * 地图控制器
 */
export function use_map_controller() {
    const mapImages = import.meta.glob('/src/assets/images/map/*.*', {eager: true});
    const {t} = useI18n();
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const notice = useNoticeStore();
    const api = useMapApi();
    const {asString} = useI18nUtils();
    const {mobile} = useDisplay();
    const {serializationMap} = useAssetsStore();

    const mapInstance: Ref<Map | null> = ref(null);
    const vectorLayerRef: Ref<VectorLayer<VectorSource> | null> = ref(null);
    const mapCenterLocation: Ref<number[]> = ref([-0.667206, 0.626653]);
    const locations: Ref<any[]> = ref(Object.values(MapLocations));
    const icons: Ref<Record<string, string>> = ref({});
    const isFull = ref(false);
    const model = ref<boolean>(false);
    const selectedLocationData: Ref<Record<any, any>> = ref({});
    const showCoordinateInfo = ref<boolean>(false);
    const clickedCoordinate = ref({longitude: 0, latitude: 0});
    const hoveedCoordinate = ref({longitude: 0, latitude: 0});

    const targetLongitude = ref<number | undefined>();
    const targetLatitude = ref<number | undefined>();
    const targetLocationId = ref<string | undefined>();

    const searchQuery = ref(null);
    const searchInput = ref('');
    const searchSuggestions = ref<any[]>([]);

    const isShowMarkModel = ref(false);
    const layerVisibility: Ref<Record<string, boolean>> = ref({shareLocation: false});
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

    const personalMarkersCount = computed(() => personalMarkers.value.length);

    const userCollectionsSelect = computed(() => {
        return [{title: t('none'), uuid: null}].concat(userCollections.value as []);
    });

    const isDebug = computed(() => !!route.query.debug);

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
        searchSuggestions.value = filtered.map(location => ({title: getLocationDisplayName(location), value: location.id, ...location}));
    });

    watch(searchQuery, (value) => {
        if (typeof value === 'object' && value !== null) {
            onSelectLocation(value);
        }
    });

    watch(selectedLocationData, async () => {
        if (!authStore.isLogin) return;

        if (model.value === true) {
            const {latitude, longitude} = selectedLocationData.value;
            await onSearchNearbyPoints(latitude, longitude);
        }
    });

    watch(selectedCollectionUuid, async (newCollectionUuid) => {
        if (!authStore.isLogin) return;

        if (newCollectionUuid) {
            await loadCollectionPoints(newCollectionUuid);
        } else {
            personalMarkers.value = [];
            onRemovePersonalMarkersFromMap();
        }
    });

    const onMapCreated = (map: Map) => {
        mapInstance.value = map;
        initializeMap(map);
    };

    const initializeMap = async (map: Map) => {
        const {x: queryX, y: queryY, key: queryKey, category: queryCategory} = route.query;

        initializeLayerVisibility();
        icons.value = serializationMap(mapImages);

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
            const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature as OLFeature<Geometry>);

            if (feature) {
                const originalData = feature.get('originalData');
                if (originalData?.category === 'shareLocation') {
                    selectedPoint.value = originalData;
                    selectedLocationData.value = {...originalData, id: originalData.id, name: originalData.title, category: 'shareLocation'};
                    model.value = true;
                    showCoordinateInfo.value = false;
                    await router.push({name: route.name, query: {...route.query, key: originalData.id, category: 'shareLocation'}});
                    return;
                }

                selectedLocationData.value = originalData;
                model.value = true;
                showCoordinateInfo.value = false;
                await router.push({name: route.name, query: {...route.query, key: selectedLocationData.value.id, category: selectedLocationData.value.category}});
                return;
            }

            showCoordinateInfo.value = true;
            model.value = false;
            await router.push({name: route.name, query: {}});
        });

        map.on('dblclick', (event) => {
            const coordinate = toLonLat(event.coordinate);
            clickedCoordinate.value = {longitude: coordinate[0], latitude: coordinate[1]};
            newMarkerData.value = {
                collectionUuid: selectedCollectionUuid.value || (userCollections.value[0]?.uuid || ''),
                title: '',
                description: '',
                longitude: coordinate[0],
                latitude: coordinate[1],
                address: '',
                tags: [],
                public: false,
                sharedUsers: [],
            };
            editingMarker.value = false;
            showCoordinateInfo.value = true;
            model.value = false;
            showCreateMarkerDialog.value = true;
            router.push({name: route.name, query: {}});
        });

        map.on('pointermove', (event) => {
            if (event.dragging) return;
            const lonLat = toLonLat(event.coordinate);
            hoveedCoordinate.value = {longitude: lonLat[0], latitude: lonLat[1]};
        });

        await onLoadUserCollections();

        if (queryKey) {
            await onHandleUrlParams(queryKey as string, queryX as string, queryY as string, queryCategory as string, vectorSource);
        }
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
                    selectedLocationData.value = {...personalMarker, category: 'shareLocation', id: personalMarker.id, name: personalMarker.title};
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

            if (userCollections.value.length > 0 && !selectedCollectionUuid.value) {
                selectedCollectionUuid.value = userCollections.value[0].uuid;
            }
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, {context: e.code}));
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
                notice.error(t(`basic.tips.${e.code}`, {context: e.code}));
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
            originalData: {...point, category: 'shareLocation'},
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
        const {valid} = await (markerFormRef.value as any).validate();
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
            const result = await api.getNearbyPoints({latitude, longitude, radius, limit: 10});
            selectedLocationNearbyPoints.value = result.data.points;
        } catch (e) {
            if (e instanceof ApiError) {
                notice.error(t(`basic.tips.${e.code}`, {context: e.code}));
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
        router.push({name: route.name, query: {...route.query, key: location.id, x: location.longitude, y: location.latitude, category: location.category}});
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

    const onToggleLayer = () => {
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
    };

    const onUpdateAllLayersVisibleState = () => {
        const allCategories = availableCategories.value.map(cat => cat.value);

        allCategories.push('shareLocation');
        allLayersVisible.value = allCategories.every(category => layerVisibility.value[category]);
    };

    const initializeLayerVisibility = () => {
        const allCategories = [...new Set(locations.value.map(loc => loc.category))];

        allCategories.forEach(category => {
            layerVisibility.value[category] = true;
        });

        layerVisibility.value.shareLocation = true;
    };

    const getLocationDisplayName = (data: any): string => {
        const location = data;

        if (!location.id) return '';

        return asString([location.id, `snb.mapLocations.${location.id}.name`], {backRawKey: false}) || location.id;
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
            view.animate({zoom: currentZoom + 1, duration: 250});
        }
    };

    const _onZoomOut = (): void => {
        if (mapInstance.value) {
            const view = mapInstance.value.getView();
            const currentZoom = view.getZoom() || 0;
            view.animate({zoom: currentZoom - 1, duration: 250});
        }
    };

    const _onResetView = (): void => {
        if (mapInstance.value && locations.value.length > 0) {
            const view = mapInstance.value.getView();
            view.animate({center: fromLonLat(mapCenterLocation.value), zoom: 13, duration: 500});
        }
    };

    return {
        authStore,
        mobile,
        mapInstance,
        vectorLayerRef,
        mapCenterLocation,
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
        onToggleAllLayers,
        onUpdateAllLayersVisibleState,
        initializeLayerVisibility,
        getLocationDisplayName,
        onCreateMarkerStyle,
        onCreateFeaturesFromLocations,
        onCreateFeatureFromLocation,
        _onZoomIn,
        _onZoomOut,
        _onResetView
    };
}
