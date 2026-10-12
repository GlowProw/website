/**
 * 额度悬浮组件
 */

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {
  useQuotaApi,
} from '@/assets/sripts/api/quota_service'
import type {
  QuotaBucket,
  QuotaResourceKey,
  QuotaStatus,
  QuotaStatusItem,
} from '@/assets/types/Quota'
import {useAuthStore} from '~/stores/userAccountStore'

const props = withDefaults(defineProps<{
  /**
   * 只展示某一类资源；不传则展示全部
   */
  resource?: QuotaResourceKey
  text?: boolean
}>(), {
  resource: undefined,
  text: false,
})

const {t} = useI18n()
const quotaApi = useQuotaApi()
const authStore = useAuthStore()

const status = ref<QuotaStatus | null>(null)
const loading = ref(false)
const RESOURCE_ORDER: QuotaResourceKey[] = ['assembly', 'comment', 'teamup', 'map', 'media']
const visibleResources = computed<QuotaResourceKey[]>(() =>
    props.resource ? [props.resource] : RESOURCE_ORDER
)
const itemOf = (resource: QuotaResourceKey): QuotaStatusItem | undefined =>
    status.value?.resources?.[resource]
const identityUnlimited = computed(() => !!status.value?.identity?.unlimited)
const boostMultiplier = computed(() => Number(status.value?.identity?.multiplier) || 1)

let loadedAt = 0

onMounted(() => {
  if (authStore.isLogin) fetchStatus()
})

/**
 * 拉取额度状态：优先读 sessionStorage 会话缓存（服务层 60 秒 TTL，按账号隔离），
 * 减少重复请求；强制刷新用于需要同步最新用量的场景
 **/
const fetchStatus = async (force = false): Promise<void> => {
  if (loading.value) return
  if (!force && status.value && Date.now() - loadedAt < 60_000) return
  loading.value = true
  try {
    status.value = await quotaApi.getQuotaStatus(force)
    loadedAt = Date.now()
  } catch {
    // 悬浮组件不打断宿主页面，拉取失败静默
  } finally {
    loading.value = false
  }
}

/**
 * 进度百分比；不限额度时不展示进度
 **/
const percentOf = (bucket: QuotaBucket | undefined): number => {
  if (!bucket || bucket.limit == null) return 0
  if (bucket.limit <= 0) return bucket.used > 0 ? 100 : 0
  return Math.min(100, Math.round((bucket.used / bucket.limit) * 100))
}

const percentOfBytes = (used: number, limit: number | null): number => {
  if (limit == null) return 0
  if (limit <= 0) return used > 0 ? 100 : 0
  return Math.min(100, Math.round((used / limit) * 100))
}

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const progressColor = (percent: number): string =>
  percent >= 100 ? 'error' : percent >= 80 ? 'warning' : 'success'

const onMenuToggle = (open: boolean): void => {
  // 展开时优先走会话缓存（60 秒 TTL），避免每次悬浮都发请求
  if (open && authStore.isLogin) fetchStatus()
}
</script>

