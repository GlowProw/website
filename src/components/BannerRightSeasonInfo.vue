<script setup lang="ts">
/**
 * 首页横幅右侧赛季信息挂件
 */
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {Season} from "glow-prow-data/src/entity/Seasons";
import {getCurrentSeason, time} from "@/assets/sripts";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const props = defineProps<{
  season?: Season | null,
  top?: number
}>()

const {t} = useI18n()
const {season: readSeason} = useI18nReadName()

// 优先采用外部传入的赛季对象，缺省时自动读取当前赛季
const currentSeason = computed<Season | null>(() => {
  return props.season !== undefined ? props.season : (getCurrentSeason() as Season | null)
})

// 赛季
const seasonShortName = computed(() => {
  if (!currentSeason.value?.id) return ''
  const id = currentSeason.value.id
  return (readSeason(id).name() || (currentSeason.value as any).alternativeName || id).toUpperCase()
})

// 赛季剩余天数
const remainingDays = computed(() => {
  if (!currentSeason.value?.endDate) return 0
  return time.calcRemainingDays(currentSeason.value.endDate) || 0
})

// 赛季倒计时文案
const timerText = computed(() => {
  if (!currentSeason.value?.id) return ''
  return t('portal.seasonTimer', {
    seasonName: seasonShortName.value,
    day: remainingDays.value
  })
})

// 赛季完整名称
const seasonFullName = computed(() => {
  if (!currentSeason.value?.id) return ''
  return readSeason(currentSeason.value.id).name() || ''
})

defineOptions({
  name: "BannerRightSeasonInfo"
})
</script>

<template>
  <div class="banner-right-season-info"
       :style="`padding-top: calc(${top || 80}px + 3vh)`"
       v-if="currentSeason && currentSeason.id && timerText && seasonFullName">
    <div class="season-info-box">
      <div class="season-text season-timer border-l">
        {{ timerText }}
      </div>
      <div class="season-text season-title">
        {{ seasonFullName }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.banner-right-season-info {
  position: absolute;
  top: 0;
  right: 0;
  padding-right: 3vh;
  padding-left: 3vh;
  z-index: 6;
  pointer-events: none;
  user-select: none;

  .season-info-box {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    display: inline-flex;
    flex-direction: column;
    gap: 5px;
    font-size: 16px;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.7);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9), 0 0 12px rgba(0, 0, 0, 0.7);

    .season-text {
      margin: 0;
      padding: 0;
      white-space: nowrap;
      line-height: 1.6;
    }

    .season-timer {
      opacity: 0.85;
      font-weight: 400;
    }

    .season-title {
      color: rgba(255, 255, 255, 0.95);
      font-weight: 500;
    }

    .season-divider {
      width: 2px;
      height: 48px;
      background: rgba(255, 255, 255, 0.35);
      border-radius: 1px;
      flex-shrink: 0;
      margin: 4px 0;
    }
  }
}

@media screen and (max-width: 980px) {
  .banner-right-season-info {
    padding-right: 2vh;
    padding-left: 2vh;

    .season-info-box {
      letter-spacing: 2px;
      gap: 6px;

      .season-title {
        letter-spacing: 2px;
      }

      .season-divider {
        height: 32px;
      }
    }
  }
}
</style>
