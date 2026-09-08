<script setup lang="ts">
import {ref} from 'vue';
import {useI18n} from 'vue-i18n';

const {t} = useI18n();

const props = defineProps<{
  modelValue: boolean;
  shareUrl: string;
  shareCode: string;
  seasonId?: string;
  seasonTitle: string;
  pointsSpent: number;
  maxPoints: number;
  selectedNodesCount: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'copy'): void;
  (e: 'import-code', code: string): void;
}>();

const importInput = ref('');

function onImport() {
  if (!importInput.value.trim()) return;
  emit('import-code', importInput.value.trim());
  importInput.value = '';
  emit('update:modelValue', false);
}
</script>

<template>
  <v-dialog
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
      max-width="560">
    <v-card class="bg-surface-darken-1 border">
      <v-card-title class="py-10 text-center bg-black mb-4">
        <v-icon size="80">mdi-share-variant</v-icon>
        <p class="mt-5 text-h6 font-weight-bold">{{ t('mastery.shareDialog.title') }}</p>
      </v-card-title>

      <v-card-text>
        <!-- 当前方案概要 -->
        <v-card border class="pa-3 mb-4 bg-surface-darken-2">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption opacity-60">{{ t('mastery.shareDialog.currentSeason') }}</span>
            <span class="font-weight-bold text-amber text-body-2">{{ seasonTitle }}</span>
          </div>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption opacity-60">{{ t('mastery.shareDialog.pointsSpent') }}</span>
            <span class="font-weight-bold text-body-2">{{ pointsSpent }} / {{ maxPoints }} {{ t('mastery.card.pointsUnit') }}</span>
          </div>
          <div class="d-flex align-center justify-space-between">
            <span class="text-caption opacity-60">{{ t('mastery.shareDialog.activatedNodes') }}</span>
            <span class="font-weight-bold text-body-2">{{ selectedNodesCount }}</span>
          </div>
        </v-card>

        <!-- 分享链接 -->
        <div class="text-subtitle-2 font-weight-bold mb-1">{{ t('mastery.shareDialog.shareLinkTitle') }}</div>
        <div class="text-caption opacity-60 mb-2">
          {{ t('mastery.shareDialog.shareLinkDesc') }}
        </div>

        <v-text-field
            :model-value="shareUrl"
            readonly
            density="compact"
            variant="outlined"
            prepend-inner-icon="mdi-link"
            append-inner-icon="mdi-content-copy"
            @click:append-inner="emit('copy')"
            class="mb-3 font-monospace text-caption"
        ></v-text-field>

        <div class="d-flex ga-3 mb-6">
          <v-btn
              class="flex-grow-1 font-weight-bold"
              color="amber"
              prepend-icon="mdi-content-copy"
              @click="emit('copy')"
          >
            {{ t('mastery.shareDialog.copyLink') }}
          </v-btn>
          <v-btn
              variant="outlined"
              color="amber"
              prepend-icon="mdi-image-outline"
              class="font-weight-bold"
              :to="{ name: 'MasteryShare', query: { season: seasonId, share: shareCode } }"
          >
            {{ t('mastery.share.createPoster') }}
          </v-btn>
        </div>

        <v-divider class="mb-4"></v-divider>

        <!-- 导入方案 -->
        <div class="text-subtitle-2 font-weight-bold mb-1">{{ t('mastery.shareDialog.importTitle') }}</div>
        <div class="text-caption opacity-60 mb-2">
          {{ t('mastery.shareDialog.importDesc') }}
        </div>
        <div class="d-flex gap-2">
          <v-text-field
              v-model="importInput"
              :placeholder="t('mastery.shareDialog.importPlaceholder')"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              class="flex-grow-1 font-monospace text-caption"
          ></v-text-field>
          <v-btn
              color="primary"
              variant="tonal"
              :disabled="!importInput.trim()"
              @click="onImport">
            {{ t('mastery.shareDialog.importAction') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
</style>
