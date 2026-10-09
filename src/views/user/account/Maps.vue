<script setup lang="ts">
import {computed, onMounted, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {
  type MapCollection,
  type MapCollectionResult,
  type MapPoint,
  type MapShape,
  type MapShapeType,
  type PointFormData,
  type ShapeManualFormData,
  parseShapeGeometry,
  parseShapeStyle,
  parseShapeTags,
  resolveShapeStyle,
  DEFAULT_PATH_COLOR,
  DEFAULT_REGION_COLOR,
  DEFAULT_REGION_FILL_COLOR,
} from "@/assets/types/Map";
import {useMapApi} from "@/assets/sripts/api/map_service";
import {useNoticeStore} from "~/stores/noticeStore";
import {ApiError} from "@/assets/types/Api";
import EmptyView from "@/components/EmptyView.vue";
import Loading from "@/components/Loading.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import MapEditMarkerDialog from "@/components/map/MapEditMarkerDialog.vue";
import MapShapeManualDialog from "@/components/map/MapShapeManualDialog.vue";
import MapShapeStylePreview from "@/components/map/MapShapeStylePreview.vue";
import QuotaLimitWidget from "@/components/QuotaLimitWidget.vue";
import PaginationBar from "@/components/PaginationBar.vue";

const {t} = useI18n(),
    api = useMapApi(),
    notice = useNoticeStore(),
    router = useRouter()

type TabKey = 'collections' | 'points' | 'paths' | 'regions'

const activeTab = ref<TabKey>('collections'),
    collectionLoading = ref(false),
    collectionFormRef = ref<any>(null),
    collectionPagination = reactive({page: 1, pageSize: 10}),
    userCollections = ref<MapCollectionResult>({data: []}),
    savingCollectionLoading = ref(false),
    collectionFormModal = ref(false),
    collectionForm = ref<any>({
      uuid: '',
      title: '',
      description: '',
      public: 1,
      sharedUsers: [] as string[]
    }),
    editingCollection = ref(false),
    showDeleteConfirm = ref(false),
    deleteConfirmMessage = ref(''),
    pendingDeleteAction = ref<(() => Promise<void>) | null>(null),
    savingPoint = ref(false),
    savingShape = ref(false)

interface EntityListState {
  rows: any[];
  total: number;
  page: number;
  pageSize: number;
  loaded: boolean;
  loading: boolean;
  filterCollection: string; // ''=全部 '__none__'=未分组 uuid
  keyword: string;
  selected: string[];
}

const createListState = (): EntityListState => ({
  rows: [],
  total: 0,
  page: 1,
  pageSize: 10,
  loaded: false,
  loading: false,
  filterCollection: '',
  keyword: '',
  selected: [],
})

const pointsState = reactive<EntityListState>(createListState()),
    pathState = reactive<EntityListState>(createListState()),
    regionState = reactive<EntityListState>(createListState())

const shapeStateByType = (type: MapShapeType): EntityListState => type === 'path' ? pathState : regionState

const pointDialogVisible = ref(false),
    pointForm = ref<PointFormData>({
      title: '',
      description: '',
      longitude: '',
      latitude: '',
      address: '',
      collectionUuid: null,
      tags: [],
      public: false,
    })

const shapeDialogVisible = ref(false),
    shapeDialogType = ref<MapShapeType>('path'),
    shapeForm = ref<ShapeManualFormData>({
      title: '',
      description: '',
      collectionUuid: null,
      tags: [],
      public: false,
      style: {},
      coordinatesText: '',
    })

const batchMoveVisible = ref(false),
    batchMoveTarget = ref<string | null>(null),
    batchMoveKind = ref<'points' | 'shapes'>('points'),
    batchMoveShapeType = ref<MapShapeType>('path')

onMounted(() => {
  getMyCollectionsData()
})

const onApiError = (e: unknown) => {
  if (e instanceof ApiError) {
    notice.error(t(`basic.tips.${e.code}`, {context: e.code}))
  }
  console.error(e)
}

const getMyCollectionsData = async () => {
  try {
    collectionLoading.value = true;
    const result = await api.getCollections(collectionPagination)
    userCollections.value = result.data || {data: []};
  } catch (e) {
    console.error(e)
  } finally {
    collectionLoading.value = false;
  }
}

const collectionTitle = (id?: string | null): string => {
  if (!id) return t('map.noCollection')
  return userCollections.value.data.find(c => c.uuid === id)?.title || t('map.noCollection')
}

const onSaveCollection = async (): Promise<void> => {
  if (!collectionFormRef.value) return;
  const {valid} = await collectionFormRef.value.validate()
  if (!valid) return;

  savingCollectionLoading.value = true;
  try {
    if (editingCollection.value) {
      await api.updateCollection(collectionForm.value.uuid, {
        title: collectionForm.value.title,
        description: collectionForm.value.description,
        public: collectionForm.value.public,
        sharedUsers: collectionForm.value.sharedUsers
      })
    } else {
      await api.createCollection({
        title: collectionForm.value.title,
        description: collectionForm.value.description,
        public: collectionForm.value.public,
        sharedUsers: collectionForm.value.sharedUsers
      })
    }
    await getMyCollectionsData()
    onResetCollectionForm()
    notice.success(t('basic.tips.map.success'))
  } catch (e) {
    onApiError(e)
  } finally {
    savingCollectionLoading.value = false;
  }
};

const onCreatedCollection = (): void => {
  editingCollection.value = false;
  collectionForm.value = {uuid: '', title: '', description: '', public: 1, sharedUsers: []};
  collectionFormModal.value = true;
};

const editCollection = (collection: MapCollection): void => {
  editingCollection.value = true;
  collectionForm.value = {
    uuid: collection.uuid,
    title: collection.title,
    description: collection.description,
    public: collection.public ? 1 : 0,
    sharedUsers: collection.sharedUsers || []
  };
  collectionFormModal.value = true;
};

const onResetCollectionForm = (): void => {
  collectionForm.value = {uuid: '', title: '', description: '', public: 1, sharedUsers: []};
  editingCollection.value = false;
  collectionFormModal.value = false;
};

const confirmDeleteCollection = (collection: MapCollection): void => {
  deleteConfirmMessage.value = t('map.confirmDeleteCollection', {title: collection.title})
  pendingDeleteAction.value = async () => {
    await api.deleteCollection(collection.uuid)
    await getMyCollectionsData()
    notice.success(t('basic.tips.map.deleteSuccess'))
  };
  showDeleteConfirm.value = true;
};

const executeDelete = async (): Promise<void> => {
  if (pendingDeleteAction.value) {
    await pendingDeleteAction.value()
    pendingDeleteAction.value = null;
  }
  showDeleteConfirm.value = false
};

/** 
 * 从地图集卡片跳到标记 Tab 并按集合过滤
 */
const openCollectionPoints = (collection: MapCollection): void => {
  pointsState.filterCollection = collection.uuid
  pointsState.page = 1
  pointsState.loaded = false
  activeTab.value = 'points'
}

/**
 * 生成分享链接，打开方可选择导入或只读浏览
 */
const copyShareLink = async (collection: MapCollection): Promise<void> => {
  const url = `${window.location.origin}/map?shareCollection=${encodeURIComponent(collection.uuid)}`
  try {
    await navigator.clipboard.writeText(url)
    notice.success(t('map.share.linkCopied'))
  } catch (e) {
    console.error('Copy share link failed', e)
  }
}

// 克隆中的集合（同时只允许一个），用于按钮 loading
const cloningUuid = ref('')

/** 
 * 克隆自己的地图集：完整复制集合及其全部标记/图形
 */
const onCloneCollection = async (collection: MapCollection): Promise<void> => {
  if (cloningUuid.value) return
  cloningUuid.value = collection.uuid
  try {
    await api.cloneCollection(collection.uuid)
    notice.success(t('map.share.cloneSuccess'))
    collectionPagination.page = 1
    await getMyCollectionsData()
  } catch (e) {
    onApiError(e)
  } finally {
    cloningUuid.value = ''
  }
}


const loadPoints = async () => {
  pointsState.loading = true
  try {
    const result = await api.getUserPoints({
      collectionUuid: pointsState.filterCollection || undefined,
      keyword: pointsState.keyword.trim() || undefined,
      page: pointsState.page,
      pageSize: pointsState.pageSize,
    })
    pointsState.rows = result.data.points || []
    pointsState.total = result.data.pagination?.total || 0
    pointsState.loaded = true
  } catch (e) {
    onApiError(e)
  } finally {
    pointsState.loading = false
  }
}

const onSearchPoints = () => {
  pointsState.page = 1
  loadPoints()
}

const onPointsFilterChange = () => {
  pointsState.page = 1
  pointsState.selected = []
  loadPoints()
}

const onPointPage = (page: number) => {
  pointsState.page = page
  loadPoints()
}

const toggleSelection = (state: EntityListState, uuid: string) => {
  const i = state.selected.indexOf(uuid)
  if (i > -1) state.selected.splice(i, 1)
  else state.selected.push(uuid)
}

const toggleSelectAllRows = (state: EntityListState) => {
  const allSelected = state.rows.length > 0 && state.rows.every(r => state.selected.includes(r.uuid))
  if (allSelected) {
    state.selected = state.selected.filter(uuid => !state.rows.some(r => r.uuid === uuid))
  } else {
    state.rows.forEach(r => {
      if (!state.selected.includes(r.uuid)) state.selected.push(r.uuid)
    })
  }
}

const rowsAllSelected = (state: EntityListState): boolean =>
    state.rows.length > 0 && state.rows.every(r => state.selected.includes(r.uuid))

const parseTags = (raw: string | null): string[] => {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

const openCreatePoint = () => {
  pointForm.value = {
    title: '',
    description: '',
    longitude: '',
    latitude: '',
    address: '',
    collectionUuid: pointsState.filterCollection && pointsState.filterCollection !== '__none__'
        ? pointsState.filterCollection
        : null,
    tags: [],
    public: false,
  }
  pointDialogVisible.value = true
}

const openEditPoint = (point: MapPoint) => {
  pointForm.value = {
    uuid: point.uuid,
    title: point.title,
    description: point.description || '',
    longitude: point.longitude,
    latitude: point.latitude,
    address: point.address || '',
    collectionUuid: point.collectionId || null,
    tags: parseTags(point.tags),
    public: point.public === 1,
  }
  pointDialogVisible.value = true
}

const onPointFormChange = (data: PointFormData) => {
  pointForm.value = data
}

const onSavePoint = async () => {
  const f = pointForm.value
  savingPoint.value = true
  try {
    const payload = {
      title: f.title,
      description: f.description || undefined,
      longitude: Number(f.longitude),
      latitude: Number(f.latitude),
      address: f.address || undefined,
      collectionUuid: f.collectionUuid || null,
      tags: f.tags,
      public: f.public,
    }
    if (f.uuid) {
      await api.updatePoint(f.uuid, payload)
      notice.success(t('basic.tips.map.updateSuccess'))
    } else {
      await api.createPoint(payload)
      notice.success(t('basic.tips.map.createSuccess'))
    }
    pointDialogVisible.value = false
    await loadPoints()
  } catch (e) {
    onApiError(e)
  } finally {
    savingPoint.value = false
  }
}

const deleteOnePoint = (point: MapPoint) => {
  deleteConfirmMessage.value = t('map.confirmDeletePoint', {title: point.title})
  pendingDeleteAction.value = async () => {
    await api.deletePoint(point.uuid)
    notice.success(t('basic.tips.map.deleteSuccess'))
    await loadPoints()
  }
  showDeleteConfirm.value = true
}

const focusPointOnMap = (point: MapPoint) => {
  router.push({path: '/map', query: {focus: `point:${point.uuid}`}})
}

const goDrawMarker = () => {
  const query: Record<string, string> = {draw: 'marker'}
  if (pointsState.filterCollection && pointsState.filterCollection !== '__none__') {
    query.collectionUuid = pointsState.filterCollection
  }
  router.push({path: '/map', query})
}


const loadShapes = async (type: MapShapeType) => {
  const state = shapeStateByType(type)
  state.loading = true
  try {
    const result = await api.getUserShapes({
      shapeType: type,
      collectionUuid: state.filterCollection || undefined,
      keyword: state.keyword.trim() || undefined,
      page: state.page,
      pageSize: state.pageSize,
    })
    state.rows = result.data.shapes || []
    state.total = result.data.pagination?.total || 0
    state.loaded = true
  } catch (e) {
    onApiError(e)
  } finally {
    state.loading = false
  }
}

const onShapeSearch = (type: MapShapeType) => {
  const state = shapeStateByType(type)
  state.page = 1
  loadShapes(type)
}

const onShapeFilterChange = (type: MapShapeType) => {
  const state = shapeStateByType(type)
  state.page = 1
  state.selected = []
  loadShapes(type)
}

const onShapePage = (type: MapShapeType, page: number) => {
  shapeStateByType(type).page = page
  loadShapes(type)
}

const defaultShapeStyle = (type: MapShapeType) => ({
  color: type === 'region' ? DEFAULT_REGION_COLOR : DEFAULT_PATH_COLOR,
  opacity: 0.6,
  width: 4,
  dashed: false,
  smoothed: false,
  fillColor: type === 'region' ? DEFAULT_REGION_FILL_COLOR : DEFAULT_PATH_COLOR,
  fillOpacity: 0.4,
})

/** 列表迷你预览用：补全默认颜色/透明度，保证旧数据也能正确呈现 */
const previewStyle = (shape: MapShape) =>
    resolveShapeStyle(parseShapeStyle(shape), shape.shapeType)

const geometryToText = (shape: MapShape): string => {
  const geo = parseShapeGeometry(shape)
  if (!geo) return ''
  if (geo.type === 'LineString') {
    return (geo.coordinates as number[][]).map(c => `${c[0]},${c[1]}`).join('\n')
  }
  const ring = (geo.coordinates as number[][][])[0] || []
  // 去掉闭合重复点
  const pts = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring
  return pts.map(c => `${c[0]},${c[1]}`).join('\n')
}

const openCreateShape = (type: MapShapeType) => {
  shapeDialogType.value = type
  const state = shapeStateByType(type)
  shapeForm.value = {
    title: '',
    description: '',
    collectionUuid: state.filterCollection && state.filterCollection !== '__none__' ? state.filterCollection : null,
    tags: [],
    public: false,
    style: defaultShapeStyle(type),
    coordinatesText: '',
  }
  shapeDialogVisible.value = true
}

const openEditShape = (shape: MapShape) => {
  shapeDialogType.value = shape.shapeType
  shapeForm.value = {
    uuid: shape.uuid,
    title: shape.title,
    description: shape.description || '',
    collectionUuid: shape.collectionId || null,
    tags: parseShapeTags(shape),
    public: shape.public === 1,
    // 补全为完整样式，旧数据缺颜色/透明度时编辑窗也能显示真实有效值
    style: resolveShapeStyle(parseShapeStyle(shape), shape.shapeType),
    coordinatesText: geometryToText(shape),
  }
  shapeDialogVisible.value = true
}

const onShapeFormChange = (data: ShapeManualFormData) => {
  shapeForm.value = data
}

const onSaveShape = async (payload: { geometry: any }) => {
  const f = shapeForm.value
  const type = shapeDialogType.value
  savingShape.value = true
  try {
    const body = {
      title: f.title,
      description: f.description || undefined,
      collectionUuid: f.collectionUuid || null,
      style: f.style,
      tags: f.tags,
      public: f.public,
      geometry: payload.geometry,
    }
    if (f.uuid) {
      await api.updateShape(f.uuid, body)
      notice.success(t('basic.tips.map.updateSuccess'))
    } else {
      await api.createShape({shapeType: type, ...body})
      notice.success(t('basic.tips.map.createSuccess'))
    }
    shapeDialogVisible.value = false
    await loadShapes(type)
  } catch (e) {
    onApiError(e)
  } finally {
    savingShape.value = false
  }
}

const deleteOneShape = (shape: MapShape) => {
  deleteConfirmMessage.value = t('map.confirmDeleteShape', {title: shape.title})
  pendingDeleteAction.value = async () => {
    await api.deleteShape(shape.uuid)
    notice.success(t('basic.tips.map.deleteSuccess'))
    await loadShapes(shape.shapeType)
  }
  showDeleteConfirm.value = true
}

const focusShapeOnMap = (shape: MapShape) => {
  router.push({path: '/map', query: {focus: `shape:${shape.uuid}`}})
}

const editShapeGeometryOnMap = (shape: MapShape) => {
  router.push({path: '/map', query: {edit: `shape:${shape.uuid}`}})
}

const goDrawShape = (type: MapShapeType) => {
  const state = shapeStateByType(type)
  const query: Record<string, string> = {draw: type}
  if (state.filterCollection && state.filterCollection !== '__none__') {
    query.collectionUuid = state.filterCollection
  }
  router.push({path: '/map', query})
}

/* ============================== 批量操作 ============================== */

const openBatchMove = (kind: 'points' | 'shapes', shapeType: MapShapeType = 'path') => {
  batchMoveKind.value = kind
  batchMoveShapeType.value = shapeType
  batchMoveTarget.value = null
  batchMoveVisible.value = true
}

const executeBatchMove = async () => {
  try {
    if (batchMoveKind.value === 'points') {
      if (pointsState.selected.length === 0) return
      await api.batchMovePoints(pointsState.selected, batchMoveTarget.value)
      notice.success(t('basic.tips.map.success'))
      pointsState.selected = []
      await loadPoints()
    } else {
      const state = shapeStateByType(batchMoveShapeType.value)
      if (state.selected.length === 0) return
      await api.batchMoveShapes(state.selected, batchMoveTarget.value)
      notice.success(t('basic.tips.map.success'))
      state.selected = []
      await loadShapes(batchMoveShapeType.value)
    }
    batchMoveVisible.value = false
  } catch (e) {
    onApiError(e)
  }
}

const batchRemoveFromCollection = async (kind: 'points' | 'shapes', shapeType: MapShapeType = 'path') => {
  try {
    if (kind === 'points') {
      if (pointsState.selected.length === 0) return
      await api.batchMovePoints(pointsState.selected, null)
      notice.success(t('basic.tips.map.removeSuccess'))
      pointsState.selected = []
      await loadPoints()
    } else {
      const state = shapeStateByType(shapeType)
      if (state.selected.length === 0) return
      await api.batchMoveShapes(state.selected, null)
      notice.success(t('basic.tips.map.removeSuccess'))
      state.selected = []
      await loadShapes(shapeType)
    }
  } catch (e) {
    onApiError(e)
  }
}

const batchDelete = async (kind: 'points' | 'shapes', shapeType: MapShapeType = 'path') => {
  const doDelete = async () => {
    if (kind === 'points') {
      if (pointsState.selected.length === 0) return
      await api.batchDeletePoints(pointsState.selected)
      pointsState.selected = []
      await loadPoints()
    } else {
      const state = shapeStateByType(shapeType)
      if (state.selected.length === 0) return
      await api.batchDeleteShapes(state.selected)
      state.selected = []
      await loadShapes(shapeType)
    }
    notice.success(t('basic.tips.map.deleteSuccess'))
  }
  deleteConfirmMessage.value = t('map.confirmBatchDelete', {count: kind === 'points' ? pointsState.selected.length : shapeStateByType(shapeType).selected.length})
  pendingDeleteAction.value = doDelete
  showDeleteConfirm.value = true
}

/* ============================== Tab 切换 ============================== */

const onTabChange = (tab: string | number) => {
  const key = tab as TabKey
  activeTab.value = key
  if (key === 'points' && !pointsState.loaded) void loadPoints()
  if (key === 'paths' && !pathState.loaded) void loadShapes('path')
  if (key === 'regions' && !regionState.loaded) void loadShapes('region')
}

const filterCollectionItems = computed(() => [
  {title: t('map.allCollections'), value: ''},
  {title: t('map.noCollection'), value: '__none__'},
  ...userCollections.value.data.map(c => ({title: c.title, value: c.uuid})),
])

const batchMoveCollectionItems = computed(() => [
  {title: t('map.noCollection'), value: null},
  ...userCollections.value.data.map(c => ({title: c.title, value: c.uuid})),
])

/** 当前图形 Tab 的类型与状态 */
const currentShapeType = computed<MapShapeType>(() => activeTab.value === 'paths' ? 'path' : 'region')
const currentShapeState = computed(() => shapeStateByType(currentShapeType.value))
const currentRowsAllSelected = computed(() => rowsAllSelected(currentShapeState.value))

defineOptions({
  name: 'AccountMaps'
})
</script>

<template>
  <div class="position-relative">
    <v-overlay :model-value="collectionLoading" contained class="d-flex align-center justify-center">
      <Loading size="50"></Loading>
    </v-overlay>

    <!-- Toolbar S -->
    <AffixContainerView>
      <v-card class="mb-4 px-2">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div>
            <v-tabs v-model="activeTab" color="amber" @update:model-value="onTabChange">
              <v-tab value="collections" prepend-icon="mdi-folder-multiple-outline">{{ t('map.tabCollections') }}</v-tab>
              <v-tab value="points" prepend-icon="mdi-map-marker-multiple-outline">{{ t('map.tabPoints') }}</v-tab>
              <v-tab value="paths" prepend-icon="mdi-vector-polyline">{{ t('map.tabPaths') }}</v-tab>
              <v-tab value="regions" prepend-icon="mdi-vector-polygon">{{ t('map.tabRegions') }}</v-tab>
            </v-tabs>
          </div>

          <div class="d-flex align-center ga-2" v-if="activeTab === 'collections'">
            <QuotaLimitWidget resource="map" text></QuotaLimitWidget>
            <v-btn color="amber" variant="tonal" @click="onCreatedCollection">
              {{ t('map.createCollection') }}
            </v-btn>
            <v-btn size="small" variant="tonal" icon="mdi-refresh"
                   @click="getMyCollectionsData" :loading="collectionLoading"></v-btn>
          </div>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- Toolbar E -->

    <!-- ============================ 地图集 Tab ============================ -->
    <div v-if="activeTab === 'collections'">
      <div v-if="userCollections && userCollections.data.length > 0" class="d-flex flex-column ga-3">
        <v-card v-for="(collection, index) in userCollections.data"
                :key="collection.uuid || index"
                border rounded="lg" class="pa-4 hover-card transition-all">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div class="d-flex align-center flex-grow-1 min-width-0">
              <v-avatar size="44" rounded="lg" class="mr-3 flex-shrink-0">
                <v-icon size="24" color="amber">mdi-folder</v-icon>
              </v-avatar>
              <div class="min-width-0 flex-grow-1">
                <div class="d-flex align-center ga-2 mb-1">
                  <h3 class="text-body-1 font-weight-bold singe-line">{{ collection.title }}</h3>
                  <v-chip size="x-small" :color="collection.public ? 'amber' : 'default'" variant="tonal">
                    {{ collection.public ? t('map.public') : t('map.private') }}
                  </v-chip>
                </div>
                <p class="text-caption opacity-60 singe-line mb-0">
                  {{ collection.description || collection.uuid }}
                </p>
              </div>
            </div>

            <div class="d-flex align-center ga-2 flex-shrink-0">
              <v-btn size="small" variant="tonal" color="amber" prepend-icon="mdi-map-marker-multiple"
                     @click="openCollectionPoints(collection)">
                {{ t('map.managePoints') }}
              </v-btn>
              <v-tooltip :text="t('map.share.copyLink')" location="top">
                <template v-slot:activator="{props}">
                  <v-btn v-bind="props" size="small" variant="tonal" icon="mdi-share-variant-outline"
                         @click="copyShareLink(collection)"></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip :text="t('map.share.clone')" location="top">
                <template v-slot:activator="{props}">
                  <v-btn v-bind="props" size="small" variant="tonal" icon="mdi-content-copy"
                         :loading="cloningUuid === collection.uuid"
                         @click="onCloneCollection(collection)"></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip :text="t('basic.button.edit')" location="top">
                <template v-slot:activator="{props}">
                  <v-btn v-bind="props" size="small" variant="tonal" icon="mdi-pencil"
                         @click="editCollection(collection)"></v-btn>
                </template>
              </v-tooltip>
              <v-tooltip :text="t('basic.button.delete')" location="top">
                <template v-slot:activator="{props}">
                  <v-btn v-bind="props" size="small" variant="tonal" color="error" icon="mdi-delete"
                         @click="confirmDeleteCollection(collection)"></v-btn>
                </template>
              </v-tooltip>
            </div>
          </div>
        </v-card>
      </div>

      <div class="text-center py-12" v-else>
        <EmptyView></EmptyView>
      </div>

      <PaginationBar v-model:page="collectionPagination.page"
                     :pagination="userCollections.pagination"
                     class="mt-6"
                     @change="getMyCollectionsData" />
    </div>

    <!-- ============================ 标记 Tab ============================ -->
    <div v-if="activeTab === 'points'">
      <v-card variant="text" class="pa-3 mb-3">
        <div class="d-flex align-center flex-wrap ga-2">
          <v-select :model-value="pointsState.filterCollection"
                    @update:model-value="pointsState.filterCollection = $event; onPointsFilterChange()"
                    :items="filterCollectionItems"
                    item-title="title" item-value="value"
                    variant="outlined" density="compact" hide-details
                    style="min-width: 180px"
                    :label="t('map.selectCollection')"></v-select>
          <v-text-field :model-value="pointsState.keyword"
                        @update:model-value="pointsState.keyword = $event"
                        @keyup.enter="onSearchPoints"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined" density="compact" hide-details
                        style="min-width: 220px; flex:1 1 220px"
                        :label="t('map.keyword')"
                        @click:append="onSearchPoints"></v-text-field>
          <v-btn variant="tonal" @click="onSearchPoints">{{ t('basic.button.search') }}</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="amber" variant="tonal" prepend-icon="mdi-map-marker-plus"
                 @click="openCreatePoint">{{ t('map.createMarker') }}</v-btn>
          <v-btn variant="tonal" prepend-icon="mdi-map"
                 @click="goDrawMarker">{{ t('map.drawOnMap') }}</v-btn>
        </div>
      </v-card>

      <!-- 批量操作条 -->
      <v-card v-if="pointsState.selected.length > 0" border color="amber" variant="tonal" class="pa-2 mb-3">
        <div class="d-flex align-center flex-wrap ga-2">
          <span class="text-body-2 font-weight-medium">
            {{ t('map.selectedCount', {count: pointsState.selected.length}) }}
          </span>
          <v-spacer></v-spacer>
          <v-btn size="small" variant="tonal" prepend-icon="mdi-folder-move"
                 @click="openBatchMove('points')">{{ t('map.batchMove') }}</v-btn>
          <v-btn size="small" variant="tonal" prepend-icon="mdi-folder-remove"
                 @click="batchRemoveFromCollection('points')">{{ t('map.batchRemove') }}</v-btn>
          <v-btn size="small" variant="tonal" color="error" prepend-icon="mdi-delete"
                 @click="batchDelete('points')">{{ t('map.batchDelete') }}</v-btn>
        </div>
      </v-card>

      <v-card border>
        <v-table>
          <thead>
          <tr>
            <th class="text-left" style="width:44px">
              <v-checkbox-btn :model-value="rowsAllSelected(pointsState)"
                              @update:model-value="toggleSelectAllRows(pointsState)"></v-checkbox-btn>
            </th>
            <th class="text-left">{{ t('map.markerName') }}</th>
            <th class="text-left">{{ t('map.coordinates') }}</th>
            <th class="text-left">{{ t('map.selectCollection') }}</th>
            <th class="text-left">{{ t('map.tags') }}</th>
            <th class="text-right" style="width:170px">{{ t('basic.button.actions') }}</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="point in pointsState.rows" :key="point.uuid"
              :class="{'row-selected': pointsState.selected.includes(point.uuid)}">
            <td>
              <v-checkbox-btn :model-value="pointsState.selected.includes(point.uuid)"
                              @update:model-value="toggleSelection(pointsState, point.uuid)"></v-checkbox-btn>
            </td>
            <td class="text-body-2 font-weight-medium">{{ point.title }}</td>
            <td class="text-caption">{{ Number(point.longitude).toFixed(4) }}, {{ Number(point.latitude).toFixed(4) }}</td>
            <td class="text-caption">{{ collectionTitle(point.collectionId) }}</td>
            <td>
              <v-chip v-for="tag in parseTags(point.tags)" :key="tag" size="x-small"
                      variant="tonal" class="mr-1">{{ tag }}</v-chip>
            </td>
            <td>
              <div class="d-flex justify-end ga-1">
                <v-btn size="small" variant="text" icon="mdi-map-marker"
                       :title="t('map.viewOnMap')" @click="focusPointOnMap(point)"></v-btn>
                <v-btn size="small" variant="text" icon="mdi-pencil"
                       @click="openEditPoint(point)"></v-btn>
                <v-btn size="small" variant="text" color="error" icon="mdi-delete"
                       @click="deleteOnePoint(point)"></v-btn>
              </div>
            </td>
          </tr>
          </tbody>
        </v-table>

        <div class="py-8 text-center" v-if="!pointsState.loading && pointsState.rows.length === 0">
          <EmptyView></EmptyView>
        </div>
        <PaginationBar v-model:page="pointsState.page"
                       :total="pointsState.total"
                       :page-size="pointsState.pageSize"
                       density="compact"
                       class="pa-3"
                       @change="onPointPage" />
      </v-card>
    </div>

    <!-- ============================ 路径 / 区域 Tab ============================ -->
    <div v-if="activeTab === 'paths' || activeTab === 'regions'">
      <v-card variant="text" class="pa-3 mb-3">
        <div class="d-flex align-center flex-wrap ga-2">
          <v-select :model-value="currentShapeState.filterCollection"
                    @update:model-value="currentShapeState.filterCollection = $event; onShapeFilterChange(currentShapeType)"
                    :items="filterCollectionItems"
                    item-title="title" item-value="value"
                    variant="outlined" density="compact" hide-details
                    style="min-width: 180px"
                    :label="t('map.selectCollection')"></v-select>
          <v-text-field :model-value="currentShapeState.keyword"
                        @update:model-value="currentShapeState.keyword = $event"
                        @keyup.enter="onShapeSearch(currentShapeType)"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined" density="compact" hide-details
                        style="min-width: 220px; flex:1 1 220px"
                        :label="t('map.keyword')"></v-text-field>
          <v-btn variant="tonal" @click="onShapeSearch(currentShapeType)">{{ t('basic.button.search') }}</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="amber" variant="tonal"
                 :prepend-icon="currentShapeType === 'path' ? 'mdi-vector-polyline' : 'mdi-vector-polygon'"
                 @click="openCreateShape(currentShapeType)">
            {{ currentShapeType === 'path' ? t('map.createPath') : t('map.createRegion') }}
          </v-btn>
          <v-btn variant="tonal" prepend-icon="mdi-map"
                 @click="goDrawShape(currentShapeType)">{{ t('map.drawOnMap') }}</v-btn>
        </div>
      </v-card>

      <!-- 批量操作条 -->
      <v-card v-if="currentShapeState.selected.length > 0" border color="amber" variant="tonal" class="pa-2 mb-3">
        <div class="d-flex align-center flex-wrap ga-2">
          <span class="text-body-2 font-weight-medium">
            {{ t('map.selectedCount', {count: currentShapeState.selected.length}) }}
          </span>
          <v-spacer></v-spacer>
          <v-btn size="small" variant="tonal" prepend-icon="mdi-folder-move"
                 @click="openBatchMove('shapes', currentShapeType)">{{ t('map.batchMove') }}</v-btn>
          <v-btn size="small" variant="tonal" prepend-icon="mdi-folder-remove"
                 @click="batchRemoveFromCollection('shapes', currentShapeType)">{{ t('map.batchRemove') }}</v-btn>
          <v-btn size="small" variant="tonal" color="error" prepend-icon="mdi-delete"
                 @click="batchDelete('shapes', currentShapeType)">{{ t('map.batchDelete') }}</v-btn>
        </div>
      </v-card>

      <v-card border>
        <v-table>
          <thead>
          <tr>
            <th class="text-left" style="width:44px">
              <v-checkbox-btn :model-value="currentRowsAllSelected"
                              @update:model-value="toggleSelectAllRows(currentShapeState)"></v-checkbox-btn>
            </th>
            <th class="text-left" style="width:70px">{{ t('map.style') }}</th>
            <th class="text-left">{{ t('map.shapeName') }}</th>
            <th class="text-left">{{ t('map.selectCollection') }}</th>
            <th class="text-left">{{ t('map.tags') }}</th>
            <th class="text-right" style="width:210px">{{ t('basic.button.actions') }}</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="shape in currentShapeState.rows" :key="shape.uuid"
              :class="{'row-selected': currentShapeState.selected.includes(shape.uuid)}">
            <td>
              <v-checkbox-btn :model-value="currentShapeState.selected.includes(shape.uuid)"
                              @update:model-value="toggleSelection(currentShapeState, shape.uuid)"></v-checkbox-btn>
            </td>
            <td>
              <!-- 样式迷你预览 -->
              <MapShapeStylePreview :shape-type="shape.shapeType" :shape-style="previewStyle(shape)"/>
            </td>
            <td class="text-body-2 font-weight-medium">
              <div class="d-flex align-center ga-1">
                {{ shape.title }}
                <v-icon v-if="parseShapeStyle(shape).smoothed" size="14" color="amber"
                        :title="t('map.smoothCurve')">mdi-wave</v-icon>
              </div>
            </td>
            <td class="text-caption">{{ collectionTitle(shape.collectionId) }}</td>
            <td>
              <v-chip v-for="tag in parseShapeTags(shape)" :key="tag" size="x-small"
                      variant="tonal" class="mr-1">{{ tag }}</v-chip>
            </td>
            <td>
              <div class="d-flex justify-end ga-1">
                <v-btn size="small" variant="text" icon="mdi-map-search"
                       :title="t('map.viewOnMap')" @click="focusShapeOnMap(shape)"></v-btn>
                <v-btn size="small" variant="text" icon="mdi-vector-square-edit"
                       :title="t('map.editVertices')" @click="editShapeGeometryOnMap(shape)"></v-btn>
                <v-btn size="small" variant="text" icon="mdi-pencil"
                       @click="openEditShape(shape)"></v-btn>
                <v-btn size="small" variant="text" color="error" icon="mdi-delete"
                       @click="deleteOneShape(shape)"></v-btn>
              </div>
            </td>
          </tr>
          </tbody>
        </v-table>

        <div class="py-8 text-center" v-if="!currentShapeState.loading && currentShapeState.rows.length === 0">
          <EmptyView></EmptyView>
        </div>
        <PaginationBar v-model:page="currentShapeState.page"
                       :total="currentShapeState.total"
                       :page-size="currentShapeState.pageSize"
                       density="compact"
                       class="pa-3"
                       @change="(p) => onShapePage(currentShapeType, p)" />
      </v-card>
    </div>

    <!-- 地图集编辑/新建对话框 S -->
    <v-dialog v-model="collectionFormModal" max-width="500">
      <v-card border>
        <v-card-title class="pa-4 font-weight-bold d-flex align-center border-b">
          <v-icon color="amber" class="mr-2">{{ editingCollection ? 'mdi-pencil' : 'mdi-plus-box' }}</v-icon>
          {{ editingCollection ? t('map.editCollection') : t('map.createCollection') }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="collectionFormRef">
            <v-text-field v-model="collectionForm.title"
                          :label="t('map.collectionTitle')" variant="outlined" density="compact"
                          class="mb-3" :rules="[v => !!v || t('map.titleRequired')]" required></v-text-field>
            <v-textarea v-model="collectionForm.description"
                        :label="t('map.collectionDescription')" variant="outlined" density="compact"
                        rows="3" class="mb-3"></v-textarea>
            <v-select v-model="collectionForm.public"
                      item-title="label" item-value="value"
                      :items="[{value: 1, label: t('map.public')}, {value: 0, label: t('map.private')}]"
                      :label="t('map.publicCollection')" variant="outlined" density="compact"></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="onResetCollectionForm">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn color="amber" variant="tonal" :loading="savingCollectionLoading" @click="onSaveCollection">
            {{ t('basic.button.submit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 地图集编辑/新建对话框 E -->

    <!-- 标记新建/编辑对话框 -->
    <MapEditMarkerDialog
        v-model="pointDialogVisible"
        :form="pointForm"
        :user-collections="userCollections.data"
        :saving="savingPoint"
        @update:form="onPointFormChange"
        @cancel="pointDialogVisible = false"
        @save="onSavePoint"></MapEditMarkerDialog>

    <!-- 路径/区域手填弹窗 -->
    <MapShapeManualDialog
        v-model="shapeDialogVisible"
        :shape-type="shapeDialogType"
        :form="shapeForm"
        :user-collections="userCollections.data"
        :saving="savingShape"
        @update:form="onShapeFormChange"
        @cancel="shapeDialogVisible = false"
        @save="onSaveShape"></MapShapeManualDialog>

    <!-- 批量移动对话框 -->
    <v-dialog v-model="batchMoveVisible" max-width="420">
      <v-card border>
        <v-card-title class="pa-4 font-weight-bold border-b">{{ t('map.batchMoveTitle') }}</v-card-title>
        <v-card-text class="pa-4">
          <v-select :model-value="batchMoveTarget"
                    @update:model-value="batchMoveTarget = $event"
                    :items="batchMoveCollectionItems"
                    item-title="title" item-value="value"
                    :label="t('map.selectCollection')"
                    variant="outlined" density="compact"></v-select>
        </v-card-text>
        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="batchMoveVisible = false">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn color="amber" variant="tonal" @click="executeBatchMove">{{ t('basic.button.submit') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 S -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card border>
        <v-card-title class="pa-4 text-h6 font-weight-bold text-error d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          {{ t('common.confirmDelete') }}
        </v-card-title>
        <v-card-text class="px-4 py-2">{{ deleteConfirmMessage }}</v-card-text>
        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteConfirm = false">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn color="error" variant="tonal" @click="executeDelete">{{ t('basic.button.submit') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 删除确认对话框 E -->
  </div>
</template>

<style scoped lang="less">
.min-width-0 {
  min-width: 0;
}

.row-selected {
  background-color: rgb(var(--v-theme-amber) / 0.08);
}

:deep(th) {
  font-size: 0.8rem;
  white-space: nowrap;
}
</style>
