<script setup lang="ts">
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useServiceStatusApi} from "@/assets/sripts/api/service_status_service";
import type {
  BuildRun,
  BuildRunsData,
  ServiceMonitorStatus,
  ServiceStatusData
} from "@/assets/types/ServiceStatus";

import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import ServiceStatusBadge from "@/components/ServiceStatusBadge.vue";

const {t} = useI18n(),
    serviceStatusApi = useServiceStatusApi()

const status = ref<ServiceStatusData | null>(null),
    builds = ref<BuildRunsData | null>(null),
    statusLoading = ref(true),
    buildsLoading = ref(true)

onMounted(() => {
  onRefresh()
})

/**
 * 并行拉取服务状态与构建流水线，任一失败不影响另一块展示
 * @param force true 时绕过缓存强制刷新
 */
const onRefresh = async (force = false) => {
  statusLoading.value = true
  buildsLoading.value = true
  try {
    status.value = await serviceStatusApi.getServiceStatus(force)
  } catch {
    status.value = null
  } finally {
    statusLoading.value = false
  }
  try {
    builds.value = await serviceStatusApi.getBuildRuns(force)
  } catch {
    builds.value = null
  } finally {
    buildsLoading.value = false
  }
}

// 监视器状态的语义色
const monitorStatusColor = (value: ServiceMonitorStatus) => ({
  up: 'green-lighten-1',
  down: 'red-lighten-1',
  pending: 'amber',
  maintenance: 'light-blue-lighten-1',
  unknown: 'grey'
}[value] || 'grey')

/**
 * 可用率小数转百分比文案
 * @param value 0-1 的可用率
 */
const formatUptime = (value: number | null) => {
  if (value === null || value === undefined) return 'N/A'
  return `${(value * 100).toFixed(2)}%`
}

/**
 * 时间戳格式化为本地可读文案
 * @param value ISO 时间字符串
 */
