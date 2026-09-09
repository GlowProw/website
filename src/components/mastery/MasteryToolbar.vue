<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import {useDisplay} from 'vuetify/framework';
import FullscreenBtn from '@/components/FullscreenBtn.vue';
import MasteryIconWidget from '@/components/snbWidget/masteryIconWidget.vue';

const {t} = useI18n();
const {mobile} = useDisplay();

const props = defineProps<{
  searchSelected: string | null;
  searchItems: Array<{ id: string; skill: string; category?: string; title: string }>;
  isLeftPanelOpen: boolean;
  viewRef?: HTMLElement | null;
  // 保留可选兼容属性
  selectedSeasonId?: string;
  seasonOptions?: Array<{ id: string; title: string; maxPoints: number }>;
}>();

const emit = defineEmits<{
  (e: 'update:searchSelected', val: string | null): void;
  (e: 'toggle-panel'): void;
  (e: 'open-share'): void;
  (e: 'open-save'): void;
  (e: 'update:fullscreen', val: boolean): void;
  (e: 'update:selectedSeasonId', val: string): void;
}>();

defineOptions({name: 'MasteryToolbar'});

/**
 * 搜索过滤：默认仅按标题匹配，这里扩展为同时支持
 * 节点 id / key / skill / 分类（category）检索
 * Vuetify customFilter 签名: (value, query, item)，item.raw 为原始条目
 */
function filterSearchItem(value: any, queryText: string, item: any): boolean {
  const query = (queryText || '').trim().toLowerCase();
  if (!query) return true;
  const raw = item?.raw || {};
  const haystack = [
    value,
    raw.title,
    raw.id,
    raw.key,
    raw.skill,
    raw.category,
  ]
      .filter(v => typeof v === 'string' && v.length > 0)
      .join(' ')
      .toLowerCase();
  return haystack.includes(query);
}
</script>

<template>
  <v-card
      border
      class="d-flex mastery-search-bar"
      :width="mobile ? 'calc(100% - 60px)' : 550"
      :style="{'top': mobile ? '80px' : '80px'}">
    <!-- 搜索定位框 -->
    <v-autocomplete
        :model-value="searchSelected"
        :items="searchItems"
        item-title="title"
        item-value="id"
        tile
        elevation="0"
        hide-details
        variant="solo"
        clearable
        class="bg-transparent flex-grow-1"
        density="comfortable"
        :menu-props="{ maxHeight: '450px' }"
        :placeholder="t('mastery.searchPlaceholder')"
        :custom-filter="filterSearchItem"
        prepend-inner-icon="mdi-magnify"
        @update:model-value="emit('update:searchSelected', $event)">
      <template v-slot:item="{ props: itemProps, item }">
        <v-list-item v-bind="itemProps" :title="item.raw.title" :subtitle="item.raw.category">
          <template v-slot:prepend>
            <div class="mr-3">
              <MasteryIconWidget
                  :id="item.raw.id"
                  :name="item.raw.id"
                  :category="item.raw.category"
                  :with-background="true"
                  :size="30"
              ></MasteryIconWidget>
            </div>
          </template>
        </v-list-item>
      </template>
    </v-autocomplete>

    <v-divider vertical></v-divider>

    <!-- 分享方案按钮 -->
    <v-btn
        tile
        stacked
        density="compact"
        :title="t('mastery.share.dialogTitle')"
        @click="emit('open-share')">
      <v-icon icon="mdi-share-variant-outline"></v-icon>
    </v-btn>

    <v-divider vertical></v-divider>

    <!-- 保存方案按钮 -->
    <v-btn
        tile
        stacked
        density="compact"
        :title="t('mastery.saveDialog.title')"
        @click="emit('open-save')">
      <v-icon icon="mdi-bookmark-multiple-outline"></v-icon>
    </v-btn>

    <v-divider vertical></v-divider>

    <!-- 图层/信息面板开关 -->
    <v-btn
        tile
        stacked
        density="compact"
        :title="isLeftPanelOpen ? t('mastery.collapsePanel') : t('mastery.expandPanel')"
        @click="emit('toggle-panel')">
      <v-icon :class="isLeftPanelOpen ? 'text-amber' : ''" :icon="`mdi-layers${!isLeftPanelOpen ? '-outline' : ''}`"></v-icon>
    </v-btn>

    <!-- 全屏按钮 -->
    <FullscreenBtn :viewRef="viewRef" @update:isFull="emit('update:fullscreen', $event)"></FullscreenBtn>
  </v-card>
</template>

<style scoped lang="less">
.mastery-search-bar {
  background-color: hsl(from rgb(var(--v-theme-background)) h s l / .6);
  backdrop-filter: blur(20px);
  position: absolute;
  top: 30px;
  left: 30px;
  z-index: 40;
  min-width: 300px;
}
</style>
