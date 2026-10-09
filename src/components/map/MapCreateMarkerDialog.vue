<template>
  <!-- 创建标记 -->
  <v-dialog :model-value="modelValue" persistent max-width="850">
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
        <v-form ref="markerFormRef">
          <v-row>
            <v-col cols="12">
              <v-text-field
                  :model-value="newMarkerData.title"
                  @update:model-value="emit('update:marker-data', { ...newMarkerData, title: $event })"
                  :label="t('map.markerName')"
                  :rules="[v => !!v || t('map.titleRequired')]"
                  variant="outlined"
                  required></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-select
                  :model-value="newMarkerData.collectionUuid"
                  @update:model-value="onCollectionChange"
                  item-title="title"
                  item-value="uuid"
                  :items="collectionItems"
                  :label="t('map.selectCollection')"
                  :placeholder="t('map.noCollection')"
                  variant="outlined"
                  clearable>
                <template v-slot:details>
                  {{ t('map.collectionOptionalTip') }}
                </template>
              </v-select>
            </v-col>

            <v-col cols="6">
              <v-text-field
                  :model-value="newMarkerData.longitude.toFixed(6)"
                  :label="t('map.longitude')"
                  variant="outlined"
                  readonly></v-text-field>
            </v-col>

            <v-col cols="6">
              <v-text-field
                  :model-value="newMarkerData.latitude.toFixed(6)"
                  :label="t('map.latitude')"
                  variant="outlined"
                  readonly></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-combobox
                  :model-value="newMarkerData.tags"
                  @update:model-value="emit('update:marker-data', { ...newMarkerData, tags: $event })"
                  :label="t('map.tags')"
                  multiple
                  chips
                  variant="outlined"></v-combobox>
            </v-col>

            <v-col cols="12">
              <v-card border class="pa-2 mb-4">
                <Textarea
                    :model-value="newMarkerData.description"
                    @update:model-value="emit('update:marker-data', { ...newMarkerData, description: $event })"
                    :min-height="'200px'"
                    :value="newMarkerData.description || t('map.markerDescription')"
                    :placeholder="t('map.markerDescription')"
                    :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']">
                </Textarea>
              </v-card>
            </v-col>

            <v-col cols="6">
              <v-select
                  :model-value="publicSelectValue"
                  @update:model-value="emit('update:marker-data', { ...newMarkerData, public: $event })"
                  item-title="label"
                  item-value="value"
                  :items="visibilityItems"
                  :label="t('map.visibility')"
                  variant="outlined"
                  :disabled="!!selectedCollection"
                  :hint="selectedCollection ? t('map.publicFollowCollection') : t('map.collectionOptionalTip')"
                  persistent-hint></v-select>
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
            :disabled="!isLogin"
            variant="flat">
          {{ t('map.createMarker') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import Textarea from "@/components/textarea/index.vue";

const props = defineProps<{
  modelValue: boolean;
  newMarkerData: any;
  userCollections: any[];
  creatingMarker: boolean;
  isLogin: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'update:marker-data', 'cancel', 'create']);

const {t} = useI18n();
const markerFormRef = ref(null);

/** 集合下拉首项为"未分组"（null） */
const collectionItems = computed(() => [
  {title: t('map.noCollection'), uuid: null},
  ...(props.userCollections || []),
]);

/** 可见性下拉项：公开 / 私有 */
const visibilityItems = computed(() => [
  {value: true, label: t('map.public')},
  {value: false, label: t('map.private')},
]);

/** 当前归属的地图集（"未分组"时为 undefined） */
const selectedCollection = computed(() =>
    (props.userCollections || []).find((c: any) => c.uuid === props.newMarkerData.collectionUuid));

/** 归属地图集时显示并跟随地图集公开状态，下拉禁用 */
const publicSelectValue = computed(() =>
    selectedCollection.value
        ? Number((selectedCollection.value as any).public) === 1
        : props.newMarkerData.public);

/** 切换地图集归属时公开状态同步跟随；移出地图集时保留当前值 */
const onCollectionChange = (uuid: string | null) => {
  const collection = (props.userCollections || []).find((c: any) => c.uuid === uuid);
  emit('update:marker-data', {
    ...props.newMarkerData,
    collectionUuid: uuid || '',
    public: collection ? Number(collection.public) === 1 : props.newMarkerData.public,
  });
};

defineExpose({markerFormRef});

defineOptions({name: 'CreateMarkerDialog'});
</script>

<style scoped>
.create-marker-card {
  margin-top: -80px !important;
}
</style>
