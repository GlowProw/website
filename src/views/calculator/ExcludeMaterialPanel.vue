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

const {t} = useI18n()
const store = useCalculatorStore()
const i18nReadName = useI18nReadName()

const materials: Record<string, any> = Materials
const searchQuery = ref('')
const isSearchDialogOpen = ref(false)

const searchResults = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return []

  const results: Array<{ id: string }> = []

  for (const [key] of Object.entries(materials)) {
    if (results.length >= 15) break
    let localName = ''
    try {
      const nameData = i18nReadName.material(key)
      const name = nameData.name()
      if (typeof name === 'string') localName = name.toLowerCase()
    } catch (e) {
      // fallback
    }

    if (key.toLowerCase().includes(query) || localName.includes(query)) {
      // 不显示已排除的
      if (!store.excludedMaterials.includes(key)) {
        results.push({id: key})
      }
    }
  }

  return results
})

function onAddExclude(id: string) {
  store.addExcludedMaterial(id)
  searchQuery.value = ''
}

function onRemoveExclude(id: string) {
  store.removeExcludedMaterial(id)
}
</script>

<template>
  <AffixBoxHasTitleView>
    <v-card variant="text" class="exclude-panel">
      <p class="text-caption opacity-60 mb-2">{{ t('calculator.exclude.description') }}</p>

      <v-dialog v-model="isSearchDialogOpen" max-width="500">
        <v-card>
          <v-card-title>{{ t('calculator.exclude.title') }}</v-card-title>
          <v-card-text>
            <v-text-field
                v-model="searchQuery"
                :placeholder="t('calculator.exclude.searchPlaceholder')"
                density="compact"
                variant="outlined"
                prepend-inner-icon="mdi-magnify"
                hide-details
                clearable
            />

            <v-list
                v-if="searchResults.length > 0"
                class="search-results-list mt-1"
                density="compact"
                elevation="4"
            >
              <v-list-item
                  v-for="result in searchResults"
                  :key="result.id"
                  @click="onAddExclude(result.id)"
              >
                <template v-slot:prepend>
                  <ItemSlotBase size="25px" :padding="0">
                    <MaterialIconWidget :id="result.id" :padding="0" :margin="0"/>
                  </ItemSlotBase>
                </template>
                <v-list-item-title class="text-body-2">
                  <MaterialName :id="result.id"/>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption opacity-50">
                  {{ result.id }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer/>
            <v-btn variant="text" @click="isSearchDialogOpen = false">{{ t('basic.button.cancel') }}</v-btn>
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
            size="small"
            @click:close="onRemoveExclude(matId)">
          <template v-slot:prepend>
            <ItemSlotBase size="18px" :padding="0" class="mr-1">
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
