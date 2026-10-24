<script setup lang="ts">
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAuthStore} from '~/stores/userAccountStore'
import {useNoticeStore} from '~/stores/noticeStore'
import {useCollectionStore} from '~/stores/collectionStore'
import {useI18nReadName} from '@/assets/sripts/i18n_read_name'
import BtnWidget from '@/components/snbWidget/btnWidget.vue'

const props = withDefaults(defineProps<{
  // 图鉴目标类型，如 item、ship
  targetType: string
  // 目标唯一 ID
  targetId: string
  // 可选的名称覆盖，未传时按类型自动解析
  name?: string
}>(), {
  name: '',
})

const {t} = useI18n()
const authStore = useAuthStore()
const noticeStore = useNoticeStore()
const collectionStore = useCollectionStore()
const i18nReadName = useI18nReadName()

// 收藏切换进行中标志
const isCollecting = ref(false)
// 上次收藏操作时间戳
const lastCollectTime = ref(0)
// 复制名称进行中标志
const isCopying = ref(false)
// 上次复制操作时间戳
const lastCopyTime = ref(0)
// 防重复触发冷却时间
const HOTKEY_COOLDOWN_MS = 400

/**
 * 按图鉴类型解析名称的读取器
 */
const nameResolvers: Record<string, (id: string) => string> = {
  item: id => i18nReadName.item(id).name(),
  ship: id => i18nReadName.ship(id).name(),
  commoditie: id => i18nReadName.commoditie(id).name(),
  cosmetic: id => i18nReadName.cosmetic(id).name(),
  ultimate: id => i18nReadName.ultimate(id).name(),
  mod: id => i18nReadName.modification(id).name(),
  material: id => i18nReadName.material(id).name(),
  set: id => i18nReadName.set(id).name(),
  treasureMap: id => i18nReadName.treasureMap(id).name(undefined),
  mapLocation: id => i18nReadName.mapLocation(id).name(),
  npc: id => i18nReadName.npc(id).name(undefined),
  empireSkill: id => i18nReadName.empireSkill(id).name(),
  mastery: id => i18nReadName.mastery(id).name(),
}

/**
 * 取得当前悬浮卡片的图鉴名称
 */
const getName = (): string => {
  if (props.name) return props.name
  const resolver = nameResolvers[props.targetType]
  return resolver ? resolver(props.targetId) : props.targetId
}

/**
 * 切换当前图鉴的收藏状态
 */
const onToggleCollect = async () => {
  if (!props.targetId) return
  const now = Date.now()
  if (isCollecting.value || now - lastCollectTime.value < HOTKEY_COOLDOWN_MS) {
    return
  }
  isCollecting.value = true
  lastCollectTime.value = now
  try {
    const collected = await collectionStore.onToggle(props.targetType, props.targetId)
    if (authStore.isLogin) {
      noticeStore.success(collected ? t('codex.item.collectedOn') : t('codex.item.collectedOff'), {mode: 'minimal'})
    } else {
      noticeStore.success(t('codex.item.collectionLocalSaved'), {mode: 'minimal'})
    }
  } catch (e: any) {
    noticeStore.error(e?.message || t('codex.item.collectedFailed'))
  } finally {
    isCollecting.value = false
  }
}

/**
 * 复制当前图鉴名称
 */
const onCopyName = async () => {
  const name = getName()
  if (!name) return
  const now = Date.now()
  if (isCopying.value || now - lastCopyTime.value < HOTKEY_COOLDOWN_MS) {
    return
  }
  isCopying.value = true
  lastCopyTime.value = now
  try {
    await navigator.clipboard.writeText(name)
    noticeStore.success(t('basic.tips.copySuccess'), {mode: 'minimal'})
  } catch (e: any) {
    noticeStore.error(t('basic.tips.copyFailed'))
  } finally {
    isCopying.value = false
  }
}

defineOptions({
  name: 'CardDetailHotkeyActions'
})
</script>

<template>
  <BtnWidget hotkey-action="overlayCollect" icon="mdi-star-outline" @action-complete="onToggleCollect">
    {{ t('setting.hotkeys.actions.collectItem') }}
  </BtnWidget>
  <BtnWidget hotkey-action="overlayCopyName" icon="mdi-content-copy" @action-complete="onCopyName">
    {{ t('setting.hotkeys.actions.copyItemName') }}
  </BtnWidget>
</template>
