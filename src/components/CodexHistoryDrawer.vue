<script setup lang="ts">
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {storeToRefs} from 'pinia'
import SwipeDrawer from '@/components/SwipeDrawer.vue'
import CodexHistory from '@/components/CodexHistory.vue'
import {storage} from '@/assets/sripts/index'
import {useCodexHistoryDrawerStore} from '~/stores/codexHistoryDrawerStore'

const {t} = useI18n()
const codexHistoryDrawerStore = useCodexHistoryDrawerStore()

// 抽屉开合状态与全局快捷键共享，展开时才渲染浏览记录并读取本地会话数据
const {open} = storeToRefs(codexHistoryDrawerStore)
// 清空记录后递增，强制浏览记录组件重新挂载
const historyKey = ref(0)

/**
 * 清空浏览记录
 */
const onClearHistory = () => {
  storage.session.rem('codex.history')
  historyKey.value++
}

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
        <!-- 展开时才挂载，读取会话中的浏览记录 -->
        <CodexHistory
            v-if="open"
            :key="historyKey"
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
