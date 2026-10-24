<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useNoticeStore} from '~/stores/noticeStore'
import {apis} from '@/assets/sripts'
import {VOtpInput} from 'vuetify/components/VOtpInput'
import {handleApiError} from '@/assets/sripts/error_handler'
import {usePageHotkeys} from '@/assets/sripts/page_hotkeys'
import {ApiError} from '@/assets/types/Api'
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t} = useI18n()
const notice = useNoticeStore()

const enabled = ref(false)
const loading = ref(false)
const step = ref<'idle' | 'setup' | 'verify' | 'done'>('idle')

// setup 阶段返回
const setupData = ref<{ setupToken: string; secret: string; otpauthUri: string; qrCodeDataUrl: string; recoveryCodes: string[] } | null>(null)

// verify 阶段输入
const verifyCode = ref('')

// 恢复码展示弹窗
const recoveryCodesModal = ref(false)
const displayedCodes = ref<string[]>([])

// 密码确认弹窗
const passwordDialog = ref(false)
const passwordInput = ref('')
const passwordLoading = ref(false)
let passwordConfirmCallback: ((pwd: string) => Promise<void>) | null = null

// 已启用时展示的图标
const statusIcon = computed(() => enabled.value ? 'mdi-shield-check' : 'mdi-shield-off-outline')

/**
 * 什么是两步验证的三个要点
 */
const features = computed(() => [
  {icon: 'mdi-lock-alert-outline', title: t('account.twoFactor.features.leak.title'), desc: t('account.twoFactor.features.leak.desc')},
  {icon: 'mdi-cellphone-key', title: t('account.twoFactor.features.apps.title'), desc: t('account.twoFactor.features.apps.desc')},
  {icon: 'mdi-wifi-off', title: t('account.twoFactor.features.offline.title'), desc: t('account.twoFactor.features.offline.desc')},
])

/**
 * 启用流程的四个步骤
 */
const flowSteps = computed(() => ['identity', 'bind', 'recovery', 'confirm'].map(key => ({
  key,
  title: t(`account.twoFactor.flow.${key}.title`),
  desc: t(`account.twoFactor.flow.${key}.desc`),
})))

// 常见问题条目顺序
const faqKeys = ['invalidCode', 'recovery', 'lostRecovery', 'newPhone', 'trust', 'setupExpired'] as const

/**
 * 常见问题问答列表
 */
const faqItems = computed(() => faqKeys.map(key => ({
  key,
  q: t(`account.twoFactor.faq.${key}.q`),
  a: t(`account.twoFactor.faq.${key}.a`),
})))

/**
 * 打开密码确认弹窗，回调在用户输入密码并确认后执行
 */
const openPasswordDialog = (callback: (pwd: string) => Promise<void>) => {
  passwordInput.value = ''
  passwordConfirmCallback = callback
  passwordDialog.value = true
}

/**
 * 确认密码：执行回调
 */
const onPasswordConfirm = async () => {
  if (!passwordInput.value.trim() || !passwordConfirmCallback) return
  passwordLoading.value = true
  try {
    await passwordConfirmCallback(passwordInput.value.trim())
    // 成功才关闭弹窗
    passwordDialog.value = false
    passwordConfirmCallback = null
    passwordInput.value = ''
  } catch (e) {
    // 失败：显示错误提示，弹窗保持打开让用户重新输入
    handleApiError(e, notice, t, {component: 'TwoFactor', tPrefix: 'basic.tips'})
  } finally {
    passwordLoading.value = false
  }
}

/**
 * 加载启用状态
 */
const onLoadStatus = async () => {
  loading.value = true
  try {
    const r = await apis.userApi().get2faStatus()
    // 接口返回体为 { success, code, data: { enabled } }，需从内层 data 取状态
    const d = (r as any).data?.data || (r as any).data
    enabled.value = !!d?.enabled
  } catch (e) {
    handleApiError(e, notice, t, {component: 'TwoFactor', tPrefix: 'basic.tips'})
  } finally {
    loading.value = false
  }
}

onMounted(onLoadStatus)

/**
 * 启动设置流程：先弹密码框，验证后生成 secret + 恢复码
 */
const onStartSetup = () => {
  openPasswordDialog(async (pwd) => {
    const r = await apis.userApi().setup2fa(pwd, t('name'))
    const d = (r as any).data?.data || (r as any).data

    setupData.value = d
    step.value = 'setup'
  })
}

/**
 * 确认 2FA 启用：校验 6 位码
 */
