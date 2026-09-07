<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';

const {t} = useI18n();

interface MasterySavedBuild {
  id: string;
  name: string;
  season: string;
  code: string;
  createdAt: number;
  updatedAt: number;
}

const props = defineProps<{
  modelValue: boolean;
  savedBuilds: MasterySavedBuild[];
  seasonTitle: string;
  pointsSpent: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'save', name: string): void;
  (e: 'load', build: MasterySavedBuild): void;
  (e: 'delete', id: string): void;
}>();

const buildName = ref('');
const confirmDeleteId = ref<string | null>(null);

watch(() => props.modelValue, (v) => {
  if (!v) buildName.value = '';
});

function onSave() {
  if (!buildName.value.trim()) return;
  emit('save', buildName.value.trim());
  buildName.value = '';
}

function onLoad(build: MasterySavedBuild) {
  emit('load', build);
  emit('update:modelValue', false);
}

function onDelete(id: string) {
  if (confirmDeleteId.value === id) {
    emit('delete', id);
    confirmDeleteId.value = null;
  } else {
    confirmDeleteId.value = id;
    setTimeout(() => {
      if (confirmDeleteId.value === id) confirmDeleteId.value = null;
    }, 3000);
  }
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const sortedBuilds = computed(() =>
    [...props.savedBuilds].sort((a, b) => b.updatedAt - a.updatedAt)
);

defineOptions({name: 'MasterySaveDialog'});
</script>

<template>
  <v-dialog
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
      max-width="580">
    <v-card class="bg-surface-darken-1 border">
      <v-card-title class="py-10 text-center bg-black mb-4">
        <v-icon size="80">mdi-bookmark-multiple</v-icon>
        <p class="mt-5 text-h6 font-weight-bold">{{ t('mastery.saveDialog.title') }}</p>
      </v-card-title>

      <div class="pa-5">
        <!-- 保存当前方案 -->
        <div class="text-subtitle-2 text-medium-emphasis mb-2">
          {{ t('mastery.saveDialog.saveCurrentTitle') }}
        </div>
        <v-card class="pa-3 mb-5 bg-surface-darken-2" border>
          <div class="d-flex align-center ga-2 mb-2 text-caption text-medium-emphasis">
            <v-icon size="14">mdi-sword-cross</v-icon>
            {{ seasonTitle }} &bull; {{ t('mastery.saveDialog.pointsSpent', {pts: pointsSpent}) }}
          </div>
          <div class="d-flex align-center ga-2">
            <v-text-field
                v-model="buildName"
                :label="t('mastery.saveDialog.namePlaceholder')"
                variant="outlined"
                density="compact"
                hide-details
                maxlength="40"
                prepend-inner-icon="mdi-bookmark-outline"
                class="flex-grow-1"
                @keydown.enter="onSave"
            />
            <v-btn
                color="amber"
                variant="flat"
                :disabled="!buildName.trim()"
                prepend-icon="mdi-content-save"
                class="flex-shrink-0"
                @click="onSave">
              {{ t('mastery.saveDialog.saveBtn') }}
            </v-btn>
          </div>
        </v-card>

        <!-- 已保存方案 -->
        <div class="text-subtitle-2 text-medium-emphasis mb-2 d-flex align-center justify-space-between">
          <span>{{ t('mastery.saveDialog.savedTitle') }}</span>
          <v-chip size="x-small" variant="tonal" color="amber">{{ savedBuilds.length }}</v-chip>
        </div>

        <div v-if="sortedBuilds.length === 0"
             class="text-center text-medium-emphasis text-caption py-6">
          <v-icon size="32" class="mb-2 opacity-40">mdi-bookmark-off-outline</v-icon>
          <div>{{ t('mastery.saveDialog.empty') }}</div>
        </div>

        <v-list v-else class="pa-0 d-flex flex-column ga-2" style="max-height:320px;overflow-y:auto;">
          <v-card
              v-for="build in sortedBuilds"
              :key="build.id"
              border
              flat
              class="build-item pa-3">
            <div class="d-flex align-start justify-space-between">
              <div class="flex-grow-1 min-width-0">
                <div class="d-flex align-center ga-2 mb-1">
                  <v-icon size="14" color="amber">mdi-bookmark</v-icon>
                  <span class="text-body-2 font-weight-medium text-truncate">{{ build.name }}</span>
                </div>
                <div class="text-caption text-medium-emphasis d-flex flex-column ga-1">
                  <span>
                    <v-icon size="11" class="mr-1">mdi-sword-cross</v-icon>{{ build.season }}
                  </span>
                  <span>
                    <v-icon size="11" class="mr-1">mdi-clock-plus-outline</v-icon>
                    {{ t('mastery.saveDialog.createdAt') }}: {{ formatDate(build.createdAt) }}
                  </span>
                  <span v-if="build.updatedAt !== build.createdAt">
                    <v-icon size="11" class="mr-1">mdi-clock-edit-outline</v-icon>
                    {{ t('mastery.saveDialog.updatedAt') }}: {{ formatDate(build.updatedAt) }}
                  </span>
                </div>
              </div>

              <div class="d-flex align-center ga-1 ml-2 flex-shrink-0">
                <v-btn
                    size="small"
                    variant="tonal"
                    icon="mdi-play-circle-outline"
                    :title="t('mastery.saveDialog.loadBtn')"
                    @click="onLoad(build)"
                />
                <v-btn
                    size="small"
                    :variant="confirmDeleteId === build.id ? 'flat' : 'tonal'"
                    :color="confirmDeleteId === build.id ? 'error' : 'default'"
                    :icon="confirmDeleteId === build.id ? 'mdi-check' : 'mdi-trash-can-outline'"
                    :title="confirmDeleteId === build.id ? t('mastery.saveDialog.confirmDelete') : t('mastery.saveDialog.deleteBtn')"
                    @click="onDelete(build.id)"
                />
              </div>
            </div>
          </v-card>
        </v-list>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
.build-item {
  background: rgb(var(--v-theme-surface-darken-2));
  transition: background 0.2s ease;

  &:hover {
    background: rgb(var(--v-theme-surface-darken-1));
  }
}
</style>
