<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRouter} from 'vue-router'
import {storeToRefs} from 'pinia'
import SwipeDrawer from '@/components/SwipeDrawer.vue'
import CodexHistory from '@/components/CodexHistory.vue'
import {storage} from '@/assets/sripts/index'
import {getCodexDetailPath} from '@/assets/sripts/codex_detail'
import {usePageHotkeys} from '@/assets/sripts/page_hotkeys'
import {useCodexHistoryDrawerStore} from '~/stores/codexHistoryDrawerStore'

const {t} = useI18n()
const router = useRouter()
const codexHistoryDrawerStore = useCodexHistoryDrawerStore()

// 抽屉开合状态与全局快捷键共享，展开时才渲染浏览记录并读取本地会话数据
const {open} = storeToRefs(codexHistoryDrawerStore)
// 清空记录后递增，强制浏览记录组件重新挂载
const historyKey = ref(0)
// 键盘导航当前选中的浏览记录下标
const selectedIndex = ref(0)

const HISTORY_KEY = 'codex.history'

/**
 * 读取当前浏览记录列表
 */
const getRecords = (): any[] => {
  const d = storage.session.get(HISTORY_KEY)
  if (d.code < 0 || !d.data?.value) return []
  return Object.values(d.data.value)
}

// 当前浏览记录总数，用于键盘导航越界处理
const recordCount = ref(0)
// 当前选中记录的唯一标识，供列表高亮
const selectedId = computed(() => {
  const record = getRecords()[selectedIndex.value]
  return record ? (record as any).id : ''
})

/**
 * 同步记录总数并修正选中下标
 */
const onSyncSelection = () => {
  const records = getRecords()
  recordCount.value = records.length
  if (selectedIndex.value >= recordCount.value) {
    selectedIndex.value = Math.max(recordCount.value - 1, 0)
  }
}

/**
 * 清空浏览记录
 */
const onClearHistory = () => {
  storage.session.rem(HISTORY_KEY)
  historyKey.value++
  selectedIndex.value = 0
  recordCount.value = 0
}

/**
 * 上移选中的浏览记录
 */
const onSelectPrev = () => {
  onSyncSelection()
  if (recordCount.value <= 0) return
  selectedIndex.value = (selectedIndex.value - 1 + recordCount.value) % recordCount.value
}

/**
 * 下移选中的浏览记录
 */
const onSelectNext = () => {
  onSyncSelection()
  if (recordCount.value <= 0) return
  selectedIndex.value = (selectedIndex.value + 1) % recordCount.value
}

/**
 * 打开当前选中的浏览记录
 */
const onOpenSelected = () => {
  const record = getRecords()[selectedIndex.value]
  if (!record) return
  open.value = false
  router.push(getCodexDetailPath((record as any).category, (record as any).id)).catch(() => {
  })
}

/**
 * 移除当前选中的浏览记录
 */
const onDeleteSelected = () => {
  const records = getRecords()
  const record: any = records[selectedIndex.value]
  if (!record) return
  const nextRecords = records.filter((item: any) => item.id !== record.id)
  storage.session.set(HISTORY_KEY, nextRecords.reduce((mapping: Record<string, any>, item: any) => {
    mapping[item.id] = item
    return mapping
  }, {}))
  historyKey.value++
  onSyncSelection()
}

usePageHotkeys({
  historyPrev: onSelectPrev,
  historyNext: onSelectNext,
  historyOpen: onOpenSelected,
  historyDelete: onDeleteSelected,
}, {
  active: () => open.value,
})

watch(open, (isOpen) => {
  if (isOpen) {
    selectedIndex.value = 0
    onSyncSelection()
  }
})

defineOptions({
  name: 'CodexHistoryDrawer'
})
</script>

<template>
  <div @click.prevent="open = true">
    <slot></slot>
  </div>

  <SwipeDrawer v-model="open" side="right" width="90vw" max-width="720px">
    <v-card tile variant="text" class="codex-history-drawer d-flex flex-column h-100 border-l">
      <div class="d-flex align-center px-4 py-2 border-bottom flex-shrink-0">
        <v-icon icon="mdi-history" class="mr-2"></v-icon>
        <span class="text-h6">{{ t('codex.cabinetHistoryTitle') }}</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-delete-outline" variant="text" :aria-label="t('common.delete')" @click="onClearHistory"></v-btn>
        <v-btn icon="mdi-close" variant="text" :aria-label="t('common.close')" @click="open = false"></v-btn>
      </div>

      <div class="flex-grow-1 overflow-y-auto pa-4">
        <!-- 浏览记录 -->
        <CodexHistory
            v-if="open"
            :key="historyKey"
            :selected-id="selectedId"
            :is-show-header="false"
            :is-show-empty="true"/>
      </div>
    </v-card>
  </SwipeDrawer>
</template>

<style scoped lang="less">
.codex-history-drawer {
  background-color: transparent;
}
</style>
