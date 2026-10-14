<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Apis, type MediaItem} from "@/assets/sripts/api";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";

import AffixContainerView from "@/components/AffixContainerView.vue";
import QuotaLimitWidget from "@/components/QuotaLimitWidget.vue";
import Loading from "@/components/Loading.vue";
import EmptyView from "@/components/EmptyView.vue";
import PaginationBar from "@/components/PaginationBar.vue";
import TimeView from "@/components/TimeView.vue";
import HtmlLink from "@/components/HtmlLink.vue";

const {t} = useI18n();
const notice = useNoticeStore();
const mediaApi = Apis.mediaApi();

const loading = ref(false);
const uploading = ref(false);
const list = ref<MediaItem[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = 12;
const searchKeyword = ref('');

// 重新上传相关
const reuploadingId = ref<string | null>(null);
const reuploadDialog = ref(false);
const reuploadTargetItem = ref<MediaItem | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const reuploadInputRef = ref<HTMLInputElement | null>(null);
const previewDialog = ref(false);
const previewItem = ref<MediaItem | null>(null);

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize) || 1);

// 单文件上限 340KB（与后端 media.maxSizeBytes 保持一致）
const MAX_FILE_SIZE = 340 * 1024;
// 图床总容量熔断状态：用量达到 9.8GB 安全阈值后停用全部上传
const storageDisabled = ref(false);

onMounted(() => {
  loadList();
  loadStoragePoolStatus();
});

/**
 * 拉取图床总容量熔断标志（媒体配额接口附带返回）
 */
const loadStoragePoolStatus = async () => {
  try {
    const quota = await mediaApi.getMediaQuota();
    storageDisabled.value = !!quota?.storagePool?.uploadDisabled;
  } catch {
    // 熔断状态拉取失败不阻断页面，真正上传时后端仍会拦截
    storageDisabled.value = false;
  }
};

const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

/**
 * 加载媒体列表
 */
const loadList = async () => {
  try {
    loading.value = true;
    const res = await mediaApi.getMediaList({
      page: currentPage.value,
      pageSize,
      keyword: searchKeyword.value,
    });
    list.value = Array.isArray(res?.data) ? res.data : [];
    totalCount.value = res?.pagination?.totalCount || 0;
  } catch (e) {
    handleApiError(e, notice, t, {component: 'AccountMedia'});
  } finally {
    loading.value = false;
  }
};

/**
 * 触发本地文件上传 (只有直传)
 */
const triggerUpload = () => {
  if (storageDisabled.value) {
    notice.error(t('account.media.storageDisabled'));
    return;
  }
  fileInputRef.value?.click();
};

/**
 * 处理选择文件上传 (直传)
 */
const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  target.value = '';

  if (file.size > MAX_FILE_SIZE) {
    notice.error(t('account.media.fileTooLarge'));
    return;
  }

  const validTypes = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    notice.error(t('account.media.unsupportedFormat'));
    return;
  }

  try {
    uploading.value = true;
    await mediaApi.uploadMedia(file);
    notice.success(t('account.media.uploadSuccess'), {mode: 'minimal'});
    await loadList();
  } catch (e: any) {
    notice.error(e?.message || t('account.media.uploadFailed'));
  } finally {
    uploading.value = false;
  }
};

/**
 * 触发重新上传：弹出确认提示框（展示已覆盖与剩余次数及覆盖警告）
 */
const triggerReupload = (item: MediaItem) => {
  if (item.reuploadCount >= 10) {
    notice.error(t('account.media.reuploadMax'));
    return;
  }
  reuploadTargetItem.value = item;
  reuploadDialog.value = true;
};

/**
 * 用户在弹窗确认覆盖后，触发文件选择
 */
const confirmReupload = () => {
  if (!reuploadTargetItem.value) return;
  reuploadingId.value = reuploadTargetItem.value.id;
  reuploadDialog.value = false;
  reuploadInputRef.value?.click();
};

/**
 * 处理重新上传文件选择
 */
const onReuploadSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  const targetId = reuploadingId.value;
  target.value = '';

  if (!file || !targetId) return;

  if (file.size > MAX_FILE_SIZE) {
    notice.error(t('account.media.fileTooLarge'));
    return;
  }

  try {
    uploading.value = true;
    await mediaApi.reuploadMedia(targetId, file);
    notice.success(t('account.media.reuploadSuccess'), {mode: 'minimal'});
    await loadList();
  } catch (e: any) {
    notice.error(e?.message || t('account.media.reuploadFailed'));
  } finally {
    uploading.value = false;
    reuploadingId.value = null;
  }
};

/**
 * 复制 URL
 */
const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    notice.success(t('account.media.copySuccess'), {mode: 'minimal'});
  } catch {
    notice.warning(t('account.media.copyFailed'));
  }
};

