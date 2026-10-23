<script setup lang="ts">
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'

const props = defineProps<{
  /**
   * 当前密码明文
   */
  password: string
}>()

const {t, locale} = useI18n()

/**
 * 评估密码强度，结果落在 0 到 4 之间
 * 密码过短按最低档处理，字符类型越丰富、长度越长则分值越高
 */
const score = computed(() => {
  const p = props.password || ''
  if (p.length < 6) return 0
  let types = 0
  if (/[a-z]/.test(p)) types++
  if (/[A-Z]/.test(p)) types++
  if (/\d/.test(p)) types++
  if (/[^A-Za-z0-9]/.test(p)) types++
  if (p.length >= 12 && types >= 4) return 4
  if (p.length >= 10 && types >= 3) return 3
  if (p.length >= 8 && types >= 2) return 2
  return 1
})

const scorePercent = computed(() => score.value * 25)

const color = computed(() => {
  switch (score.value) {
    case 0: return 'grey'
    case 1: return 'red'
    case 2: return 'orange'
    case 3: return 'yellow'
    case 4: return 'green'
    default: return 'grey'
  }
})

/**
 * 根据强度给出一条优化建议，仅非空且非最强时展示
 */
const suggestion = computed(() => {
  if (score.value >= 4 || score.value === 0) return ''
  const p = props.password || ''
  const missing: string[] = []
  if (!/[a-z]/.test(p)) missing.push(t('passwordStrength.hint.lower'))
  if (!/[A-Z]/.test(p)) missing.push(t('passwordStrength.hint.upper'))
  if (!/\d/.test(p)) missing.push(t('passwordStrength.hint.number'))
  if (!/[^A-Za-z0-9]/.test(p)) missing.push(t('passwordStrength.hint.special'))
  if (p.length < 12) missing.push(t('passwordStrength.hint.longer'))
  if (missing.length === 0) return ''
  // 中文用顿号，英文等语言用逗号分隔建议项
  return t('passwordStrength.suggestion', { items: missing.join(locale.value.startsWith('zh') ? '、' : ', ') })
})

const levelLabel = computed(() => t(`passwordStrength.level.${score.value}`))
</script>

<template>
  <div class="password-strength">
    <v-progress-linear v-if="password"
                      :model-value="scorePercent"
                      :color="color"
                      height="15"
                      rounded
                      class="mb-1">
      <template #default="{ value }">
        <div class="text-caption text-right text-grey">{{ levelLabel }}</div>
      </template>
    </v-progress-linear>
    <div v-else class="text-caption text-grey d-none"></div>
    <div v-if="password" class="text-caption text-grey">
      <span :class="'text-' + color">{{ levelLabel }}</span>
      <span v-if="suggestion" class="opacity-80"> · {{ suggestion }}</span>
    </div>
  </div>
</template>

<style scoped>
.password-strength {
  min-height: 1.2rem;
}
</style>
