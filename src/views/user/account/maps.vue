<script setup lang="ts">
import {onMounted, type Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {type MapCollection, type MapCollectionResult, type MapPoint} from "@/assets/types/Map";
import {useMapApi} from "@/assets/sripts/api/map_service";
import {useNoticeStore} from "~/stores/noticeStore";
import {AxiosError} from "axios";
import {ApiError} from "@/assets/types/Api";
import EmptyView from "@/components/EmptyView.vue";
import Loading from "@/components/Loading.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const {t} = useI18n(),
    api = useMapApi(),
    notice = useNoticeStore()

let collectionLoading = ref(false),
    collectionFormRef = ref<any>(null),
    collectionPagination: Ref<any> = ref({
      page: 1,
      pageSize: 10
    }),
    userCollections: Ref<MapCollectionResult> = ref({data: []}),
    savingCollectionLoading = ref(false),
    collectionFormModal = ref(false),
    collectionForm: Ref<any> = ref({
      uuid: '',
      title: '',
      description: '',
      public: 1,
      sharedUsers: [] as string[]
    }),
    editingCollection = ref(false),
    showDeleteConfirm = ref(false),
    deleteConfirmMessage = ref(''),
    pendingDeleteAction = ref<any>(),

    // 坐标管理相关
    selectedCollection = ref<MapCollection | null>(null),
    showPointManager = ref(false),
    collectionPoints = ref<MapPoint[]>([]),
    orphanPoints = ref<MapPoint[]>([]),
    searchQuery = ref(''),
    selectedPoints = ref<string[]>([]),
    pointPagination = ref({
      page: 1,
      pageSize: 20
    }),
    orphanPointPagination = ref({
      page: 1,
      pageSize: 20
    })

onMounted(() => {
  getMyCollectionsData()
})

/**
 * 获取地图集列表
 */
const getMyCollectionsData = async () => {
  try {
    collectionLoading.value = true;
    const result = await api.getCollections(collectionPagination.value)
    userCollections.value = result.data || {data: []};
  } catch (e) {
    console.error(e)
  } finally {
    collectionLoading.value = false;
  }
}

/**
 * 打开坐标管理器
 */
const openPointManager = async (collection: MapCollection) => {
  selectedCollection.value = collection;
  showPointManager.value = true;
  selectedPoints.value = [];

  await Promise.all([
    loadCollectionPoints(collection.uuid),
    loadOrphanPoints()
  ])
}

/**
 * 加载地图集内的坐标
 */
const loadCollectionPoints = async (collectionUuid: string) => {
  try {
    const result = await api.getUserPoints({
      collectionUuid,
      page: pointPagination.value.page,
      pageSize: pointPagination.value.pageSize
    });
    collectionPoints.value = result.data.points || [];
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {context: e.code}))
    }
    console.error(e)
  }
}

/**
 * 加载孤儿坐标
 */
const loadOrphanPoints = async () => {
  try {
    const result = await api.getOrphanPoints({
      page: orphanPointPagination.value.page,
      pageSize: orphanPointPagination.value.pageSize
    });
    orphanPoints.value = result.data.points || [];
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {context: e.code}))
    }
    console.error(e)
  }
}

/**
 * 搜索坐标
 */
const onSearchPoints = async () => {
  if (!searchQuery.value.trim()) {
    await loadOrphanPoints()
    return;
  }

  try {
    const result = await api.getUserPoints({
      page: orphanPointPagination.value.page,
      pageSize: orphanPointPagination.value.pageSize
    });
    const pts = result.data.points || [];
    orphanPoints.value = pts.filter((point: MapPoint) =>
        point.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        point.description?.toLowerCase().includes(searchQuery.value.toLowerCase()))
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {context: e.code}))
    }
    console.error(e)
  }
}

const togglePointSelection = (pointId: string) => {
  const index = selectedPoints.value.indexOf(pointId)
  if (index > -1) {
    selectedPoints.value.splice(index, 1)
  } else {
    selectedPoints.value.push(pointId)
  }
}

