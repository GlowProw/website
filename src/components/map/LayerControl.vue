<template>
  <v-navigation-drawer
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
      temporary
      absolute
      class="layer-control-panel"
      :scrim="false"
      :style="mobile ? modelValue ? 'min-width: 100%' : 'width: 0' : ''"
      :width="mobile ? '100vh' : 510">

    <AdsWidget id="none" class="px-7 my-5 w-100"></AdsWidget>

    <div>
      <v-card
          v-if="authStore.isLogin"
          tile
          elevation="0"
          class="bg-transparent">
        <div class="d-flex align-center py-4 px-7">
          <v-row align="center">
            <v-col cols="auto">
              <v-icon icon="mdi-map-marker-multiple" class="mr-2 text-amber"></v-icon>
              {{ t('map.layerCollection') }}
            </v-col>
            <v-col class="text-amber">
              <v-divider opacity=".2" thickness="2"></v-divider>
            </v-col>
            <v-col cols="auto">
              <v-btn icon variant="text" density="compact" to="/account/maps" target="_blank">
                <v-icon icon="mdi-cog"></v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </div>

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
        <div class="d-flex align-center py-4 px-7">
          <v-row align="center">
            <v-col cols="auto">
              <v-icon icon="mdi-layers" class="mr-2 text-amber"></v-icon>
              {{ t('map.layerControl') }}
            </v-col>
            <v-col class="text-amber">
              <v-divider opacity=".2" thickness="2"></v-divider>
            </v-col>
            <v-col cols="auto" class="d-flex ga-2">
              <v-btn
                  variant="tonal"
                  size="small"
                  @click="emit('toggle-all-layers')">
                <span>{{ allLayersVisible ? t('map.hideAll') : t('map.showAll') }}</span>
              </v-btn>
              <v-btn icon density="compact" variant="text" to="/account/maps" target="_blank">
                <v-icon icon="mdi-cog"></v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <v-card-text class="pa-0 pb-6">
          <!-- 集合 S -->
          <v-expansion-panels
              variant="default"
              class="bg-transparent"
              multiple
              :tile="true"
              v-model="panelOpen">
            <template v-for="(categories, groupName) in groupedCategories" :key="groupName">
              <v-expansion-panel
                  v-if="categories.length > 0"
                  class="bg-transparent"
                  elevation="0">
                <v-expansion-panel-title class="pa-0 px-8">
                  <div class="d-flex align-center w-100" @click.stop>
                    <div class="font-weight-bold" style="cursor: pointer" @click="toggleGroupPanel(groupName)">
                      <v-icon class="mr-2">mdi-selection-marker</v-icon>
                      {{ groupName === 'other' ? t('map.groups.other') : t(`map.groups.${groupName}`) }}
                    </div>
                    <v-spacer></v-spacer>
                    <v-checkbox
                        :model-value="groupVisibility[groupName]"
                        @update:model-value="emit('update:group-visibility', { group: groupName, visible: $event })"
                        hide-details
                        class="mr-2"
                        density="compact"></v-checkbox>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row density="compact" class="bg-transparent py-1 px-2">
                    <v-col cols="6"
                           v-for="category in categories"
                           :key="category.value">
                      <v-card border>
                        <div class="bg-black w-100 py-4">
                          <ItemSlotBase size="50px" class="mx-auto">
                            <v-img
                                :src="getCategoryIcon(category.value)"
                                cover/>
                          </ItemSlotBase>

                          <v-card hover variant="plain" class="position-absolute top-0 right-0 pa-2">
                            <a :href="`/codex/mapLocations?category=${category.value}`">
                              <v-icon>mdi-open-in-new</v-icon>
                            </a>
                          </v-card>
                        </div>
                        <v-row class="px-5 py-5" align="center">
                          <v-checkbox
                              density="compact"
                              :model-value="layerVisibility[category.value]"
                              @update:model-value="emit('update:layer-visibility', { category: category.value, visible: $event })"
                              hide-details
                              hide-spin-buttons></v-checkbox>
                          <div class="ml-2">
                            <p class="d-flex ga-2 singe-line">
                              <span>{{ category.text }}</span>
                            </p>
                            <p class="d-flex ga-2 singe-line text-caption">
                              <span class="opacity-60">{{ getCategoryCount(category.value) }} {{ t('map.locations') }}</span>
                            </p>
                          </div>
                        </v-row>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </template>
          </v-expansion-panels>

          <v-divider class="my-3"></v-divider>

          <!-- 面板 Markers S -->
          <v-list density="compact" class="bg-transparent px-3">
            <v-list-item v-if="authStore.isLogin">
              <template v-slot:prepend>
                <v-checkbox
                    :model-value="layerVisibility.shareLocation"
                    @update:model-value="emit('update:layer-visibility', { category: 'shareLocation', visible: $event })"
                    hide-details
                    class="mr-2"
                    density="compact"></v-checkbox>
                <v-card width="50" height="50" border class="bg-black mr-2 pa-1">
                  <ItemSlotBase size="40px" class="mx-auto">
                    <v-img
                        :src="getPersonalMarkerIcon()"
                        width="30"
                        height="30"
                        cover/>
                  </ItemSlotBase>
                </v-card>
              </template>
              <v-list-item-title>
                {{ t('map.personalMarkers') }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ personalMarkersCount }} {{ t('map.locations') }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <!-- 面板 Markers E -->

        </v-card-text>
      </v-card>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import {useDisplay} from 'vuetify/framework';
import {useAuthStore} from '~/stores/userAccountStore';
import AdsWidget from "@/components/ads/google/index.vue";
import {onMounted, ref, watch} from 'vue';
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {storage_account} from "@/assets/sripts/index";

const props = defineProps<{
  modelValue: boolean;
  selectedCollectionUuid: string;
  userCollectionsSelect: any[];
  allLayersVisible: boolean;
  availableCategories: any[];
  groupedCategories: Record<string, any[]>;
  layerVisibility: Record<string, boolean>;
  groupVisibility: Record<string, boolean>;
  getCategoryIcon: (category: string) => string;
  getCategoryCount: (category: string) => number;
  getPersonalMarkerIcon: () => string;
  personalMarkersCount: number;
}>();

const emit = defineEmits(['update:modelValue', 'update:selectedCollectionUuid', 'toggle-all-layers', 'update:layer-visibility', 'update:group-visibility', 'init-visibility']);

const {t} = useI18n();
const {mobile} = useDisplay();
const authStore = useAuthStore();

const panelOpen = ref<number[]>([]);

watch([props.groupVisibility, props.layerVisibility], (value: any) => {
  console.log(value)
  storage_account.updateConfiguration('map', 'marker.select', {
    groupVisibility: value[0],
    layerVisibility: value[1]
  })
}, {deep: true})

onMounted(() => {
  let d = storage_account.getConfigurationItem('map', 'marker.select')
  if (d) {
    emit('init-visibility', d);
  }
})

/**
 * 集合开关
 * @param groupName
 */
const toggleGroupPanel = (groupName: string) => {
  const keys = Object.keys(props.groupedCategories);
  const index = keys.indexOf(groupName);

  if (index !== -1) {
    const i = panelOpen.value.indexOf(index);
    if (i !== -1) {
      panelOpen.value.splice(i, 1);
    } else {
      panelOpen.value.push(index);
    }
  }
};

onMounted(() => {
  // Open all panels by default
  if (props.groupedCategories) {
    panelOpen.value = Object.keys(props.groupedCategories).map((_, i) => i);
  }
});


defineOptions({name: 'LayerControl'});
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
