<template>
  <v-row>
    <!-- 导入区域 S -->
    <v-col cols="12" lg="6">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-5">{{ t('setting.wishlist.description') }}</p>

        <!-- URL 导入 -->
        <div class="mb-6">
          <v-text-field
              v-model="importUrl"
              :placeholder="t('setting.wishlist.urlPlaceholder')"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-2"
              @keydown.enter="onImportFromUrl">
            <template v-slot:append-inner>
              <v-btn
                  size="small"
                  variant="tonal"
                  color="amber"
                  :loading="importLoading"
                  :disabled="!importUrl"
                  @click="onImportFromUrl">
                {{ t('setting.wishlist.importFromUrl') }}
              </v-btn>
            </template>
          </v-text-field>
        </div>

        <v-row no-gutters class="ga-2">
          <v-col cols="auto">
            <v-btn
                variant="tonal"
                size="small"
                prepend-icon="mdi-file-upload"
                @click="onTriggerFileUpload">
              {{ t('setting.wishlist.importFromFile') }}
            </v-btn>
            <input
                ref="fileInputRef"
                type="file"
                accept=".txt,.csv,.text"
                style="display: none"
                @change="onFileUpload"
            />
          </v-col>
          <v-col cols="auto">
            <v-btn
                variant="tonal"
                size="small"
                prepend-icon="mdi-content-paste"
                @click="pasteDialog = true">
              {{ t('setting.wishlist.importFromText') }}
            </v-btn>
          </v-col>
        </v-row>

        <template v-slot:title>
          {{ t('setting.wishlist.importTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <!-- 导入区域 E -->

    <!-- 统计信息 S -->
    <v-col cols="12" lg="6">
      <AffixBoxHasTitleView>
        <div class="d-flex flex-column ga-3">
          <v-row no-gutters align="center">
            <v-col>
              <span class="text-h3 font-weight-bold text-amber">{{ wishlistStore.wishlists.length }}</span>
              <span class="ml-2 opacity-60">{{ t('setting.wishlist.listTitle') }}</span>
            </v-col>
          </v-row>
          <v-row no-gutters align="center">
            <v-col>
              <span class="text-h4 font-weight-bold">{{ wishlistStore.enabledRules.toLocaleString() }}</span>
              <span class="ml-2 opacity-60">{{ t('setting.wishlist.rules') }}</span>
            </v-col>
          </v-row>

          <!-- 批量操作 -->
          <v-divider class="my-2"></v-divider>
          <v-row no-gutters class="ga-2">
            <v-col cols="auto">
              <v-btn size="small" variant="tonal" color="var(--main-color)" @click="wishlistStore.enableAll()"
                     :disabled="wishlistStore.wishlists.length === 0">
                <v-icon icon="mdi-check-all" class="mr-1"></v-icon>
                {{ t('setting.wishlist.enableAll') }}
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-btn size="small" variant="tonal" @click="wishlistStore.disableAll()"
                     :disabled="wishlistStore.wishlists.length === 0">
                <v-icon icon="mdi-cancel" class="mr-1"></v-icon>
                {{ t('setting.wishlist.disableAll') }}
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-btn size="small" variant="tonal" color="red" @click="clearAllDialog = true"
                     :disabled="wishlistStore.wishlists.length === 0">
                <v-icon icon="mdi-delete-sweep" class="mr-1"></v-icon>
                {{ t('setting.wishlist.clearAll') }}
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <template v-slot:title>
          {{ t('setting.wishlist.matchedItems') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <!-- 统计信息 E -->

    <!-- 已导入清单列表 S -->
    <v-col cols="12">
      <AffixBoxHasTitleView>
        <div v-if="wishlistStore.wishlists.length === 0" class="text-center py-10">
          <v-icon icon="mdi-playlist-star" size="60" class="opacity-20 mb-3"></v-icon>
          <p class="opacity-50">{{ t('setting.wishlist.noWishlists') }}</p>
        </div>

        <v-row v-else>
          <v-col cols="12" md="6" lg="4"
                 v-for="wl in wishlistStore.wishlists"
                 :key="wl.id">
            <v-card
                border
                :class="[wl.enabled ? 'wishlist-card-enabled' : 'wishlist-card-disabled']"
                class="wishlist-card pa-4">
              <v-row align="start">
                <v-col cols="9">
                  <div class="font-weight-bold singe-line" :title="wl.title">
                    {{ wl.title }}
                  </div>
                  <!-- 描述 -->
                  <p v-if="wl.description" class="text-caption opacity-50 mb-2 singe-line" :title="wl.description">
                    {{ wl.description }}
                  </p>
                </v-col>
                <v-col cols="auto">
                  <v-switch
                      hide-details
                      inset
                      density="compact"
                      :model-value="wl.enabled"
                      @update:model-value="wishlistStore.toggleWishlist(wl.id)">
                  </v-switch>
                </v-col>
              </v-row>

              <!-- 元数据标签 -->
              <div class="d-flex flex-wrap ga-1 mb-2">
                <!-- 规则数 -->
                <v-chip size="x-small" variant="tonal" :color="wl.enabled ? 'amber' : 'grey'">
                  {{ t('setting.wishlist.rules', {count: wl.rules.length}) }}
                </v-chip>
                <!-- 去重数 -->
                <v-chip size="x-small" variant="tonal" v-if="wl.duplicatesRemoved && wl.duplicatesRemoved > 0">
                  {{ t('setting.wishlist.duplicatesRemoved', {count: wl.duplicatesRemoved}) }}
                </v-chip>
                <!-- 版本 -->
                <v-chip size="x-small" variant="tonal" v-if="wl.version" prepend-icon="mdi-tag">
                  v{{ wl.version }}
                </v-chip>
              </div>

              <!-- 作者 -->
              <p class="text-caption opacity-50 singe-line" v-if="wl.author">
                <a v-if="wl.authorUrl" :href="wl.authorUrl" target="_blank" class="text-decoration-none">{{ wl.author }}</a>
                <span v-else>{{ wl.author }}</span>
              </p>

              <!-- 来源 -->
              <p class="text-caption opacity-40 singe-line" :title="wl.source" v-if="wl.source">
                {{ t('setting.wishlist.source') }}: {{ truncateSource(wl.source) }}
              </p>

              <!-- 更新时间 -->
              <p class="text-caption opacity-40" v-if="wl.lastUpdatedAt">
                {{ t('setting.wishlist.lastUpdated') }}: {{ formatTime(wl.lastUpdatedAt) }}
              </p>

              <v-row no-gutters class="mt-3 ga-1" align="center">
                <!-- 更新按钮 -->
                <v-col cols="auto" v-if="wl.updateUrls && wl.updateUrls.length > 0">
                  <v-btn size="x-small" variant="tonal" color="var(--main-color)"
                         :loading="wishlistStore.isUpdating(wl.id)"
                         @click="onUpdate(wl.id)">
                    <v-icon icon="mdi-refresh" class="mr-1"></v-icon>
                    {{ t('setting.wishlist.update') }}
                  </v-btn>
                </v-col>
                <v-spacer></v-spacer>
                <v-col cols="auto">
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn size="x-small" variant="text" v-bind="props" icon slim>
                        <v-icon icon="mdi-dots-vertical"></v-icon>
                      </v-btn>
                    </template>
                    <v-list slim density="compact">
                      <v-list-item prepend-icon="mdi-export" @click="onExport(wl.id)">
                        {{ t('setting.wishlist.export') }}
                      </v-list-item>
                      <v-list-item prepend-icon="mdi-delete" @click="confirmDelete(wl.id)">
                        {{ t('setting.wishlist.delete') }}
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>

        <template v-slot:title>
          {{ t('setting.wishlist.listTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <!-- 已导入清单列表 E -->
  </v-row>

  <!-- 粘贴对话框 S -->
  <v-dialog v-model="pasteDialog" max-width="600">
    <v-card class="pa-5">
      <v-card-title>{{ t('setting.wishlist.pasteTitle') }}</v-card-title>
      <v-card-text>
        <v-textarea
            v-model="pasteText"
            :placeholder="t('setting.wishlist.pastePlaceholder')"
            variant="outlined"
            rows="12"
            auto-grow
            hide-details>
        </v-textarea>
      </v-card-text>
      <!-- 预览提示 -->
      <v-alert v-if="pastePreviewError" type="warning" variant="tonal" density="compact" class="mx-5 mb-2">
        {{ pastePreviewError }}
      </v-alert>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="pasteDialog = false">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn color="amber" :disabled="!pasteText || !!pastePreviewError" @click="onImportFromPaste">
          {{ t('setting.wishlist.importBtn') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- 粘贴对话框 E -->

  <!-- 删除确认对话框 S -->
  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card class="pa-5">
      <v-card-title>{{ t('setting.wishlist.delete') }}</v-card-title>
      <v-card-text>{{ t('setting.wishlist.deleteConfirm') }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="deleteDialog = false">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn color="red" @click="onConfirmDelete">{{ t('setting.wishlist.delete') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- 删除确认对话框 E -->

  <!-- 清空确认对话框 S -->
  <v-dialog v-model="clearAllDialog" max-width="400">
    <v-card class="pa-5">
      <v-card-title>{{ t('setting.wishlist.clearAll') }}</v-card-title>
      <v-card-text>{{ t('setting.wishlist.clearAllConfirm') }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="clearAllDialog = false">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn color="red" @click="onConfirmClearAll">{{ t('setting.wishlist.clearAll') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- 清空确认对话框 E -->
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useWishlistStore} from '~/stores/wishlistStore';
import {parseWishlistText, validateWishlist} from '@/assets/sripts/wishlist_data_processing';
import AffixBoxHasTitleView from '@/components/AffixBoxHasTitleView.vue';
import {useNoticeStore} from "~/stores/noticeStore";

const {t} = useI18n();
const wishlistStore = useWishlistStore();

const importUrl = ref('');
const importLoading = ref(false);
const pasteDialog = ref(false);
const pasteText = ref('');
const deleteDialog = ref(false);
const deleteTargetId = ref('');
const clearAllDialog = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const not = useNoticeStore()

/**
 * 粘贴文本实时预览验证
 */
const pastePreviewError = computed(() => {
  if (!pasteText.value) return '';
  const parsed = parseWishlistText(pasteText.value, 'preview');
  const validation = validateWishlist(parsed);
  if (!validation.valid) {
    const missing = validation.errors.map(e => t(`setting.wishlist.field_${e}`)).join(', ');
    return t('setting.wishlist.requiredFieldsMissing', {fields: missing});
  }
  return '';
});

/**
 * 处理导入结果
 */
function handleImportResult(result: { success: boolean; wishlist?: any; errors?: string[] }, source: string) {
  if (result.success) {
    const wl = result.wishlist;
    const dupMsg = wl?.duplicatesRemoved && wl.duplicatesRemoved > 0
        ? ` (${t('setting.wishlist.duplicatesRemoved', {count: wl.duplicatesRemoved})})`
        : '';
    not.success(t('setting.wishlist.importSuccess') + dupMsg);
  } else {
    if (result.errors?.includes('max_limit')) {
      not.error(t('setting.wishlist.field_max_limit'));
    } else {
      const missing = result.errors?.map(e => t(`setting.wishlist.field_${e}`)).join(', ') || '';
      not.error(t('setting.wishlist.requiredFieldsMissing', {fields: missing}));
    }
  }
}

/**
 * 从 URL 导入
 */
const onImportFromUrl = async () => {
  if (!importUrl.value) return;
  importLoading.value = true;
  try {
    const result = await wishlistStore.importFromUrl(importUrl.value);
    handleImportResult(result, importUrl.value);
    if (result.success) importUrl.value = '';
  } catch (e: any) {
    not.error(t('setting.wishlist.importError') + ': ' + (e.message || e));
  } finally {
    importLoading.value = false;
  }
};

/**
 * 触发文件选择
 */
const onTriggerFileUpload = () => {
  fileInputRef.value?.click();
};

/**
 * 文件上传处理
 */
const onFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    if (text) {
      const result = wishlistStore.importFromText(text, file.name);
      handleImportResult(result, file.name);
    }
  };
  reader.readAsText(file);

  // 重置 input 值，使得同一文件可重复选择
  target.value = '';
};

/**
 * 从粘贴文本导入
 */
const onImportFromPaste = () => {
  if (!pasteText.value) return;
  const result = wishlistStore.importFromText(pasteText.value, 'paste');
  handleImportResult(result, 'paste');
  if (result.success) {
    pasteText.value = '';
    pasteDialog.value = false;
  }
};

/**
 * 更新愿望清单
 */
const onUpdate = async (id: string) => {
  const result = await wishlistStore.updateFromUrls(id);
  if (result.success) {
    not.success(t('setting.wishlist.importSuccess'));
  } else {
    not.error(t('setting.wishlist.updateError') + (result.error ? ': ' + result.error : ''));
  }
};

/**
 * 导出愿望清单
 */
const onExport = (id: string) => {
  const text = wishlistStore.exportAsText(id);
  if (!text) return;

  const wl = wishlistStore.wishlists.find(w => w.id === id);
  const filename = `${wl?.title || 'wishlist'}.txt`;

  const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * 确认删除
 */
const confirmDelete = (id: string) => {
  deleteTargetId.value = id;
  deleteDialog.value = true;
};

const onConfirmDelete = () => {
  wishlistStore.removeWishlist(deleteTargetId.value);
  deleteDialog.value = false;
  deleteTargetId.value = '';
};

/**
 * 确认清空
 */
const onConfirmClearAll = () => {
  wishlistStore.removeAll();
  clearAllDialog.value = false;
};

/**
 * 截断来源 URL 显示
 */
const truncateSource = (source: string): string => {
  if (source.length <= 50) return source;
  return source.slice(0, 20) + '...' + source.slice(-25);
};

/**
 * 格式化时间戳
 */
const formatTime = (ts: number): string => {
  return new Date(ts).toLocaleString();
};
</script>

<style scoped lang="less">
.wishlist-card {
  transition: all 0.3s ease;

  &.wishlist-card-disabled {
    opacity: 0.6;
  }
}
</style>
