<script lang="ts" setup>
import {computed, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useAuthStore} from '~/stores/userAccountStore'
import {useNoticeStore} from '~/stores/noticeStore'
import {useCollectionStore} from '~/stores/collectionStore'
import type {CollectionToggleChange, CollectionToggleType} from '@/assets/types/Collection'

const props = withDefaults(defineProps<{
  /**
   * 图鉴目标类型，如 item、ship、material
   */
  targetType: string
  /**
   * 目标唯一 ID
   */
  targetId: string
  /**
   * 展示形态：详情页按钮、列表小图标、图标右上角角标
   */
  type?: CollectionToggleType
}>(), {
  type: 'button'
})

const emit = defineEmits<{
  change: [payload: CollectionToggleChange]
}>()

const {t} = useI18n()
const authStore = useAuthStore()
const noticeStore = useNoticeStore()
const collectionStore = useCollectionStore()

const saving = ref(false)

/**
 * 当前目标的已取得状态，本地标记优先于账户记录
 */
const isCollected = computed(() => collectionStore.isCollected(props.targetType, props.targetId))

/**
 * 切换已取得状态，未登录时只记录在本地
 */
const onToggle = async () => {
  if (!props.targetId || saving.value) return

  saving.value = true
  try {
    const collected = await collectionStore.onToggle(props.targetType, props.targetId)
    if (authStore.isLogin) {
      noticeStore.success(collected ? t('codex.item.collectedOn') : t('codex.item.collectedOff'), {mode: 'minimal'})
    } else {
      noticeStore.success(t('codex.item.collectionLocalSaved'), {mode: 'minimal'})
    }
    emit('change', {targetType: props.targetType, targetId: props.targetId, collected})
  } catch (e: any) {
    noticeStore.error(e?.message || t('codex.item.collectedFailed'))
  } finally {
    saving.value = false
  }
}

onMounted(() => collectionStore.onLoadAccount())
watch(() => [props.targetType, props.targetId], () => collectionStore.onLoadAccount())
</script>

<template>
  <div v-if="props.type === 'corner'" class="collection-toggle-corner">
    <v-btn v-if="authStore.isLogin"
           v-tooltip:bottom="t('codex.item.collectionToggleTip')"
           :class="isCollected ? 'text-amber' : ''"
           :loading="saving"
           icon
           size="x-small"
           variant="text"
           @click.stop="onToggle">
      <v-icon size="16" :icon="`mdi-${isCollected ? 'star' : 'star-outline'}`"></v-icon>
    </v-btn>
  </div>

  <!-- 弹窗物品列表 -->
  <v-icon-btn v-else-if="props.type === 'icon'"
              v-tooltip:bottom="t('codex.item.collectionToggleTip')"
              :class="{'text-amber':isCollected}"
              :icon="`mdi-${isCollected ? 'star' : 'star-outline'}`"
              :loading="saving"
              size="18"
              variant="flat"
              @click.stop="onToggle"></v-icon-btn>

  <v-btn v-else
         v-tooltip:bottom="t('codex.item.collectionToggleTip')"
         :class="isCollected ? 'text-amber' : ''"
         :loading="saving"
         border
         variant="flat"
         @click.stop="onToggle">
    <v-icon :icon="`mdi-${isCollected ? 'star' : 'star-outline'}`"></v-icon>
  </v-btn>
</template>

<style scoped lang="less">
.collection-toggle-corner {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 12;
  line-height: 1;
}
</style>