/**
 * 软删除媒体
 */
const removeMedia = async (item: MediaItem) => {
  if (!confirm(t('account.media.deleteConfirm', {filename: item.filename}))) return;
  try {
    await mediaApi.deleteMedia(item.id);
    notice.success(t('account.media.deleteSuccess'), {mode: 'minimal'});
    await loadList();
  } catch (e: any) {
    notice.error(e?.message || t('account.media.deleteFailed'));
  }
};

/**
 * 预览大图
 */
const openPreview = (item: MediaItem) => {
  previewItem.value = item;
  previewDialog.value = true;
};

defineOptions({
  name: 'AccountMedia',
});
</script>

<template>
  <div class="position-relative media-page-root">
    <AffixContainerView>
      <v-card class="mb-4 pa-2">
        <div class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div class="d-flex align-center">
            <div class="d-flex align-center flex-wrap ga-2">
              <div>
                <v-text-field
                    v-model="searchKeyword"
                    min-width="260px"
                    :placeholder="t('account.media.searchPlaceholder')"
                    prepend-inner-icon="mdi-magnify"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    @keyup.enter="() => { currentPage = 1; loadList(); }"
                    @click:clear="() => { currentPage = 1; loadList(); }"></v-text-field>
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ t('account.media.totalItems', {total: totalCount}) }}
              </div>
            </div>
          </div>

          <div class="d-flex align-center ga-2">
            <input
                ref="fileInputRef"
                type="file"
                accept=".webp,.png,.jpg,.jpeg"
                style="display: none"
                @change="onFileSelected"/>
            <input
                ref="reuploadInputRef"
                type="file"
                accept=".webp,.png,.jpg,.jpeg"
                style="display: none"
                @change="onReuploadSelected"/>

            <!-- 配额与容量复用 QuotaLimitWidget -->
            <QuotaLimitWidget resource="media" text></QuotaLimitWidget>

            <!-- 仅直传上传按钮 -->
            <v-btn
                color="amber"
                variant="flat"
                prepend-icon="mdi-cloud-upload-outline"
                :loading="uploading"
                :disabled="storageDisabled"
                @click="triggerUpload">
              {{ t('account.media.upload') }}
            </v-btn>

            <v-btn
                icon="mdi-refresh"
                size="small"
                variant="tonal"
                :loading="loading"
                @click="loadList"
            ></v-btn>
          </div>
        </div>
      </v-card>
    </AffixContainerView>

    <!-- 图床容量熔断提示 -->
    <v-alert
        v-if="storageDisabled"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4"
        icon="mdi-cloud-off-outline"
        :title="t('account.media.storageDisabled')"
        :text="t('account.media.storageDisabledDesc')"
        closable></v-alert>


    <!-- 加载状态 -->
    <Loading v-if="loading && list.length === 0"/>

    <!-- 空列表 -->
    <EmptyView v-else-if="list.length === 0">
      <template #title>
        <h3>{{ t('account.media.emptyTitle') }}</h3>
      </template>
      <template #description>
        <p>{{ t('account.media.emptyDesc') }}</p>
      </template>
    </EmptyView>

    <!-- 媒体网格卡片 -->
    <v-row v-else dense>
      <v-col
          v-for="item in list"
          :key="item.id"
          cols="12"
          sm="6"
          md="4"
          lg="3">
        <v-card border rounded="lg" class="media-card bg-grey-darken-4 h-100 d-flex flex-column">
          <!-- 缩略图区域 -->
          <div
              class="media-thumb-wrapper cursor-pointer bg-black position-relative"
              @click="openPreview(item)">
            <v-img
                :src="item.url"
                height="160"
                cover
                class="rounded-t-lg">
              <template #placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <Loading size="24"></Loading>
                </div>
              </template>
              <template #error>
                <div class="d-flex flex-column align-center justify-center fill-height text-medium-emphasis">
                  <v-icon size="32">mdi-image-broken</v-icon>
                  <span class="text-caption mt-1">{{ t('account.media.loadFailed') }}</span>
                </div>
              </template>
            </v-img>

            <div class="media-badge position-absolute d-flex align-center">
              <v-chip size="x-small" color="black" variant="flat" class="text-caption text-white">
                {{ item.ext?.toUpperCase() }} · {{ formatBytes(item.size) }}
              </v-chip>
            </div>
          </div>

          <!-- 信息区域 -->
          <v-card-text class="pa-3 flex-grow-1">
            <div class="font-weight-medium text-truncate mb-1" :title="item.filename">
              {{ item.filename }}
            </div>
            <div class="d-flex align-center justify-space-between text-caption text-medium-emphasis">
              <TimeView :time="item.createdTime"></TimeView>
              <span :class="item.reuploadCount >= 10 ? 'text-error' : ''">
                {{ t('account.media.coverage', {used: item.reuploadCount}) }}
              </span>
            </div>
          </v-card-text>

          <v-divider></v-divider>

          <!-- 操作按钮区域 -->
          <v-card-actions class="pa-2 d-flex justify-space-between">
            <div>
              <v-btn
                  size="x-small"
                  variant="text"
                  icon="mdi-link-variant"
                  :title="t('account.media.copyUrl')"
                  @click="copyUrl(item.url)"
              ></v-btn>
            </div>

            <div>
              <v-btn
                  size="x-small"
                  variant="text"
                  icon="mdi-cached"
                  color="amber"
                  :title="t('account.media.reuploadLimitTooltip')"
                  :disabled="item.reuploadCount >= 10"
                  @click="triggerReupload(item)"
              ></v-btn>
              <v-btn
                  size="x-small"
                  variant="text"
                  icon="mdi-delete-outline"
                  color="error"
                  :title="t('account.media.delete')"
                  @click="removeMedia(item)"
              ></v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 分页组件 -->
    <div v-if="totalPages > 1" class="mt-6 d-flex justify-center">
      <PaginationBar
          v-model:page="currentPage"
          :total-pages="totalPages"
          @change="loadList"/>
    </div>

    <!-- 预览大图弹窗 -->
    <v-dialog v-model="previewDialog" max-width="1024">
      <v-card v-if="previewItem" class="bg-grey-darken-4 pa-4" border rounded="lg">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="font-weight-bold text-truncate" style="max-width: 600px">
            {{ previewItem.filename }}
          </span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="previewDialog = false"></v-btn>
        </div>

        <div class="text-center bg-black rounded mb-3">
          <v-img :src="previewItem.url" max-height="500" contain></v-img>
        </div>

        <div class="font-mono">
          <v-row align="center">
            <v-col cols="auto">
              {{ t('account.media.preview.directUrl') }}
            </v-col>
            <v-col>
              <v-divider></v-divider>
            </v-col>
            <v-col cols="6" class="singe-line">
              <HtmlLink :href="previewItem.url" target="_blank">
                {{ previewItem.url }}
              </HtmlLink>
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col cols="auto">
              {{ t('account.media.preview.fileSize') }}
            </v-col>
            <v-col>
              <v-divider></v-divider>
            </v-col>
            <v-col cols="auto">
              {{ formatBytes(previewItem.size) }} ({{ previewItem.mimeType }})
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col cols="auto">
              {{ t('account.media.preview.uploadTime') }}
            </v-col>
            <v-col>
              <v-divider></v-divider>
            </v-col>
            <v-col cols="auto">
              <TimeView :time="previewItem.createdTime" />
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col cols="auto">
              {{ t('account.media.preview.reuploadCount') }}
            </v-col>
            <v-col>
              <v-divider></v-divider>
            </v-col>
            <v-col cols="auto">
              {{ previewItem.reuploadCount }}
            </v-col>
          </v-row>
        </div>

        <v-card-actions class="mt-2 pa-0">
          <v-spacer></v-spacer>
          <v-btn color="amber" variant="flat" @click="copyUrl(previewItem.url)">
            {{ t('account.media.preview.copyUrl') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 重新上传覆盖确认弹窗 -->
    <v-dialog v-model="reuploadDialog" width="800">
      <v-card v-if="reuploadTargetItem" border rounded="lg" class="bg-grey-darken-4">
        <v-card-title class="d-flex align-center ga-2 text-subtitle-1 font-weight-bold py-4">
          <v-icon color="warning">mdi-cloud-sync-outline</v-icon>
          <span>{{ t('account.media.reuploadConfirmTitle') }}</span>
        </v-card-title>
        <div class="py-3 px-4">
          <div class="text-body-2 text-medium-emphasis mb-3">
            {{ t('account.media.reuploadConfirmDesc') }}
          </div>

          <v-alert density="compact" variant="tonal" color="warning" icon="mdi-alert-circle-outline" class="mb-1 text-caption">
            <div>{{ t('account.media.reuploadUsed', { used: reuploadTargetItem.reuploadCount }) }}</div>
            <div class="font-weight-bold mt-1">
              {{ t('account.media.reuploadRemaining', { remaining: Math.max(0, 10 - reuploadTargetItem.reuploadCount) }) }}
            </div>
          </v-alert>
        </div>
        <v-card-actions class="pt-2">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="reuploadDialog = false">
            {{ t('basic.button.cancel') }}
          </v-btn>
          <v-btn color="warning" variant="flat" @click="confirmReupload">
            {{ t('account.media.reuploadConfirmBtn') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.media-thumb-wrapper {
  overflow: hidden;
}

.media-badge {
  top: 8px;
  right: 8px;
}

.cursor-pointer {
  cursor: pointer;
}

.font-mono {
  font-family: monospace;
}
</style>
