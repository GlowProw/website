<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {Editor} from "@tiptap/vue-3";
import {useI18n} from "vue-i18n";
import {Apis, type MediaItem} from "@/assets/sripts/api";
import {useAuthStore} from "~/stores/userAccountStore";
import {useNoticeStore} from "~/stores/noticeStore";
import Loading from "@/components/Loading.vue";

const props = defineProps({
  editor: {
    type: Editor,
  },
});

const {t} = useI18n();
const emit = defineEmits(['finish', 'close']);
const authStore = useAuthStore();
const notice = useNoticeStore();
const mediaApi = Apis.mediaApi();

const show = ref(false);
const activeTab = ref<'media' | 'local' | 'url'>('media');
const data = ref({
  src: '',
});

// 本地上传相关
const uploading = ref(false);
const uploadProgress = ref(0);
const fileInputRef = ref<HTMLInputElement | null>(null);

// 单文件上限（从媒体配额接口动态获取；null 表示不限）
const maxFileSize = ref<number | null>(null);

/**
 * 惰性拉取媒体配额与单文件上限（仅在弹窗打开或准备上传时触发）
 */
const ensureQuota = async () => {
  if (!authStore.isLogin || maxFileSize.value !== null) return;
  try {
    const quota = await mediaApi.getMediaQuota();
    maxFileSize.value = quota?.storage?.maxFileSize ?? null;
  } catch {
    // 拉取失败时不拦截，真正上传时后端仍会校验
  }
};

// 媒体库选择相关
const selectedMediaId = ref<string | null>(null);
const mediaLoading = ref(false);
const mediaList = ref<MediaItem[]>([]);
const mediaTotalCount = ref(0);
const mediaPage = ref(1);
const mediaPageSize = 12;
const selectedTypeFilter = ref<'all' | 'webp' | 'png' | 'jpg'>('all');
const mediaSearch = ref('');

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const mediaTotalPages = computed(() => Math.ceil(mediaTotalCount.value / mediaPageSize) || 1);

const filteredMediaList = computed(() => {
  return mediaList.value.filter((item) => {
    // 扩展名过滤
    if (selectedTypeFilter.value !== 'all') {
      const ext = (item.ext || '').toLowerCase();
      if (selectedTypeFilter.value === 'jpg') {
        if (ext !== 'jpg' && ext !== 'jpeg') return false;
      } else if (ext !== selectedTypeFilter.value) {
        return false;
      }
    }
    // 关键字过滤
    if (mediaSearch.value.trim()) {
      const kw = mediaSearch.value.trim().toLowerCase();
      if (!item.filename.toLowerCase().includes(kw) && !item.id.toLowerCase().includes(kw)) {
        return false;
      }
    }
    return true;
  });
});

/**
 * 加载用户媒体库列表
 */
const loadMediaList = async (page = 1) => {
  if (!authStore.isLogin) return;
  try {
    mediaLoading.value = true;
    mediaPage.value = page;
    const res = await mediaApi.getMediaList({
      page,
      pageSize: mediaPageSize,
      keyword: mediaSearch.value.trim() || undefined,
    });
    mediaList.value = Array.isArray(res?.data) ? res.data : [];
    mediaTotalCount.value = res?.pagination?.totalCount || 0;
  } catch (err: any) {
    notice.error(err?.message || '加载媒体库失败');
  } finally {
    mediaLoading.value = false;
  }
};

/**
 * 选中媒体项
 */
const selectMediaItem = (item: MediaItem) => {
  selectedMediaId.value = item.id;
  data.value.src = item.url;
};

/**
 * 双击媒体项直接插入
 */
const onMediaItemDblClick = (item: MediaItem) => {
  selectMediaItem(item);
  onFinish();
};

watch(activeTab, (newTab) => {
  if (newTab === 'media' && authStore.isLogin && mediaList.value.length === 0) {
    loadMediaList(1);
  }
});

/**
 * 触发本地文件选择
 */
const triggerFileInput = () => {
  if (!authStore.isLogin) {
    notice.warning('请先登录账号后再使用本地图片上传功能');
    return;
  }
  ensureQuota();
  fileInputRef.value?.click();
};

/**
 * 处理选择文件上传 (直传)
 * @param eventOrFile 事件或文件对象
 */
