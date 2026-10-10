<template>
  <!-- 编辑标记 -->
  <v-dialog :model-value="modelValue" persistent max-width="850" @update:model-value="emit('update:modelValue', $event)">
    <v-card border elevation="12">
      <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 create-marker-card">
        <v-img :src="getCategoryIcon(form.category || 'shareLocation')" width="64" height="64" class="mx-auto mb-2"></v-img>
        <p>
          {{ isEdit ? t('map.editMarkerTitle') : t('map.createMarker') }}
        </p>
      </v-card-title>
      <template v-slot:append>
        <v-btn variant="tonal" icon @click="emit('cancel')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

      <v-card-text>
        <v-form ref="formRef">
          <v-row dense>
            <v-col cols="12" md="8">
              <v-text-field
                  :model-value="form.title"
                  @update:model-value="patch({ title: $event })"
                  :label="t('map.markerName')"
                  :rules="[v => !!v || t('map.titleRequired')]"
                  variant="outlined"
                  density="compact"
                  required></v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-autocomplete
                  :model-value="form.category || 'shareLocation'"
                  @update:model-value="patch({ category: $event })"
                  :items="categoryOptions"
                  item-value="value"
                  item-title="text"
                  :label="t('map.style')"
                  variant="outlined"
                  density="compact">
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-img
                          v-if="getCategoryIcon(item.raw.value)"
                          :src="getCategoryIcon(item.raw.value)"
                          width="24"
                          height="24"
                          class="mr-2"
                          contain
                      />
                    </template>
                  </v-list-item>
                </template>
                <template v-slot:prepend-inner>
                  <v-img
                      v-if="getCategoryIcon(form.category || 'shareLocation')"
                      :src="getCategoryIcon(form.category || 'shareLocation')"
                      width="20"
                      height="20"
                      class="mr-1"
                      contain
                  />
                </template>
              </v-autocomplete>
            </v-col>

            <v-col cols="12">
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
                  clearable></v-select>
            </v-col>

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
            <v-col cols="12">
              <v-combobox
                  :model-value="form.tags"
                  @update:model-value="patch({ tags: $event })"
                  :label="t('map.tags')"
                  multiple
                  chips
                  variant="outlined"
                  density="compact"
                  class="mb-3"></v-combobox>
            </v-col>
            <v-col cols="12">
              <v-card border class="pa-2 mb-4">
                <Textarea
                    :model-value="form.description"
                    @update:model-value="patch({ description: $event })"
                    :label="t('map.markerDescription')"
                    variant="outlined"
                    density="compact"
                    :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"></Textarea>
              </v-card>
            </v-col>
            <v-col cols="6">
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
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-4 py-3">
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
import {computed, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import type {PointFormData} from '@/assets/types/Map';
import Textarea from "@/components/textarea/index.vue";
import {useAssetsStore} from "~/stores/assetsStore";

const props = defineProps<{
  modelValue: boolean;
  form: PointFormData;
  userCollections: any[];
  saving: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'update:form', 'cancel', 'save']);

const {t, te} = useI18n();
const formRef = ref(null);

const mapImages = import.meta.glob('/src/assets/images/map/*.*', {eager: true});
const {serializationMap} = useAssetsStore();
const icons = ref<Record<string, string>>(serializationMap(mapImages));

const getCategoryIcon = (category: string) => {
  return icons.value[category] || icons.value['shareLocation'] || icons.value['default'] || '';
};

const categoryKeys = [
  'shareLocation',
  'den',
  'outpost',
  'settlement',
  'capitalSettlement',
  'foundry',
  'lumberyard',
  'weaver',
  'militaryBase',
  'megafort',
  'guardTower',
  'treasureMap',
  'shipwreck',
  'bounty',
  'mainContract',
  'sideContract',
  'archive',
  'abaka',
  'acacia',
  'bogIron',
  'cobalt',
  'coconut',
  'copper',
  'crocodile',
  'durian',
  'greenheart',
  'hemp',
  'hippopotamus',
  'iroko',
  'ironwood',
  'juniper',
  'jute',
  'linen',
  'magnetite',
  'mopane',
  'ndizi',
  'nickel',
  'pureIron',
  'ramie',
  'roselle',
  'screwpine',
  'shark',
  'sisal',
  'teak',
  'zinc'
];

const categoryOptions = computed(() => {
  return categoryKeys.map(cat => ({
    value: cat,
    text: te(`map.types.${cat}.name`)
        ? t(`map.types.${cat}.name`)
        : (cat === 'shareLocation' ? t('map.tabPoints') || '个人标记' : cat)
  }));
});

const isEdit = computed(() => !!(props.form as any).uuid);

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

const patch = (data: Partial<PointFormData>) => {
  emit('update:form', {...props.form, ...data});
};

const onSubmit = async () => {
  const {valid} = await (formRef.value as any).validate();
  if (valid) emit('save');
};

defineExpose({
  formRef
});

defineOptions({
  name: 'MapEditMarkerDialog'
});
</script>

<style scoped lang="less">
.create-marker-card {
  margin-top: -80px !important;
}
</style>
