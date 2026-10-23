<script setup lang="ts">
import {computed, nextTick, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Apis} from "@/assets/sripts/api";
import {useNoticeStore} from "~/stores/noticeStore";
import type {AchievementCategory, AchievementItem, AchievementOverview} from "@/assets/types/Achievement";
import Loading from "@/components/Loading.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";

const {t, te} = useI18n(),
    notice = useNoticeStore(),
    api = Apis.accountGrowthApi()

const loading = ref(true),
    overview = ref<AchievementOverview | null>(null),
    claimingKey = ref<string | null>(null),
    ladderRef = ref<InstanceType<typeof HorizontalScrollList> | null>(null)

// 成就分类的固定展示顺序与图标
const categoryOrder: AchievementCategory[] = ['assembly', 'mastery', 'signin', 'teamup', 'subscription']
const categoryIcons: Record<AchievementCategory, string> = {
  assembly: 'mdi-package-variant-closed',
  mastery: 'mdi-sword-cross',
  signin: 'mdi-calendar-check',
  teamup: 'mdi-account-group-outline',
  subscription: 'mdi-crown-outline'
}

// 按分类分组后的成就列表
const groupedAchievements = computed(() => categoryOrder.map(category => ({
  category,
  icon: categoryIcons[category],
  items: (overview.value?.achievements || []).filter(item => item.category === category)
})))

const progressPercent = computed(() => Math.round((overview.value?.progress || 0) * 100))

/**
 * 读取成就与等级总览
 */
const onLoad = async () => {
  loading.value = true
  try {
    const result = await api.getAchievements()

    overview.value = result.data.data as AchievementOverview
    // 先结束加载态让等级轴进入 DOM，再滚动到当前等级徽章
    loading.value = false

    await nextTick()

    ladderRef.value?.scrollToItem((overview.value.level.level || 1) - 1, 'auto')
  } catch (e: any) {
    notice.error(e?.message || t('account.achievements.loadFailed'))
  } finally {
    loading.value = false
  }
}

/**
 * 领取被动成就
 * @param item 成就条目
 */
const onClaim = async (item: AchievementItem) => {
  if (claimingKey.value) return
  claimingKey.value = item.key
  try {
    await api.claimAchievement(item.key)
    notice.success(t('account.achievements.claimSuccess'), {mode: 'minimal'})
    await onLoad()
  } catch (e: any) {
    notice.error(e?.message || t('account.achievements.claimFailed'))
  } finally {
    claimingKey.value = null
  }
}

/**
 * 成就名称
 * @param key 成就标识
 */
const achievementName = (key: string): string => t(`account.achievements.items.${key}.name`)

/**
 * 成就描述
 * @param key 成就标识
 */
const achievementDesc = (key: string): string => t(`account.achievements.items.${key}.desc`)

/**
 * 成就要求文案
 * @param item 成就条目
 */