const onFileSelected = async (eventOrFile: any) => {
  let file: File | undefined;
  if (eventOrFile instanceof Event) {
    const target = eventOrFile.target as HTMLInputElement;
    file = target?.files?.[0];
    if (target) target.value = '';
  } else if (Array.isArray(eventOrFile)) {
    file = eventOrFile[0];
  } else if (eventOrFile instanceof File) {
    file = eventOrFile;
  }
  if (!file) return;

  // 校验大小（随贡献者等级与重复订阅升级动态变化）
  if (maxFileSize.value !== null && file.size > maxFileSize.value) {
    notice.error('文件体积过大，超过当前单文件上传上限');
    return;
  }

  // 2. 校验格式 (webp, png, jpg)
  const validTypes = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    notice.error('不支持的格式，仅允许上传 webp, png, jpg 格式图片');
    return;
  }

  try {
    uploading.value = true;
    uploadProgress.value = 30;
    const res = await mediaApi.uploadMedia(file);
    uploadProgress.value = 100;
    data.value.src = res.url;
    notice.success('本地图片上传成功！');
    // 上传完毕自动插入到编辑器正文
    onFinish();
  } catch (e: any) {
    notice.error(e?.message || '图片上传失败，请检查配额或稍后重试');
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
};

/**
 * 完成插入图片
 */
const onFinish = () => {
  const src = (data.value.src || '').trim();
  if (!src) {
    notice.warning('请先选择或上传图片，或填入有效的图片地址');
    return;
  }
  onPanelToggle();
  emit('finish', src);
};

/**
 * 打开面板
 */
const openPanel = (src?: string) => {
  onPanelToggle();
  ensureQuota();
  data.value.src = src || '';
  selectedMediaId.value = null;
  if (src) {
    activeTab.value = 'url';
  } else if (authStore.isLogin) {
    activeTab.value = 'media';
    loadMediaList(1);
  } else {
    activeTab.value = 'local';
  }
};

/**
 * 面板开关
 */
const onPanelToggle = () => {
  show.value = !show.value;
  if (!show.value) {
    emit('close');
  }
};

const onClose = () => {
  onPanelToggle();
  emit('close');
};

defineExpose({
  openPanel,
  onPanelToggle,
  onClose,
});

defineOptions({
  name: 'ImgView',
});
</script>

