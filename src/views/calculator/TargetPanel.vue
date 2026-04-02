<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, ref, watch} from "vue";
import {Items, Ships, Materials, Material} from "glow-prow-data";
import {useCalculatorStore} from "~/stores/calculatorStore";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ShipName from "@/components/snbWidget/shipName.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t} = useI18n()
const store = useCalculatorStore()

const items: Record<string, any> = Items
const ships: Record<string, any> = Ships

const searchQuery = ref('')
const searchType = ref<'item' | 'ship'>('item')
const addQuantity = ref(1)

// 搜索结果
const searchResults = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return []

  const source = searchType.value === 'item' ? items : ships
  const results: Array<{ id: string, type: 'item' | 'ship', hasRequired: boolean }> = []

  for (const [key, value] of Object.entries(source)) {
    if (results.length >= 20) break
    const data = value as any
    if (key.toLowerCase().includes(query) || (data.id && data.id.toLowerCase().includes(query))) {
      results.push({
        id: key,
        type: searchType.value,
        hasRequired: !!data.required
      })
    }
  }

  return results
})

function onAddTarget(id: string, type: 'item' | 'ship') {
  store.addTarget(id, type, addQuantity.value)
  searchQuery.value = ''
}

function onRemoveTarget(uid: string) {
  store.removeTarget(uid)
}

function onQuantityChange(uid: string, val: number) {
  store.updateTargetQuantity(uid, val)
}
</script>

<template>
  <AffixBoxHasTitleView>
    <v-card variant="text" class="target-panel">
      <v-card-title class="d-flex align-center ga-2">

      </v-card-title>

      <v-card-text>
        <!-- 搜索类型切换 -->
        <v-btn-toggle v-model="searchType" mandatory density="compact" class="mb-3" color="amber">
          <v-btn value="item" size="small">
            <v-icon icon="mdi-sword" class="mr-1" size="16"/>
            {{ t('calculator.targets.item') }}
          </v-btn>
          <v-btn value="ship" size="small">
            <v-icon icon="mdi-sail-boat" class="mr-1" size="16"/>
            {{ t('calculator.targets.ship') }}
          </v-btn>
        </v-btn-toggle>

        <!-- 搜索 + 数量 -->
        <v-row dense>
          <v-col>
            <v-text-field
                v-model="searchQuery"
                :placeholder="t('calculator.targets.searchPlaceholder')"
                density="compact"
                variant="outlined"
                prepend-inner-icon="mdi-magnify"
                hide-details
                clearable
            />
          </v-col>
          <v-col cols="auto">
            <v-text-field
                v-model.number="addQuantity"
                type="number"
                :min="1"
                density="compact"
                variant="outlined"
                hide-details
                style="width: 80px;"
                :label="t('calculator.targets.quantity')"
            />
          </v-col>
        </v-row>

        <!-- 搜索结果下拉 -->
        <v-list
            v-if="searchResults.length > 0"
            class="search-results-list mt-1"
            density="compact"
            elevation="4"
        >
          <v-list-item
              v-for="result in searchResults"
              :key="result.id"
              @click="onAddTarget(result.id, result.type)"
              :disabled="!result.hasRequired"
          >
            <template v-slot:prepend>
              <ItemSlotBase size="30px" :padding="0">
                <ItemIconWidget
                    v-if="result.type === 'item'"
                    :id="result.id"
                    :isOpenDetail="false"
                    :isShowOpenDetail="false"
                    :padding="0"
                    :margin="0"
                />
                <ShipIconWidget
                    v-else
                    :id="result.id"
                    :isOpenDetail="false"
                />
              </ItemSlotBase>
            </template>
            <v-list-item-title class="text-body-2 d-flex align-center ga-2">
              <ItemName v-if="result.type === 'item'" :data="items[result.id]"/>
              <ShipName v-else :id="result.id"/>
              <v-chip v-if="!result.hasRequired" size="x-small" color="grey" variant="tonal">
                无材料
              </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption opacity-50">
              {{ result.id }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-divider class="my-3"/>

        <!-- 已添加目标列表 -->
        <div v-if="store.targets.length === 0" class="text-center py-6 opacity-50">
          <v-icon icon="mdi-target" size="40" class="mb-2"/>
          <p class="text-body-2">{{ t('calculator.targets.noTargets') }}</p>
        </div>

        <TransitionGroup name="list" tag="div">
          <v-card
              v-for="target in store.targets"
              :key="target.uid"
              variant="tonal"
              class="mb-2 target-item"
          >
            <v-card-text class="pa-2 d-flex align-center ga-2">
              <ItemSlotBase size="35px" :padding="0">
                <ItemIconWidget
                    v-if="target.type === 'item'"
                    :id="target.id"
                    :isOpenDetail="false"
                    :isShowOpenDetail="false"
                    :padding="0"
                    :margin="0"
                />
                <ShipIconWidget
                    v-else
                    :id="target.id"
                    :isOpenDetail="false"
                />
              </ItemSlotBase>

              <div class="flex-grow-1">
                <p class="text-body-2 font-weight-medium">
                  <ItemName v-if="target.type === 'item'" :data="items[target.id]"/>
                  <ShipName v-else :id="target.id"/>
                </p>
                <p class="text-caption opacity-50">{{ target.id }}</p>
              </div>

              <v-text-field
                  :model-value="target.quantity"
                  @update:model-value="(val: any) => onQuantityChange(target.uid, Number(val))"
                  type="number"
                  :min="1"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="max-width: 80px;"
              />

              <v-btn
                  density="compact"
                  icon="mdi-close"
                  variant="text"
                  color="error"
                  size="small"
                  @click="onRemoveTarget(target.uid)"
              />
            </v-card-text>
          </v-card>
        </TransitionGroup>
      </v-card-text>
    </v-card>

    <template v-slot:title>
      <div>{{ t('calculator.targets.title') }}</div>
      <v-btn
          density="compact"
          icon="mdi-delete"
          variant="text"
          class="mt-5"
          color="error"
          @click="store.clearTargets()"
          v-if="store.targets.length > 0"
          :title="t('basic.button.reset')"/>
    </template>
  </AffixBoxHasTitleView>
</template>

<style scoped lang="less">
.target-panel {
  .search-results-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
  }

  .target-item {
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(255, 193, 7, 0.3);
    }
  }
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
