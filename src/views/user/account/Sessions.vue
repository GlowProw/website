<script setup lang="ts">
/**
 * 用户中心多平台登录设备与令牌管理视图
 */

import {onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {apis} from '@/assets/sripts'
import {useNoticeStore} from '~/stores/noticeStore'
import Loading from '@/components/Loading.vue'
import AffixBoxHasTitleView from '@/components/AffixBoxHasTitleView.vue'
import EmptyView from '@/components/EmptyView.vue'
import TimeView from "@/components/TimeView.vue";

const {t} = useI18n()
const notice = useNoticeStore()

const loading = ref(false)
const revokingOther = ref(false)
const revokingSessionId = ref<string | null>(null)
const sessions = ref<any[]>([])

onMounted(() => {
  loadSessions()
})

/**
 * 加载当前用户的多平台登录会话记录
 */
const loadSessions = async () => {
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
    notice.error(err?.message || '获取登录会话失败')
  } finally {
    loading.value = false
  }
}

/**
 * 一键注销其他平台/设备令牌
 */
const onRevokeOtherSessions = async () => {
  if (!confirm('确定要注销其他所有平台与设备的登录令牌吗？其他设备将被即时挤下线。')) {
    return
  }

  try {
    revokingOther.value = true

    await apis.userApi().revokeOtherSessions()
    notice.success('其他设备已成功下线')

    await loadSessions()
  } catch (err: any) {
    notice.error(err?.message || '注销其他设备失败')
  } finally {
    revokingOther.value = false
  }
}

/**
 * 注销指定会话令牌
 * @param session 会话条目对象
 */
const onRevokeSession = async (session: any) => {
  if (!confirm(`确定要注销此设备 [${session.browser || session.platform}] 的登录状态吗？`)) {
    return
  }

  try {
    revokingSessionId.value = session.sessionId

    await apis.userApi().revokeUserSession(session.sessionId)

    notice.success('指定设备已成功注销', {mode: 'minimal'})

    await loadSessions()
  } catch (err: any) {
    notice.error(err?.message || '注销失败')
  } finally {
    revokingSessionId.value = null
  }
}

/**
 * 根据平台返回对应图标
 * @param platform 平台标识
 */
const getPlatformIcon = (platform: string) => {
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
 * @param platform 平台标识
 */
const getPlatformName = (platform: string) => {
  switch (platform) {
    case 'client':
      return '桌面客户端 (Client)'
    case 'admin':
      return '管理后台 (Admin)'
    case 'bot':
      return '机器人集成 (Bot)'
    case 'web':
    default:
      return '网页端 (Web)'
  }
}
</script>

<template>
  <div class="user-account-sessions">
    <AffixBoxHasTitleView
        title="登录设备与令牌管理"
        subtitle="每个平台（网页/客户端/后台/机器人）仅保留单一有效登录窗口，再次登录将安全互踢。在此可查看登录足迹并一键注销其他设备。">
      <template v-slot:title>
        {{ t('account.sessions.title') }}
      </template>

      <div>
        <v-row class="mb-1">
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-btn
                v-if="sessions.length > 1"
                color="error"
                variant="tonal"
                size="small"
                prepend-icon="mdi-logout-variant"
                :loading="revokingOther"
                @click="onRevokeOtherSessions"
            >
              注销其他所有设备
            </v-btn>
          </v-col>
        </v-row>

        <Loading v-if="loading"/>
        <div v-else-if="sessions.length" class="d-flex flex-column ga-3">
          <v-card
              v-for="s in sessions"
              :key="s.id"
              variant="flat"
              :class="['pa-4 border', s.isCurrent ? 'current-session-card' : '']">
            <div class="d-flex align-center justify-space-between flex-wrap ga-3">
              <div class="d-flex align-center ga-3">
                <v-avatar size="44" :color="s.isCurrent ? 'primary' : 'grey-lighten-3'" rounded="lg">
                  <v-icon :color="s.isCurrent ? 'white' : 'grey-darken-2'" size="24">
                    {{ getPlatformIcon(s.platform) }}
                  </v-icon>
                </v-avatar>

                <div>
                  <div class="d-flex align-center ga-2 flex-wrap">
                    <span class="font-weight-bold text-subtitle-2">{{ getPlatformName(s.platform) }}</span>
                    <v-chip v-if="s.isCurrent" size="x-small" color="success" variant="flat" class="font-weight-medium">
                      当前设备
                    </v-chip>
                    <v-chip v-else-if="s.status === 'active'" size="x-small" color="primary" variant="tonal">
                      在线
                    </v-chip>
                    <v-chip v-else size="x-small" color="grey" variant="tonal">
                      已下线
                    </v-chip>
                  </div>

                  <div class="text-caption text-medium-emphasis mt-1 d-flex align-center ga-3 flex-wrap">
                    <span>
                      <v-icon size="14" class="mr-1">mdi-devices</v-icon>
                      {{ s.browser || '未知浏览器' }} · {{ s.os || '未知系统' }} {{ s.device ? `(${s.device})` : '' }}
                    </span>
                    <span>
                      <v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>
                      IP: {{ s.ip || '—' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="d-flex align-center ga-3 align-self-md-center">
                <div class="text-caption text-medium-emphasis text-right">
                  <div>登录于:
                    <TimeView :time="s.loginTime"></TimeView>
                  </div>
                  <div v-if="s.lastActiveTime">活跃:
                    <TimeView :time="s.lastActiveTime"></TimeView>
                  </div>
                </div>

                <v-btn
                    v-if="!s.isCurrent && s.status === 'active'"
                    size="small"
                    variant="outlined"
                    color="error"
                    :loading="revokingSessionId === s.sessionId"
                    @click="onRevokeSession(s)">
                  下线此设备
                </v-btn>
              </div>
            </div>
          </v-card>
        </div>

        <div v-else class="text-center py-8 text-medium-emphasis text-caption">
          <EmptyView>
            <template v-slot:description>
              暂无活跃登录会话记录
            </template>
          </EmptyView>
        </div>
      </div>
    </AffixBoxHasTitleView>
  </div>
</template>

<style scoped lang="less">
</style>
