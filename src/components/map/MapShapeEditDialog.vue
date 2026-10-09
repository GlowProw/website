<template>
  <!-- 编辑地图区域/路径弹窗 -->
  <v-dialog :model-value="modelValue" persistent max-width="1024">
    <v-card border elevation="12">
      <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 shape-card">
        <v-icon size="72">{{ shapeType === 'path' ? 'mdi-vector-polyline' : 'mdi-vector-polygon' }}</v-icon>
      </v-card-title>
      <template v-slot:append>
        <v-btn variant="tonal" icon @click="emit('cancel')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

      <v-card-text>
        <v-form ref="formRef">
          <v-row>
            <v-col cols="12" lg="6">
              <v-card variant="tonal" height="240"  class="d-flex justify-center align-center pa-4">
                <template v-slot:image>
                  <MapView :draggable="false" :zoomable="false" :initialZoom="11" :latitude="-0.768919" :longitude="0.536439"></MapView>
                </template>
                <div style="transform: scale(1)">
                  <MapShapeStylePreview :shape-type="shapeType" :shape-style="form.style" :width="70" :height="52"/>
                </div>
              </v-card>

              <div class="mt-10">
                <MapShapeStyleFields
                    :shape-type="shapeType"
                    :style="form.style"
                    @update:style="patchStyle($event)"></MapShapeStyleFields>
              </div>
            </v-col>
            <v-col cols="12" lg="6">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                      :model-value="form.title"
                      @update:model-value="patch({ title: $event })"
                      :label="t('map.shapeName')"
                      :rules="[v => !!v || t('map.titleRequired')]"
                      variant="outlined"
                      required></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                      :model-value="form.collectionUuid"
                      @update:model-value="onCollectionChange"
                      item-title="title"
                      item-value="uuid"
                      :items="collectionItems"
                      :label="t('map.selectCollection')"
                      :placeholder="t('map.noCollection')"
                      variant="outlined"
                      clearable></v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <v-combobox
                      :model-value="form.tags"
                      @update:model-value="patch({ tags: $event })"
                      :label="t('map.tags')"
                      multiple
                      chips
                      variant="outlined"></v-combobox>
                </v-col>

                <v-col cols="12">
                  <v-card border class="px-2 py-2">
                     <Textarea
                         :model-value="form.description"
                         @update:model-value="patch({ description: $event })"
                         :min-height="'160px'"
                         :value="form.description || t('map.shapeDescription')"
                         :placeholder="t('map.shapeDescription')"
                         :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']">
                    </Textarea>
                  </v-card>
                </v-col>

                <v-col cols="12">
                  <v-select
                      :model-value="publicSelectValue"
                      @update:model-value="patch({ public: $event })"
                      item-title="label"
                      item-value="value"
                      :items="visibilityItems"
                      :label="t('map.visibility')"
                      variant="outlined"
                      :disabled="!!selectedCollection"
                      :hint="selectedCollection ? t('map.publicFollowCollection') : undefined"
                      persistent-hint></v-select>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 py-4">
        <v-spacer></v-spacer>
        <v-btn @click="emit('cancel')" variant="text">
          {{ t('basic.button.cancel') }}
        </v-btn>
        <v-btn @click="emit('save')" :loading="saving" variant="flat">
          {{ mode === 'create' ? t('map.createShape') : t('basic.button.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import Textarea from '@/components/textarea/index.vue';
import MapShapeStyleFields from '@/components/map/MapShapeStyleFields.vue';
import MapShapeStylePreview from '@/components/map/MapShapeStylePreview.vue';
import {MapShapeType, ShapeFormData, ShapeStyle} from '@/assets/types/Map';
import MapView from "@/components/map/MapView.vue";

const props = defineProps<{
  modelValue: boolean;
  mode: 'create' | 'edit';
  shapeType: MapShapeType;
  form: ShapeFormData;
  userCollections: any[];
  saving: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'update:form', 'cancel', 'save']);

const {t} = useI18n();
const formRef = ref(null);

const collectionItems = computed(() => [
  {title: t('map.noCollection'), uuid: null},
  ...(props.userCollections || []),
]);

/**
 * 可见性下拉项：公开 / 私有
 **/
const visibilityItems = computed(() => [
  {value: true, label: t('map.public')},
  {value: false, label: t('map.private')},
]);

/**
 * 当前归属的地图集（"未分组"时为 undefined）
 **/
const selectedCollection = computed(() =>
    (props.userCollections || []).find((c: any) => c.uuid === props.form.collectionUuid));

/**
 * 归属地图集时显示并跟随地图集公开状态，下拉禁用
 **/
const publicSelectValue = computed(() =>
    selectedCollection.value ? Number((selectedCollection.value as any).public) === 1 : props.form.public);

/**
 * 切换地图集归属时公开状态同步跟随；移出地图集时保留当前值
 **/
const onCollectionChange = (uuid: string | null) => {
  const collection = (props.userCollections || []).find((c: any) => c.uuid === uuid);
  patch({
    collectionUuid: uuid || null,
    public: collection ? Number(collection.public) === 1 : props.form.public,
  });
};

const patch = (data: Partial<ShapeFormData>) => {
  emit('update:form', {...props.form, ...data});
};

const patchStyle = (style: ShapeStyle) => {
  emit('update:form', {...props.form, style});
};

defineExpose({formRef});

defineOptions({
  name: 'MapShapeEditDialog'
});
</script>

<style scoped>
.shape-card {
  margin-top: -80px !important;
}
</style>
