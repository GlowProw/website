<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRoute, useRouter} from 'vue-router'
import {storage} from '@/assets/sripts'

// 访问次数累计在本地，关闭状态也永久记录
const VISITS_KEY = 'app.supportPrompt.visits'
const DISMISSED_KEY = 'app.supportPrompt.dismissedAt'
// 单次会话内的停留时长与访问页面
const DWELL_KEY = 'app.supportPrompt.dwellMs'
const PAGES_KEY = 'app.supportPrompt.pages'

// 触发条件：访问 8 次、停留 2 分钟、浏览 6 个页面
const MIN_VISITS = 8
const MIN_DWELL_MS = 2 * 60 * 1000
const MIN_PAGES = 6

const {t} = useI18n()
const route = useRoute()
const router = useRouter()

const visible = ref(false)
const visits = ref(0)
// 本次会话累计停留毫秒数
let dwellMs = 0
// 本次会话访问过的页面路径
let pages: string[] = []
// 避免同一次会话重复弹出
let prompted = false
let tickTimer: number | null = null

/**
 * 读取本地存储中的数值
 */
const readNumber = (key: string) => {
  const res = storage.local.get(key)
  return res.code === 0 ? Number(res.data?.value) || 0 : 0
}

/**
 * 读取会话存储中的停留时长
 */
const readDwell = () => {
  const res = storage.session.get(DWELL_KEY)
  return res.code === 0 ? Number(res.data?.value) || 0 : 0
}

/**
 * 读取本次会话访问过的页面列表
 */
const readPages = (): string[] => {
  const res = storage.session.get(PAGES_KEY)
  return res.code === 0 && Array.isArray(res.data?.value) ? res.data.value : []
}

/**
 * 判断是否允许弹出，已关闭或本次会话已弹过则跳过
 */
const canPrompt = () => {
  if (prompted || visible.value) return false
  if (readNumber(DISMISSED_KEY) > 0) return false
  return visits.value >= MIN_VISITS && dwellMs >= MIN_DWELL_MS && pages.length >= MIN_PAGES
}

/**
 * 记录访问过的页面，同一路径只算一次
 */
const trackPage = (path: string) => {
  if (!path) return
  if (!pages.includes(path)) {
    pages.push(path)
    storage.session.set(PAGES_KEY, pages)
  }
}

/**
 * 每秒累计停留时长并检查触发条件
 */
const onTick = () => {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return

  dwellMs += 1000
  storage.session.set(DWELL_KEY, dwellMs)

  if (canPrompt()) {
    prompted = true
    visible.value = true
  }
}

/**
 * 关闭弹窗并永久记录，之后不再弹出
 */
const onClose = () => {
  visible.value = false
  storage.local.set(DISMISSED_KEY, Date.now())
}

/**
 * 前往订阅页，同样视为已处理本次提示
 */
const onSubscribe = () => {
  storage.local.set(DISMISSED_KEY, Date.now())
  visible.value = false

  const lang = route.params.lang || 'zh_CN'
  router.push({name: 'PortalSettingSubscriptions', params: {lang}})
}

onMounted(() => {
  visits.value = readNumber(VISITS_KEY) + 1
  storage.local.set(VISITS_KEY, visits.value)

  dwellMs = readDwell()
  pages = readPages()
  trackPage(route.fullPath)

  tickTimer = window.setInterval(onTick, 1000)
})

watch(() => route.fullPath, path => trackPage(path))

onBeforeUnmount(() => {
  if (tickTimer) window.clearInterval(tickTimer)
  tickTimer = null
})
</script>

<template>
  <v-dialog v-model="visible" max-width="480">
    <v-card class="pa-2">
      <v-card-title class="text-h6 font-weight-bold">
        {{ t('basic.supportPrompt.title') }}
      </v-card-title>
      <v-card-text class="opacity-80">
        {{ t('basic.supportPrompt.detail', {name: t('name')}) }}
      </v-card-text>
      <v-card-actions>
        <v-btn variant="text" @click="onClose">
          {{ t('basic.supportPrompt.later') }}
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="amber" class="px-5" variant="flat" @click="onSubscribe">
          {{ t('basic.supportPrompt.subscribe') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