<template>
  <v-menu location="bottom center" open-on-hover open-on-click :close-delay="180"
          @update:model-value="onMenuToggle">
    <template v-slot:activator="{props: menuProps}">
      <v-btn v-bind="menuProps"
             variant="text"
             :icon="!text"
             :prepend-icon="text ? 'mdi-speedometer-slow' : undefined">
        <v-icon v-if="!text">mdi-speedometer-slow</v-icon>
        <span v-if="text">{{ t('quota.trigger') }}</span>
      </v-btn>
    </template>

    <v-card border width="360" rounded="lg" class="quota-popover">
      <v-card-title class="py-8 text-center bg-black mb-3">
        <v-icon size="64">mdi-shield-check-outline</v-icon>
      </v-card-title>

      <v-card-text class="pt-1">
        <div class="d-flex ga-2 gap-1 align-center">
          <p class="u d-inline-flex font-weight-bold">{{ t('quota.title') }}</p>

          <v-chip v-if="status && identityUnlimited" size="x-small" color="success" variant="tonal">
            {{ t('quota.unlimited') }}
          </v-chip>
          <v-chip v-else-if="status && boostMultiplier > 1" size="x-small" color="amber" variant="tonal">
            {{ t('quota.boost', {multiplier: boostMultiplier}) }}
          </v-chip>
        </div>

        <p class="text-caption text-medium-emphasis mt-1 mb-3 quota-desc">{{ t('quota.description') }}</p>

        <div v-if="status && identityUnlimited" class="text-caption text-success mb-2">
          {{ t('quota.identityUnlimited') }}
        </div>

        <v-progress-circular v-if="loading && !status" indeterminate size="24" width="2"
                             color="amber" class="d-block mx-auto my-4"></v-progress-circular>

        <div v-if="status" class="d-flex flex-column ga-3">
          <div v-for="resource in visibleResources" :key="resource" class="quota-item">
            <v-divider class="mb-2">
              <span class="text-body-2 font-weight-medium text-amber">{{ t(`quota.resource.${resource}`) }}</span>
            </v-divider>

            <!-- 媒体库展示专属完整配额指标：文件数、存储容量、覆盖重传 -->
            <template v-if="resource === 'media' && status.mediaDetails">
              <!-- 1. 文件数量 -->
              <div class="text-caption text-medium-emphasis font-weight-bold mb-1">
                {{ t('quota.media.files') || '文件数量' }}
              </div>
              <div class="d-flex align-center ga-2 mb-1">
                <span class="text-caption text-medium-emphasis quota-period-label">{{ t('quota.monthly') }}</span>
                <v-progress-linear
                  v-if="status.mediaDetails.files.monthly.limit != null"
                  :model-value="percentOf(status.mediaDetails.files.monthly)"
                  :color="progressColor(percentOf(status.mediaDetails.files.monthly))"
                  height="6" rounded density="compact" hide-details class="flex-grow-1"></v-progress-linear>
                <span v-else class="flex-grow-1"></span>
                <span class="text-caption quota-count">
                  <template v-if="status.mediaDetails.files.monthly.limit != null">
                    {{ t('quota.used', {
                      used: status.mediaDetails.files.monthly.used ?? 0,
                      limit: status.mediaDetails.files.monthly.limit
                    }) }}
                  </template>
                  <template v-else>{{ t('quota.unlimited') }}</template>
                </span>
              </div>
              <div class="d-flex align-center ga-2 mb-2">
                <span class="text-caption text-medium-emphasis quota-period-label">{{ t('quota.yearly') }}</span>
                <v-progress-linear
                  v-if="status.mediaDetails.files.yearly.limit != null"
                  :model-value="percentOf(status.mediaDetails.files.yearly)"
                  :color="progressColor(percentOf(status.mediaDetails.files.yearly))"
                  height="6" rounded density="compact" hide-details class="flex-grow-1"></v-progress-linear>
                <span v-else class="flex-grow-1"></span>
                <span class="text-caption quota-count">
                  <template v-if="status.mediaDetails.files.yearly.limit != null">
                    {{ t('quota.used', {
                      used: status.mediaDetails.files.yearly.used ?? 0,
                      limit: status.mediaDetails.files.yearly.limit
                    }) }}
                  </template>
                  <template v-else>{{ t('quota.unlimited') }}</template>
                </span>
              </div>

              <!-- 2. 存储容量 -->
              <div class="text-caption text-medium-emphasis font-weight-bold mb-1 d-flex align-center justify-space-between">
                <span>{{ t('quota.media.storage') || '存储容量' }}</span>
                <span class="text-caption font-weight-regular text-disabled">
                  {{ t('quota.media.maxFileSize') || '单文件 ≤ 1MB' }}
                </span>
              </div>
              <div class="d-flex align-center ga-2 mb-1">
                <span class="text-caption text-medium-emphasis quota-period-label">{{ t('quota.monthly') }}</span>
                <v-progress-linear
                  v-if="status.mediaDetails.storage.monthly.limit != null"
                  :model-value="percentOfBytes(status.mediaDetails.storage.monthly.used, status.mediaDetails.storage.monthly.limit)"
                  :color="progressColor(percentOfBytes(status.mediaDetails.storage.monthly.used, status.mediaDetails.storage.monthly.limit))"
                  height="6" rounded density="compact" hide-details class="flex-grow-1"></v-progress-linear>
                <span v-else class="flex-grow-1"></span>
                <span class="text-caption quota-count">
                  <template v-if="status.mediaDetails.storage.monthly.limit != null">
                    {{ formatBytes(status.mediaDetails.storage.monthly.used) }} / {{ formatBytes(status.mediaDetails.storage.monthly.limit) }}
                  </template>
                  <template v-else>{{ t('quota.unlimited') }}</template>
                </span>
              </div>
              <div class="d-flex align-center ga-2 mb-2">
                <span class="text-caption text-medium-emphasis quota-period-label">{{ t('quota.yearly') }}</span>
                <v-progress-linear
                  v-if="status.mediaDetails.storage.yearly.limit != null"
                  :model-value="percentOfBytes(status.mediaDetails.storage.yearly.used, status.mediaDetails.storage.yearly.limit)"
                  :color="progressColor(percentOfBytes(status.mediaDetails.storage.yearly.used, status.mediaDetails.storage.yearly.limit))"
                  height="6" rounded density="compact" hide-details class="flex-grow-1"></v-progress-linear>
                <span v-else class="flex-grow-1"></span>
                <span class="text-caption quota-count">
                  <template v-if="status.mediaDetails.storage.yearly.limit != null">
                    {{ formatBytes(status.mediaDetails.storage.yearly.used) }} / {{ formatBytes(status.mediaDetails.storage.yearly.limit) }}
                  </template>
                  <template v-else>{{ t('quota.unlimited') }}</template>
                </span>
              </div>

              <!-- 3. 覆盖重传 -->
              <div class="text-caption text-medium-emphasis font-weight-bold mb-1 d-flex align-center justify-space-between">
                <span>{{ t('quota.media.reupload') || '覆盖重传' }}</span>
                <span class="text-caption font-weight-regular text-disabled">
                  {{ t('quota.media.maxPerFile') || '单文件 ≤ 10次' }}
                </span>
              </div>
              <div class="d-flex align-center ga-2">
                <span class="text-caption text-medium-emphasis quota-period-label">{{ t('quota.monthly') }}</span>
                <v-progress-linear
                  v-if="status.mediaDetails.reupload.monthly.limit != null"
                  :model-value="percentOf(status.mediaDetails.reupload.monthly)"
                  :color="progressColor(percentOf(status.mediaDetails.reupload.monthly))"
                  height="6" rounded density="compact" hide-details class="flex-grow-1"></v-progress-linear>
                <span v-else class="flex-grow-1"></span>
                <span class="text-caption quota-count">
                  <template v-if="status.mediaDetails.reupload.monthly.limit != null">
                    {{ status.mediaDetails.reupload.monthly.used }} / {{ status.mediaDetails.reupload.monthly.limit }} 次
                  </template>
                  <template v-else>{{ t('quota.unlimited') }}</template>
                </span>
              </div>
            </template>

            <!-- 常规资源展示 (assembly, comment, teamup, map) -->
            <template v-else>
              <!-- 本月 -->
              <div class="d-flex align-center ga-2 mb-1">
                <span class="text-caption text-medium-emphasis quota-period-label">{{ t('quota.monthly') }}</span>
                <v-progress-linear
                  v-if="itemOf(resource)?.monthly.limit != null"
                  :model-value="percentOf(itemOf(resource)?.monthly)"
                  :color="progressColor(percentOf(itemOf(resource)?.monthly))"
                  height="6" rounded density="compact" hide-details class="flex-grow-1"></v-progress-linear>
                <span v-else class="flex-grow-1"></span>
                <span class="text-caption quota-count">
                  <template v-if="itemOf(resource)?.monthly.limit != null">
                    {{ t('quota.used', {
                      used: itemOf(resource)?.monthly.used ?? 0,
                      limit: itemOf(resource)?.monthly.limit
                    }) }}
                  </template>
                  <template v-else>{{ t('quota.unlimited') }}</template>
                </span>
              </div>

              <!-- 本年 -->
              <div class="d-flex align-center ga-2">
                <span class="text-caption text-medium-emphasis quota-period-label">{{ t('quota.yearly') }}</span>
                <v-progress-linear
                  v-if="itemOf(resource)?.yearly.limit != null"
                  :model-value="percentOf(itemOf(resource)?.yearly)"
                  :color="progressColor(percentOf(itemOf(resource)?.yearly))"
                  height="6" rounded density="compact" hide-details class="flex-grow-1"></v-progress-linear>
                <span v-else class="flex-grow-1"></span>
                <span class="text-caption quota-count">
                  <template v-if="itemOf(resource)?.yearly.limit != null">
                    {{ t('quota.used', {
                      used: itemOf(resource)?.yearly.used ?? 0,
                      limit: itemOf(resource)?.yearly.limit
                    }) }}
                  </template>
                  <template v-else>{{ t('quota.unlimited') }}</template>
                </span>
              </div>
            </template>
          </div>
        </div>

        <div v-else-if="!loading" class="text-caption text-medium-emphasis text-center py-3">
          {{ t('quota.loading') }}
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<style scoped>
.quota-desc {
  line-height: 1.5;
}

.quota-period-label {
  width: 36px;
  flex-shrink: 0;
}

.quota-count {
  min-width: 64px;
  text-align: right;
  white-space: nowrap;
}
</style>