const onConfirmEnable = async () => {
  if (verifyCode.value.length !== 6) return
  if (!setupData.value) return
  passwordLoading.value = true
  try {
    await apis.userApi().verify2fa(setupData.value.setupToken, verifyCode.value.trim())

    enabled.value = true
    step.value = 'done'
    notice.success(t('account.twoFactor.enabled'))
  } catch (e) {
    handleApiError(e, notice, t, {component: 'TwoFactor', tPrefix: 'basic.tips'})
    // setupToken 已过期（10 分钟），重置流程让用户重新启用
    if (e instanceof ApiError && e.code === '2fa.setupTokenExpired') {
      onReset()
    }
  } finally {
    passwordLoading.value = false
  }
}

/**
 * 禁用 2FA
 */
const onDisable = () => {
  openPasswordDialog(async (pwd) => {
    if (!confirm(t('account.twoFactor.disableConfirm'))) return
    await apis.userApi().disable2fa(pwd)
    enabled.value = false
    step.value = 'idle'
    setupData.value = null
    notice.success(t('account.twoFactor.disabled'))
  })
}

/**
 * 重新生成恢复码
 */
const onRegenerateCodes = () => {
  openPasswordDialog(async (pwd) => {
    if (!confirm(t('account.twoFactor.regenerateConfirm'))) return
    const r = await apis.userApi().regenerateRecoveryCodes(pwd)
    const d = (r as any).data?.data || (r as any).data
    displayedCodes.value = d?.recoveryCodes || []
    recoveryCodesModal.value = true
    notice.success(t('account.twoFactor.regenerated'))
  })
}

/**
 * 复制到剪贴板
 */
const onCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    notice.success(t('basic.tips.copySuccess'))
  } catch {
    notice.warning(t('basic.tips.copyFailed'))
  }
}

/**
 * 返回到设置面板
 */
const onReset = () => {
  step.value = 'idle'
  setupData.value = null
  verifyCode.value = ''
}

// 已启用且没有密码弹窗时才能重新生成恢复码
const canRegenerateRecovery = computed(() =>
    enabled.value && step.value === 'idle' && !passwordDialog.value && !passwordLoading.value,
)

// 设置流程中校验码填满后才允许提交启用
const canConfirmEnable = computed(() =>
    step.value === 'setup' && Boolean(setupData.value) && verifyCode.value.length === 6 && !passwordLoading.value,
)

// 设置流程或启用完成态下取消可回到初始面板
const canResetTwoFactor = computed(() => step.value === 'setup' || step.value === 'done')

usePageHotkeys({
  accountRegenRecovery: onRegenerateCodes,
}, {
  active: () => canRegenerateRecovery.value,
})

usePageHotkeys({
  accountSave: onConfirmEnable,
}, {
  active: () => canConfirmEnable.value,
})

usePageHotkeys({
  accountCancel: onReset,
}, {
  active: () => canResetTwoFactor.value,
  allowInEditable: ['accountCancel'],
})
</script>

