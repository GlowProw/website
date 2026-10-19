<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {apis} from '@/assets/sripts'
import {useNoticeStore} from '~/stores/noticeStore'

import Loading from '@/components/Loading.vue'
import EmptyView from '@/components/EmptyView.vue'
import AffixContainerView from '@/components/AffixContainerView.vue'
import TimeView from "@/components/TimeView.vue"

const {t} = useI18n()
const notice = useNoticeStore()

// 状态定义
const loading = ref(false),
    searchQuery = ref(''),
    revokingOther = ref(false),
    revokingSessionId = ref<string | null>(null),
    sessions = ref<any[]>([]),
    currentPage = ref(1),
    pageSize = 10

onMounted(() => {
  loadSessions()
})

/**
 * 过滤后的会话列表
 */
const filteredList = computed(() => {
  const list = sessions.value || []
  if (!searchQuery.value) return list
  const q = searchQuery.value.toLowerCase().trim()
  return list.filter((s: any) =>
      (s.browser || '').toLowerCase().includes(q) ||
      (s.os || '').toLowerCase().includes(q) ||
      (s.device || '').toLowerCase().includes(q) ||
      (s.platform || '').toLowerCase().includes(q) ||
      (s.ip || '').toLowerCase().includes(q)
  )
})

/**
 * 总页数
 */
const totalPages = computed(() => {
  return Math.ceil(filteredList.value.length / pageSize) || 1
})

/**
 * 当前页分页列表
 */
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

/**
 * 加载当前用户的多平台登录会话记录
 *
 * @returns {Promise<void>}
 */
const loadSessions = async (): Promise<void> => {
  try {
    loading.value = true
    const res = await apis.userApi().getUserSessions()
    const payload = res?.data?.data || res?.data || res

    if (Array.isArray(payload?.list)) {
      sessions.value = payload.list
    } else if (Array.isArray(payload?.data?.list)) {
      sessions.value = payload.data.list
    } else if (Array.isArray(payload)) {
      sessions.value = payload
    } else if (Array.isArray(payload?.data)) {
      sessions.value = payload.data
    } else {
      sessions.value = []
    }
  } catch (err: any) {
    notice.error(err?.message || t('account.sessions.fetchError'))
  } finally {
    loading.value = false
  }
}

/**
 * 一键注销其他平台/设备令牌
 *
 * @returns {Promise<void>}
 */
const onRevokeOtherSessions = async (): Promise<void> => {
  if (!confirm(t('account.sessions.revokeOtherConfirm'))) {
    return
  }

  try {
    revokingOther.value = true
    await apis.userApi().revokeOtherSessions()
    notice.success(t('account.sessions.revokeOtherSuccess'))
    await loadSessions()
  } catch (err: any) {
    notice.error(err?.message || t('account.sessions.revokeOtherError'))
  } finally {
    revokingOther.value = false
  }
}

/**
 * 注销指定会话令牌
 *
 * @param {any} session - 会话条目对象
 * @returns {Promise<void>}
 */
const onRevokeSession = async (session: any): Promise<void> => {
  const targetName = session.browser || session.platform || ''
  if (!confirm(t('account.sessions.revokeConfirm', {name: targetName}))) {
    return
  }

  try {
    revokingSessionId.value = session.sessionId
    await apis.userApi().revokeUserSession(session.sessionId)
    notice.success(t('account.sessions.revokeSuccess'), {mode: 'minimal'})
    await loadSessions()
  } catch (err: any) {
    notice.error(err?.message || t('account.sessions.revokeError'))
  } finally {
    revokingSessionId.value = null
  }
}

/**
 * 根据平台返回对应图标
 *
 * @param {string} platform - 平台标识
 * @returns {string} 图标标识
 */
const getPlatformIcon = (platform: string): string => {
  switch (platform) {
    case 'client':
      return 'mdi-laptop'
    case 'admin':
      return 'mdi-shield-crown-outline'
    case 'bot':
      return 'mdi-robot-outline'
    case 'web':
    default:
      return 'mdi-web'
  }
}

/**
 * 获取平台可读名称
 *
 * @param {string} platform - 平台标识
 * @returns {string} 平台显示文案
 */
const getPlatformName = (platform: string): string => {
  switch (platform) {
    case 'client':
      return t('account.sessions.platformClient')
    case 'admin':
      return t('account.sessions.platformAdmin')
    case 'bot':
      return t('account.sessions.platformBot')
    case 'web':
    default:
      return t('account.sessions.platformWeb')
  }
}

/**
 * 复制文本至剪贴板
 *
 * @param {string} text - 目标文本
 */
const copyText = (text: string) => {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    notice.success(t('basic.button.copied') || '已复制')
  }).catch(() => {
    notice.error(t('basic.tips.copyFailed') || '复制失败')
  })
}

defineOptions({
  name: 'AccountSessions'
})
</script>