const toggleSelectAll = (points: MapPoint[]) => {
  const allSelected = points.length > 0 && points.every(point => selectedPoints.value.includes(point.uuid))
  if (allSelected) {
    selectedPoints.value = selectedPoints.value.filter(uuid => !points.some(p => p.uuid === uuid))
  } else {
    points.forEach(point => {
      if (!selectedPoints.value.includes(point.uuid)) {
        selectedPoints.value.push(point.uuid)
      }
    })
  }
}

/**
 * 添加选中坐标到地图集
 */
const addSelectedPointsToCollection = async () => {
  if (!selectedCollection.value || selectedPoints.value.length === 0) return;

  try {
    await api.addPointsToCollection(selectedCollection.value.uuid, selectedPoints.value)
    await Promise.all([
      loadCollectionPoints(selectedCollection.value.uuid),
      loadOrphanPoints()
    ])
    selectedPoints.value = [];
    notice.success(t(`basic.tips.map.success`) || '添加成功')
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {context: e.code}))
    }
    console.error(e)
  }
}

/**
 * 从地图集中移除选中坐标
 */
const onRemoveSelectedPointsFromCollection = async () => {
  if (!selectedCollection.value || selectedPoints.value.length === 0) return;

  try {
    await api.removePointsFromCollection(selectedCollection.value.uuid, selectedPoints.value)
    await Promise.all([
      loadCollectionPoints(selectedCollection.value.uuid),
      loadOrphanPoints()
    ])
    selectedPoints.value = [];
    notice.success(t(`basic.tips.map.success`) || '移除成功')
  } catch (e) {
    if (e instanceof AxiosError && e.response) {
      notice.error(t(`basic.tips.${e.response?.data?.code}`, {content: e.response?.data?.message}))
    } else {
      console.error(e)
    }
  }
}

/**
 * 删除选中坐标
 */
const deleteSelectedPoints = async () => {
  if (selectedPoints.value.length === 0) return;

  try {
    if (!confirm(t('common.confirmDelete') || '确定要删除选中的坐标吗？')) return

    for (const pointId of selectedPoints.value) {
      await api.deletePoint(pointId)
    }

    if (selectedCollection.value) {
      await loadCollectionPoints(selectedCollection.value.uuid)
    }
    await loadOrphanPoints()
    selectedPoints.value = [];
    notice.success(t(`basic.tips.map.success`) || '删除成功')
  } catch (e) {
    if (e instanceof AxiosError) {
      notice.error(t(`basic.tips.${e.response?.data?.code}`, {content: e.response?.data?.message}))
    }
    console.error(e)
  }
}

