<script setup lang="ts">
import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useCalculatorStore} from "~/stores/calculatorStore";
import {useNoticeStore} from "~/stores/noticeStore";
import {storageIntermediateTransfer, apis} from "@/assets/sripts";
import {StorageIntermediateTransferSaveType} from "@/assets/sripts/storage_assembly";
import EmptyView from "@/components/EmptyView.vue";

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'imported'): void
}>()

const {t} = useI18n()
const store = useCalculatorStore()
const noticeStore = useNoticeStore()

const assemblyDrafts = ref<any[]>([])
const importUid = ref('')
const importLoading = ref(false)

/**
 * 当对话框打开时，加载本地草稿列表
 */
watch(() => props.modelValue, (val) => {
  if (val) {
    onLoadDrafts()
  }
})

/**
 * 加载本地保存的配装草稿
 */
function onLoadDrafts() {
  const d = storageIntermediateTransfer.gets({
    saveType: StorageIntermediateTransferSaveType.Draft,
    category: 'assembly'
  })
  if (d.code === 0) {
    assemblyDrafts.value = d.data
  }
}

/**
 * 从本地草稿列表中导入配装
 * @param item 草稿项
 */
function onImportAssembly(item: any) {
  const assemblyData = item.assembly?.data || item.assembly
  if (assemblyData) {
    store.importAssembly(assemblyData)
    onClose()
    emit('imported')
  }
}

/**
 * 通过配装 ID (UID) 从服务器导入配装
 */
async function onImportByUid() {
  if (!importUid.value) return

  importLoading.value = true
  try {
    const result = await apis.assemblyApi().getAssemblyItem(importUid.value)
    const d = result.data
    if (d.data && d.data.assembly) {
      const assemblyData = d.data.assembly.data || d.data.assembly
      store.importAssembly(assemblyData)
      importUid.value = ''
      noticeStore.success(t('calculator.import.importSuccess'))
      onClose()
      emit('imported')
    } else {
      noticeStore.error(t('calculator.import.importError'))
    }
  } catch (e) {
    console.error(e)
    noticeStore.error(t('calculator.import.importError'))
  } finally {
    importLoading.value = false
  }
}

/**
 * 关闭对话框
 */
function onClose() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog
      :model-value="modelValue"
      @update:model-value="onClose"
      max-width="580">
    <v-card border>
      <v-card-title class="d-flex align-center pa-4">
        {{ t('calculator.import.importBuild') }}
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="onClose"></v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <div class="my-3">
        <!-- 通过 ID 导入 S -->
        <v-list class="pa-0">
          <v-list-item class="px-4 py-4" link>
            <v-text-field
                v-model="importUid"
                :label="t('calculator.import.importByUidPlaceholder')"
                density="comfortable"
                variant="outlined"
                color="amber"
                hide-details
                @keyup.enter="onImportByUid">
              <template v-slot:append-inner>
                <v-btn
                    :loading="importLoading"
                    :disabled="!importUid"
                    color="amber"
                    variant="text"
                    @click="onImportByUid">
                  {{ t('calculator.import.importByUid') }}
                </v-btn>
              </template>
            </v-text-field>
          </v-list-item>
        </v-list>
        <!-- 通过 ID 导入 E -->

        <div class="mb-2 px-4">
          <v-divider>{{ t('calculator.or') }}</v-divider>
        </div>

        <!-- 通过 草稿 S -->
        <v-list v-if="assemblyDrafts.length > 0" class="pa-0">
          <v-list-item
              v-for="item in assemblyDrafts"
              :key="item.id"
              @click="onImportAssembly(item)"
              class="pa-4">
            <v-list-item-title class="font-weight-bold">
              {{ item.id === 'quickArchiving' ? '快速储存草稿' : (item.name || '未命名配装') }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="item.id !== 'quickArchiving'" class="mt-1 opacity-60">
              ID: {{ item.id }}
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-btn variant="tonal" color="amber" size="small">
                {{ t('calculator.import.importBuild') }}
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
        <div v-else class="pa-10 text-center">
          <EmptyView :description="t('calculator.import.noBuildsFound')"></EmptyView>
        </div>
        <!-- 通过 草稿 E -->
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="less">
</style>
