<script setup lang="ts">
/**
 * 全局快捷键绑定设置视图
 * 支持组合按键（如 cmd+k、ctrl+s、alt+f 等）捕获录入、冲突检测与系统默认重置
 */
import {computed, onBeforeUnmount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {type HotkeyItem, useHotkeysStore} from '~/stores/hotkeysStore'
import {useOS} from '@/assets/sripts/os'
import {VHotkey} from 'vuetify/components/VHotkey'
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t} = useI18n()
const hotkeysStore = useHotkeysStore()
const {os} = useOS()

/**
 * 根据操作系统检测当前运行平台类型，供 VHotkey 自适应平台符号与修饰键展示
 */
const currentPlatform = computed<'auto' | 'mac' | 'pc'>(() => {
  const osType = os.value
  if (osType === 'MacOS' || osType === 'iOS') return 'mac'
  return 'pc'
})

// 当前正在录制按键的动作 ID
const recordingActionId = ref<string | null>(null)
// 通知提示条状态
const snackbar = ref({show: false, text: '', color: 'success'})

/**
 * 弹出提示消息
 * @param text 消息内容
 * @param color 颜色类型
 */
const notify = (text: string, color = 'success') => {
  snackbar.value = {show: true, text, color}
}

/**
 * 按分类聚合快捷键列表
 */
const categorizedHotkeys = computed(() => {
  const groups: Record<string, HotkeyItem[]> = {
    workshop: [],
    global: [],
  }
  for (const item of hotkeysStore.hotkeyList) {
    if (!groups[item.category]) {
      groups[item.category] = []
    }
    groups[item.category].push(item)
  }
  return groups
})

/**
 * 开始录制某个快捷键动作
 * @param item 目标快捷键项
 */
const startRecording = (item: HotkeyItem) => {
  recordingActionId.value = item.id
  window.addEventListener('keydown', onKeyDownCapture, true)
}

/**
 * 停止按键录制
 */
const stopRecording = () => {
  recordingActionId.value = null
  window.removeEventListener('keydown', onKeyDownCapture, true)
}

/**
 * 录制中的组合键盘事件捕获处理
 * 支持识别单键与各种组合修饰键（cmd、ctrl、alt、shift 等）
 * @param e 键盘事件
 */
const onKeyDownCapture = (e: KeyboardEvent) => {
  if (!recordingActionId.value) return

  e.preventDefault()
  e.stopPropagation()

  // 按单一 ESC 退出当前录制而不修改
  if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && recordingActionId.value !== 'closeModal') {
    stopRecording()
    return
  }

  const keyLower = e.key.toLowerCase()
  // 若当前仅按下了修饰键本身，保持等待主功能按键按下
  if (['control', 'meta', 'alt', 'shift'].includes(keyLower)) {
    return
  }

  // 构建组合键标准字符串
  const parts: string[] = []
  if (e.metaKey) {
    parts.push(currentPlatform.value === 'mac' ? 'cmd' : 'win')
  }
  if (e.ctrlKey) {
    parts.push('ctrl')
  }
  if (e.altKey) {
    parts.push(currentPlatform.value === 'mac' ? 'option' : 'alt')
  }
  if (e.shiftKey) {
    parts.push('shift')
  }

  // 主按键处理
  let mainKey = keyLower
  if (mainKey === ' ') mainKey = 'space'
  parts.push(mainKey)

  const combinedKey = parts.join('+')

  const result = hotkeysStore.updateKey(recordingActionId.value, combinedKey)
  if (result.success) {
    if (result.conflictId) {
      notify(t('setting.hotkeys.conflictWarning', {key: combinedKey}), 'warning')
    } else {
      notify(t('setting.hotkeys.updateSuccess', {key: combinedKey}), 'success')
    }
  } else {
    notify(t('setting.hotkeys.updateFailed'), 'error')
  }

  stopRecording()
}

/**
 * 恢复所有快捷键至默认绑定
 */
const onResetDefaults = () => {
  hotkeysStore.resetToDefaults()
  notify(t('setting.hotkeys.resetSuccess'), 'info')
}

onBeforeUnmount(() => {
  stopRecording()
})

defineOptions({
  name: 'PortalSettingHotkeys'
})
</script>