/**
 * 保存地图集
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
    notice.success(t(`basic.tips.map.success`) || '操作成功')
  } catch (e) {
    if (e instanceof AxiosError && e.response) {
      notice.error(t(`basic.tips.${e.response?.data?.code}`, {content: e.response?.data?.message}))
    }
    console.error(e)
  } finally {
    savingCollectionLoading.value = false;
  }
};

const onCreatedCollection = (): void => {
  editingCollection.value = false;
  collectionForm.value = {
    uuid: '',
    title: '',
    description: '',
    public: 1,
    sharedUsers: []
  };
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
  collectionForm.value = {
    uuid: '',
    title: '',
    description: '',
    public: 1,
    sharedUsers: []
  };
  editingCollection.value = false;
  collectionFormModal.value = false;
};

const confirmDeleteCollection = (collection: MapCollection): void => {
  deleteConfirmMessage.value = t('map.confirmDeleteCollection', {title: collection.title}) || `确定删除地图集 [${collection.title}] 吗？`
  pendingDeleteAction.value = async () => {
    await api.deleteCollection(collection.uuid)
    await getMyCollectionsData()
    notice.success(t(`basic.tips.map.success`) || '删除成功')
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

defineOptions({
  name: 'AccountMaps'
})
</script>

<template>
  <div class="position-relative">
    <v-overlay :model-value="collectionLoading" contained class="d-flex align-center justify-center">
      <Loading></Loading>
    </v-overlay>

    <!-- Toolbar S -->
    <AffixContainerView>
      <v-card class="mb-4 pa-2">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div class="text-body-2 font-weight-medium d-flex align-center">
            {{ t('map.collectionList') }}
          </div>

          <!-- 行为按钮组 -->
          <div class="d-flex align-center ga-2">
            <v-btn
                color="amber"
                variant="tonal"
                @click="onCreatedCollection">
              {{ t('map.createCollection') }}
            </v-btn>

            <v-btn
                size="small"
                variant="tonal"
                icon="mdi-refresh"
                @click="getMyCollectionsData"
                :loading="collectionLoading">
            </v-btn>
          </div>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- Toolbar E -->

    <!-- 地图集列表展示 S -->
    <div v-if="userCollections && userCollections.data.length > 0" class="d-flex flex-column ga-3">
      <v-card
          v-for="(collection, index) in userCollections.data"
          :key="collection.uuid || index"
          border
          rounded="lg"
          class="pa-4 hover-card transition-all">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3">
          <div class="d-flex align-center flex-grow-1 min-width-0">
            <v-avatar size="44" rounded="lg" class="mr-3 flex-shrink-0">
              <v-icon size="24" color="amber">mdi-folder</v-icon>
            </v-avatar>

            <div class="min-width-0 flex-grow-1">
              <div class="d-flex align-center ga-2 mb-1">
                <h3 class="text-body-1 font-weight-bold singe-line">{{ collection.title }}</h3>
                <v-chip size="x-small" :color="collection.public ? 'amber' : 'default'" variant="tonal">
                  {{ collection.public ? (t('map.public')) : (t('map.private')) }}
                </v-chip>
              </div>
              <p class="text-caption opacity-60 singe-line mb-0">
                {{ collection.description || collection.uuid }}
              </p>
            </div>
          </div>

          <!-- 右侧行为操作按钮组 -->
          <div class="d-flex align-center ga-2 flex-shrink-0">
            <v-btn
                size="small"
                variant="tonal"
                color="amber"
                prepend-icon="mdi-map-marker-multiple"
                @click="openPointManager(collection)">
              {{ t('map.managePoints') || '管理坐标' }}
            </v-btn>

            <v-tooltip :text="t('basic.button.edit')" location="top">
              <template v-slot:activator="{props}">
                <v-btn
                    v-bind="props"
                    size="small"
                    variant="tonal"
                    icon="mdi-pencil"
                    @click="editCollection(collection)">
                </v-btn>
              </template>
            </v-tooltip>

            <v-tooltip :text="t('basic.button.delete')" location="top">
              <template v-slot:activator="{props}">
                <v-btn
                    v-bind="props"
                    size="small"
                    variant="tonal"
                    color="error"
                    icon="mdi-delete"
                    @click="confirmDeleteCollection(collection)">
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </div>
      </v-card>
    </div>
    <!-- 地图集列表展示 E -->

    <div class="text-center py-12" v-else>
      <EmptyView></EmptyView>
    </div>

    <!-- 统一分页器 S -->
    <div v-if="userCollections.pagination && Number(userCollections.pagination.totalPages) > 1" class="d-flex justify-center mt-6">
      <v-pagination
          v-model="collectionPagination.page"
          :length="userCollections.pagination.totalPages"
          density="comfortable"
          active-color="amber"
          rounded="circle"
          variant="tonal"
          @update:model-value="getMyCollectionsData">
      </v-pagination>
    </div>
    <!-- 统一分页器 E -->

    <!-- 坐标管理对话框 S -->
    <v-dialog v-model="showPointManager" max-width="1100">
      <v-card border rounded="lg" v-if="selectedCollection">
        <v-card-title class="pa-4 d-flex align-center justify-space-between border-b">
          <div class="d-flex align-center">
            <v-icon color="amber" class="mr-2">mdi-map-marker-multiple</v-icon>
            <span class="font-weight-bold">{{ selectedCollection.title }} - {{ t('map.managePoints') || '坐标管理' }}</span>
          </div>
          <v-btn variant="tonal" density="compact" icon="mdi-close" @click="showPointManager = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <v-row>
            <!-- 左侧：地图集内坐标 -->
            <v-col cols="12" md="6">
              <v-card border rounded="lg" class="pa-3 h-100">
                <div class="d-flex align-center justify-space-between mb-3 pb-2 border-b">
                  <span class="font-weight-bold d-flex align-center text-body-2">
                    <v-icon size="18" color="amber" class="mr-1">mdi-map-marker</v-icon>
                    {{ t('map.pointsInCollection') }} ({{ collectionPoints.length }})
                  </span>

                  <div class="d-flex align-center ga-1">
                    <v-btn
                        v-if="collectionPoints.length > 0"
                        size="x-small"
                        variant="tonal"
                        @click="toggleSelectAll(collectionPoints)">
                      {{ collectionPoints.every(p => selectedPoints.includes(p.uuid)) ? t('map.deselectAll') : t('map.selectAll') }}
                    </v-btn>

                    <v-btn
                        size="x-small"
                        color="error"
                        variant="tonal"
                        :disabled="!collectionPoints.some(p => selectedPoints.includes(p.uuid))"
                        @click="onRemoveSelectedPointsFromCollection">
                      {{ t('map.remove') || '移出' }}
                    </v-btn>
                  </div>
                </div>

                <div v-if="collectionPoints.length > 0" class="d-flex flex-column ga-2 max-h-400 overflow-y-auto pr-1">
                  <v-card
                      v-for="point in collectionPoints"
                      :key="point.uuid"
                      border
                      class="pa-2 cursor-pointer transition-all hover-card"
                      :class="{'selected-border': selectedPoints.includes(point.uuid)}"
                      @click="togglePointSelection(point.uuid)">
                    <div class="d-flex align-center">
                      <v-checkbox-btn
                          :model-value="selectedPoints.includes(point.uuid)"
                          @click.stop="togglePointSelection(point.uuid)"
                          class="mr-2 flex-shrink-0">
                      </v-checkbox-btn>
                      <div class="flex-grow-1 min-width-0">
                        <div class="font-weight-bold text-body-2 singe-line">{{ point.title }}</div>
                        <div class="text-caption opacity-60 singe-line">
                          Lat: {{ point.latitude }} | Lng: {{ point.longitude }}
                        </div>
                      </div>
                    </div>
                  </v-card>
                </div>
                <div class="py-8 text-center" v-else>
                  <EmptyView></EmptyView>
                </div>
              </v-card>
            </v-col>

            <!-- 右侧：未分组/孤儿坐标池 -->
            <v-col cols="12" md="6">
              <v-card border rounded="lg" class="pa-3 h-100">
                <div class="d-flex align-center justify-space-between mb-3 pb-2 border-b">
                  <span class="font-weight-bold d-flex align-center text-body-2">
                    <v-icon size="18" class="mr-1">mdi-map-marker-outline</v-icon>
                    {{ t('map.availablePoints') }} ({{ orphanPoints.length }})
                  </span>

                  <div class="d-flex align-center ga-1">
                    <v-btn
                        v-if="orphanPoints.length > 0"
                        size="x-small"
                        variant="tonal"
                        @click="toggleSelectAll(orphanPoints)">
                      {{ orphanPoints.every(p => selectedPoints.includes(p.uuid)) ? t('map.deselectAll') : t('map.selectAll') }}
                    </v-btn>

                    <v-btn
                        size="x-small"
                        color="amber"
                        variant="tonal"
                        :disabled="!orphanPoints.some(p => selectedPoints.includes(p.uuid))"
                        @click="addSelectedPointsToCollection">
                      {{ t('map.add') || '加入图集' }}
                    </v-btn>
                  </div>
                </div>

                <!-- 搜索框 -->
                <v-text-field
                    v-model="searchQuery"
                    :placeholder="t('map.searchPoints') || '搜索未分组坐标...'"
                    density="compact"
                    variant="outlined"
                    hide-details
                    prepend-inner-icon="mdi-magnify"
                    class="mb-3"
                    @update:model-value="onSearchPoints">
                </v-text-field>

                <div v-if="orphanPoints.length > 0" class="d-flex flex-column ga-2 max-h-400 overflow-y-auto pr-1">
                  <v-card
                      v-for="point in orphanPoints"
                      :key="point.uuid"
                      border
                      class="pa-2 cursor-pointer transition-all hover-card"
                      :class="{'selected-border': selectedPoints.includes(point.uuid)}"
                      @click="togglePointSelection(point.uuid)">
                    <div class="d-flex align-center">
                      <v-checkbox-btn
                          :model-value="selectedPoints.includes(point.uuid)"
                          @click.stop="togglePointSelection(point.uuid)"
                          class="mr-2 flex-shrink-0">
                      </v-checkbox-btn>
                      <div class="flex-grow-1 min-width-0">
                        <div class="font-weight-bold text-body-2 singe-line">{{ point.title }}</div>
                        <div class="text-caption opacity-60 singe-line">
                          Lat: {{ point.latitude }} | Lng: {{ point.longitude }}
                        </div>
                      </div>
                    </div>
                  </v-card>
                </div>
                <div class="py-8 text-center" v-else>
                  <EmptyView></EmptyView>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- 坐标管理对话框 E -->

    <!-- 地图集编辑/新建对话框 S -->
    <v-dialog v-model="collectionFormModal" max-width="500">
      <v-card border rounded="lg">
        <v-card-title class="pa-4 font-weight-bold d-flex align-center border-b">
          <v-icon color="amber" class="mr-2">{{ editingCollection ? 'mdi-pencil' : 'mdi-plus-box' }}</v-icon>
          {{ editingCollection ? (t('map.editCollection') || '编辑地图集') : t('map.createCollection') }}
        </v-card-title>

        <v-card-text class="pa-4">
          <v-form ref="collectionFormRef">
            <v-text-field
                v-model="collectionForm.title"
                :label="t('map.collectionTitle')"
                variant="outlined"
                density="compact"
                class="mb-3"
                :rules="[v => !!v || '请输入标题']"
                required>
            </v-text-field>

            <v-textarea
                v-model="collectionForm.description"
                :label="t('map.collectionDescription')"
                variant="outlined"
                density="compact"
                rows="3"
                class="mb-3">
            </v-textarea>

            <v-select
                v-model="collectionForm.public"
                item-title="label"
                item-value="value"
                :items="[{value: 1, label: t('map.public') || '公开'}, {value: 0, label: t('map.private') || '私有'}]"
                :label="t('map.publicCollection')"
                variant="outlined"
                density="compact">
            </v-select>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="onResetCollectionForm">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-btn
              color="amber"
              variant="tonal"
              :loading="savingCollectionLoading"
              @click="onSaveCollection">
            {{ t('basic.button.submit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 地图集编辑/新建对话框 E -->

    <!-- 删除确认对话框 S -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card border rounded="lg">
        <v-card-title class="pa-4 text-h6 font-weight-bold text-error d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          {{ t('common.confirmDelete') }}
        </v-card-title>
        <v-card-text class="px-4 py-2">
          {{ deleteConfirmMessage }}
        </v-card-text>
        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteConfirm = false">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-btn color="error" variant="tonal" @click="executeDelete">
            {{ t('basic.button.submit') }}
          </v-btn>
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

.max-h-400 {
  max-height: 400px;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
