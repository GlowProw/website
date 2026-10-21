<script lang="ts" setup>
import {onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRoute, useRouter} from 'vue-router'
import {useCollectionApi} from '@/assets/sripts/api/collection_service'
import {useAuthStore} from '~/stores/userAccountStore'
import {useNoticeStore} from '~/stores/noticeStore'

const props = defineProps<{
  /**
   * 图鉴目标类型，如 item、ship、material
   */
  targetType: string
  /**
   * 目标唯一 ID
   */
  targetId: string
}>()

const {t} = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const noticeStore = useNoticeStore()
const collectionApi = useCollectionApi()

const isCollected = ref(false)
const saving = ref(false)

/**
 * 读取当前目标的已取得状态
 */
const onLoad = async () => {
  if (!authStore.isLogin || !props.targetId) {
    isCollected.value = false
    return
  }
  try {
    const result = await collectionApi.getCollectionStatus(props.targetType, props.targetId)
    isCollected.value = Boolean((result.data.data as { collected: boolean })?.collected)
  } catch {
    // 状态读取失败时保持未取得，不打断详情页其它内容
  }
}

/**
 * 切换已取得状态，接口失败时回滚本地状态
 */
const onToggle = async () => {
  // 未登录时保留按钮可点击，先引导到登录页并在登录后回到当前详情
  if (!authStore.isLogin) {
    router.push({name: 'signin', query: {backUrl: route.fullPath}})
    return
  }
  if (!props.targetId || saving.value) return
  const next = !isCollected.value
  isCollected.value = next
  saving.value = true
  try {
    await collectionApi.setCollection(props.targetType, props.targetId, next)
    noticeStore.success(next ? t('codex.item.collectedOn') : t('codex.item.collectedOff'))
  } catch (e: any) {
    isCollected.value = !next
    noticeStore.error(e?.message || t('codex.item.collectedFailed'))
  } finally {
    saving.value = false
  }
}

onMounted(onLoad)
watch(() => [props.targetType, props.targetId], onLoad)
</script>

<template>
  <v-btn v-tooltip:bottom="t('codex.item.collected')"
         :class="isCollected ? 'text-amber' : ''"
         :loading="saving"
         border
         variant="text"
         @click="onToggle">
    <v-icon :icon="`mdi-${isCollected ? 'check-decagram' : 'check-decagram-outline'}`"></v-icon>
  </v-btn>
</template>
