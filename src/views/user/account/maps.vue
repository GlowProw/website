<script setup lang="ts">
import {onMounted, Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {MapCollection, MapCollectionResult, MapPoint} from "@/assets/types/Map";
import {useMapApi} from "@/assets/sripts/api/map_service";
import {useNoticeStore} from "~/stores/noticeStore";
import {AxiosError} from "axios";
import {PaginationParams} from "@/assets/types";
import {ApiError} from "@/assets/types/Api";
import EmptyView from "@/components/EmptyView.vue";
import Time from "@/components/Time.vue";
import TimeView from "@/components/TimeView.vue";

const {t} = useI18n(),
    api = useMapApi(),
    notice = useNoticeStore()

let collectionLoading = ref(false),
    collectionFormRef = ref(null),
    collectionPagination: Ref<PaginationParams> = ref({
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
    pendingDeleteAction = ref(),

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

    const result = await api.getCollections(collectionPagination.value),
        d = result.data;

    userCollections.value = d;
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

  // 加载该地图集的坐标 和 孤儿坐标
  await Promise.all([
    loadCollectionPoints(collection.uuid),
    loadOrphanPoints()
  ])
}

/**
 * 加载地图集内的坐标
 * @param collectionUuid
 */
const loadCollectionPoints = async (collectionUuid: string) => {
  try {
    const result = await api.getUserPoints({
          collectionUuid,
          page: pointPagination.value.page,
          pageSize: pointPagination.value.pageSize
        }),
        d = result.data;

    collectionPoints.value = d.points || [];
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  }
}

/**
 * 加载孤儿坐标（没有地图集的坐标）
 */
const loadOrphanPoints = async () => {
  try {
    const result = await api.getOrphanPoints({
          page: orphanPointPagination.value.page,
          pageSize: orphanPointPagination.value.pageSize
        }),
        d = result.data;

    orphanPoints.value = d.points || [];
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
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
        }),
        d = result.data;

    // 前端过滤搜索结果
    orphanPoints.value = (d.points || []).filter(point =>
        point.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        point.description?.toLowerCase().includes(searchQuery.value.toLowerCase()))

  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  }
}

/**
 * 选择/取消选择坐标
 * @param pointId
 */
const togglePointSelection = (pointId: string) => {
  const index = selectedPoints.value.indexOf(pointId)
  if (index > -1) {
    selectedPoints.value.splice(index, 1)
  } else {
    selectedPoints.value.push(pointId)
  }
}

/**
 * 全选/取消全选当前页坐标
 */
const toggleSelectAll = (points: MapPoint[]) => {
  const allSelected = points.every(point => selectedPoints.value.includes(point.uuid))

  if (allSelected) {
    // 取消全选
    selectedPoints.value = selectedPoints.value.filter(uuid =>
        !points.some(point => point.uuid === uuid))

  } else {
    // 全选
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

    // 重新加载数据
    await Promise.all([
      loadCollectionPoints(selectedCollection.value.uuid),
      loadOrphanPoints()
    ])

    // 清空选择
    selectedPoints.value = [];

    notice.success(t(`basic.tips.map.success`))
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
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

    // 重新加载数据
    await Promise.all([
      loadCollectionPoints(selectedCollection.value.uuid),
      loadOrphanPoints()
    ])

    // 清空选择
    selectedPoints.value = [];

    notice.success(t(`basic.tips.map.success`))
  } catch (e) {
    if (e instanceof AxiosError && e.response)
      notice.error(t(`basic.tips.${e.response.data.code}`, {
        content: e.response.data.message
      }), {
        color: 'red'
      })
    else if (e instanceof AxiosError)
      notice.error(t(`basic.tips.error`, {
        content: e.toString()
      }), {
        color: 'red'
      })
    console.error(e)
  }
}

/**
 * 删除选中坐标
 */
