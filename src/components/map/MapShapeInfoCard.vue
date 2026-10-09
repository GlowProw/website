<template>
  <v-card
      v-show="shape"
      border
      elevation="12"
      :width="mobile ? 'calc(100% - 60px)' : 450"
      :style="{
        'top': mobile ? '140px' : '80px'
      }"
      class="shape-info-card overflow-y-auto">
    <template v-slot:title>
      <div class="my-2 mr-2">
        <div class="d-flex align-center">
          <div>
            <div
                class="d-flex align-center text-amber singe-line"
                :title="shape.title">
              {{ shape.title }}
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-slot:append>
      <v-btn variant="tonal" icon @click="emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>

    <div class="mx-4 pb-3">
      <div class="d-flex ga-2">
        <v-chip size="small" variant="tonal" color="amber">
          {{ shape.shapeType === 'region' ? t('map.region') : t('map.path') }}
        </v-chip>
        <v-chip v-if="!shape.collectionId" size="small" variant="tonal">
          {{ t('map.noCollection') }}
        </v-chip>
      </div>
    </div>

    <div>
      <template v-if="vertexEditing">
        <v-row class="shape-title px-10 mx-n6 py-2 text-amber-lighten-4" no-gutters>
          {{ t('map.vertexEditingTitle') }}
        </v-row>
        <p class="my-2 mx-4">
          {{ t('map.vertexEditingTip') }}
        </p>
      </template>

      <template v-if="true">
        <!-- 描述内容 -->
        <v-row class="shape-title px-10 mx-n6 py-2 text-amber-lighten-4" no-gutters>
          {{ t('map.shapeDescription') }}
        </v-row>
        <div class="mb-2">
          <Textarea v-if="shape.description" readonly class="my-2 mx-4 shape-desc" min-height="auto" :value="shape.description"></Textarea>
          <p class="my-2 mx-4" v-else>很懒什么都没有说</p>
        </div>
      </template>

      <div class="shape-title px-10 mx-n6 py-2 text-amber-lighten-4">
        {{ t('empireSkillSimulation.other') }}
      </div>
      <div class="mx-5 mb-5 opacity-80"
           v-if="shape && shape.id">
        <v-text-field :value="shape.id" hide-details readonly variant="underlined" density="compact">
          <template v-slot:append-inner>
            <v-icon>mdi-identifier</v-icon>
          </template>
        </v-text-field>

        <v-row no-gutters class="mt-2" align="center" v-if="shape.createdTime">
          <v-col cols="auto" class="mr-2">
            <v-icon icon="mdi-calendar-range" size="19"></v-icon>
            {{ t('empireSkillSimulation.dateAdded') }}
          </v-col>
          <v-spacer></v-spacer>
          <v-col class="text-right">
            <TimeView :time="shape.createdTime" v-if="shape.createdTime">
            </TimeView>
          </v-col>
        </v-row>
        <v-row no-gutters class="mt-2" align="center" v-if="shape.updatedTime">
          <v-col cols="auto" class="mr-2">
            <v-icon icon="mdi-calendar-range" size="19"></v-icon>
            {{ t('empireSkillSimulation.lastUpdated') }}
          </v-col>
          <v-spacer></v-spacer>
          <v-col class="text-right">
            <TimeView :time="shape.updatedTime" v-if="shape.updatedTime">
            </TimeView>
          </v-col>
        </v-row>
      </div>
    </div>

    <v-card-actions class="px-3 pb-3 flex-wrap" v-if="false">
      <template v-if="!vertexEditing">
        <template v-if="canManage">
          <v-btn variant="tonal" prepend-icon="mdi-pencil"
                 @click="shape && emit('edit-attrs', shape.uuid)">
            {{ t('basic.button.edit') }}
          </v-btn>
          <v-btn variant="tonal" prepend-icon="mdi-vector-square-edit"
                 @click="shape && emit('edit-vertices', shape.uuid)">
            {{ t('map.editVertices') }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="tonal" color="error" prepend-icon="mdi-delete"
                 @click="confirming = true">
            {{ t('basic.button.delete') }}
          </v-btn>
        </template>
        <v-spacer v-else></v-spacer>
      </template>
      <template v-else>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="emit('cancel-vertices')">
          {{ t('basic.button.cancel') }}
        </v-btn>
        <v-btn variant="tonal"
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
import ShieldWidget from "@/components/snbWidget/shieldWidget.vue";
import MapLocationName from "@/components/snbWidget/mapLocationName.vue";
import Textarea from "@/components/textarea/index.vue";
import TimeView from "@/components/TimeView.vue";

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
  background-color: hsl(from rgb(var(--v-theme-background)) h s l / .8);
  backdrop-filter: blur(20px);
  position: absolute;
  z-index: 10;
  right: 30px;
  max-height: 80vh;

  .shape-title {
    marker: none;
    background-color: hsl(from #000 h s l / .3);
  }
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
