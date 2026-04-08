<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, ref} from "vue";
import {Items, Materials, Ships} from "glow-prow-data";
import {useCalculatorStore} from "~/stores/calculatorStore";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ShipName from "@/components/snbWidget/shipName.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {useDisplay} from "vuetify/framework";
import EmptyView from "@/components/EmptyView.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";

const {t} = useI18n()
const store = useCalculatorStore()
const {mobile} = useDisplay()
const i18nReadName = useI18nReadName()

const items: Record<string, any> = Items
const ships: Record<string, any> = Ships
const material: Record<string, any> = Materials

const searchQuery = ref('')
const searchType = ref<'item' | 'ship' | 'material'>('item')
const addQuantity = ref(1)
const selectedTargetObj = ref(null)
const fileInput = ref<HTMLInputElement | null>(null)
const importType = ref<'json' | 'csv'>('json')

const isSearchDialogOpen = ref(store.targets.length === 0)

// 搜索结果
const searchResults = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return []

  let source = null

  switch (searchType.value) {
    case 'ship':
      source = ships
      break
    case 'item':
      source = items
      break
    case 'material':
      source = material
      break
  }

  const results: Array<{ id: string, type: 'item' | 'ship' | 'material', hasRequired: boolean }> = []

  for (const [key, value] of Object.entries(source)) {
    if (results.length >= 20) break
    const data = value as any
    let localName = ''
    let displayName = key
    try {
      let nameData = null;

      switch (searchType.value) {
        case 'ship':
          nameData = i18nReadName.ship(key)
          break
        case 'item':
          nameData = i18nReadName.item(key)
          break
        case 'material':
          nameData = i18nReadName.material(key)
          break
      }

      const name = nameData.name()
      if (typeof name === 'string') {
        localName = name.toLowerCase()
        displayName = name
      }
    } catch (e) {
      // fallback
    }

    if (key.toLowerCase().includes(query) || localName.includes(query) || (data.id && data.id.toLowerCase().includes(query))) {
      results.push({
        id: key,
        name: displayName,
        type: searchType.value,
        hasRequired: !!data.required
      } as any)
    }
  }

  return results.slice(0, 50)
})

function onAddTarget(id: string, type: 'item' | 'ship' | 'material') {
  store.addTarget(id, type, addQuantity.value)
  searchQuery.value = ''
}

function onConfirmAddTarget() {
  if (selectedTargetObj.value) {
    onAddTarget(selectedTargetObj.value.id, selectedTargetObj.value.type || selectedTargetObj.value.raw?.type)
    selectedTargetObj.value = null
    isSearchDialogOpen.value = false
  }
}

function onRemoveTarget(uid: string) {
  store.removeTarget(uid)
}

function onQuantityChange(uid: string, val: number) {
  store.updateTargetQuantity(uid, val)
}

function triggerImport(type: 'json' | 'csv') {
  importType.value = type
  if (fileInput.value) {
    fileInput.value.value = ''
    fileInput.value.accept = type === 'json' ? '.json' : '.csv'
    fileInput.value.click()
  }
}

function onFileImport(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  store.importFile(file, importType.value)
  isSearchDialogOpen.value = false
}
</script>

