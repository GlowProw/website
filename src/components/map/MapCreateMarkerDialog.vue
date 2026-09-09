<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="500">
    <v-card border elevation="12">
      <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 create-marker-card">
        <v-icon size="80">mdi-map-marker-plus</v-icon>
      </v-card-title>
      <template v-slot:append>
        <v-btn variant="tonal" icon @click="emit('cancel')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

      <v-card-text>
        <v-alert type="warning" class="mb-5" v-if="userCollections.length <= 0">
          {{ t('map.collectionIsEmptyTip') }}
          <template v-slot:append>
            <v-btn to="/account/maps" target="_blank">
              {{ t('basic.button.go') }}
            </v-btn>
          </template>
        </v-alert>

        <v-form ref="markerFormRef">
          <v-row>
            <v-col cols="12">
              <v-text-field
                  :model-value="newMarkerData.title"
                  @update:model-value="emit('update:marker-data', { ...newMarkerData, title: $event })"
                  :label="t('map.markerName')"
                  :disabled="userCollections.length <= 0"
                  :rules="[v => !!v || t('map.titleRequired')]"
                  variant="outlined"
                  required></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-select
                  :model-value="newMarkerData.collectionUuid"
                  @update:model-value="emit('update:marker-data', { ...newMarkerData, collectionUuid: $event })"
                  item-title="title"
                  item-value="uuid"
                  :items="userCollections"
                  :label="t('map.selectCollection')"
                  :disabled="userCollections.length <= 0"
                  :placeholder="t('map.selectCollection')"
                  variant="outlined"
                  required>
                <template v-slot:details v-if="userCollections.length <= 0">
                  {{ t('map.collectionIsEmptyTip') }}
                </template>
              </v-select>
            </v-col>

            <v-col cols="6">
              <v-text-field
                  :model-value="newMarkerData.longitude.toFixed(6)"
                  :disabled="userCollections.length <= 0"
                  :label="t('map.longitude')"
                  variant="outlined"
                  readonly></v-text-field>
            </v-col>

            <v-col cols="6">
              <v-text-field
                  :model-value="newMarkerData.latitude.toFixed(6)"
                  :disabled="userCollections.length <= 0"
                  :label="t('map.latitude')"
                  variant="outlined"
                  readonly></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-combobox
                  :model-value="newMarkerData.tags"
                  @update:model-value="emit('update:marker-data', { ...newMarkerData, tags: $event })"
                  :label="t('map.tags')"
                  :disabled="userCollections.length <= 0"
                  multiple
                  chips
                  variant="outlined"></v-combobox>
            </v-col>

            <v-col cols="12" v-if="userCollections.length > 0">
              <Textarea
                  :model-value="newMarkerData.description"
                  @update:model-value="emit('update:marker-data', { ...newMarkerData, description: $event })"
                  :min-height="'200px'"
                  :value="newMarkerData.description || t('map.markerDescription')"
                  :placeholder="t('map.markerDescription')"
                  :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']">
              </Textarea>
            </v-col>

            <v-col cols="12">
              <v-checkbox
                  :model-value="newMarkerData.public"
                  @update:model-value="emit('update:marker-data', { ...newMarkerData, public: $event })"
                  density="compact"
                  :label="t('map.publicMarker')"
                  :disabled="userCollections.length <= 0"
                  color="primary"></v-checkbox>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 py-4">
        <v-spacer></v-spacer>
        <v-btn @click="emit('cancel')" variant="text">
          {{ t('basic.button.cancel') }}
        </v-btn>
        <v-btn
            @click="emit('create')"
            :loading="creatingMarker"
            :disabled="!isLogin || newMarkerData.collectionUuid == null"
            variant="flat">
          {{ t('map.createMarker') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Textarea from "@/components/textarea/index.vue";

defineProps<{
  modelValue: boolean;
  newMarkerData: any;
  userCollections: any[];
  creatingMarker: boolean;
  isLogin: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'update:marker-data', 'cancel', 'create']);

const { t } = useI18n();
const markerFormRef = ref(null);

defineExpose({ markerFormRef });

defineOptions({ name: 'CreateMarkerDialog' });
</script>

<style scoped>
.create-marker-card {
  margin-top: -80px !important;
}
</style>
