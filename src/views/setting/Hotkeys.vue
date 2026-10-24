<script setup lang="ts">
/**
 * 全局快捷键绑定设置视图
 * 支持组合按键（如 cmd+k、ctrl+s、alt+f 等）捕获录入、冲突检测与系统默认重置
 */
import {computed, onBeforeUnmount, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useHotkeysStore} from '~/stores/hotkeysStore'
import {useNoticeStore} from '~/stores/noticeStore'
import type {HotkeyItem, HotkeyLocation, HotkeyMode} from '@/assets/types/Hotkeys'
import {useOS} from '@/assets/sripts/os'
import {VHotkey} from 'vuetify/components/VHotkey'
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t} = useI18n()
const hotkeysStore = useHotkeysStore()
const notice = useNoticeStore()
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

/**
 * 地点标识对应的多语言键
 * @param location 地点标识
 */
const locationI18nKey = (location: HotkeyLocation) => {
  return `setting.hotkeys.location${location.charAt(0).toUpperCase()}${location.slice(1)}`
}

/**
 * 快捷键分组展示配置，按动作清单中的分类出现顺序动态生成
 */
const groupList = computed(() => {
  const seen = new Set<string>()
  return hotkeysStore.hotkeyList
      .filter(item => {
        if (seen.has(item.category)) return false
        seen.add(item.category)
        return true
      })
      .map(item => ({key: item.category, titleKey: item.categoryKey}))
})

/**
 * 按分类聚合快捷键列表
 */
const categorizedHotkeys = computed(() => {
  const groups: Record<string, HotkeyItem[]> = {}
  for (const item of hotkeysStore.hotkeyList) {
    if (!groups[item.category]) {
      groups[item.category] = []
    }
    groups[item.category].push(item)
  }
  return groups
})

/**
 * 修改动作的触发方式
 * @param item 目标快捷键项
 * @param mode 按下立即触发或按住蓄力触发
 */
const onUpdateMode = (item: HotkeyItem, mode: unknown) => {
  if (mode !== 'press' && mode !== 'hold') return
  hotkeysStore.updateMode(item.id, mode as HotkeyMode)
  notice.success(t('setting.hotkeys.modeUpdated', {
    mode: t(mode === 'hold' ? 'setting.hotkeys.modeHold' : 'setting.hotkeys.modePress'),
  }), {mode: 'minimal'})
}

/**
 * 拼装与指定动作共用按键的其他动作名称
 * @param actionId 动作唯一标识
 */
const conflictNames = (actionId: string) => {
  return hotkeysStore.getConflicts(actionId).map(item => t(item.nameKey)).join(' / ')
}

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
      const conflictItem = hotkeysStore.hotkeyList.find(item => item.id === result.conflictId)
      notice.warning(t('setting.hotkeys.conflictWith', {
        key: combinedKey,
        name: conflictItem ? t(conflictItem.nameKey) : '',
      }))
    } else {
      notice.success(t('setting.hotkeys.updateSuccess', {key: combinedKey}), {mode: 'minimal'})
    }
  } else {
    notice.error(t('setting.hotkeys.updateFailed'))
  }

  stopRecording()
}

/**
 * 恢复所有快捷键至默认绑定
 */
const onResetDefaults = () => {
  hotkeysStore.resetToDefaults()
  notice.info(t('setting.hotkeys.resetSuccess'))
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
      <AffixBoxHasTitleView v-for="group in groupList" :key="group.key">
        <template v-slot:title>
          {{ t(group.titleKey) }}
        </template>

        <div class="setting-hotkeys-group mb-6">
          <v-card class="setting-hotkeys-card">
            <v-list class="bg-transparent pa-0">
              <template v-for="(item, idx) in categorizedHotkeys[group.key]" :key="item.id">
                <v-list-item class="py-3 px-4">
                  <v-list-item-title class="font-weight-medium text-white mb-1">
                    {{ t(item.nameKey) }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption text-medium-emphasis">
                    {{ t(item.descriptionKey) }}
                  </v-list-item-subtitle>

                  <div class="d-flex flex-wrap ga-2 mt-2">
                    <v-chip v-for="location in item.locations"
                            :key="location"
                            size="x-small"
                            variant="tonal"
                            prepend-icon="mdi-map-marker-outline">
                      {{ t(locationI18nKey(location)) }}
                    </v-chip>
                    <v-chip v-if="hotkeysStore.getConflicts(item.id).length > 0"
                            size="x-small"
                            color="warning"
                            variant="tonal"
                            prepend-icon="mdi-alert-outline">
                      {{ t('setting.hotkeys.conflictBadge', {name: conflictNames(item.id)}) }}
                    </v-chip>
                  </div>

                  <template #append>
                    <div class="d-flex align-center ga-2">
                      <v-btn-toggle
                          :model-value="item.mode"
                          mandatory
                          density="compact"
                          variant="outlined"
                          divided
                          class="setting-hotkeys-mode"
                          @update:model-value="(value) => onUpdateMode(item, value)">
                        <v-btn value="press" size="small" class="px-2">
                          {{ t('setting.hotkeys.modePress') }}
                        </v-btn>
                        <v-btn value="hold" size="small" class="px-2">
                          {{ t('setting.hotkeys.modeHold') }}
                        </v-btn>
                      </v-btn-toggle>

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
                    </div>
                  </template>
                </v-list-item>
                <v-divider v-if="idx < categorizedHotkeys[group.key].length - 1"></v-divider>
              </template>
            </v-list>
          </v-card>
        </div>
      </AffixBoxHasTitleView>
    </v-col>
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
