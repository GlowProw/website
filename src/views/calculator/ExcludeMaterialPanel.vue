<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, ref} from "vue";
import {Materials} from "glow-prow-data";
import {useCalculatorStore} from "~/stores/calculatorStore";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {useDisplay} from "vuetify/framework";
import EmptyView from "@/components/EmptyView.vue";

const {t} = useI18n()
const store = useCalculatorStore()
const {mobile} = useDisplay()
const i18nReadName = useI18nReadName()

const materials: Record<string, any> = Materials
const searchQuery = ref('')
const selectedExcludeObj = ref(null)
const isSearchDialogOpen = ref(false)

const searchResults = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return []

  const results: Array<{ id: string, name: string }> = []

  for (const [key] of Object.entries(materials)) {
    if (results.length >= 15) break
    let localName = ''
    let displayName = key
    try {
      const nameData = i18nReadName.material(key)
      const name = nameData.name()
      if (typeof name === 'string') {
        localName = name.toLowerCase()
        displayName = name
      }
    } catch (e) {
      // fallback
    }

    if (key.toLowerCase().includes(query) || localName.includes(query)) {
      // 不显示已排除的
      if (!store.excludedMaterials.includes(key)) {
        results.push({id: key, name: displayName})
      }
    }
  }

  return results
})

function onAddExclude(id: string) {
  store.addExcludedMaterial(id)
  searchQuery.value = ''
}

function onConfirmAddExclude() {
  if (selectedExcludeObj.value) {
    onAddExclude(selectedExcludeObj.value.id || selectedExcludeObj.value.raw?.id)
    selectedExcludeObj.value = null
    isSearchDialogOpen.value = false
  }
}

function onRemoveExclude(id: string) {
  store.removeExcludedMaterial(id)
}
</script>

<template>
  <AffixBoxHasTitleView>
    <v-card variant="text" class="exclude-panel">
      <p class="text-caption opacity-60 mb-2">{{ t('calculator.exclude.description') }}</p>

      <v-dialog v-model="isSearchDialogOpen" max-width="580">
        <v-card border class="pa-5" :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 580">
          <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
            <v-icon size="80">mdi-plus</v-icon>
            <p>{{ t('calculator.exclude.title') }}</p>
          </v-card-title>

          <v-card-text>
                <v-autocomplete
                    v-model="selectedExcludeObj"
                    v-model:search="searchQuery"
                    :items="searchResults"
                    item-title="name"
                    item-value="id"
                return-object
                no-filter
                :placeholder="t('calculator.exclude.searchPlaceholder')"
                density="compact"
                variant="outlined"
                prepend-inner-icon="mdi-magnify"
                hide-details
                clearable>
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <ItemSlotBase size="25px" class="mr-2">
                      <MaterialIconWidget :id="item.raw.id" :padding="0" :margin="0"/>
                    </ItemSlotBase>
                  </template>
                </v-list-item>
              </template>
              <template v-slot:no-data>
                <EmptyView></EmptyView>
              </template>
            </v-autocomplete>
          </v-card-text>
          <v-card-actions class="px-5 pb-5">
            <v-spacer/>
            <v-btn variant="text" @click="isSearchDialogOpen = false">{{ t('basic.button.cancel') }}</v-btn>
            <v-btn variant="elevated" color="amber" class="text-black" :disabled="!selectedExcludeObj" @click="onConfirmAddExclude()">
              {{ t('basic.button.submit') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-card border v-if="store.excludedMaterials.length === 0" class="text-center py-6 opacity-50">
        <v-icon icon="mdi-filter-off" size="30" class="mb-1"/>
        <p class="text-body-2">{{ t('calculator.exclude.noExcludes') }}</p>
      </v-card>

      <div class="d-flex flex-wrap ga-2" v-else>
        <v-chip
            v-for="matId in store.excludedMaterials"
            :key="matId"
            closable
            variant="tonal"
            color="amber"
            size="large"
            @click:close="onRemoveExclude(matId)">
          <template v-slot:prepend>
            <ItemSlotBase size="30px" class="mr-1">
              <MaterialIconWidget :id="matId" :padding="0" :margin="0"/>
            </ItemSlotBase>
          </template>
          <MaterialName :id="matId"/>
        </v-chip>
      </div>
    </v-card>

    <template v-slot:title>
      <div class="d-flex align-center ga-2 flex-grow-1">
        <v-icon icon="mdi-filter-remove" class=""/>
        <span>{{ t('calculator.exclude.title') }}</span>
        <v-btn
            icon="mdi-plus"
            size="x-small"
            variant="tonal"
            color="amber"
            @click="isSearchDialogOpen = true"
        />
        <v-spacer/>
        <v-btn
            density="compact"
            icon="mdi-delete"
            variant="text"
            color="error"
            @click="store.clearExcludedMaterials()"
            v-if="store.excludedMaterials.length > 0"
            :title="t('basic.button.reset')"
        />
      </div>
    </template>
  </AffixBoxHasTitleView>
</template>

<style scoped lang="less">
.exclude-panel {
  .search-results-list {
    max-height: 250px;
    overflow-y: auto;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
  }
}
</style>