<template>
  <div class="position-relative">
    <v-overlay :model-value="loading" contained class="d-flex align-center justify-center">
      <Loading size="50"></Loading>
    </v-overlay>

    <!-- 操作头 S -->
    <AffixContainerView>
      <v-card class="d-flex align-center justify-space-between flex-wrap ga-2 pa-2">
        <div class="d-flex align-center flex-wrap ga-2">
          <!-- 搜索框 -->
          <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              :placeholder="t('basic.button.search')"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              style="width: 220px;"
              class="flex-shrink-0">
          </v-text-field>

          <span class="text-caption opacity-60 ml-2">
            {{ sessions.length }} {{ t('account.sessions.title') }}
          </span>
        </div>

        <v-spacer></v-spacer>

        <div class="d-flex align-center ga-2">
          <v-btn
              v-if="sessions.length > 1"
              color="error"
              variant="tonal"
              prepend-icon="mdi-logout-variant"
              :loading="revokingOther"
              @click="onRevokeOtherSessions">
            {{ t('account.sessions.revokeOther') }}
          </v-btn>

          <v-btn
              variant="flat"
              :loading="loading"
              @click="loadSessions">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- 操作头 E -->

    <!-- 会话设备管理列表 S -->
    <div v-if="pagedList && pagedList.length > 0">
      <v-list lines="three" variant="text" class="bg-transparent">
        <template v-for="(s, index) in pagedList" :key="s.sessionId || s.id || index">
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar size="50" rounded="lg" :color="s.isCurrent ? 'amber' : 'surface-variant'" class="mr-3 flex-shrink-0">
                <v-icon size="24" :color="s.isCurrent ? 'black' : 'amber'">
                  {{ getPlatformIcon(s.platform) }}
                </v-icon>
              </v-avatar>
            </template>

            <template v-slot:title>
              <div class="d-flex align-center flex-wrap ga-2">
                <p class="font-weight-bold">{{ getPlatformName(s.platform) }}</p>

                <v-chip v-if="s.isCurrent" size="x-small" color="amber" variant="flat" class="font-weight-medium">
                  {{ t('account.sessions.currentDevice') }}
                </v-chip>
                <v-chip v-else-if="s.status === 'active'" size="x-small" color="success" variant="tonal">
                  {{ t('account.sessions.online') }}
                </v-chip>
                <v-chip v-else size="x-small" color="grey" variant="tonal">
                  {{ t('account.sessions.offline') }}
                </v-chip>
              </div>
            </template>

            <template v-slot:subtitle>
              <div class="d-flex align-center flex-wrap ga-2 mt-2">
                <!-- 浏览器与系统 -->
                <p class="d-flex align-center">
                  <v-icon size="14" class="mr-1">mdi-devices</v-icon>
                  {{ s.browser || t('account.sessions.unknownBrowser') }} · {{ s.os || t('account.sessions.unknownOS') }} {{ s.device ? `(${s.device})` : '' }}
                </p>

                <v-divider vertical inset class="mx-1"></v-divider>

                <!-- IP 地址 -->
                <p class="d-flex align-center cursor-pointer" :title="s.ip" @click="copyText(s.ip)">
                  <v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>
                  IP: {{ s.ip || '—' }}
                </p>

                <v-divider vertical inset class="mx-1"></v-divider>

                <!-- 登录时间 -->
                <p class="d-flex align-center">
                  <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                  {{ t('account.sessions.loginAt') }}
                  <TimeView :time="s.loginTime"></TimeView>
                </p>

                <!-- 活跃时间 -->
                <template v-if="s.lastActiveTime">
                  <v-divider vertical inset class="mx-1"></v-divider>
                  <p class="d-flex align-center">
                    <v-icon size="14" class="mr-1">mdi-update</v-icon>
                    {{ t('account.sessions.activeAt') }}
                    <TimeView :time="s.lastActiveTime"></TimeView>
                  </p>
                </template>
              </div>
            </template>

            <template v-slot:append>
              <div class="d-flex align-center ga-2">
                <!-- 非当前设备下线按钮 -->
                <v-btn
                    v-if="!s.isCurrent && s.status === 'active'"
                    size="x-small"
                    variant="tonal"
                    color="error"
                    prepend-icon="mdi-logout-variant"
                    :loading="revokingSessionId === s.sessionId"
                    @click="onRevokeSession(s)">
                  {{ t('account.sessions.revokeThis') }}
                </v-btn>

                <!-- 操作下拉菜单 -->
                <v-menu location="bottom end">
                  <template v-slot:activator="{ props }">
                    <v-btn
                        v-bind="props"
                        size="small"
                        variant="text"
                        icon="mdi-dots-vertical">
                    </v-btn>
                  </template>
                  <v-list min-width="200" class="pa-1" border rounded="lg">
                    <v-list-item
                        prepend-icon="mdi-content-copy"
                        @click="copyText(s.ip)">
                      <v-list-item-title>{{ t('basic.button.copy') }} IP</v-list-item-title>
                    </v-list-item>

                    <template v-if="!s.isCurrent && s.status === 'active'">
                      <v-divider class="my-1"></v-divider>
                      <v-list-item
                          prepend-icon="mdi-logout-variant"
                          class="text-error"
                          @click="onRevokeSession(s)">
                        <v-list-item-title>{{ t('account.sessions.revokeThis') }}</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>
          <v-divider inset v-if="index < pagedList.length - 1"></v-divider>
        </template>
      </v-list>

      <!-- 分页器 S -->
      <div
          v-if="totalPages > 1"
          class="d-flex justify-center mt-4">
        <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="5"
            density="comfortable"
            size="small">
        </v-pagination>
      </div>
      <!-- 分页器 E -->
    </div>

    <div class="text-center py-12" v-else>
      <EmptyView>
        <template v-slot:description>
          {{ t('account.sessions.empty') }}
        </template>
      </EmptyView>
    </div>
    <!-- 会话设备管理列表 E -->
  </div>
</template>

<style scoped lang="less">
.cursor-pointer {
  cursor: pointer;
}
</style>
