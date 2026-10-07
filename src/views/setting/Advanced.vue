<template>
  <v-row>
      <!-- 桌面通知与活动提醒权限控制 -->
      <v-col cols="12" md="8" lg="6">
        <AffixBoxHasTitleView>
          <p class="text-caption opacity-60 mb-5">
            {{ t('setting.advanced.notification.description') }}
          </p>

          <!-- 权限状态提示与总开关 -->
          <v-list lines="two" class="bg-transparent mb-4">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon :color="permissionColor">
                  {{ permissionIcon }}
                </v-icon>
              </template>
              <v-list-item-title>{{ t('setting.advanced.notification.status') }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ t(`setting.advanced.notification.${reminderStore.permissionStatus}`) || reminderStore.permissionStatus }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-btn
                    v-if="reminderStore.permissionStatus !== 'granted' && reminderStore.permissionStatus !== 'unsupported'"
                    size="small"
                    variant="tonal"
                    color="amber"
                    @click="onRequestPermission">
                  {{ t('setting.advanced.notification.requestPermission') }}
                </v-btn>
              </template>
            </v-list-item>

            <!-- 桌面通知总开关 -->
            <v-list-item>
              <template v-slot:prepend>
                <v-icon :color="reminderStore.masterNotificationEnabled ? 'amber' : 'grey'">
                  mdi-bell-badge-outline
                </v-icon>
              </template>
              <v-list-item-title>{{ t('setting.advanced.notification.masterSwitch') }}</v-list-item-title>
              <v-list-item-subtitle>{{ t('setting.advanced.notification.masterSwitchDesc') }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-switch
                    hide-details
                    inset
                    density="compact"
                    color="amber"
                    :model-value="reminderStore.masterNotificationEnabled"
                    @update:model-value="onToggleMasterNotification">
                </v-switch>
              </template>
            </v-list-item>
          </v-list>

          <template v-slot:title>
            {{ t('setting.advanced.notification.title') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>

      <!-- 人机验证系统设置 -->
      <v-col cols="12" md="8" lg="6">
        <AffixBoxHasTitleView>
          <p class="text-caption opacity-60 mb-5">
            {{ t('setting.advanced.captcha.description') }}
          </p>

          <v-select
              v-model="captchaProvider"
              :items="captchaOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              color="amber"
              hide-details
              @update:model-value="onCaptchaProviderChange">
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:title>
                  <div class="d-flex align-center ga-2">
                    <span>{{ item.raw.title }}</span>
                    <v-chip v-if="item.raw.recommend" size="x-small" color="success" variant="tonal">
                      {{ t('setting.advanced.captcha.recommend') }}
                    </v-chip>
                  </div>
                </template>
                <template v-slot:subtitle>
                  <span class="text-caption opacity-60">{{ item.raw.subtitle }}</span>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <template v-slot:title>
            {{ t('setting.advanced.captcha.title') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>

      <!-- PWA 应用设置 -->
      <v-col cols="12" md="8" lg="6">
        <AffixBoxHasTitleView>
          <p class="text-caption">{{ t('pwa.status.description') }}</p>

          <div class="mb-5">
            <v-list lines="two" class="bg-transparent">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon :color="status === 'ready' || status === 'installed' ? '' : 'warning'">
                    {{ isInstalled ? 'mdi-cellphone-check' : 'mdi-web' }}
                  </v-icon>
                </template>
                <v-list-item-title>{{ t('pwa.status.label') }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ t(`pwa.status.${status}`) || status }}
                </v-list-item-subtitle>
              </v-list-item>

              <!-- 有新内容时的刷新项 -->
              <v-list-item v-if="needRefresh">
                <template v-slot:prepend>
                  <v-icon color="info">mdi-update</v-icon>
                </template>
                <v-list-item-title>{{ t('pwa.newContentAvailable') }}</v-list-item-title>
                <v-list-item-subtitle>{{ t('pwa.refreshToUpdate') }}</v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn color="info" variant="flat" @click="onRefresh">
                    {{ t('basic.button.refresh') }}
                  </v-btn>
                </template>
              </v-list-item>

              <!-- 安装选项 -->
              <v-list-item v-if="!isInstalled">
                <template v-slot:prepend>
                  <v-icon :color="installPrompt ? 'amber' : 'grey-lighten-1'">
                    {{ installPrompt ? 'mdi-download' : 'mdi-download-off' }}
                  </v-icon>
                </template>
                <v-list-item-title>{{ t('pwa.install.title') }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ installPrompt ? (t('pwa.install.description')) : (t('pwa.install.unavailable')) }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn :disabled="!installPrompt"
                         variant="tonal"
                         @click="onInstall"
                         :color="installPrompt ? 'amber' : ''">
                    {{ t('pwa.install.button')}}
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <v-alert
              v-if="offlineReady"
              type="success"
              variant="tonal"
              icon="mdi-check-circle"
              class="mb-4">
            {{ t('pwa.offlineReady') }}
          </v-alert>

          <div class="text-caption text-grey">
            <p v-if="isInstalled">{{ t('pwa.status.installed_message') }}</p>
            <p v-else-if="!installPrompt">
              {{ t('pwa.install.help.title') }}<br>
              {{ t('pwa.install.help.step1') }}<br>
              {{ t('pwa.install.help.step2') }}<br>
              {{ t('pwa.install.help.step3') }}
            </p>
          </div>

          <template v-slot:title>
            {{ t('pwa.status.title') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>

      <!-- 开发者调试 -->
      <v-col cols="12" md="8" lg="6">
        <AffixBoxHasTitleView>
          <p class="text-caption opacity-60">
            {{ t('setting.advanced.hint') }}
          </p>
          <p class="mt-1 mb-5 text-caption opacity-60">
            {{ t('setting.advanced.debugDesc') }}
          </p>

          <v-row align="center" no-gutters>
            <v-col class="font-weight-bold">
              {{ t('setting.advanced.debugName') }}
            </v-col>
            <v-col cols="auto">
              <v-switch
                  hide-details
                  inset
                  density="compact"
                  color="error"
                  v-model="debugSwitch"
                  @update:modelValue="onDebugSwitch"></v-switch>
            </v-col>
          </v-row>

          <template v-slot:title>
            {{ t('setting.advanced.cardTitle') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
    </v-row>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import AffixBoxHasTitleView from '@/components/AffixBoxHasTitleView.vue'
import { useAppStore } from '~/stores/appStore'
import { useReminderStore } from '~/stores/reminderStore'
import { useNoticeStore } from '~/stores/noticeStore'
import { use_pwa } from '@/assets/sripts/use_pwa'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const reminderStore = useReminderStore()
const notice = useNoticeStore()

// 开发者调试开关
const debugSwitch = ref(appStore.isDebug)

const onDebugSwitch = (val: boolean) => {
  appStore.setDebug(val)
}

// 验证器类型切换
const captchaProvider = ref(appStore.captchaType)

const captchaOptions = computed(() => [
  {
    title: t('setting.advanced.captcha.turnstile'),
    subtitle: t('setting.advanced.captcha.turnstileDesc'),
    value: 'turnstile',
    recommend: true
  },
  {
    title: t('setting.advanced.captcha.svg'),
    subtitle: t('setting.advanced.captcha.svgDesc'),
    value: 'svg',
    recommend: false
  }
])

const onCaptchaProviderChange = (val: any) => {
  appStore.setCaptchaType(val)
  notice.success(t('basic.tips.captcha.ok'), {mode: 'minimal'})
}

// 通知设置相关
const permissionColor = computed(() => {
  if (reminderStore.permissionStatus === 'granted') return 'success'
  if (reminderStore.permissionStatus === 'denied') return 'error'
  return 'warning'
})

const permissionIcon = computed(() => {
  if (reminderStore.permissionStatus === 'granted') return 'mdi-check-circle'
  if (reminderStore.permissionStatus === 'denied') return 'mdi-close-circle'
  return 'mdi-alert-circle'
})

const onRequestPermission = async () => {
  const granted = await reminderStore.requestPermission()
  if (granted) {
    notice.success(t('setting.advanced.notification.permissionGrantedMsg'), {
      title: t('setting.advanced.notification.title')
    })
  } else {
    notice.warning(t('setting.advanced.notification.permissionDeniedMsg'), {
      title: t('setting.advanced.notification.title')
    })
  }
}

const onToggleMasterNotification = (val: boolean) => {
  reminderStore.setMasterNotification(val)
}

const onSendTestNotification = () => {
  reminderStore.triggerTestNotification({
    title: t('setting.advanced.notification.testTitle'),
    note: t('setting.advanced.notification.testBody')
  })
}

const onGoToReminders = () => {
  router.push('/reminder')
}

// PWA 应用状态与更新逻辑
const { status, reload, install, isInstalled, needRefresh, offlineReady, installPrompt, closePwaUpdate } = use_pwa()

const isWidgetsRoute = computed(() => route.path.startsWith('/widgets') || route.path.includes('/widgets'))

// 监听离线就绪状态
watch(
  () => offlineReady.value,
  (ready) => {
    if (ready && !isWidgetsRoute.value) {
      notice.info(t('pwa.offlineReady'), {
        title: t('pwa.status.label'),
        mode: 'minimal',
        timeout: 5000
      })
      closePwaUpdate()
    }
  }
)

// 监听新版本发布
watch(
  () => needRefresh.value,
  (refresh) => {
    if (refresh && !isWidgetsRoute.value) {
      notice.primary(`${t('pwa.newContentAvailable')} - ${t('pwa.refreshToUpdate')}`, {
        title: t('pwa.newContentAvailable'),
        mode: 'minimal',
        timeout: 0
      })
    }
  }
)

const onRefresh = () => {
  reload()
}

const onInstall = () => {
  install()
}

onMounted(() => {
  reminderStore.init()
})
</script>

<style scoped lang="less">
</style>
