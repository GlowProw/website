<script setup lang="ts">
import {computed, onMounted, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {
  type EntityListState,
  type MapCollection,
  type MapCollectionResult,
  type MapPoint,
  type MapShape,
  type MapShapeType,
  type PointFormData,
  type ShapeFormData,
  type ShapeGeometry,
  type TabKey,
  parseShapeGeometry,
  parseShapeStyle,
  parseShapeTags,
  resolveShapeStyle,
} from "@/assets/types/Map";
import {useMapApi} from "@/assets/sripts/api/map_service";
import {useNoticeStore} from "~/stores/noticeStore";
import {useAssetsStore} from "~/stores/assetsStore";
import {ApiError} from "@/assets/types/Api";
import EmptyView from "@/components/EmptyView.vue";
import Loading from "@/components/Loading.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import MapEditMarkerDialog from "@/components/map/MapEditMarkerDialog.vue";
import MapShapeEditDialog from "@/components/map/MapShapeEditDialog.vue";
import MapShapeStylePreview from "@/components/map/MapShapeStylePreview.vue";
import QuotaLimitWidget from "@/components/QuotaLimitWidget.vue";
import PaginationBar from "@/components/PaginationBar.vue";

const {t} = useI18n(),
    api = useMapApi(),
    notice = useNoticeStore(),
    router = useRouter(),
    {serializationMap} = useAssetsStore()

const mapImages = import.meta.glob('/src/assets/images/map/*.*', {eager: true})
const mapIcons = ref<Record<string, string>>(serializationMap(mapImages))

/**
 * 获取标记对应的分类图标路径
 * @param category 分类标识
 */
const getCategoryIcon = (category?: string): string => {
  if (!category) return mapIcons.value['shareLocation'] || mapIcons.value['default'] || '';
  return mapIcons.value[category] || mapIcons.value['shareLocation'] || mapIcons.value['default'] || '';
}

const activeTab = ref<TabKey>('collections'),
    collectionLoading = ref(false),
    collectionFormRef = ref<any>(null),
    collectionPagination = reactive({page: 1, pageSize: 10}),
    userCollections = ref<MapCollectionResult>({data: []}),
    collectionSelected = ref<string[]>([]),
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

/**
 * 创建列表通用响应式状态结构
 */
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

/**
 * 根据图形类型获取对应列表状态
 * @param type 图形类型 ('path' | 'region')
 */
const shapeStateByType = (type: MapShapeType): EntityListState => type === 'path' ? pathState : regionState

const pointDialogVisible = ref(false),
    pointForm = ref<PointFormData>({
      title: '',
      description: '',
      longitude: '',
      latitude: '',
      collectionUuid: null,
      category: 'shareLocation',
      tags: [],
      public: false,
    })

const shapeDialogVisible = ref(false),
    shapeDialogMode = ref<'create' | 'edit'>('edit'),
    shapeDialogType = ref<MapShapeType>('path'),
    shapeFormRef = ref<any>(null),
    editingShapeUuid = ref<string | null>(null),
    shapeForm = ref<ShapeFormData>({
      title: '',
      description: '',
      collectionUuid: null,
      tags: [],
      public: false,
      style: resolveShapeStyle(null, 'path'),
    })

const batchMoveVisible = ref(false),
    batchMoveTarget = ref<string | null>(null),
    batchMoveKind = ref<'points' | 'shapes'>('points'),
    batchMoveShapeType = ref<MapShapeType>('path')

onMounted(() => {
  getMyCollectionsData()
})

/**
 * API 错误提示处理函数
 * @param e 捕获的异常对象
 */
const onApiError = (e: unknown) => {
  if (e instanceof ApiError) {
    notice.error(t(`basic.tips.${e.code}`, {context: e.code}))
  }
  console.error(e)
}

/**
 * 加载当前用户的地图集列表数据
 */
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

/**
 * 获取地图集标题名称
 * @param id 地图集 UUID
 */
const collectionTitle = (id?: string | null): string => {
  if (!id) return t('map.noCollection')
  return userCollections.value.data.find(c => c.uuid === id)?.title || t('map.noCollection')
}

/**
 * 保存地图集（新建或更新）
 */
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

/**
 * 打开新建地图集弹窗
 */
const onCreatedCollection = (): void => {
  editingCollection.value = false;
  collectionForm.value = {uuid: '', title: '', description: '', public: 1, sharedUsers: []};
  collectionFormModal.value = true;
};

/**
 * 打开编辑地图集弹窗
 * @param collection 待编辑的地图集对象
 */
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

/**
 * 重置并关闭地图集表单弹窗
 */
const onResetCollectionForm = (): void => {
  collectionForm.value = {uuid: '', title: '', description: '', public: 1, sharedUsers: []};
  editingCollection.value = false;
  collectionFormModal.value = false;
};

/**
 * 确认删除单个地图集
 * @param collection 待删除的地图集对象
 */
const confirmDeleteCollection = (collection: MapCollection): void => {
  deleteConfirmMessage.value = t('map.confirmDeleteCollection', {title: collection.title})
  pendingDeleteAction.value = async () => {
    await api.deleteCollection(collection.uuid)
    await getMyCollectionsData()
    notice.success(t('basic.tips.map.deleteSuccess'))
  };
  showDeleteConfirm.value = true;
};

/**
 * 执行待处理的删除操作
 */
const executeDelete = async (): Promise<void> => {
  if (pendingDeleteAction.value) {
    await pendingDeleteAction.value()
    pendingDeleteAction.value = null;
  }
  showDeleteConfirm.value = false
};

/**
 * 从地图集列表跳到标记 Tab 并按集合过滤
 * @param collection 目标地图集对象
 */
const openCollectionPoints = (collection: MapCollection): void => {
  pointsState.filterCollection = collection.uuid
  pointsState.page = 1
  pointsState.loaded = false
  activeTab.value = 'points'
  void loadPoints()
}

/**
 * 从地图集列表跳到路径 Tab 并按集合过滤
 * @param collection 目标地图集对象
 */
const openCollectionPaths = (collection: MapCollection): void => {
  pathState.filterCollection = collection.uuid
  pathState.page = 1
  pathState.loaded = false
  activeTab.value = 'paths'
  void loadShapes('path')
}

/**
 * 从地图集列表跳到区域 Tab 并按集合过滤
 * @param collection 目标地图集对象
 */
const openCollectionRegions = (collection: MapCollection): void => {
  regionState.filterCollection = collection.uuid
  regionState.page = 1
  regionState.loaded = false
  activeTab.value = 'regions'
  void loadShapes('region')
}

/**
 * 切换单个地图集选择状态
 * @param uuid 地图集 UUID
 */
const toggleCollectionSelection = (uuid: string) => {
  const idx = collectionSelected.value.indexOf(uuid);
  if (idx > -1) collectionSelected.value.splice(idx, 1);
  else collectionSelected.value.push(uuid);
}

/**
 * 判断当前页地图集是否全部选中
 */
const collectionsAllSelected = computed(() => {
  const rows = userCollections.value?.data || [];
  return rows.length > 0 && rows.every(r => collectionSelected.value.includes(r.uuid));
})

/**
 * 切换全选当前页地图集
 */
const toggleSelectAllCollections = () => {
  const rows = userCollections.value?.data || [];
  if (collectionsAllSelected.value) {
    collectionSelected.value = collectionSelected.value.filter(uuid => !rows.some(r => r.uuid === uuid));
  } else {
    rows.forEach(r => {
      if (!collectionSelected.value.includes(r.uuid)) collectionSelected.value.push(r.uuid);
    });
  }
}

/**
 * 批量删除选中的地图集
 */
const batchDeleteCollections = async () => {
  if (collectionSelected.value.length === 0) return;
  deleteConfirmMessage.value = t('map.confirmBatchDelete', {count: collectionSelected.value.length});
  pendingDeleteAction.value = async () => {
    for (const uuid of collectionSelected.value) {
      await api.deleteCollection(uuid);
    }
    collectionSelected.value = [];
    await getMyCollectionsData();
    notice.success(t('basic.tips.map.deleteSuccess'));
  };
  showDeleteConfirm.value = true;
}

/**
 * 生成地图集分享链接并复制到剪贴板
 * @param collection 地图集对象
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
 * 克隆地图集（完整复制集合及其全部标记与图形）
 * @param collection 待克隆的地图集对象
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

/**
 * 加载标记列表数据
 */
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

/**
 * 触发标记关键词搜索
 */
const onSearchPoints = () => {
  pointsState.page = 1
  loadPoints()
}

/**
 * 标记所属集合过滤条件变化处理
 */
const onPointsFilterChange = () => {
  pointsState.page = 1
  pointsState.selected = []
  loadPoints()
}

/**
 * 标记列表分页切换
 * @param page 目标页码
 */
const onPointPage = (page: number) => {
  pointsState.page = page
  loadPoints()
}

/**
 * 切换列表单行选中状态
 * @param state 列表状态对象
 * @param uuid 实体 UUID
 */
const toggleSelection = (state: EntityListState, uuid: string) => {
  const i = state.selected.indexOf(uuid)
  if (i > -1) state.selected.splice(i, 1)
  else state.selected.push(uuid)
}

/**
 * 切换全选当前列表行
 * @param state 列表状态对象
 */
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

/**
 * 判断列表行是否已全部选中
 * @param state 列表状态对象
 */
const rowsAllSelected = (state: EntityListState): boolean =>
    state.rows.length > 0 && state.rows.every(r => state.selected.includes(r.uuid))

/**
 * 解析 JSON 字符串形式的标签数组
 * @param raw 原始数据
 */
const parseTags = (raw: string | null): string[] => {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/**
 * 打开新建标记弹窗
 */
const openCreatePoint = () => {
  pointForm.value = {
    title: '',
    description: '',
    longitude: '',
    latitude: '',
    collectionUuid: pointsState.filterCollection && pointsState.filterCollection !== '__none__'
        ? pointsState.filterCollection
        : null,
    category: 'shareLocation',
    tags: [],
    public: false,
  }
  pointDialogVisible.value = true
}

/**
 * 打开编辑标记弹窗
 * @param point 待编辑的标记对象
 */
const openEditPoint = (point: MapPoint) => {
  pointForm.value = {
    uuid: point.uuid,
    title: point.title,
    description: point.description || '',
    longitude: point.longitude,
    latitude: point.latitude,
    collectionUuid: point.collectionId || null,
    category: (point as any).category || (point as any).type || 'shareLocation',
    tags: parseTags(point.tags),
    public: point.public === 1,
  }
  pointDialogVisible.value = true
}

/**
 * 标记表单数据更新回调
 * @param data 新表单数据
 */
const onPointFormChange = (data: PointFormData) => {
  pointForm.value = data
}

/**
 * 保存标记（新建或更新）
 */
const onSavePoint = async () => {
  const f = pointForm.value
  savingPoint.value = true
  try {
    const payload = {
      title: f.title,
      description: f.description || undefined,
      longitude: Number(f.longitude),
      latitude: Number(f.latitude),
      collectionUuid: f.collectionUuid || null,
      category: f.category || 'shareLocation',
      type: f.category || 'shareLocation',
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

/**
 * 删除单个标记确认
 * @param point 标记对象
 */
const deleteOnePoint = (point: MapPoint) => {
  deleteConfirmMessage.value = t('map.confirmDeletePoint', {title: point.title})
  pendingDeleteAction.value = async () => {
    await api.deletePoint(point.uuid)
    notice.success(t('basic.tips.map.deleteSuccess'))
    await loadPoints()
  }
  showDeleteConfirm.value = true
}

/**
 * 在大地图上定位聚焦该标记
 * @param point 标记对象
 */
const focusPointOnMap = (point: MapPoint) => {
  router.push({path: '/map', query: {focus: `point:${point.uuid}`}})
}

/**
 * 跳转到大地图进行标记绘制放置
 */
const goDrawMarker = () => {
  const query: Record<string, string> = {draw: 'marker'}
  if (pointsState.filterCollection && pointsState.filterCollection !== '__none__') {
    query.collectionUuid = pointsState.filterCollection
  }
  router.push({path: '/map', query})
}

/**
 * 加载图形列表（路径或区域）
 * @param type 图形类型 ('path' | 'region')
 */
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

/**
 * 图形列表搜索
 * @param type 图形类型
 */
const onShapeSearch = (type: MapShapeType) => {
  const state = shapeStateByType(type)
  state.page = 1
  loadShapes(type)
}

/**
 * 图形所属集合过滤变化
 * @param type 图形类型
 */
const onShapeFilterChange = (type: MapShapeType) => {
  const state = shapeStateByType(type)
  state.page = 1
  state.selected = []
  loadShapes(type)
}

/**
 * 图形列表分页切换
 * @param type 图形类型
 * @param page 目标页码
 */
const onShapePage = (type: MapShapeType, page: number) => {
  shapeStateByType(type).page = page
  loadShapes(type)
}

/**
 * 列表迷你预览样式补全解析
 * @param shape 图形对象
 */
const previewStyle = (shape: MapShape) =>
    resolveShapeStyle(parseShapeStyle(shape), shape.shapeType)

/**
 * 生成默认初始几何
 * @param type 图形类型
 */
const defaultShapeGeometry = (type: MapShapeType): ShapeGeometry => {
  return type === 'path'
      ? { type: 'LineString', coordinates: [[-0.67, 0.63], [-0.65, 0.62], [-0.63, 0.64]] }
      : { type: 'Polygon', coordinates: [[[-0.67, 0.63], [-0.65, 0.63], [-0.65, 0.61], [-0.67, 0.61], [-0.67, 0.63]]] }
}

/**
 * 打开新建路径/区域弹窗（内置微缩地图直接交互绘制）
 * @param type 图形类型
 */
const openCreateShape = (type: MapShapeType) => {
  editingShapeUuid.value = null
  shapeDialogMode.value = 'create'
  shapeDialogType.value = type
  const state = shapeStateByType(type)
  shapeForm.value = {
    title: '',
    description: '',
    collectionUuid: state.filterCollection && state.filterCollection !== '__none__' ? state.filterCollection : null,
    tags: [],
    public: false,
    style: resolveShapeStyle(null, type),
    geometry: defaultShapeGeometry(type),
  }
  shapeDialogVisible.value = true
}

/**
 * 打开编辑路径/区域属性及顶点弹窗
 * @param shape 图形对象
 */
const openEditShape = (shape: MapShape) => {
  editingShapeUuid.value = shape.uuid
  shapeDialogMode.value = 'edit'
  shapeDialogType.value = shape.shapeType
  shapeForm.value = {
    title: shape.title,
    description: shape.description || '',
    collectionUuid: shape.collectionId || null,
    tags: parseShapeTags(shape),
    public: shape.public === 1,
    // 补全为完整样式，旧数据缺颜色/透明度时编辑窗也能显示真实有效值
    style: resolveShapeStyle(parseShapeStyle(shape), shape.shapeType),
    geometry: parseShapeGeometry(shape) || defaultShapeGeometry(shape.shapeType),
  }
  shapeDialogVisible.value = true
}

/**
 * 图形表单数据更新回调
 * @param data 新表单数据
 */
const onShapeFormChange = (data: ShapeFormData) => {
  shapeForm.value = data
}

/**
 * 保存路径/区域（新建或更新）
 */
const onSaveShape = async () => {
  const formRef = (shapeFormRef.value as any)?.formRef
  if (formRef) {
    const {valid} = await formRef.validate()
    if (!valid) return
  }

  const f = shapeForm.value
  const type = shapeDialogType.value
  savingShape.value = true
  try {
    const body: any = {
      title: f.title,
      description: f.description || undefined,
      collectionUuid: f.collectionUuid || null,
      style: f.style,
      tags: f.tags,
      public: f.public,
    }
    if (f.geometry) {
      body.geometry = f.geometry
    }
    if (shapeDialogMode.value === 'create') {
      const geo = f.geometry || defaultShapeGeometry(type)
      await api.createShape({
        shapeType: type,
        ...body,
        geometry: geo,
      })
      notice.success(t('basic.tips.map.createSuccess'))
    } else if (editingShapeUuid.value) {
      await api.updateShape(editingShapeUuid.value, body)
      notice.success(t('basic.tips.map.updateSuccess'))
    }
    shapeDialogVisible.value = false
    await loadShapes(type)
  } catch (e) {
    onApiError(e)
  } finally {
    savingShape.value = false
  }
}

/**
 * 删除单个图形确认
 * @param shape 图形对象
 */
const deleteOneShape = (shape: MapShape) => {
  deleteConfirmMessage.value = t('map.confirmDeleteShape', {title: shape.title})
  pendingDeleteAction.value = async () => {
    await api.deleteShape(shape.uuid)
    notice.success(t('basic.tips.map.deleteSuccess'))
    await loadShapes(shape.shapeType)
  }
  showDeleteConfirm.value = true
}

/**
 * 在大地图上定位聚焦该图形
 * @param shape 图形对象
 */
const focusShapeOnMap = (shape: MapShape) => {
  router.push({path: '/map', query: {focus: `shape:${shape.uuid}`}})
}

/**
 * 跳转到大地图编辑图形顶点
 * @param shape 图形对象
 */
const editShapeGeometryOnMap = (shape: MapShape) => {
  router.push({path: '/map', query: {edit: `shape:${shape.uuid}`}})
}

/**
 * 跳转到大地图绘制图形
 * @param type 图形类型
 */
const goDrawShape = (type: MapShapeType) => {
  const state = shapeStateByType(type)
  const query: Record<string, string> = {draw: type}
  if (state.filterCollection && state.filterCollection !== '__none__') {
    query.collectionUuid = state.filterCollection
  }
  router.push({path: '/map', query})
}

/* ==批量操作 ==*/

/**
 * 打开批量移动到地图集弹窗
 * @param kind 实体类型 ('points' | 'shapes')
 * @param shapeType 图形子类型
 */
const openBatchMove = (kind: 'points' | 'shapes', shapeType: MapShapeType = 'path') => {
  batchMoveKind.value = kind
  batchMoveShapeType.value = shapeType
  batchMoveTarget.value = null
  batchMoveVisible.value = true
}

/**
 * 执行批量移动操作
 */
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

/**
 * 批量移出所属地图集（转为未分组）
 * @param kind 实体类型
 * @param shapeType 图形子类型
 */
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

/**
 * 批量删除选中的标记或图形
 * @param kind 实体类型
 * @param shapeType 图形子类型
 */
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

/* ==Tab 切换 ==*/

/**
 * 顶部 Tab 切换处理
 * @param tab 目标 Tab Key
 */
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

/**
 * 当前图形 Tab 的类型与状态
 */
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

    <!-- 地图集 Tab S -->
    <div v-if="activeTab === 'collections'">
      <!-- 批量操作条 -->
      <v-card v-if="collectionSelected.length > 0" border color="amber" variant="tonal" class="pa-2 mb-3">
        <div class="d-flex align-center flex-wrap ga-2">
          <span class="text-body-2 font-weight-medium">
            {{ t('map.selectedCount', {count: collectionSelected.length}) }}
          </span>
          <v-spacer></v-spacer>
          <v-btn size="small" variant="tonal" color="error" prepend-icon="mdi-delete"
                 @click="batchDeleteCollections">{{ t('map.batchDelete') }}</v-btn>
        </div>
      </v-card>

      <v-card border>
        <v-table>
          <thead>
          <tr>
            <th class="text-left" style="width:44px">
              <v-checkbox-btn :model-value="collectionsAllSelected"
                              @update:model-value="toggleSelectAllCollections"></v-checkbox-btn>
            </th>
            <th class="text-left">{{ t('map.collectionTitle') }}</th>
            <th class="text-left">{{ t('map.collectionDescription') }}</th>
            <th class="text-left" style="width:100px">{{ t('map.visibility') }}</th>
            <th class="text-left" style="width:310px">{{ t('basic.button.manage') || '管理' }}</th>
            <th class="text-right" style="width:170px">{{ t('basic.button.actions') }}</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="collection in (userCollections?.data || [])" :key="collection.uuid"
              :class="{'row-selected': collectionSelected.includes(collection.uuid)}">
            <td>
              <v-checkbox-btn :model-value="collectionSelected.includes(collection.uuid)"
                              @update:model-value="toggleCollectionSelection(collection.uuid)"></v-checkbox-btn>
            </td>
            <td class="text-body-2 font-weight-medium">
              <div class="d-flex align-center ga-2">
                <v-icon size="18" color="amber">mdi-folder</v-icon>
                <span>{{ collection.title }}</span>
              </div>
            </td>
            <td class="text-caption opacity-70">{{ collection.description || '—' }}</td>
            <td>
              <v-chip size="x-small" :color="collection.public ? 'amber' : 'default'" variant="tonal">
                {{ collection.public ? t('map.public') : t('map.private') }}
              </v-chip>
            </td>
            <td>
              <div class="d-flex align-center ga-1">
                <v-btn size="x-small" variant="tonal" color="amber" prepend-icon="mdi-map-marker-multiple" rounded="xl"
                       @click="openCollectionPoints(collection)">
                  {{ t('map.managePoints') }}
                </v-btn>
                <v-btn size="x-small" variant="tonal" color="amber" prepend-icon="mdi-vector-polyline" rounded="xl"
                       @click="openCollectionPaths(collection)">
                  {{ t('map.managePaths') }}
                </v-btn>
                <v-btn size="x-small" variant="tonal" color="amber" prepend-icon="mdi-vector-polygon" rounded="xl"
                       @click="openCollectionRegions(collection)">
                  {{ t('map.manageRegions') }}
                </v-btn>
              </div>
            </td>
            <td>
              <div class="d-flex justify-end ga-1">
                <v-btn size="small" variant="text" icon="mdi-share-variant-outline"
                       :title="t('map.share.copyLink')" @click="copyShareLink(collection)"></v-btn>
                <v-btn size="small" variant="text" icon="mdi-content-copy"
                       :loading="cloningUuid === collection.uuid"
                       :title="t('map.share.clone')" @click="onCloneCollection(collection)"></v-btn>
                <v-btn size="small" variant="text" icon="mdi-pencil"
                       :title="t('basic.button.edit')" @click="editCollection(collection)"></v-btn>
                <v-btn size="small" variant="text" color="error" icon="mdi-delete"
                       :title="t('basic.button.delete')" @click="confirmDeleteCollection(collection)"></v-btn>
              </div>
            </td>
          </tr>
          </tbody>
        </v-table>

        <div class="py-8 text-center" v-if="!collectionLoading && (!userCollections?.data || userCollections.data.length === 0)">
          <EmptyView></EmptyView>
        </div>
        <PaginationBar v-model:page="collectionPagination.page"
                       :pagination="userCollections.pagination"
                       class="pa-3"
                       @change="getMyCollectionsData" />
      </v-card>
    </div>
    <!-- 地图集 Tab E -->

    <!-- 标记 Tab S -->
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

          <!-- 新建标记下拉按钮组 -->
          <v-btn-group color="amber" variant="tonal" density="compact" rounded="lg">
            <v-btn prepend-icon="mdi-map-marker-plus" @click="openCreatePoint">
              {{ t('map.createMarker') }}
            </v-btn>
            <v-menu location="bottom end">
              <template v-slot:activator="{ props: menuProps }">
                <v-btn v-bind="menuProps" icon="mdi-menu-down" size="small"></v-btn>
              </template>
              <v-list density="compact">
                <v-list-item prepend-icon="mdi-map-marker-plus" @click="openCreatePoint">
                  <v-list-item-title>{{ t('map.createMarker') }}</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-map" @click="goDrawMarker">
                  <v-list-item-title>{{ t('map.drawOnMap') }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-btn-group>
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
            <th class="text-left" style="width:60px">{{ t('map.style') }}</th>
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
            <td>
              <v-img :src="getCategoryIcon(point.category || (point as any).type)" width="22" height="22" contain></v-img>
            </td>
            <td class="text-body-2 font-weight-medium u">{{ point.title }}</td>
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
    <!-- 标记 Tab E -->

    <!-- 路径 / 区域 Tab S -->
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

          <!-- 新建路径/区域下拉按钮组 -->
          <v-btn-group color="amber" variant="tonal" density="compact" rounded="lg">
            <v-btn :prepend-icon="currentShapeType === 'path' ? 'mdi-vector-polyline' : 'mdi-vector-polygon'"
                   @click="openCreateShape(currentShapeType)">
              {{ currentShapeType === 'path' ? t('map.createPath') : t('map.createRegion') }}
            </v-btn>
            <v-menu location="bottom end">
              <template v-slot:activator="{ props: menuProps }">
                <v-btn v-bind="menuProps" icon="mdi-menu-down" size="small"></v-btn>
              </template>
              <v-list density="compact">
                <v-list-item :prepend-icon="currentShapeType === 'path' ? 'mdi-vector-polyline' : 'mdi-vector-polygon'"
                             @click="openCreateShape(currentShapeType)">
                  <v-list-item-title>{{ currentShapeType === 'path' ? t('map.createPath') : t('map.createRegion') }}</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-map" @click="goDrawShape(currentShapeType)">
                  <v-list-item-title>{{ t('map.drawOnMap') }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-btn-group>
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
              <div class="d-flex align-center ga-1 u">
                {{ shape.title }}
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
    <!-- 路径 / 区域 Tab E -->

    <!-- 地图集编辑/新建对话框 S -->
    <v-dialog v-model="collectionFormModal" persistent max-width="600">
      <v-card border elevation="12">
        <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 create-collection-card">
          <v-icon size="64" class="mb-2">mdi-folder-multiple-image</v-icon>
          <p>
            {{ editingCollection ? t('map.editCollection') : t('map.createCollection') }}
          </p>
        </v-card-title>
        <template v-slot:append>
          <v-btn variant="tonal" icon @click="onResetCollectionForm">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
        <v-card-text>
          <v-form ref="collectionFormRef">
            <v-row dense>
              <v-col cols="12">
                <v-text-field v-model="collectionForm.title"
                              :label="t('map.collectionTitle')" variant="outlined" density="compact"
                              class="mb-1" :rules="[v => !!v || t('map.titleRequired')]" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="collectionForm.description"
                            :label="t('map.collectionDescription')" variant="outlined" density="compact"
                            rows="3" class="mb-1"></v-textarea>
              </v-col>
              <v-col cols="12">
                <v-select v-model="collectionForm.public"
                          item-title="label" item-value="value"
                          :items="[{value: 1, label: t('map.public')}, {value: 0, label: t('map.private')}]"
                          :label="t('map.publicCollection')" variant="outlined" density="compact"></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 py-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="onResetCollectionForm">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn color="amber" variant="tonal" :loading="savingCollectionLoading" @click="onSaveCollection">
            {{ editingCollection ? t('basic.button.save') : t('basic.button.create') }}
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

    <!-- 路径/区域编辑弹窗 -->
    <MapShapeEditDialog
        ref="shapeFormRef"
        v-model="shapeDialogVisible"
        :mode="shapeDialogMode"
        :shape-type="shapeDialogType"
        :form="shapeForm"
        :user-collections="userCollections.data"
        :saving="savingShape"
        @update:form="onShapeFormChange"
        @cancel="shapeDialogVisible = false"
        @save="onSaveShape"></MapShapeEditDialog>

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

.create-collection-card {
  margin-top: -80px !important;
}
</style>