<template>
  <div class="twofactor-page">
    <v-row>
      <!-- 主操作区 S -->
      <v-col cols="12" lg="8">
        <AffixBoxHasTitleView>
          <template v-slot:title>
            {{ step === 'setup' ? t('account.twoFactor.enable') : step === 'done' ? t('account.twoFactor.enabled') : t('account.twoFactor.statusTitle') }}
          </template>



          <!-- 状态与操作 S -->
          <div v-if="step === 'idle'" class="d-flex align-start flex-wrap ga-4">
            <v-avatar size="56" :color="enabled ? 'green' : 'grey'" variant="tonal" class="flex-shrink-0">
              <v-icon :icon="statusIcon" size="30"/>
            </v-avatar>

            <div class="flex-grow-1" style="min-width: 240px">
              <div class="text-subtitle-1 font-weight-medium">
                {{ enabled ? t('account.twoFactor.statusOn') : t('account.twoFactor.statusOff') }}
              </div>
              <p class="text-body-2 opacity-70 mt-1 mb-4">
                {{ enabled ? t('account.twoFactor.enabledNote') : t('account.twoFactor.statusHint') }}
              </p>

              <div class="d-flex flex-wrap ga-2">
                <v-btn v-if="!enabled"
                       color="amber"
                       variant="flat"
                       prepend-icon="mdi-shield-plus-outline"
                       :loading="passwordLoading"
                       @click="onStartSetup">
                  {{ t('account.twoFactor.enable') }}
                </v-btn>

                <template v-else>
                  <v-btn variant="tonal"
                         prepend-icon="mdi-key-chain-variant"
                         :loading="passwordLoading"
                         @click="onRegenerateCodes">
                    {{ t('account.twoFactor.regenerate') }}
                  </v-btn>
                  <v-btn variant="outlined"
                         color="red"
                         prepend-icon="mdi-shield-off-outline"
                         :loading="passwordLoading"
                         @click="onDisable">
                    {{ t('account.twoFactor.disable') }}
                  </v-btn>
                </template>
              </div>
            </div>
          </div>
          <!-- 状态与操作 E -->

          <!-- 启用成功 S -->
          <div v-else-if="step === 'done'" class="d-flex align-center flex-wrap ga-4">
            <v-avatar size="56" color="green" variant="tonal" class="flex-shrink-0">
              <v-icon icon="mdi-check-decagram-outline" size="30"/>
            </v-avatar>

            <div class="flex-grow-1" style="min-width: 240px">
              <div class="text-subtitle-1 font-weight-medium mb-1">{{ t('account.twoFactor.enabled') }}</div>
              <p class="text-body-2 opacity-70 mb-0">{{ t('account.twoFactor.enabledDesc') }}</p>
            </div>

            <v-btn variant="tonal" color="amber" @click="onReset">{{ t('basic.button.close') }}</v-btn>
          </div>
          <!-- 启用成功 E -->

          <!-- 三步设置流程 S -->
          <div v-else-if="step === 'setup' && setupData">
            <p class="text-caption opacity-60 mb-4">{{ t('account.twoFactor.setupHint') }}</p>

            <!-- 步骤 1 S -->
            <div class="step-item">
              <div class="step-badge">1</div>
              <div class="step-content">
                <div class="text-body-1 font-weight-medium mb-1">{{ t('account.twoFactor.step1Title') }}</div>
                <div class="text-caption opacity-60 mb-3">{{ t('account.twoFactor.qrHint') }}</div>

                <div class="d-flex flex-wrap ga-6 align-start">
                  <div class="qr-frame flex-shrink-0">
                    <img :src="setupData.qrCodeDataUrl" alt="2FA QR" width="150" height="150" class="rounded"/>
                  </div>

                  <div class="flex-grow-1" style="min-width: 220px">
                    <div class="text-caption mb-1">{{ t('account.twoFactor.manualKey') }}</div>
                    <v-text-field :model-value="setupData.secret"
                                  readonly
                                  hide-details
                                  density="compact"
                                  variant="solo-filled">
                      <template v-slot:append-inner>
                        <v-btn icon="mdi-content-copy" size="small" variant="text" @click="onCopy(setupData.secret)"/>
                      </template>
                    </v-text-field>
                  </div>
                </div>
              </div>
            </div>
            <!-- 步骤 1 E -->

            <!-- 步骤 2 S -->
            <div class="step-item">
              <div class="step-badge">2</div>
              <div class="step-content">
                <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-1">
                  <span class="text-body-1 font-weight-medium">{{ t('account.twoFactor.step2Title') }}</span>
                  <v-btn size="x-small"
                         variant="text"
                         prepend-icon="mdi-content-copy"
                         @click="onCopy(setupData.recoveryCodes.join('\n'))">
                    {{ t('account.twoFactor.copyAll') }}
                  </v-btn>
                </div>
                <div class="text-caption opacity-60 mb-3">{{ t('account.twoFactor.recoveryHint') }}</div>

                <div class="d-flex flex-wrap gap-2 mb-3">
                  <v-chip v-for="c in setupData.recoveryCodes" :key="c" variant="tonal" color="amber">
                    <code class="mono">{{ c }}</code>
                  </v-chip>
                </div>

                <div class="text-caption text-red">{{ t('account.twoFactor.recoveryWarning') }}</div>
              </div>
            </div>
            <!-- 步骤 2 E -->

            <!-- 步骤 3 S -->
            <div class="step-item">
              <div class="step-badge">3</div>
              <div class="step-content">
                <div class="text-body-1 font-weight-medium mb-1">{{ t('account.twoFactor.step3Title') }}</div>
                <div class="text-caption opacity-60 mb-3">{{ t('account.twoFactor.step3Hint') }}</div>

                <v-otp-input v-model="verifyCode"
                             :length="6"
                             variant="solo-filled"
                             :label="t('account.twoFactor.verifyCode')"
                             :disabled="passwordLoading"
                             class="mb-3 ml-n2"
                             style="max-width: 320px"/>

                <div class="d-flex ga-2">
                  <v-btn variant="flat"
                         color="amber"
                         :loading="passwordLoading"
                         :disabled="verifyCode.length !== 6"
                         @click="onConfirmEnable">
                    {{ t('account.twoFactor.confirmEnable') }}
                  </v-btn>

                  <v-btn v-if="step === 'setup'" border variant="text" @click="onReset">
                    {{ t('basic.button.cancel') }}
                  </v-btn>
                </div>
              </div>
            </div>
            <!-- 步骤 3 E -->
          </div>
          <!-- 三步设置流程 E -->
        </AffixBoxHasTitleView>
      </v-col>
      <!-- 主操作区 E -->

      <!-- 流程说明 S -->
      <v-col cols="12" lg="4">
        <AffixBoxHasTitleView>
          <template v-slot:title>
            {{ t('account.twoFactor.flowTitle') }}
          </template>

          <p class="mb-4">{{ t('account.twoFactor.flowHint') }}</p>

          <div v-for="(item, index) in flowSteps" :key="item.key" class="flow-item">
            <div class="flow-index">{{ index + 1 }}</div>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.title }}</div>
              <div class="text-caption opacity-60">{{ item.desc }}</div>
            </div>
          </div>
        </AffixBoxHasTitleView>
      </v-col>
      <!-- 流程说明 E -->
    </v-row>

    <!-- 常见问题 S -->
    <v-row border class="pa-5 mt-4">
      <v-col cols="12" lg="3" class="d-flex flex-column align-start">
        <p class="text-h5">{{ t('account.twoFactor.faqTitle') }}</p>
        <p class="mt-2 opacity-60">{{ t('account.twoFactor.description') }}</p>
      </v-col>
      <v-col cols="12" lg="9">
        <v-expansion-panels variant="accordion" flat rounded gap="10">
          <v-expansion-panel rounded="30" :title="t('account.twoFactor.introTitle')">
            <template v-slot:text>
              <!-- 功能说明 S -->
              <p class="mb-4">{{ t('account.twoFactor.introDesc') }}</p>

              <v-row class="">
                <v-col v-for="item in features" :key="item.icon" cols="12" md="4">
                  <div class="d-flex ga-3">
                    <v-icon :icon="item.icon" color="amber" size="22" class="mt-1 flex-shrink-0"/>
                    <div>
                      <div class="font-weight-medium">{{ item.title }}</div>
                      <div class="opacity-60">{{ item.desc }}</div>
                    </div>
                  </div>
                </v-col>
              </v-row>
              <!-- 功能说明 E -->
            </template>
          </v-expansion-panel>

          <v-expansion-panel rounded="30" v-for="item in faqItems" :key="item.key" :title="item.q" :text="item.a"/>
        </v-expansion-panels>
      </v-col>
    </v-row>
    <!-- 常见问题 E -->

    <!-- 密码确认 S -->
    <v-dialog v-model="passwordDialog" max-width="400">
      <v-card>
        <v-card-title>{{ t('account.twoFactor.currentPassword') }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="passwordInput"
                        type="password"
                        variant="solo-filled"
                        :label="t('account.twoFactor.currentPassword')"
                        prepend-inner-icon="mdi-lock"
                        @keydown.enter="onPasswordConfirm"/>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn variant="text" @click="passwordDialog = false">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn variant="flat" color="amber"
                 :loading="passwordLoading"
                 :disabled="!passwordInput.trim()"
                 @click="onPasswordConfirm">
            {{ t('basic.button.submit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 密码确认 E -->

    <!-- 恢复码弹窗 S -->
    <v-dialog v-model="recoveryCodesModal" max-width="480">
      <v-card>
        <v-card-title>{{ t('account.twoFactor.recoveryCodesTitle') }}</v-card-title>
        <v-card-text>
          <div class="text-caption text-red mb-2">{{ t('account.twoFactor.recoveryWarning') }}</div>
          <div class="d-flex flex-wrap gap-2 mb-2">
            <v-chip v-for="c in displayedCodes" :key="c" variant="tonal" color="amber">
              <code class="mono">{{ c }}</code>
            </v-chip>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" :prepend-icon="'mdi-content-copy'" @click="onCopy(displayedCodes.join('\n'))">
            {{ t('account.twoFactor.copyAll') }}
          </v-btn>
          <v-spacer/>
          <v-btn variant="text" @click="recoveryCodesModal = false">{{ t('basic.button.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- 恢复码弹窗 E -->
  </div>
</template>

<style scoped>
.twofactor-page .mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.qr-frame {
  display: inline-flex;
  padding: 8px;
  background: #fff;
  border-radius: 8px;
}

/* 设置流程步骤 */
.step-item {
  position: relative;
  padding-left: 52px;
  padding-bottom: 28px;
}

.step-item:last-child {
  padding-bottom: 0;
}

.step-item:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 36px;
  bottom: 4px;
  left: 15px;
  width: 2px;
  background: rgba(255, 193, 7, 0.18);
}

.step-badge {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffc107;
  background: rgba(255, 193, 7, 0.12);
  border: 1px solid rgba(255, 193, 7, 0.35);
  border-radius: 50%;
}

.step-content {
  min-width: 0;
}

.flow-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding-bottom: 20px;
}

.flow-item:last-child {
  padding-bottom: 0;
}

.flow-item:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 28px;
  bottom: 4px;
  left: 13px;
  width: 2px;
  background: rgba(255, 255, 255, 0.08);
}

.flow-index {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}
</style>