<template>
  <v-row class="setting-hotkeys-container">
    <v-col cols="12" lg="4" class="setting-hotkeys-header mb-3">
      <v-row class="d-flex align-center justify-space-between flex-wrap ga-3">
        <v-col cols="auto">
          <p>
            {{ t('setting.hotkeys.subtitle') }}
          </p>
        </v-col>

        <v-btn
            variant="tonal"
            block
            prepend-icon="mdi-restore"
            @click="onResetDefaults">
          {{ t('setting.hotkeys.resetDefaults') }}
        </v-btn>
      </v-row>
    </v-col>

    <!-- 分组快捷键列表 -->
    <v-col cols="12" lg="8" class="setting-hotkeys-groups">
      <!-- 工坊快捷键 S -->
      <AffixBoxHasTitleView>
        <template v-slot:title>
          {{ t('setting.hotkeys.groupWorkshop') }}
        </template>

        <div class="setting-hotkeys-group mb-6">
          <v-card class="setting-hotkeys-card">
            <v-list class="bg-transparent pa-0">
              <template v-for="(item, idx) in categorizedHotkeys.workshop" :key="item.id">
                <v-list-item class="py-3 px-4">
                  <v-list-item-title class="font-weight-medium text-white mb-1">
                    {{ t(item.nameKey) }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption text-medium-emphasis">
                    {{ t(item.descriptionKey) || t('setting.hotkeys.defaultDesc') }}
                  </v-list-item-subtitle>

                  <template #append>
                    <v-btn
                        v-if="recordingActionId === item.id"
                        size="small"
                        color="amber"
                        variant="flat"
                        class="setting-hotkeys-key-btn recording pulse-anim">
                      {{ t('setting.hotkeys.pressCombination') }}
                    </v-btn>
                    <div
                        v-else
                        class="setting-hotkeys-badge-wrapper cursor-pointer"
                        :title="t('setting.hotkeys.clickToRecord')"
                        @click="startRecording(item)">
                      <v-hotkey
                          :keys="item.currentKey"
                          display-mode="symbol"
                          variant="elevated"
                          :platform="currentPlatform"/>
                    </div>
                  </template>
                </v-list-item>
                <v-divider v-if="idx < categorizedHotkeys.workshop.length - 1"></v-divider>
              </template>
            </v-list>
          </v-card>
        </div>
      </AffixBoxHasTitleView>
      <!-- 工坊快捷键 E -->

      <!-- 全局通用快捷键 S -->
      <AffixBoxHasTitleView>
        <template v-slot:title>
          {{ t('setting.hotkeys.groupGlobal') }}
        </template>

        <div class="setting-hotkeys-group mb-6">
          <v-card class="setting-hotkeys-card">
            <v-list class="bg-transparent pa-0">
              <template v-for="(item, idx) in categorizedHotkeys.global" :key="item.id">
                <v-list-item class="py-3 px-4">
                  <v-list-item-title class="font-weight-medium text-white mb-1">
                    {{ t(item.nameKey) }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption text-medium-emphasis">
                    {{ t(item.descriptionKey) || t('setting.hotkeys.defaultDesc') }}
                  </v-list-item-subtitle>

                  <template #append>
                    <v-btn
                        v-if="recordingActionId === item.id"
                        size="small"
                        color="amber"
                        variant="flat"
                        class="setting-hotkeys-key-btn recording pulse-anim">
                      {{ t('setting.hotkeys.pressCombination') }}
                    </v-btn>
                    <div
                        v-else
                        class="setting-hotkeys-badge-wrapper cursor-pointer"
                        :title="t('setting.hotkeys.clickToRecord')"
                        @click="startRecording(item)">
                      <v-hotkey
                          :keys="item.currentKey"
                          display-mode="symbol"
                          variant="elevated"
                          :platform="currentPlatform"/>
                    </div>
                  </template>
                </v-list-item>
                <v-divider v-if="idx < categorizedHotkeys.global.length - 1"></v-divider>
              </template>
            </v-list>
          </v-card>
        </div>
      </AffixBoxHasTitleView>
      <!-- 全局通用快捷键 E -->
    </v-col>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500" location="bottom end">
      {{ snackbar.text }}
    </v-snackbar>
  </v-row>
</template>

<style scoped lang="less">
.setting-hotkeys-container {
  width: 100%;

  .setting-hotkeys-key-btn {
    letter-spacing: 0.5px;
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.pulse-anim {
  animation: pulse 1.2s infinite ease-in-out;
}
</style>