const deleteSelectedPoints = async () => {
  if (selectedPoints.value.length === 0) return;

  try {
    // 批量删除坐标
    for (const pointId of selectedPoints.value) {
      await api.deletePoint(pointId)
    }

    // 重新加载数据
    if (selectedCollection.value) {
      await loadCollectionPoints(selectedCollection.value.uuid)
    }
    await loadOrphanPoints()

    // 清空选择
    selectedPoints.value = [];

    notice.success(t(`basic.tips.map.success`))
  } catch (e) {
    if (e instanceof AxiosError)
      notice.error(t(`basic.tips.${e.response.data.code}`, {
        content: e.response.data.message
      }), {
        color: 'red'
      })
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
      // 更新地图集
      await api.updateCollection(collectionForm.value.uuid, {
        title: collectionForm.value.title,
        description: collectionForm.value.description,
        public: collectionForm.value.public,
        sharedUsers: collectionForm.value.sharedUsers
      })
    } else {
      // 创建新地图集
      await api.createCollection({
        title: collectionForm.value.title,
        description: collectionForm.value.description,
        public: collectionForm.value.public,
        sharedUsers: collectionForm.value.sharedUsers
      })
    }

    // 重新加载地图集列表
    await getMyCollectionsData()

    // 重置表单
    onResetCollectionForm()

    notice.success(t(`basic.tips.map.success`))
  } catch (e) {
    if (e instanceof AxiosError && e.response)
      notice.error(t(`basic.tips.${e.response.data.code}`, {
        content: e.response.data.message
      }), {
        color: 'red'
      })
    else if (e instanceof AxiosError)
      notice.error(t(`basic.tips.error`, {
        content: e.toString()
      }), {
        color: 'red'
      })
    console.error(e)
  } finally {
    savingCollectionLoading.value = false;
  }
};

/**
 * 创建地图集
 */
const onCreatedCollection = (): void => {
  onResetCollectionForm()
  collectionFormModal.value = true;
};

/**
 * 编辑地图集
 */
const editCollection = (collection: MapCollection): void => {
  collectionForm.value = {
    id: collection.id,
    uuid: collection.uuid,
    title: collection.title,
    description: collection.description || '',
    public: collection.public,
    sharedUsers: collection.sharedUsers || [],
  };
  editingCollection.value = true;
  collectionFormModal.value = true;
};

/**
 * 重置地图集表单
 */
const onResetCollectionForm = (): void => {
  collectionForm.value = {
    id: '',
    uuid: '',
    title: '',
    description: '',
    public: 1,
    sharedUsers: []
  };
  editingCollection.value = false;
  collectionFormModal.value = false;
};

//
// /**
//  * 更新标记
//  */
// const onUpdateMarker = async (): Promise<void> => {
//   if (!markerFormRef.value || !newMarkerData.value.id) return;
//
//   const {valid} = await markerFormRef.value.validate(
//   if (!valid) return;
//
//   updatingMarker.value = true;
//
//   try {
//     const updatedPoint = await updatePoint(newMarkerData.value.uuid, {
//       title: newMarkerData.value.title,
//       description: newMarkerData.value.description,
//       latitude: newMarkerData.value.latitude,
//       longitude: newMarkerData.value.longitude,
//       address: newMarkerData.value.address,
//       tags: newMarkerData.value.tags,
//       isPublic: newMarkerData.value.isPublic,
//       sharedUsers: newMarkerData.value.sharedUsers
//     }
//
//     // 重新加载当前地图集的坐标点
//     if (selectedCollectionUuid.value) {
//       await loadCollectionPoints(selectedCollectionUuid.value
//     }
//
//     // 关闭对话框并重置数据
//     showCreateMarkerDialog.value = false;
//     onResetNewMarkerData(
//     selectedPoint.value = null;
//
//   } catch (error) {
//     console.error('更新标记失败:', error
//   } finally {
//     updatingMarker.value = false;
//   }
// };

/**
 * 确认删除地图集
 */
const confirmDeleteCollection = (collection: MapCollection): void => {
  deleteConfirmMessage.value = t('map.confirmDeleteCollection', {title: collection.title})
  pendingDeleteAction.value = async () => {
    await api.deleteCollection(collection.uuid)
    await getMyCollectionsData()
  };
  showDeleteConfirm.value = true;
};

/**
 * 执行删除操作
 */
const executeDelete = async (): Promise<void> => {
  if (pendingDeleteAction.value) {
    await pendingDeleteAction.value()
    pendingDeleteAction.value = null;
  }
  showDeleteConfirm.value = false
};
</script>

