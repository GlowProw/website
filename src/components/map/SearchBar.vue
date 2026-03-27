<template>
  <v-card border class="d-flex map-search-bar"
          :width="mobile ? 'calc(100% - 60px)' : 450"
          :style="{'top': mobile ? '80px' : '80px'}">
    <v-combobox
        v-model="model"
        v-model:search="search"
        :items="searchSuggestions"
        tile
        elevation="0"
        hide-details
        variant="solo"
        clearable
        class="bg-transparent"
        density="comfortable"
        :menu-props="{ maxHeight: '450px' }"
        :placeholder="t('map.searchPlaceholder')"
        @keydown.enter="emit('search')"
        prepend-inner-icon="mdi-magnify">
      <template v-slot:item="{ props, item }">
        <v-list-item v-bind="props">
          <template v-slot:prepend>
            <v-img
                :src="getCategoryIcon(item.raw.category)"
                width="24"
                height="24"
                class="mr-2"
                cover/>
          </template>
          <template v-slot:title>
            <MapLocationName :id="item.raw.id" v-if="item.raw.id"></MapLocationName>
          </template>
        </v-list-item>
      </template>
    </v-combobox>

    <v-divider vertical></v-divider>
    <v-btn tile stacked density="compact" @click="emit('toggle-layers')">
      <v-icon :class="isLayerPanelVisible ? 'text-amber' : ''" :icon="`mdi-layers${!isLayerPanelVisible ? '-outline' : ''}`"></v-icon>
    </v-btn>

    <FullscreenBtn @update:isFull="emit('update:fullscreen', $event)"></FullscreenBtn>
  </v-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify/framework';
import MapLocationName from "@/components/snbWidget/mapLocationName.vue";
import FullscreenBtn from "@/components/FullscreenBtn.vue";

const model = defineModel<any | null>({ required: true });
const search = defineModel<string>('search', { required: true });

defineProps<{
  searchSuggestions: any[];
  isLayerPanelVisible: boolean;
  getCategoryIcon: (category: string) => string;
}>();

const emit = defineEmits(['search', 'toggle-layers', 'update:fullscreen']);

const { t } = useI18n();
const { mobile } = useDisplay();

defineOptions({ name: 'SearchBar' });
</script>

<style scoped>
.map-search-bar {
  background-color: hsl(from rgb(var(--v-theme-background)) h s l / .8);
  position: absolute;
  top: 30px;
  left: 30px;
  z-index: 40;
  min-width: 300px;
}
</style>