<template>
  <AffixBoxHasTitleView>
    <v-card variant="text" class="target-panel">
      <v-dialog v-model="isSearchDialogOpen" max-width="500">
        <v-card border class="pa-5" :min-width="mobile ? '100%' : 350" :width="mobile ? '100%' : 580">
          <v-card-title class="py-10 text-center bg-black mb-4 mx-n5 mt-n5">
            <v-icon size="80">mdi-plus</v-icon>
            <p>{{ t('calculator.targets.addTarget') }}</p>
          </v-card-title>
          <v-card-text>
            <v-select
                v-model="searchType"
                :items="[
                { title: t('calculator.targets.item'), value: 'item' },
                { title: t('calculator.targets.ship'), value: 'ship' },
                { title: t('calculator.targets.material'), value: 'material' }
              ]"
                density="compact"
                variant="outlined"
                class="mb-3">
              <template v-slot:no-data>
                <EmptyView></EmptyView>
              </template>
            </v-select>

            <!-- 搜索 + 数量 -->
            <v-row dense>
              <v-col>
                <v-autocomplete
                    v-model="selectedTargetObj"
                    v-model:search="searchQuery"
                    :items="searchResults"
                    item-title="name"
                    item-value="id"
                    return-object
                    no-filter
                    :placeholder="t('calculator.targets.searchPlaceholder')"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="mdi-magnify"
                    hide-details
                    clearable>
                  <template v-slot:item="{ props, item }">
                    <v-list-item
                        v-bind="props"
                        three-line
                        :disabled="!item.raw.hasRequired">
                      <template v-slot:prepend>
                        <ItemSlotBase size="30px" class="mr-2">
                          <ItemIconWidget
                              v-if="item.raw.type === 'item'"
                              :id="item.raw.id"
                              :isOpenDetail="false"/>
                          <ShipIconWidget
                              v-if="item.raw.type === 'ship'"
                              :id="item.raw.id"
                              :isOpenDetail="false"/>
                          <MaterialIconWidget
                              v-if="item.raw.type === 'material'"
                              :id="item.raw.id"
                              :isOpenDetail="false"/>
                        </ItemSlotBase>
                      </template>
                      <template v-slot:append>
                        <v-chip v-if="!item.raw.hasRequired" size="x-small" color="orange" variant="tonal">{{ t('calculator.ui.hasNotRequired') }}</v-chip>
                      </template>
                    </v-list-item>
                  </template>
                  <template v-slot:no-data>
                    <EmptyView></EmptyView>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols="auto">
                <v-combobox
                    v-model.number="addQuantity"
                    :items="[1, 5, 10, 50, 100]"
                    type="number"
                    :min="1"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="width: 200px;"
                    :label="t('calculator.targets.quantity')">
                  <template v-slot:no-data>
                    <EmptyView></EmptyView>
                  </template>
                </v-combobox>
              </v-col>
            </v-row>

            <div class="mt-10">
              <v-divider>{{ t('calculator.or') }}</v-divider>

              <!-- 导入 -->
              <v-list density="compact" slim>
                <v-list-item @click="triggerImport('json')">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-code-json"/>
                  </template>
                  <v-list-item-title>{{ t('calculator.import.json') }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="triggerImport('csv')">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-file-delimited"/>
                  </template>
                  <v-list-item-title>{{ t('calculator.import.csv') }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
          <v-card-actions class="px-5 pb-5">
            <v-spacer/>
            <v-btn variant="text" @click="isSearchDialogOpen = false">{{ t('basic.button.cancel') }}</v-btn>
            <v-btn variant="elevated" color="amber" class="text-black" :disabled="!selectedTargetObj" @click="onConfirmAddTarget()">
              {{ t('basic.button.submit') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 已添加目标列表 -->
      <v-card border v-if="store.targets.length === 0" class="text-center py-6 opacity-50">
        <v-icon icon="mdi-target" size="40" class="mb-2"/>
        <p class="text-body-2">{{ t('calculator.targets.noTargets') }}</p>
      </v-card>

      <TransitionGroup name="list" tag="div">
        <v-card
            v-for="target in store.targets"
            :key="target.uid"
            variant="flat"
            class="mb-2 target-item">
          <div class="pl-2 py-0 d-flex align-center">
            <ItemSlotBase size="40px" :padding="0">
              <ItemIconWidget
                  v-if="target.type === 'item'"
                  :id="target.id"/>
              <ShipIconWidget
                  v-if="target.type === 'ship'"
                  :id="target.id"/>
              <MaterialIconWidget
                  v-if="target.type === 'material'"
                  :id="target.id"/>
            </ItemSlotBase>

            <div class="flex-grow-1 py-1 ml-2">
              <p class="text-body-2 font-weight-medium">
                <ItemName v-if="target.type === 'item'" :data="items[target.id]"/>
                <ShipName v-if="target.type === 'ship'" :id="target.id"/>
                <MaterialName v-if="target.type === 'material'" :id="target.id"></MaterialName>
              </p>
            </div>

            <v-text-field
                :model-value="target.quantity"
                @update:model-value="(val: any) => onQuantityChange(target.uid, Number(val))"
                type="number"
                :min="1"
                elevation="0"
                density="comfortable"
                tile
                variant="solo-filled"
                hide-details
                style="max-width: 80px;height: 47px;"/>

            <v-divider vertical thickness="1"></v-divider>

            <v-btn
                class=""
                icon="mdi-close"
                variant="text"
                tile
                color="error"
                @click="onRemoveTarget(target.uid)"/>
          </div>
        </v-card>
      </TransitionGroup>
    </v-card>

    <template v-slot:title>
      <div class="d-flex align-center ga-2 flex-grow-1">
        <span>{{ t('calculator.targets.title') }}</span>
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
            @click="store.clearTargets()"
            v-if="store.targets.length > 0"
            :title="t('basic.button.reset')"/>
      </div>
    </template>
  </AffixBoxHasTitleView>

  <!-- 配置文件上传 -->
  <input type="file" ref="fileInput" @change="onFileImport" style="display: none"/>
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
