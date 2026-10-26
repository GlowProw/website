<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {apis, number} from "@/assets/sripts";
import type {PublicAchievementSummary} from "@/assets/types/Achievement";

const props = defineProps<{
  userId?: string | null
}>()

const {t, te} = useI18n(),
    api = apis.accountGrowthApi()

const loading = ref(true),
    summary = ref<PublicAchievementSummary | null>(null)

/**
 * 读取指定用户的公开成就摘要
 */
const onLoad = async () => {
  if (!props.userId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const result = await api.getPublicAchievements(String(props.userId))
    summary.value = result.data.data as PublicAchievementSummary
  } catch {
    summary.value = {hidden: true}
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
  <template v-if="summary.level">
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
      <div v-else class="text-caption opacity-50">{{ t('account.achievements.widget.empty') }}</div>
    </div>
  </template>
</template>

<style scoped>
.achievement-list {
  overflow-y: auto;
}
</style>
