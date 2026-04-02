<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, ref} from "vue";
import {Materials} from "glow-prow-data";
import {useCalculatorStore} from "~/stores/calculatorStore";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t} = useI18n()
const store = useCalculatorStore()

const materials: Record<string, any> = Materials
const searchQuery = ref('')

const searchResults = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return []

  const results: Array<{ id: string }> = []

  for (const [key] of Object.entries(materials)) {
    if (results.length >= 15) break
    if (key.toLowerCase().includes(query)) {
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
      <v-card-title class="d-flex align-center ga-2">
        <v-spacer/>
        <v-btn
            density="compact"
            icon="mdi-delete-sweep"
            variant="text"
            color="error"
            @click="store.clearExcludedMaterials()"
            v-if="store.excludedMaterials.length > 0"
            :title="t('basic.button.reset')"
        />
      </v-card-title>

      <v-card-text>
        <p class="text-caption opacity-60 mb-2">{{ t('calculator.exclude.description') }}</p>

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

        <v-divider class="my-3"/>

        <div v-if="store.excludedMaterials.length === 0" class="text-center py-4 opacity-50">
          <v-icon icon="mdi-filter-off" size="30" class="mb-1"/>
          <p class="text-body-2">{{ t('calculator.exclude.noExcludes') }}</p>
        </div>

        <div class="d-flex flex-wrap ga-2" v-else>
          <v-chip
              v-for="matId in store.excludedMaterials"
              :key="matId"
              closable
              variant="tonal"
              color="orange"
              size="small"
              @click:close="onRemoveExclude(matId)"
          >
            <template v-slot:prepend>
              <ItemSlotBase size="18px" :padding="0" class="mr-1">
                <MaterialIconWidget :id="matId" :padding="0" :margin="0"/>
              </ItemSlotBase>
            </template>
            <MaterialName :id="matId"/>
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <template v-slot:title>
      <v-icon icon="mdi-filter-remove" class="mb-2"/>
      <span>{{ t('calculator.exclude.title') }}</span>
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