<template>
  <div class="position-relative">
    <v-overlay v-model="collectionLoading" contained>
      <Loading></Loading>
    </v-overlay>

    <v-row class="mb-2">
      <v-spacer></v-spacer>
      <v-col cols="auto" class="d-flex ga-2">
        <v-btn class="bg-amber" @click="onCreatedCollection">
          创建地图集
        </v-btn>
        <v-btn @click="getMyCollectionsData">
          <v-icon icon="mdi-refresh" :class="[collectionLoading ? 'spin-icon-load' : '']"></v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <v-list border rounded lines="one" v-if="userCollections && userCollections.data.length > 0">
      <v-list-item v-for="(collection,index) in userCollections.data" :key="index">
        <template v-slot:prepend>
          <v-icon size="38">mdi-folder</v-icon>
        </template>
        <v-list-item-title>{{ collection.title }}</v-list-item-title>
        <v-list-item-subtitle>
          <div class="d-flex text-caption opacity-60">
            <v-icon>mdi-identifier</v-icon>
            <p class="ml-2">{{ collection.description || collection.uuid }}</p>
          </div>
        </v-list-item-subtitle>

        <template v-slot:append>
          <div class="d-flex ga-2">
            <v-btn class="h-100 px-8" elevation="0" tile @click="openPointManager(collection)"
                   icon="mdi-map-marker-multiple"></v-btn>
            <v-btn class="h-100 px-8" elevation="0" tile @click="editCollection(collection)"
                   icon="mdi-pencil"></v-btn>
            <v-btn class="h-100 px-8" elevation="0" tile @click="confirmDeleteCollection(collection)"
                   icon="mdi-delete"></v-btn>
          </div>
        </template>
      </v-list-item>
    </v-list>
    <div class="text-center" v-else>
      <EmptyView></EmptyView>
    </div>

    <!-- 分页 S-->
    <v-pagination
        v-if="userCollections.pagination"
        v-model="collectionPagination.page"
        :length="userCollections.pagination?.totalPages || 0"
        @update:model-value="getMyCollectionsData"
        class="mt-8"
    ></v-pagination>
    <!-- 分页 E-->

    <!-- 坐标管理对话框 S -->
    <v-dialog v-model="showPointManager" max-width="1200">
      <v-card border v-if="selectedCollection" class="point-manager-dialog">
        <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 create-collectio-card">
          <v-icon size="80">mdi-map-marker-multiple</v-icon>
          <p>{{ selectedCollection.title }}</p>
        </v-card-title>
        <template v-slot:append>
          <v-btn variant="tonal" icon @click="showPointManager = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>

        <v-card-text>
          <v-row>
            <!-- 地图集内坐标 -->
            <v-col>
              <div class="d-flex align-center mb-3">
                <v-icon icon="mdi-map-marker" class="mr-2"></v-icon>
                地图集内坐标
                <v-spacer></v-spacer>
                <v-btn
                    v-if="collectionPoints.length > 0"
                    @click="toggleSelectAll(collectionPoints)"
                    variant="text"
                    size="small">
                  {{ collectionPoints.every(p => selectedPoints.includes(p.uuid)) ? '取消全选' : '全选' }}
                </v-btn>
              </div>

              <v-card border class="h-100">
                <v-list>
                  <v-list-item
                      v-for="(point, index) in collectionPoints"
                      :key="index"
                      @click="togglePointSelection(point.uuid)">
                    <template v-slot:prepend>
                      <v-checkbox
                          :model-value="selectedPoints.includes(point.uuid)"
                          hide-details
                          class="mr-2"
                      ></v-checkbox>
                    </template>
                    <v-list-item-title>{{ point.title }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ point.description || '无描述' }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-card variant="text" min-width="250">
                        <v-row align="center">
                          <v-col cols="6">
                            <v-text-field
                                :value="point.latitude"
                                :disabled="userCollections.data.length <= 0"
                                :label="t('map.longitude')"
                                active
                                hide-details
                                density="compact"
                                variant="outlined"
                                readonly></v-text-field>
                          </v-col>

                          <v-col cols="6">
                            <v-text-field
                                :value="point.longitude"
                                :disabled="userCollections.data.length <= 0"
                                :label="t('map.latitude')"
                                active
                                hide-details
                                density="compact"
                                variant="outlined"
                                readonly></v-text-field>
                          </v-col>
                        </v-row>
                      </v-card>
                    </template>
                  </v-list-item>
                  <v-list-item v-if="collectionPoints.length === 0">
                    <EmptyView></EmptyView>
                  </v-list-item>
                </v-list>
              </v-card>

              <v-row class="my-3">
                <v-col>
                  <v-btn
                      @click="deleteSelectedPoints"
                      :disabled="selectedPoints.length === 0"
                      color="error"
                      variant="tonal">
                    删除坐标
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="auto" class="d-flex flex-column justify-center ga-2">
              <v-btn
                  border
                  @click="addSelectedPointsToCollection"
                  :disabled="selectedPoints.length === 0"
                  variant="flat">
                <v-icon>mdi-chevron-double-left</v-icon>
              </v-btn>
              <v-btn
                  border
                  @click="onRemoveSelectedPointsFromCollection"
                  :disabled="selectedPoints.length === 0"
                  variant="flat">
                <v-icon>mdi-chevron-double-right</v-icon>
              </v-btn>
            </v-col>

            <!-- 可添加的坐标 -->
            <v-col>
              <div class="d-flex align-center mb-3">
                <v-icon icon="mdi-map-marker-plus" class="mr-2"></v-icon>
                可添加的坐标
                <v-spacer></v-spacer>
                <v-btn
                    @click="toggleSelectAll(orphanPoints)"
                    variant="text"
                    size="small">
                  {{ orphanPoints.every(p => selectedPoints.includes(p.uuid)) ? '取消全选' : '全选' }}
                </v-btn>
              </div>

              <v-card border class="h-100">
                <v-card-title class="w-100">
                  <v-text-field
                      v-model="searchQuery"
                      @input="onSearchPoints"
                      placeholder="搜索坐标..."
                      density="compact"
                      hide-details
                      class="search-field"
                  ></v-text-field>
                </v-card-title>

                <v-list>
                  <v-list-item
                      v-for="(point, index) in orphanPoints"
                      :key="index"
                      @click="togglePointSelection(point.uuid)">
                    <template v-slot:prepend>
                      <v-checkbox
                          :model-value="selectedPoints.includes(point.uuid)"
                          hide-details
                          class="mr-2"
                      ></v-checkbox>
                    </template>
                    <v-list-item-title>{{ point.title }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ point.description || '无描述' }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-card variant="text" min-width="250">
                        <v-row align="center">
                          <v-col cols="6">
                            <v-text-field
                                :value="point.latitude"
                                :disabled="userCollections.data.length <= 0"
                                :label="t('map.longitude')"
                                active
                                hide-details
                                density="compact"
                                variant="outlined"
                                readonly></v-text-field>
                          </v-col>

                          <v-col cols="6">
                            <v-text-field
                                :value="point.longitude"
                                :disabled="userCollections.data.length <= 0"
                                :label="t('map.latitude')"
                                active
                                hide-details
                                density="compact"
                                variant="outlined"
                                readonly></v-text-field>
                          </v-col>
                        </v-row>
                      </v-card>
                    </template>
                  </v-list-item>
                  <v-list-item v-if="orphanPoints.length === 0">
                    <EmptyView></EmptyView>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- 坐标管理对话框 E -->

    <!-- 地图集管理对话框 S -->
    <v-dialog v-model="collectionFormModal" max-width="500">
      <v-card border elevation="12">
        <v-card-title class="d-flex py-10 ga-2 justify-center align-center bg-black mb-4 mx-n5 create-collectio-card">
          <v-icon size="80">mdi-map-marker-multiple</v-icon>
          <v-icon size="30">mdi-plus</v-icon>
          <v-icon size="80">mdi-rename</v-icon>
        </v-card-title>
        <template v-slot:append>
          <v-btn variant="tonal" icon @click="onResetCollectionForm">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>

        <v-card-text>
          <v-form ref="collectionFormRef" class="mt-4">
            <v-text-field
                v-model="collectionForm.title"
                :label="t('map.collectionTitle')"
                variant="outlined"
                required></v-text-field>

            <v-textarea
                v-model="collectionForm.description"
                :label="t('map.collectionDescription')"
                variant="outlined"
                rows="3"></v-textarea>

            <v-combobox
                v-model="collectionForm.sharedUsers"
                :label="t('map.sharedUsers')"
                :items="[]"
                multiple
                chips
                variant="outlined"
                :hint="t('map.sharedUsersHint')"></v-combobox>

            <v-select
                item-title="label"
                item-value="value"
                v-model="collectionForm.public"
                :items="[{value: 0, label: 'off'},{value: 1, label: 'on'}]"
                :label="t('map.publicCollection')">
            </v-select>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="onResetCollectionForm" variant="text">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-btn
              @click="onSaveCollection"
              :loading="savingCollectionLoading"
              class="bg-amber"
              variant="flat">
            {{ editingCollection ? t('basic.button.submit') : t('basic.button.submit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 地图集管理对话框 E -->

    <!-- 删除确认对话框 S -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-container>
        <v-card>
          <v-card-title class="text-h6">
            {{ t('common.confirmDelete') }}
          </v-card-title>
          <v-card-text>
            {{ deleteConfirmMessage }}
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="showDeleteConfirm = false" variant="text">
              {{ t('basic.button.cancel') }}
            </v-btn>
            <v-btn @click="executeDelete" color="error" variant="flat">
              {{ t('basic.button.submit') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-dialog>
    <!-- 删除确认对话框 E -->
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/icon";

.create-collectio-card {
  margin-top: -80px !important;
}

.point-manager-dialog {
}

.v-list-item {
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 4px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
}
</style>