const formatTime = (value: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

// 构建结论的语义色与图标
const buildStateColor = (run: BuildRun) => {
  if (run.conclusion === 'running') return 'amber'
  return ({
    success: 'green-lighten-1',
    failure: 'red-lighten-1',
    cancelled: 'grey',
    skipped: 'grey',
    unknown: 'grey',
    running: 'amber'
  }[run.conclusion] || 'grey')
}

/**
 * 构建结论对应的图标，构建中显示旋转图标
 * @param run 单次流水线
 */
const buildStateIcon = (run: BuildRun) => {
  if (run.conclusion === 'running') return 'mdi-loading'
  return ({
    success: 'mdi-check-circle-outline',
    failure: 'mdi-close-circle-outline',
    cancelled: 'mdi-cancel',
    skipped: 'mdi-debug-step-over',
    unknown: 'mdi-help-circle-outline',
    running: 'mdi-loading'
  }[run.conclusion] || 'mdi-help-circle-outline')
}

defineOptions({
  name: 'SettingServiceStatus'
})
</script>

<template>
  <div>
    <v-alert
        v-if="status?.incident"
        :type="status.incident.style === 'danger' ? 'error' : status.incident.style === 'warning' ? 'warning' : 'info'"
        variant="tonal"
        class="mb-6"
        border="start">
      <b>{{ status.incident.title }}</b>
      <p class="mb-0 mt-1 text-body-2" v-if="status.incident.content">{{ status.incident.content }}</p>
    </v-alert>

    <v-row>
      <v-col cols="12" lg="4">
        <AffixBoxHasTitleView>
          <p>{{ t('setting.serviceStatus.desc') }}</p>

          <p class="opacity-60" v-if="status?.updatedAt">
            {{ t('setting.serviceStatus.lastUpdated') }} {{ formatTime(status.updatedAt) }}
          </p>

          <v-btn
              href="https://status.glow-prow.top/status/glow-prow"
              target="_blank"
              variant="text"
              block
              border
              class="my-4">
            {{ t('setting.serviceStatus.viewStatusPage') }}
            <ServiceStatusBadge mode="full" class="mx-2"></ServiceStatusBadge>
          </v-btn>

          <template v-slot:title>
            {{ t('setting.serviceStatus.overviewTitle') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>

      <v-col cols="12" lg="8">
        <v-row>
          <v-col cols="12" v-if="statusLoading && !status">
            <AffixBoxHasTitleView>
              <v-skeleton-loader type="list-item-two-line@3"></v-skeleton-loader>
              <template v-slot:title>
                {{ t('setting.serviceStatus.monitorsTitle') }}
              </template>
            </AffixBoxHasTitleView>
          </v-col>

          <v-col
              cols="12"
              :class="{'mt-0': groupIndex > 0}"
              v-for="(group, groupIndex) in (status?.groups || [])"
              :key="groupIndex">
            <AffixBoxHasTitleView>
              <div v-for="(monitor, monitorIndex) in group.monitors" :key="monitorIndex">
                <v-row align="center">
                  <v-col cols="auto" class="singe-line">
                    <v-icon
                        class="mr-2"
                        :icon="monitor.status == 'up' ? 'mdi-check-circle-outline' : ''"
                        :color="monitorStatusColor(monitor.status)"
                        size="18"></v-icon>
                    {{ monitor.name }}
                  </v-col>
                  <v-col>
                    <v-divider></v-divider>
                  </v-col>
                  <v-col cols="auto" class="text-body-2" :class="`text-${monitorStatusColor(monitor.status)}`">
                    {{ t(`setting.serviceStatus.monitor.${monitor.status}`) }}
                  </v-col>
                  <v-col cols="4" sm="3" class="text-right text-caption opacity-70">
                    {{ t('setting.serviceStatus.uptime24h') }} {{ formatUptime(monitor.uptime24h) }}
                  </v-col>
                </v-row>
              </div>
              <template v-slot:title>
                {{ group.name || t('setting.serviceStatus.monitorsTitle') }}
              </template>
            </AffixBoxHasTitleView>
          </v-col>

          <v-col cols="12" v-if="!statusLoading && !(status?.groups?.length)">
            <AffixBoxHasTitleView>
              <p class="text-caption opacity-60 mb-0">{{ t('setting.serviceStatus.loadFailed') }}</p>
              <template v-slot:title>
                {{ t('setting.serviceStatus.monitorsTitle') }}
              </template>
            </AffixBoxHasTitleView>
          </v-col>

          <v-col cols="12">
            <AffixBoxHasTitleView>
              <div class="d-flex align-center mb-2">
                <span class="text-caption opacity-60">
                  {{ t('setting.serviceStatus.builds.desc') }}
                </span>
                <v-spacer></v-spacer>
                <v-btn
                    icon="mdi-refresh"
                    size="x-small"
                    variant="text"
                    :loading="buildsLoading"
                    @click="onRefresh(true)"></v-btn>
              </div>

              <v-skeleton-loader v-if="buildsLoading && !builds" type="list-item-two-line@3"></v-skeleton-loader>

              <div v-else-if="builds && builds.runs.length > 0">
                <div v-for="(run, runIndex) in builds.runs" :key="runIndex">
                  <v-row align="center" no-gutters class="py-1">
                    <v-col cols="auto">
                      <v-icon
                          :icon="buildStateIcon(run)"
                          :color="buildStateColor(run)"
                          :class="{'build-spin': run.conclusion === 'running'}"
                          size="18"></v-icon>
                    </v-col>
                    <v-col class="singe-line px-3">
                      <span class="font-weight-medium">{{ run.title }}</span>
                      <span class="opacity-60 ml-2">#{{ run.runNumber }}</span>
                    </v-col>
                    <v-col cols="auto" class="text-caption opacity-60 px-2 d-none d-sm-block">
                      <v-icon icon="mdi-source-branch" size="14" class="mr-1"></v-icon>{{ run.branch }}
                    </v-col>
                    <v-col cols="auto" class="text-caption px-2" :class="`text-${buildStateColor(run)}`">
                      {{ t(`setting.serviceStatus.builds.state.${run.conclusion}`) }}
                    </v-col>
                    <v-col cols="auto" class="text-caption opacity-60 px-2 d-none d-md-block">
                      {{ formatTime(run.updatedAt) }}
                    </v-col>
                  </v-row>
                  <v-divider v-if="runIndex < builds.runs.length - 1" opacity=".06"></v-divider>
                </div>
              </div>

              <div v-else class="d-flex align-center">
                <p class="text-caption opacity-60 mb-0">{{ t('setting.serviceStatus.builds.loadFailed') }}</p>
                <v-btn size="x-small" variant="text" color="amber" class="ml-2" @click="onRefresh(true)">
                  {{ t('setting.serviceStatus.builds.retry') }}
                </v-btn>
              </div>

              <template v-slot:title>
                {{ t('setting.serviceStatus.builds.title') }}
              </template>
            </AffixBoxHasTitleView>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">
.build-spin {
  animation: build-rotate 1.2s linear infinite;
}

@keyframes build-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