<template>
  <v-dialog
      v-model="show"
      class="link"
      :width="680"
      :transitionNames="['fade']"
      @update:model-value="(status) => !status ? $emit('close') : null">
    <v-card border rounded="lg" class="bg-grey-darken-4">
      <v-card-title class="py-10 text-center bg-black rounded-lg ma-2">
        <v-icon size="80">mdi-image-plus-outline</v-icon>
      </v-card-title>

      <v-tabs v-model="activeTab" color="amber">
        <v-tab value="media">
          <v-icon size="18" class="mr-1">mdi-image-multiple-outline</v-icon>
          {{ t('account.media.selectFromMedia') }}
        </v-tab>
        <v-tab value="local">
          <v-icon size="18" class="mr-1">mdi-cloud-upload-outline</v-icon>
          从本地上传
        </v-tab>
        <v-tab value="url">
          <v-icon size="18" class="mr-1">mdi-link-variant</v-icon>
          网络图片直链
        </v-tab>
      </v-tabs>
      <v-divider></v-divider>


      <v-card-text class="px-6 py-4">
        <!-- 从媒体库选择面板 -->
        <div v-if="activeTab === 'media'">
          <div v-if="!authStore.isLogin" class="text-center py-8">
            <v-icon size="48" color="medium-emphasis" class="mb-2">mdi-account-lock-outline</v-icon>
            <div class="text-body-2 text-medium-emphasis mb-3">登录后可直接从你的专属媒体库选择已上传图片</div>
          </div>
          <div v-else>
            <!-- 筛选与搜索工具栏 -->
            <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-3">
              <v-chip-group v-model="selectedTypeFilter" mandatory selected-class="text-amber">
                <v-chip value="all" size="small" variant="tonal">{{ t('account.media.filterAll') || '全部' }}</v-chip>
                <v-chip value="webp" size="small" variant="tonal">WebP</v-chip>
                <v-chip value="png" size="small" variant="tonal">PNG</v-chip>
                <v-chip value="jpg" size="small" variant="tonal">JPG</v-chip>
              </v-chip-group>

              <div class="d-flex align-center ga-2">
                <v-text-field
                    v-model="mediaSearch"
                    density="compact"
                    variant="outlined"
                    hide-details
                    prepend-inner-icon="mdi-magnify"
                    placeholder="搜索文件名…"
                    class="search-input"
                    clearable
                    @keydown.enter="loadMediaList(1)"
                ></v-text-field>
                <v-btn icon="mdi-refresh" variant="text" size="small" :loading="mediaLoading" @click="loadMediaList(mediaPage)"></v-btn>
              </div>
            </div>

            <!-- 媒体图片网格 -->
            <div v-if="mediaLoading" class="py-12 text-center">
              <Loading size="36"></Loading>
            </div>
            <div v-else-if="filteredMediaList.length === 0" class="py-10 text-center text-medium-emphasis">
              <v-icon size="40" class="mb-2 text-disabled">mdi-image-off-outline</v-icon>
              <div class="text-caption">{{ t('account.media.noMediaFound') }}</div>
            </div>
            <div v-else class="media-gallery-grid mb-3">
              <div
                  v-for="item in filteredMediaList"
                  :key="item.id"
                  class="media-gallery-card rounded border overflow-hidden cursor-pointer position-relative"
                  :class="{ 'media-gallery-card--active': selectedMediaId === item.id }"
                  @click="selectMediaItem(item)"
                  @dblclick="onMediaItemDblClick(item)">
                <v-img :src="item.url" aspect-ratio="1" cover class="bg-black">
                  <template #placeholder>
                    <div class="d-flex align-center justify-center fill-height">
                      <Loading size="18"></Loading>
                    </div>
                  </template>
                </v-img>

                <!-- 底部悬浮信息条 -->
                <div class="gallery-info px-1 py-1 text-caption text-truncate">
                  <span class="text-truncate d-block" :title="item.filename">{{ item.filename }}</span>
                </div>
              </div>
            </div>

            <!-- 分页控制器 -->
            <div v-if="mediaTotalPages > 1" class="d-flex align-center justify-space-between text-caption text-medium-emphasis pt-1">
              <span>共 {{ mediaTotalCount }} 张图片</span>
              <div class="d-flex align-center ga-1">
                <v-btn icon="mdi-chevron-left" variant="text" size="x-small" :disabled="mediaPage <= 1" @click="loadMediaList(mediaPage - 1)"></v-btn>
                <span>{{ mediaPage }} / {{ mediaTotalPages }}</span>
                <v-btn icon="mdi-chevron-right" variant="text" size="x-small" :disabled="mediaPage >= mediaTotalPages" @click="loadMediaList(mediaPage + 1)"></v-btn>
              </div>
            </div>
          </div>
        </div>

        <!-- 本地上传面板 -->
        <div v-else-if="activeTab === 'local'">
          <v-file-upload
              density="comfortable"
              scrim="primary"
              accept=".webp,.png,.jpg,.jpeg"
              :disabled="!authStore.isLogin || uploading"
              :loading="uploading"
              @update:model-value="onFileSelected"
          ></v-file-upload>

          <div v-if="!authStore.isLogin" class="text-caption text-warning mt-2 text-center">
            * 提示：未登录用户无法使用图床上传，请先登录账号
          </div>
        </div>

        <!-- 外链输入面板 -->
        <div v-else>
          <v-text-field
              v-model="data.src"
              maxlength="2048"
              label="图片 URL (Href)"
              placeholder="https://example.com/image.png"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-link"
              hide-details
              class="mb-3"
          ></v-text-field>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <span class="text-caption text-medium-emphasis ml-2" v-if="activeTab === 'media' && authStore.isLogin">
          * 双击图片卡片可快速插入
        </span>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="onClose">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn
            color="amber"
            variant="flat"
            :disabled="!data.src"
            :loading="uploading"
            @click="onFinish">
          {{ t('basic.button.insert') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
.search-input {
  width: 170px;
}

.media-gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  max-height: 280px;
  overflow-y: auto;
  padding: 2px;
}

.media-gallery-card {
  transition: all 0.2s ease;
  background-color: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.media-gallery-card--active {
  border-color: #ffc107 !important;
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.4);
}

.gallery-info {
  background: rgba(0, 0, 0, 0.85);
  font-size: 11px;
}

.upload-dropzone {
  background-color: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
