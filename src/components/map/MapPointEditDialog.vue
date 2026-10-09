<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="600">
    <v-card border>
      <v-card-title class="py-4 d-flex align-center ga-2 border-b">
        <v-icon color="amber">{{ isEdit ? 'mdi-pencil' : 'mdi-map-marker-plus' }}</v-icon>
        {{ isEdit ? t('map.editMarkerTitle') : t('map.createMarker') }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef">
          <v-text-field
              :model-value="form.title"
              @update:model-value="patch({ title: $event })"
              :label="t('map.markerName')"
              :rules="[v => !!v || t('map.titleRequired')]"
              variant="outlined"
              density="compact"
              class="mb-3"
              required></v-text-field>

          <v-select
              :model-value="form.collectionUuid"
              @update:model-value="onCollectionChange"
              item-title="title"
              item-value="uuid"
              :items="collectionItems"
              :label="t('map.selectCollection')"
              :placeholder="t('map.noCollection')"
              variant="outlined"
              density="compact"
              clearable
              class="mb-3"></v-select>

          <v-row dense>
            <v-col cols="6">
              <v-text-field
                  :model-value="form.longitude"
                  @update:model-value="patch({ longitude: $event })"
                  :label="t('map.longitude')"
                  type="number"
                  variant="outlined"
                  density="compact"
                  :rules="[v => v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v)) || t('map.invalidCoordinate')]"
                  required></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                  :model-value="form.latitude"
                  @update:model-value="patch({ latitude: $event })"
                  :label="t('map.latitude')"
                  type="number"
                  variant="outlined"
                  density="compact"
                  :rules="[v => v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v)) || t('map.invalidCoordinate')]"
                  required></v-text-field>
            </v-col>
          </v-row>

          <v-text-field
              :model-value="form.address"
              @update:model-value="patch({ address: $event })"
              :label="t('map.address')"
              variant="outlined"
              density="compact"
              class="mb-3"></v-text-field>

          <v-combobox
              :model-value="form.tags"
              @update:model-value="patch({ tags: $event })"
              :label="t('map.tags')"
              multiple
              chips
              variant="outlined"
              density="compact"
              class="mb-3"></v-combobox>

          <v-textarea
              :model-value="form.description"
              @update:model-value="patch({ description: $event })"
              :label="t('map.markerDescription')"
              variant="outlined"
              density="compact"
              rows="3"
              class="mb-2"></v-textarea>

          <v-select
              :model-value="publicSelectValue"
              @update:model-value="patch({ public: $event })"
              item-title="label"
              item-value="value"
              :items="visibilityItems"
              :label="t('map.visibility')"
              variant="outlined"
              density="compact"
              class="mb-2"
              :disabled="!!selectedCollection"
              :hint="selectedCollection ? t('map.publicFollowCollection') : undefined"
              persistent-hint></v-select>
        </v-form>
      </v-card-text>

      <v-card-actions class="border-t px-4 py-3">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="emit('cancel')">{{ t('basic.button.cancel') }}</v-btn>
        <v-btn color="amber" variant="tonal" :loading="saving" @click="onSubmit">
          {{ isEdit ? t('basic.button.save') : t('basic.button.create') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PointFormData } from '@/assets/types/Map';

const props = defineProps<{
  modelValue: boolean;
  form: PointFormData;
  userCollections: any[];
  saving: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'update:form', 'cancel', 'save']);

const { t } = useI18n();
const formRef = ref(null);

const isEdit = computed(() => !!(props.form as any).uuid);

const collectionItems = computed(() => [
  { title: t('map.noCollection'), uuid: null },
  ...(props.userCollections || []),
]);

/** 可见性下拉项：公开 / 私有 */
const visibilityItems = computed(() => [
  { value: true, label: t('map.public') },
  { value: false, label: t('map.private') },
]);

/** 当前归属的地图集（"未分组"时为 undefined） */
const selectedCollection = computed(() =>
    (props.userCollections || []).find((c: any) => c.uuid === props.form.collectionUuid));

/** 归属地图集时显示并跟随地图集公开状态，下拉禁用 */
const publicSelectValue = computed(() =>
    selectedCollection.value ? Number((selectedCollection.value as any).public) === 1 : props.form.public);

/** 切换地图集归属时公开状态同步跟随；移出地图集时保留当前值 */
const onCollectionChange = (uuid: string | null) => {
  const collection = (props.userCollections || []).find((c: any) => c.uuid === uuid);
  patch({
    collectionUuid: uuid || null,
    public: collection ? Number(collection.public) === 1 : props.form.public,
  });
};

const patch = (data: Partial<PointFormData>) => {
  emit('update:form', { ...props.form, ...data });
};

const onSubmit = async () => {
  const { valid } = await (formRef.value as any).validate();
  if (valid) emit('save');
};

defineExpose({ formRef });

defineOptions({ name: 'MapPointEditDialog' });
</script>
