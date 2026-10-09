<template>
  <v-dialog :model-value="modelValue" persistent max-width="460">
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon color="amber">mdi-share-variant-outline</v-icon>
        <span>{{ t('map.share.dialogTitle') }}</span>
      </v-card-title>

      <v-card-text v-if="info">
        <div class="text-h6 text-wrap">{{ info.title }}</div>
        <div class="d-flex align-center ga-2 text-body-2 text-medium-emphasis mt-1 mb-3">
          <v-icon size="16">mdi-account-outline</v-icon>
          <span>{{ t('map.share.creator', {name: info.creator.name || '-'}) }}</span>
        </div>

        <p v-if="info.description" class="text-body-2 text-medium-emphasis mb-3 text-wrap">
          {{ info.description }}
        </p>

        <div class="d-flex flex-wrap ga-2">
          <v-chip size="small" variant="tonal" color="amber" prepend-icon="mdi-map-marker-outline">
            {{ t('map.share.pointCount', {count: info.pointCount}) }}
          </v-chip>
          <v-chip size="small" variant="tonal" prepend-icon="mdi-vector-polyline">
            {{ t('map.share.shapeCount', {count: info.shapeCount}) }}
          </v-chip>
        </div>

        <v-alert v-if="info.isOwner" type="info" variant="tonal" density="compact" class="mt-4 mb-0">
          {{ t('map.share.ownHint') }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-btn variant="text" @click="emit('cancel')">{{ t('basic.button.cancel') }}</v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="tonal" prepend-icon="mdi-eye-outline" @click="emit('preview')">
          {{ t('map.share.readonly') }}
        </v-btn>
        <v-btn v-if="!info?.isOwner" color="amber" variant="flat" prepend-icon="mdi-download-outline"
               :loading="importing" @click="emit('import')">
          {{ t('map.share.import') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { SharedCollectionInfo } from '@/assets/types/Map';

defineProps<{
  modelValue: boolean;
  info: SharedCollectionInfo | null;
  importing?: boolean;
}>();

const emit = defineEmits(['cancel', 'import', 'preview']);

const { t } = useI18n();
</script>
