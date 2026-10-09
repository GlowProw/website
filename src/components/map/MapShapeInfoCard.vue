<template>
  <v-card v-if="shape"
          border
          class="shape-info-card"
          :width="mobile ? 'calc(100% - 60px)' : 340">
    <v-card-title class="d-flex align-center ga-2 py-3">
      <v-icon :icon="shape.shapeType === 'region' ? 'mdi-vector-polygon' : 'mdi-vector-polyline'"
              color="amber"></v-icon>
      <span class="text-truncate flex-grow-1">{{ shape.title }}</span>
      <v-btn icon="mdi-close" size="small" variant="text" @click="emit('close')"></v-btn>
    </v-card-title>

    <v-card-text class="pt-0">
      <v-chip size="small" variant="tonal" color="amber" class="mr-2">
        {{ shape.shapeType === 'region' ? t('map.region') : t('map.path') }}
      </v-chip>
      <v-chip v-if="!shape.collectionId" size="small" variant="tonal">
        {{ t('map.noCollection') }}
      </v-chip>

      <v-alert v-if="vertexEditing" type="info" variant="tonal" density="compact" class="mt-3 mb-2 py-1">
        {{ t('map.vertexEditingTip') }}
      </v-alert>

      <!-- HTML 描述来自富文本，均为本站内用户内容 -->
      <div v-if="shape.description" class="text-body-2 mt-2 shape-desc" v-html="shape.description"></div>
    </v-card-text>

    <v-card-actions class="px-3 pb-3 flex-wrap">
      <template v-if="!vertexEditing">
        <template v-if="canManage">
          <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil"
                 @click="shape && emit('edit-attrs', shape.uuid)">
            {{ t('basic.button.edit') }}
          </v-btn>
          <v-btn size="small" variant="tonal" prepend-icon="mdi-vector-square-edit"
                 @click="shape && emit('edit-vertices', shape.uuid)">
            {{ t('map.editVertices') }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn size="small" variant="tonal" color="error" prepend-icon="mdi-delete"
                 @click="confirming = true">
            {{ t('basic.button.delete') }}
          </v-btn>
        </template>
        <v-spacer v-else></v-spacer>
      </template>
      <template v-else>
        <v-spacer></v-spacer>
        <v-btn size="small" variant="text" @click="emit('cancel-vertices')">
          {{ t('basic.button.cancel') }}
        </v-btn>
        <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-content-save"
               @click="emit('save-vertices', shape.uuid)">
          {{ t('basic.button.save') }}
        </v-btn>
      </template>
    </v-card-actions>

    <v-dialog :model-value="confirming" @update:model-value="confirming = $event" max-width="420">
      <v-card border>
        <v-card-title class="text-body-1">{{ t('common.confirmDelete') }}</v-card-title>
        <v-card-text class="text-body-2">
          {{ t('map.confirmDeleteShape', { title: shape.title }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirming = false">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn color="error" variant="flat" @click="onConfirmDelete">
            {{ t('basic.button.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify/framework';
import { useAuthStore } from '~/stores/userAccountStore';
import type { MapShape } from '@/assets/types/Map';

const props = defineProps<{
  shape: MapShape | null;
  vertexEditing?: boolean;
}>();

const emit = defineEmits(['close', 'edit-attrs', 'edit-vertices', 'cancel-vertices', 'save-vertices', 'delete']);

const { t } = useI18n();
const { mobile } = useDisplay();
const authStore = useAuthStore();

// 分享/公开场景下只展示信息，编辑与删除仅属主可见
const canManage = computed(() => !!props.shape && props.shape.userId === authStore.user?.userId);

const confirming = ref(false);

watch(() => props.shape?.uuid, () => {
  confirming.value = false;
});

const onConfirmDelete = () => {
  confirming.value = false;
  if (props.shape) emit('delete', props.shape.uuid);
};

defineOptions({ name: 'MapShapeInfoCard' });
</script>

<style scoped>
.shape-info-card {
  position: absolute;
  z-index: 40;
  right: 30px;
  top: 170px;
}

.shape-desc {
  max-height: 220px;
  overflow-y: auto;
  opacity: 0.85;
}

@media (max-width: 960px) {
  .shape-info-card {
    right: 15px;
    left: 15px;
    width: auto !important;
    top: 140px;
  }
}
</style>
