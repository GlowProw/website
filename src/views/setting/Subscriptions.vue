<script setup lang="ts">

import {computed, onMounted, onUnmounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {CreateOrderParams, MyOrder, SubscriptionPlans, SubscriptionProgress, useSubscriptionApi} from '@/assets/sripts/api/subscription_service'
import type {SubscriptionTierItem} from '@/assets/types/Subscription'
import {subscriptionsConfig} from '~/public/config/subscriptions'
import {useAuthStore} from '~/stores/userAccountStore'
import {useNoticeStore} from '~/stores/noticeStore'
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {t, te, locale} = useI18n()
const authStore = useAuthStore()
const notice = useNoticeStore()
const api = useSubscriptionApi()

const loading = ref(false)
const plans = ref<SubscriptionPlans | null>(null)
const progress = ref<SubscriptionProgress | null>(null)
const hall = ref<any[]>([])
const myStatus = ref<Record<string, any>>({})

const period = ref<'monthly' | 'yearly'>('monthly')
const customAmount = ref<number | string>('')

// 支付平台选择弹窗状态
const checkoutDialog = ref(false)
const pendingTier = ref<{ tier: string; period: 'monthly' | 'yearly' | 'once'; amount?: number } | null>(null)
const submitting = ref(false)

const isZh = computed(() => String(locale.value).startsWith('zh'))

// 待支付订单状态（倒计时 / 取消 / 继续支付）
const pendingOrders = ref<MyOrder[]>([])
const nowTick = ref(Date.now())
let tickTimer: ReturnType<typeof setInterval> | null = null
const cancellingOrderId = ref<number | null>(null)
const continuingOrderId = ref<number | null>(null)

/**
 * 获取档位的本地化展示名称
 * 优先匹配 i18n 语言包（subscription.tiers.${tier}.name），不存在时回退至金额显示
 *
 * @param {string} tier - 档位标识
 * @returns {string} 档位显示名称
 */
const getTierName = (tier: string): string => {
  if (tier === 'custom') return t('subscription.tiers.custom.name')
  const key = `subscription.tiers.${tier}.name`
  return te(key) ? t(key) : `¥${tier}`
}

/**
 * 获取档位的描述文案
 * 若语言包未定义该档位描述，则返回空字符串
 *
 * @param {string} tier - 档位标识
 * @returns {string} 档位描述文案
 */
const getTierDesc = (tier: string): string => {
  const key = `subscription.tiers.${tier}.desc`
  return te(key) ? t(key) : ''
}

/**
 * 判断档位是否属于核心捐助者档位
 * 兼容 plans.core 嵌套字段与旧版 core 扁平字段
 *
 * @param {any} tierDef - 档位配置对象
 * @returns {boolean} 是否为核心捐助者档位
 */
const isCoreTier = (tierDef: any): boolean => {
  return Boolean(tierDef?.plans?.core ?? tierDef?.core)
}

/**
 * 计算待支付订单距离超时的剩余毫秒数
 *
 * @param {MyOrder} o - 订单条目数据对象
 * @returns {number} 剩余有效毫秒数，已过期或无过期时间时返回 0
 */
const remainingMs = (o: MyOrder): number =>
    o.expireTime ? Math.max(0, new Date(o.expireTime).getTime() - nowTick.value) : 0

/**
 * 将剩余毫秒数格式化为易读的倒计时时钟文本
 * 剩余时长大于等于 1 小时时显示 `HH:mm:ss`，不足 1 小时时显示 `mm:ss`
 *
 * @param {number} ms - 剩余倒计时毫秒数
 * @returns {string} 格式化后的倒计时字符串
 */
const formatCountdown = (ms: number): string => {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

// 监听待支付订单：若任意单据倒计时归零，立即触发重新拉取订单列表（服务端惰性关单后单据将自动移入历史记录）
const hasExpiredPending = computed(() => pendingOrders.value.some(o => remainingMs(o) <= 0))
watch(hasExpiredPending, v => {
  if (v) loadMyOrders()
})

/**
 * 获取当前登录用户的待支付订单列表
 * 未登录态下静默清空列表；接口异常时做静默容错，避免影响赞助主界面的正常渲染
 *
 * @returns {Promise<void>}
 */
async function loadMyOrders(): Promise<void> {
  if (!authStore.user?.token) {
    pendingOrders.value = []
    return
  }
  try {
    const r = await api.getMyOrders()
    pendingOrders.value = r.pending || []
  } catch {
    // 待支付区块加载失败做静默降级，不阻塞订阅主页
  }
}

/**
 * 取消指定的待支付订单
 * 具备请求防重入锁，成功后弹出通知提示并重新拉取最新的订单列表
 *
 * @param {MyOrder} o - 需要执行取消操作的订单对象
 * @returns {Promise<void>}
 */
const onCancelOrder = async (o: MyOrder): Promise<void> => {
  if (cancellingOrderId.value !== null) return
  cancellingOrderId.value = o.id
  try {
    await api.cancelOrder(o.id)
    notice.minimal(t('subscription.orderCancelled'), 'success')
    await loadMyOrders()
  } catch (e: any) {
    notice.minimal(e?.message || t('subscription.checkoutFailed'), 'error')
  } finally {
    cancellingOrderId.value = null
  }
}

/**
 * 对未完成支付的订单发起继续支付流程
 * 根据原订单中的档位、周期、支付平台及金额重新生成支付请求，并跳转至第三方收银台
 *
 * @param {MyOrder} o - 需要继续支付的目标订单对象
 * @returns {Promise<void>}
 */
const onContinuePay = async (o: MyOrder): Promise<void> => {
  if (continuingOrderId.value !== null) return
  continuingOrderId.value = o.id
  try {
    const payload: CreateOrderParams = {
      tier: o.tier,
      period: (['monthly', 'yearly', 'once'] as const).includes(o.period as any)
          ? o.period as 'monthly' | 'yearly' | 'once'
          : 'once',
      platform: o.platform === 'stripe' ? 'stripe' : 'afdian',
      // 自定义一次性赞助按原金额重开支付单（旧单超时后由服务端自动关闭）
      ...(o.tier === 'custom' ? {amount: Number(o.amountCny || o.amount)} : {})
    }
    const result = await api.createOrder(payload)
    if (result.redirectUrl)
      window.location.href = result.redirectUrl
  } catch (e: any) {
    notice.minimal(e?.message || t('subscription.checkoutFailed'), 'error')
    continuingOrderId.value = null
  }
}

/**
 * 按配置顺序排列的有效订阅档位列表
 * 配置直接源自 subscriptions.ts，完全由前端配置文件驱动
 */
const sortedTiers = computed<SubscriptionTierItem[]>(() => {
  const map = new Map(subscriptionsConfig.tiers.map(i => [i.tier, i]))
  return subscriptionsConfig.tierOrder.map(k => map.get(k)).filter(Boolean) as SubscriptionTierItem[]
})

/**
 * 根据当前选中的订阅周期（按月/按年）获取档位所对应的计费金额
 *
 * @param {any} tierDef - 档位配置对象
 * @returns {number} 档位对应的 CNY 金额
 */
const tierPrice = (tierDef: any): number => period.value === 'yearly' ? tierDef.yearlyCny : tierDef.monthlyCny

/**
 * 判断当前登录用户是否处于有效的「核心捐助者」身份
 */
const iAmCoreDonor = computed(() => {
  const s = myStatus.value?.donor_core
  return !!s && (!s.expiryTime || new Date(s.expiryTime).getTime() > Date.now())
})

/**
 * 判断当前登录用户是否处于有效的「普通捐助者」身份
 */
const iAmDonor = computed(() => {
  const s = myStatus.value?.donor
  return !!s && (!s.expiryTime || new Date(s.expiryTime).getTime() > Date.now())
})

/**
 * 页面主数据加载器
 * 并行请求档位方案（getPlans）、筹款目标进度（getProgress）以及核心捐助榜（getHall）；
 * 若已登录，同步拉取个人会员身份状态（getMyStatus）及待支付订单列表（loadMyOrders）。
 *
 * @returns {Promise<void>}
 */
const load = async (): Promise<void> => {
  loading.value = true
  try {
    const [p, g, h] = await Promise.all([
      api.getPlans().catch(() => null),
      api.getProgress().catch(() => null),
      api.getHall().catch(() => [])
    ])
    plans.value = p
    progress.value = g
    hall.value = h || []
    if (authStore.user?.token) {
      api.getMyStatus().then(s => myStatus.value = s || {}).catch(() => {
      })
      loadMyOrders()
    }
  } finally {
    loading.value = false
  }
}

/**
 * 唤起结算支付对话框
 * 暂存当前结算参数（档位名称、付费周期、金额）并展示平台选择界面
 *
 * @param {string} tier - 档位标识（如 '100' 或 'custom'）
 * @param {'monthly' | 'yearly' | 'once'} per - 付费周期（月度/年度/一次性）
 * @param {number} [amount] - 扣费金额（CNY）
 */
const openCheckout = (tier: string, per: 'monthly' | 'yearly' | 'once', amount?: number): void => {
  pendingTier.value = {tier, period: per, amount}
  checkoutDialog.value = true
}

/**
 * 点击固定档位卡片的「订阅」按钮
 * 根据当前选择的周期获取单价，打开支付渠道弹窗
 *
 * @param {any} tierDef - 选中的档位数据对象
 */
const onTierClick = (tierDef: any): void => {
  openCheckout(tierDef.tier, period.value, tierPrice(tierDef))
}

/**
 * 点击「自定义赞助」按钮
 * 校验金额有效性及最低门槛（>= 5 元），格式化为保留两位小数后打开支付渠道弹窗
 */
const onCustomClick = (): void => {
  const amount = Number(customAmount.value)
  if (!Number.isFinite(amount) || amount < 5) {
    notice.warning(t('subscription.customMin'))
    return
  }
  openCheckout('custom', 'once', Math.round(amount * 100) / 100)
}

/**
 * 确认选择支付平台并正式发起下单流程
 * 验证登录态，提交创建订单请求，并在成功后重定向跳转至三方收银台（爱发电 / Stripe）
 *
 * @param {'afdian' | 'stripe'} platform - 用户选择的支付渠道标识
 * @returns {Promise<void>}
 */
const pay = async (platform: 'afdian' | 'stripe'): Promise<void> => {
  if (!pendingTier.value || submitting.value) return
  if (!authStore.user?.token) {
    notice.warning(t('subscription.loginFirst'))
    return
  }
  submitting.value = true
  try {
    const payload: CreateOrderParams = {
      tier: pendingTier.value.tier,
      period: pendingTier.value.period,
      platform,
      ...(pendingTier.value.amount !== undefined ? {amount: pendingTier.value.amount} : {})
    }
    const result = await api.createOrder(payload)
    if (result.redirectUrl)
      window.location.href = result.redirectUrl
    else
      throw new Error('no redirect url')
  } catch (e: any) {
    notice.error(e?.message || t('subscription.checkoutFailed'))
    submitting.value = false
  }
}

/**
 * 格式化 ISO 8601 时间戳为本地化日期字符串
 * 中文环境下显示 `YYYY年M月D日`，其它语言环境下显示 `YYYY-MM-DD`
 *
 * @param {string} iso - ISO 格式时间字符串
 * @returns {string} 格式化后的日期文本
 */
const formatExpiry = (iso: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return isZh.value
      ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
      : d.toISOString().slice(0, 10)
}

const cancelling = ref(false)

/**
 * 发起取消 Stripe 周期订阅
 * 调用后端接口获取 Stripe 客户门户（Billing Portal）链接，并跳转供用户进行退订与付款方式管理
 *
 * @returns {Promise<void>}
 */
const onCancelStripe = async (): Promise<void> => {
  if (cancelling.value) return
  cancelling.value = true
  try {
    const result = await api.createCancelPortal()
    if (result.redirectUrl)
      window.location.href = result.redirectUrl
    else
      throw new Error('no portal url')
  } catch (e: any) {
    // 未检测到 Stripe 周期订阅（可能为爱发电平台赞助或一次性打赏）
    notice.warning(
        e?.code === 'subscription.noActiveStripeSubscription'
            ? t('subscription.cancelAfdianTip')
            : (e?.message || t('subscription.checkoutFailed'))
    )
    cancelling.value = false
  }
}

onMounted(() => {
  load()

  // 每秒驱动待支付倒计时
  tickTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
})
</script>

<template>
  <div>
    <v-row>
      <v-col cols="12" lg="4">
        <!-- 本月目标进度 -->
        <AffixBoxHasTitleView>
          <div>
            <p class="opacity-60 mb-1">
              {{ t('subscription.introLine1', {name: t('name')}) }}
            </p>
            <p class="opacity-60 mb-1">
              {{ t('subscription.introLine2', {name: t('name')}) }}
            </p>
            <p class="opacity-60 mb-7">
              {{ t('subscription.introLine3') }}
            </p>

            <v-progress-linear
                :model-value="progress ? Math.min(100, progress.percent) : 0"
                color="amber"
                height="14"
                rounded
                striped
                class="mb-2">
              <strong class="text-black">{{ progress?.percent ?? 0 }}%</strong>
            </v-progress-linear>

            <v-row class="d-flex ga-4 text-caption text-medium-emphasis">
              <v-col cols="auto">
                <span>{{ t('subscription.orderCount') }}：{{ progress?.orderCount ?? 0 }}</span>
                <div v-if="hall.length">
                  <v-avatar v-for="d in hall.slice(0, 12)" :key="d.id" :size="22" class="ml-1"
                            v-tooltip="d.username">
                    <v-img :src="d.avatar || ''"></v-img>
                  </v-avatar>
                </div>
              </v-col>
              <v-spacer></v-spacer>
              <v-col cols="auto" v-if="progress">
                {{ progress.totalCny }} / {{ progress.goalCny }}
              </v-col>
            </v-row>
          </div>
          <template v-slot:title>
            <div class="d-flex align-center ga-2">
              {{ t('subscription.monthlyGoal') }}
            </div>
          </template>
        </AffixBoxHasTitleView>
      </v-col>
      <v-col cols="12" lg="8">
        <AffixBoxHasTitleView>
          <!-- 我的身份 -->
          <v-alert v-if="iAmCoreDonor || iAmDonor"
                   :type="iAmCoreDonor ? 'warning' : 'info'"
                   variant="tonal"
                   class="mb-4"
                   density="compact">
            {{ iAmCoreDonor ? t('subscription.youAreCore') : t('subscription.youAreDonor') }}
            <span v-if="myStatus[iAmCoreDonor ? 'donor_core' : 'donor']?.expiryTime">
            （{{ t('subscription.expireAt') }} {{ formatExpiry(myStatus[iAmCoreDonor ? 'donor_core' : 'donor'].expiryTime) }}）
            </span>
          </v-alert>

          <!-- 取消订阅管理 -->
          <v-card v-if="iAmCoreDonor || iAmDonor " variant="tonal" class="mb-4 pa-3">
            <div class="d-flex ga-3 align-center flex-wrap">
              <v-icon icon="mdi-cog-outline"></v-icon>
              <div class="flex-grow-1">
                <div class="text-subtitle-2">{{ t('subscription.manageTitle') }}</div>
                <div class="text-caption text-medium-emphasis">{{ t('subscription.cancelTip') }}</div>
              </div>
              <v-btn variant="outlined"
                     size="small"
                     :loading="cancelling"
                     prepend-icon="mdi-credit-card-off-outline"
                     @click="onCancelStripe">
                {{ t('subscription.cancelStripe') }}
              </v-btn>
              <v-btn variant="outlined"
                     size="small"
                     prepend-icon="mdi-lightning-bolt"
                     href="https://afdian.com"
                     target="_blank">
                {{ t('subscription.cancelAfdian') }}
              </v-btn>
            </div>
          </v-card>

          <!-- 待支付订单：倒计时 + 取消 / 继续支付 -->
          <v-card v-if="pendingOrders.length" variant="tonal" color="warning" class="mb-4 pa-3">
            <div class="text-subtitle-2 mb-2 d-flex align-center ga-2">
              <v-icon icon="mdi-clock-alert-outline"></v-icon>
              {{ t('subscription.pendingOrders') }}
            </div>
            <v-alert
                v-for="o in pendingOrders"
                :key="o.id"
                type="warning"
                variant="flat"
                density="comfortable"
                class="mb-2 py-2">
              <div class="d-flex align-center flex-wrap ga-3">
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-medium">
                    {{ getTierName(o.tier) }}
                    <span class="text-medium-emphasis">
                      · {{ o.platform === 'stripe' ? 'Stripe' : t('subscription.platformAfdian') }}
                      · ¥{{ o.amountCny ?? o.amount }}
                    </span>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    {{ t('subscription.payExpireIn', {time: formatCountdown(remainingMs(o))}) }}
                  </div>
                </div>
                <v-btn
                    size="small"
                    variant="outlined"
                    :loading="cancellingOrderId === o.id"
                    prepend-icon="mdi-close-circle-outline"
                    @click="onCancelOrder(o)">
                  {{ t('subscription.cancelPay') }}
                </v-btn>
                <v-btn
                    size="small"
                    variant="flat"
                    :loading="continuingOrderId === o.id"
                    prepend-icon="mdi-credit-card-fast-outline"
                    @click="onContinuePay(o)">
                  {{ t('subscription.continuePay') }}
                </v-btn>
              </div>
            </v-alert>
          </v-card>

          <!-- 月 / 年切换 -->
          <div class="d-flex ga-3 mb-4 align-center">
            <v-btn-toggle mandatory color="amber" variant="outlined" v-model="period" density="compact">
              <v-btn value="monthly">{{ t('subscription.monthly') }}</v-btn>
              <v-btn value="yearly">
                {{ t('subscription.yearly') }}
              </v-btn>
            </v-btn-toggle>
          </div>

          <!-- 档位卡片 -->
          <v-row>
            <v-col v-for="tierDef in sortedTiers" :key="tierDef.tier" cols="12" md="6" lg="6">
              <v-card rounded="lg"
                      border
                      class="h-100">
                <v-card-title class="py-16 text-center bg-black mb-4 text-amber text-h4 u">
                  {{ getTierName(tierDef.tier) }}
                </v-card-title>
                <v-card-item>
                  <div class="text-h5">
                    {{ period === 'yearly' ? tierDef.yearlyCny : tierDef.monthlyCny }}
                    <span class="text-body-2 text-medium-emphasis">
                      / {{ period === 'yearly' ? t('subscription.perYear') : t('subscription.perMonth') }}
                    </span>
                  </div>
                </v-card-item>
                <v-card-text class="text-body-2 text-caption opacity-60">
                  <v-row class="mb-4">
                    <v-col cols="4" v-if="isCoreTier(tierDef)">
                      <v-chip size="small" color="warning" variant="flat">
                        {{ t('subscription.coreDonor') }}
                      </v-chip>
                    </v-col>
                  </v-row>

                  {{ getTierDesc(tierDef.tier) }}
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn variant="flat"
                         @click="onTierClick(tierDef)">
                     {{ t('subscription.subscribe') }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>

            <!-- 一次性自定义 -->
            <v-col cols="12" md="6" lg="6">
              <v-card rounded="lg" dashed border class="h-100">
                <v-card-title class="py-10 text-center bg-black mb-4 text-amber text-h4 u">
                  <div>
                    <v-icon icon="mdi-gift-outline"></v-icon>
                  </div>
                  {{ t('subscription.tiers.custom.name') }}
                </v-card-title>
                <v-card-text>
                  <v-text-field v-model="customAmount"
                                type="number"
                                :min="5"
                                density="compact"
                                class="mt-3"
                                :label="t('subscription.customAmount')"
                                hide-details></v-text-field>

                  <div class="mt-5 text-body-2 text-medium-emphasis">
                    {{ t('subscription.customRule') }}
                  </div>
                  <div class="mt-2 text-body-2 text-medium-emphasis">
                    {{ t('subscription.tiers.custom.desc') }}
                  </div>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn variant="text" @click="onCustomClick">
                    {{ t('subscription.donateOnce') }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </AffixBoxHasTitleView>
      </v-col>
    </v-row>


    <!-- 支付平台选择弹窗 -->
    <v-dialog v-model="checkoutDialog" max-width="460">
      <v-card border>
        <v-card-title class="py-16 text-center bg-black mb-4 text-amber text-h4 u">
          {{ pendingTier ? getTierName(pendingTier.tier) : '' }}
        </v-card-title>
        <v-card-text>
          <div class="text-body-1 mb-3">
            {{ pendingTier?.amount }}
            <span class="text-body-2 text-medium-emphasis">
              · {{
                pendingTier?.period === 'yearly'
                    ? t('subscription.perYear')
                    : pendingTier?.period === 'monthly' ? t('subscription.perMonth') : t('subscription.once')
              }}
            </span>
          </div>
          <v-divider></v-divider>
          <div class="text-body-2 text-medium-emphasis my-2">
            {{ t('subscription.choosePlatform') }}
          </div>
          <div class="d-flex ga-3 flex-wrap">
            <v-btn :disabled="!plans?.platforms.afdian || submitting"
                   variant="tonal"
                   prepend-icon="mdi-lightning-bolt"
                   @click="pay('afdian')">
              {{ t('subscription.platformAfdian') }}
            </v-btn>
            <v-btn :disabled="!plans?.platforms.stripe || submitting"
                   variant="tonal"
                   prepend-icon="mdi-credit-card-outline"
                   @click="pay('stripe')">
              Stripe
            </v-btn>
          </div>
          <v-alert v-if="!plans?.platforms.afdian && !plans?.platforms.stripe"
                   type="warning" variant="text" density="compact" class="mt-3">
            {{ t('subscription.noPlatform') }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text="" @click="checkoutDialog = false">{{ t('subscription.cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
