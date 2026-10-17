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
    notice.error(err?.message || t('account.sessions.fetchError'))
  } finally {
    loading.value = false
  }
}

/**
 * 一键注销其他平台/设备令牌
 */
const onRevokeOtherSessions = async () => {
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
 * @param session 会话条目对象
 */
const onRevokeSession = async (session: any) => {
  const targetName = session.browser || session.platform || ''
  if (!confirm(t('account.sessions.revokeConfirm', { name: targetName }))) {
    return
  }

  try {
    revokingSessionId.value = session.sessionId

    await apis.userApi().revokeUserSession(session.sessionId)

    notice.success(t('account.sessions.revokeSuccess'), { mode: 'minimal' })

    await loadSessions()
  } catch (err: any) {
    notice.error(err?.message || t('account.sessions.revokeError'))
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
</script>

<template>
  <div class="account-sessions-root">
    <AffixBoxHasTitleView>
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
              {{ t('account.sessions.revokeOther') }}
            </v-btn>
          </v-col>
        </v-row>

        <Loading v-if="loading"/>
        <div v-else-if="sessions.length" class="d-flex flex-column ga-3">
          <v-card
              v-for="s in sessions"
              :key="s.sessionId || s.id"
              variant="flat"
              :class="['pa-4 border account-sessions-card', s.isCurrent ? 'account-sessions-card-current' : '']">
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
                      {{ t('account.sessions.currentDevice') }}
                    </v-chip>
                    <v-chip v-else-if="s.status === 'active'" size="x-small" color="primary" variant="tonal">
                      {{ t('account.sessions.online') }}
                    </v-chip>
                    <v-chip v-else size="x-small" color="grey" variant="tonal">
                      {{ t('account.sessions.offline') }}
                    </v-chip>
                  </div>

                  <div class="text-caption text-medium-emphasis mt-1 d-flex align-center ga-3 flex-wrap">
                    <span>
                      <v-icon size="14" class="mr-1">mdi-devices</v-icon>
                      {{ s.browser || t('account.sessions.unknownBrowser') }} · {{ s.os || t('account.sessions.unknownOS') }} {{ s.device ? `(${s.device})` : '' }}
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
                  <div>{{ t('account.sessions.loginAt') }}
                    <TimeView :time="s.loginTime"></TimeView>
                  </div>
                  <div v-if="s.lastActiveTime">{{ t('account.sessions.activeAt') }}
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
                  {{ t('account.sessions.revokeThis') }}
                </v-btn>
              </div>
            </div>
          </v-card>
        </div>

        <div v-else class="text-center py-8 text-medium-emphasis text-caption">
          <EmptyView>
            <template v-slot:description>
              {{ t('account.sessions.empty') }}
            </template>
          </EmptyView>
        </div>
      </div>
    </AffixBoxHasTitleView>
  </div>
</template>

<style scoped lang="less">
.account-sessions-root {
  .account-sessions-card {
    transition: border-color 0.2s ease, background-color 0.2s ease;

    &-current {
      border-color: rgba(var(--v-theme-primary), 0.4) !important;
      background-color: rgba(var(--v-theme-primary), 0.03);
    }
  }
}
</style>
