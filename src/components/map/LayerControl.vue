<template>
  <v-navigation-drawer
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
      temporary
      absolute
      tile
      class="layer-control-panel"
      :scrim="false"
      :style="mobile ? modelValue ? 'min-width: 100%' : 'width: 0' : ''"
      :width="mobile ? '100vh' : 510">

    <div class="px-7 my-5 w-100">
      <AdsWidget id="none"></AdsWidget>
    </div>

    <div>
      <v-card
          v-if="authStore.isLogin"
          tile
          elevation="0"
          class="bg-transparent">
        <v-card-title class="d-flex align-center py-4 px-7">
          <v-icon icon="mdi-map-marker-multiple" class="mr-2 text-amber"></v-icon>
          {{ t('map.layerCollection') }}
          <v-btn size="x-small" variant="tonal">BETA</v-btn>
          <v-spacer></v-spacer>
          <v-btn density="compact" to="/account/maps" target="_blank">
            <v-icon icon="mdi-cog"></v-icon>
          </v-btn>
        </v-card-title>

        <v-select
            :model-value="selectedCollectionUuid"
            @update:model-value="emit('update:selectedCollectionUuid', $event)"
            :items="userCollectionsSelect"
            item-title="title"
            item-value="uuid"
            density="compact"
            variant="outlined"
            hide-details
            :placeholder="t('map.selectCollection')"
            class="collection-selector mx-9">
        </v-select>
      </v-card>

      <v-card
          tile
          elevation="0"
          class="bg-transparent"
          width="100%"
          height="100%">
        <v-card-title class="d-flex align-center py-4 px-7">
          <v-icon icon="mdi-layers" class="mr-2 text-amber"></v-icon>
          {{ t('map.layerControl') }}
          <v-spacer></v-spacer>
          <v-btn
              variant="text"
              size="small"
              @click="emit('toggle-all-layers')">
            {{ allLayersVisible ? t('map.hideAll') : t('map.showAll') }}
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-0 px-3">
          <v-list density="compact" class="bg-transparent">
            <v-list-item
                v-for="category in availableCategories"
                :key="category.value">
              <template v-slot:prepend>
                <v-checkbox
                    :model-value="layerVisibility[category.value]"
                    @update:model-value="emit('update:layer-visibility', { category: category.value, visible: $event })"
                    hide-details
                    class="mr-2"
                    density="compact"></v-checkbox>
                <v-img
                    :src="getCategoryIcon(category.value)"
                    width="20"
                    height="20"
                    class="mr-3"
                    cover/>
              </template>
              <v-list-item-title>
                {{ category.text }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ getCategoryCount(category.value) }} {{ t('map.locations') }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="authStore.isLogin && layerVisibility.shareLocation">
              <template v-slot:prepend>
                <v-checkbox
                    :model-value="layerVisibility.shareLocation"
                    @update:model-value="emit('update:layer-visibility', { category: 'shareLocation', visible: $event })"
                    hide-details
                    class="mr-2"
                    density="compact"></v-checkbox>
                <v-img
                    :src="getPersonalMarkerIcon()"
                    width="20"
                    height="20"
                    class="mr-3"
                    cover/>
              </template>
              <v-list-item-title>
                {{ t('map.personalMarkers') }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ personalMarkersCount }} {{ t('map.locations') }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify/framework';
import { useAuthStore } from '~/stores/userAccountStore';
import AdsWidget from "@/components/ads/google/index.vue";

defineProps<{
  modelValue: boolean;
  selectedCollectionUuid: string;
  userCollectionsSelect: any[];
  allLayersVisible: boolean;
  availableCategories: any[];
  layerVisibility: Record<string, boolean>;
  getCategoryIcon: (category: string) => string;
  getCategoryCount: (category: string) => number;
  getPersonalMarkerIcon: () => string;
  personalMarkersCount: number;
}>();

const emit = defineEmits(['update:modelValue', 'update:selectedCollectionUuid', 'toggle-all-layers', 'update:layer-visibility']);

const { t } = useI18n();
const { mobile } = useDisplay();
const authStore = useAuthStore();

defineOptions({ name: 'LayerControl' });
</script>

<style scoped>
.layer-control-panel {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.67);
  backdrop-filter: blur(70px);
  top: 0 !important;
  left: 0;
  padding-top: 136px;
  height: calc(100vh - 100px) !important;
  overflow-y: auto;
  z-index: 30 !important;
}
</style>