const requirementText = (item: AchievementItem): string => {
  if (item.category === 'assembly') return t('account.achievements.requirement.assembly', {count: item.requirement})
  if (item.category === 'mastery') return t('account.achievements.requirement.mastery', {count: item.requirement})
  if (item.category === 'teamup') return t('account.achievements.requirement.teamup', {count: item.requirement})
  if (item.category === 'signin') return t('account.achievements.requirement.level', {level: item.requirement})

  const tier = item.key.split('_').pop() || ''
  const tierKey = `subscription.tiers.${tier}.name`

  return t('account.achievements.requirement.subscription', {tier: te(tierKey) ? t(tierKey) : `¥${tier}`})
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
 * 成就状态对应的颜色
 * @param item 成就条目
 */
const statusColor = (item: AchievementItem): string => {
  if (item.status === 'obtained') return 'amber'
  if (item.status === 'claimable') return 'green'
  return 'grey'
}

onMounted(onLoad)

defineOptions({
  name: 'AccountAchievements'
})
</script>

<template>
  <v-row>
    <v-col cols="12" lg="12">
      <Loading v-if="loading"/>

      <template v-else-if="overview">
        <v-row align="start" density="compact" class="mb-10">
          <v-col cols="12" lg="auto">
            <div class="rank-icon-wrapper mx-auto mb-5 mb-md-0 mx-md-8 mb-lg-0 mx-lg-8">
              <v-img :src="levelIcon(overview.level.key)" width="96" height="96" class="rank-img" contain/>
            </div>

            <div>
              <p class="text-h5 font-weight-bold mt-4 text-center u">{{ levelName(overview.level.key) }}</p>

              <div class="d-flex flex-wrap justify-center align-center ga-1 mt-2">
                <v-chip size="x-small" color="amber" variant="tonal" class="font-weight-medium">
                  {{ t('account.achievements.levelBadge', {level: romanLevel(overview.level.level)}) }}
                </v-chip>
                <v-chip size="x-small" color="amber-accent-3" variant="tonal">
                  {{ t('account.achievements.points', {points: overview.points}) }}
                </v-chip>
              </div>
            </div>
          </v-col>

          <v-col cols="12" lg="10">
            <div class="opacity-70 mb-3">
              {{ t(`account.achievements.levels.${overview.level.key}.desc`) }}
            </div>

            <template v-if="overview.nextLevel">
              <div class="d-flex align-center justify-space-between text-body-2 mb-1">
                <span>{{ t('account.achievements.nextLevel', {level: levelName(overview.nextLevel.key)}) }}</span>
                <span class="opacity-70">
                  {{ t('account.achievements.remaining', {points: overview.nextLevel.threshold - overview.points}) }}
                </span>
              </div>
              <v-progress-linear :model-value="progressPercent" color="amber" height="8" rounded/>
            </template>
            <div v-else class="text-body-2 opacity-70">
              {{ t('account.achievements.maxLevel') }}
            </div>

            <HorizontalScrollList ref="ladderRef" :is-indicator="false" :is-mask="true" class="mt-5">
              <v-card
                  v-for="level in overview.levels"
                  :key="level.key"
                  width="110"
                  class="level-ladder-item px-5 py-4"
                  :class="{'level-ladder-item--current': level.level === overview.level.level}">
                <v-img :src="levelIcon(level.key)" width="60" height="60" class="mb-2" contain/>
                <p class="text-caption opacity-60 mt-1">{{ romanLevel(level.level) }}</p>
                <p class="text-caption singe-line">{{ levelName(level.key) }}</p>
              </v-card>
            </HorizontalScrollList>
          </v-col>
        </v-row>

        <AffixBoxHasTitleView v-for="group in groupedAchievements" :key="group.category" class="mb-8">
          <template v-slot:title>
            {{ t(`account.achievements.categories.${group.category}`) }}
          </template>

          <v-row gap="60">
            <v-col v-for="item in group.items" :key="item.key" cols="12" md="6" lg="4">
              <v-card variant="text" class="h-100 d-flex flex-column">
                <div class="d-flex align-start ga-3">
                  <div class="flex-grow-1">
                    <div class="d-flex align-center justify-space-between ga-2">
                      <span class="text-h5 u font-weight-bold">{{ achievementName(item.key) }}</span>
                      <v-chip size="x-small" :color="statusColor(item)" variant="tonal">
                        {{ t(`account.achievements.status.${item.status}`) }}
                      </v-chip>
                    </div>
                    <div class="opacity-70 text-body-2 mt-1">{{ achievementDesc(item.key) }}</div>
                  </div>
                </div>

                <div class="d-flex flex-wrap align-center ga-2 my-4">
                  <v-chip size="x-small" color="amber-accent-3">
                    +{{ item.points }} {{ t('account.achievements.pointUnit') }}
                  </v-chip>
                  <v-chip size="x-small" variant="text" class="opacity-70">
                    {{ requirementText(item) }}
                  </v-chip>
                  <v-chip v-if="item.repeatable && item.times > 0" size="x-small" color="cyan" variant="tonal">
                    {{ t('account.achievements.times', {times: item.times}) }}
                  </v-chip>
                </div>

                <div class="mt-auto pt-3 d-flex justify-end border-t" v-if="item.mode === 'passive'">
                  <v-btn v-if="item.status === 'claimable'"
                         color="amber"
                         variant="flat"
                         size="small"
                         :loading="claimingKey === item.key"
                         @click="onClaim(item)">
                    {{ t('account.achievements.claim') }}
                  </v-btn>
                  <span v-else-if="item.status === 'obtained'" class="text-caption opacity-60">
                    {{ t('account.achievements.obtainedAt', {time: new Date(item.claimedTime || item.obtainedTime || '').toLocaleDateString()}) }}
                  </span>
                  <span v-else class="text-caption opacity-60">
                    {{ t('account.achievements.lockedTip') }}
                  </span>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </AffixBoxHasTitleView>
      </template>
    </v-col>
  </v-row>
</template>

<style scoped>
.rank-card {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
}

.rank-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 193, 7, 0.4);
}

.rank-icon-wrapper {
  width: 96px;
  height: 96px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
}

.level-ladder-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid transparent;
  opacity: 0.45;
  transition: all 0.2s ease;
}

.level-ladder-item--current {
  opacity: 1;
  background: rgba(255, 193, 7, 0.08);
}

.level-ladder-item:hover {
  opacity: 1;
}
</style>
