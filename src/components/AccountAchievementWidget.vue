<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {apis, number, sessionUserInfo} from "@/assets/sripts";
import type {PublicAchievementSummary} from "@/assets/types/Achievement";

const props = defineProps<{
  userId?: string | null
}>()

const {t, te} = useI18n(),
    api = apis.accountGrowthApi()

const loading = ref(true),
    summary = ref<PublicAchievementSummary | null>(null)

// 模块级并发请求复用池，防止短时间内或并发挂载时重复发起请求
const pendingAchievementRequests = new Map<string, Promise<PublicAchievementSummary>>()

/**
 * 读取指定用户的公开成就摘要（优先读取持久会话缓存，避免重复请求）
 */
const onLoad = async () => {
  if (!props.userId) {
    loading.value = false
    return
  }

  const userId = String(props.userId)

  // 1. 读取持久会话缓存数据（与用户信息卡片一致）
  const sessionData = sessionUserInfo.getUserInfoItem('achievement', userId)
  if (sessionData) {
    summary.value = sessionData
    loading.value = false
    return
  }

  // 2. 存在并发在途请求则直接复用
  if (pendingAchievementRequests.has(userId)) {
    loading.value = true
    try {
      summary.value = await pendingAchievementRequests.get(userId)!
    } finally {
      loading.value = false
    }
    return
  }

  // 3. 发起请求并存入持久会话保持中
  loading.value = true
  const fetchPromise = (async () => {
    try {
      const result = await api.getPublicAchievements(userId)
      const data = (result.data.data as PublicAchievementSummary) || {hidden: true}
      sessionUserInfo.updateConfiguration('achievement', userId, data)
      return data
    } catch {
      const fallback: PublicAchievementSummary = {hidden: true}
      sessionUserInfo.updateConfiguration('achievement', userId, fallback)
      return fallback
    } finally {
      pendingAchievementRequests.delete(userId)
    }
  })()

  pendingAchievementRequests.set(userId, fetchPromise)

  try {
    summary.value = await fetchPromise
  } finally {
    loading.value = false
  }
}

/**
 * 等级图标路径
 * @param key 等级标识
 */
const levelIcon = (key: string): string => {
  const match = key.match(/^kingpin_(copper|silver|gold)_(\d+)$/)
  if (match) return `/images/emote/snb-Infamy/kingpin ${match[1]}-${match[2]}.webp`
  return `/images/emote/snb-Infamy/${key}.webp`
}

/**
 * 等级名称
 * @param key 等级标识
 */
const levelName = (key: string): string => t(`account.achievements.levels.${key}.name`)

/**
 * 等级位阶（罗马数字）
 * @param level 等级序号
 */
const romanLevel = (level: number): string => [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV'
][level - 1] || String(level)

/**
 * 成就名称
 * @param key 成就标识
 */
const achievementName = (key: string): string => {
  const path = `account.achievements.items.${key}.name`
  return te(path) ? t(path) : key
}

onMounted(onLoad)

watch(() => props.userId, () => {
  summary.value = null
  onLoad()
})

defineOptions({
  name: 'AccountAchievementWidget'
})
</script>

<template>
  <template v-if="summary?.level">
    <div class="achievement-list d-flex flex-wrap ga-1 gap-1">
      <v-chip>
        <v-row density="compact" align="center">
          <v-col cols="auto">
            <v-img :src="levelIcon(summary.level.key)" width="23" height="23" contain/>
          </v-col>
          <v-col>
            <div class="d-flex align-center flex-wrap ga-2">
              <span class="text-caption font-weight-bold">{{ levelName(summary.level.key) }} {{ number.intToRoman(summary.level.level) }}</span>
            </div>
            <v-progress-linear :model-value="Math.round((summary.progress || 0) * 100)"
                               color="amber"
                               height="3"
                               class="d-flex align-center"
                               style="font-size: 8px; min-width: 100px; padding: 2px 0"
                               rounded>
            </v-progress-linear>
          </v-col>
        </v-row>
      </v-chip>

      <template v-if="summary.achievements?.length">
        <v-chip v-for="item in summary.achievements" :key="item.key" class="" color="amber" variant="tonal">
          {{ achievementName(item.key) }}
        </v-chip>
      </template>
    </div>
  </template>
</template>

<style scoped>
.achievement-list {
  overflow-y: auto;
}
</style>
