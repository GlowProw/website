<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import {useServiceStatusApi} from "@/assets/sripts/api/service_status_service";
import type {ServiceOverallStatus, ServiceStatusData} from "@/assets/types/ServiceStatus";

const props = withDefaults(defineProps<{
  // full 额外显示跳转箭头，compact 只保留状态点与文案
  mode?: 'full' | 'compact'
}>(), {
  mode: 'compact'
})

const route = useRoute(),
    {t} = useI18n(),
    serviceStatusApi = useServiceStatusApi()

const status = ref<ServiceStatusData | null>(null)
const loading = ref(true)

onMounted(() => {
  onRefresh()
})

/**
 * 拉取服务状态，失败时保持未知态展示
 */
const onRefresh = async () => {
  loading.value = true
  try {
    status.value = await serviceStatusApi.getServiceStatus()
  } catch {
    status.value = null
  } finally {
    loading.value = false
  }
}

// 整体状态：接口异常或尚无数据时按未知处理
const overall = computed<ServiceOverallStatus>(() => status.value?.overall || 'unknown')

// 状态对应的语义色
const statusColor = computed(() => ({
  up: 'green-lighten-1',
  partial: 'amber',
  down: 'red-lighten-1',
  unknown: 'grey'
}[overall.value]))

// 点击徽章进入服务状态页
const statusPageTarget = computed(() => ({
  name: 'PortalSettingServiceStatus',
  params: {lang: route.params.lang}
}))

defineOptions({
  name: 'ServiceStatusBadge'
})
</script>

<template>
  <p class="service-status-badge px-2">
    <span class="status-dot mr-2" :class="[`bg-${statusColor}`, {'pulse': overall === 'up'}]"></span>
    <span>{{ t(`setting.serviceStatus.overall.${overall}`) }}</span>
  </p>
</template>

<style scoped lang="less">
.service-status-badge {
  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &.pulse {
      animation: status-pulse 2s infinite;
    }
  }
}

@keyframes status-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(102, 187, 106, .5);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(102, 187, 106, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(102, 187, 106, 0);
  }
}
</style>
