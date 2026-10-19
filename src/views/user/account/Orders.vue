<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {apis} from "@/assets/sripts";
import {useNoticeStore} from "~/stores/noticeStore";
import {useAuthStore} from "~/stores/userAccountStore";
import {useSubscriptionApi} from "@/assets/sripts/api/subscription_service";
import type {CreateOrderParams} from "@/assets/types/Subscription";

import Loading from "@/components/Loading.vue";
import EmptyView from "@/components/EmptyView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import TimeView from "@/components/TimeView.vue";

const notice = useNoticeStore(),
    authStore = useAuthStore(),
    {t, te} = useI18n(),
    subApi = useSubscriptionApi()

// 状态定义
const loading = ref(false),
    searchQuery = ref(''),
    selectedStatus = ref('all'),
    selectedPlatform = ref('all'),
    ordersList = ref<any[]>([]),
    currentPage = ref(1),
    pageSize = 10,
    totalCount = ref(0),
    totalPages = ref(1),
    cancellingOrderId = ref<number | null>(null),
    continuingOrderId = ref<number | null>(null),
    syncingOrderId = ref<number | null>(null)

// 状态选项配置
const statusOptions = computed(() => [
  {title: t('account.orders.allStatus'), value: 'all'},
  {title: t('account.orders.statusPending'), value: 'pending'},
  {title: t('account.orders.statusPaid'), value: 'paid'},
  {title: t('account.orders.statusClosed'), value: 'closed'},
  {title: t('account.orders.statusRefunded'), value: 'refunded'}
])

// 支付平台选项配置
const platformOptions = computed(() => [
  {title: t('account.orders.allPlatforms'), value: 'all'},
  {title: t('subscription.platformAfdian'), value: 'afdian'},
  {title: 'Stripe', value: 'stripe'},
  {title: 'PayPal', value: 'paypal'}
])

onMounted(() => {
  fetchOrders()
})

/**
 * 格式化获取档位展示名称
 *
 * @param {string} tier - 档位标识
 * @returns {string} 本地化档位名称
 */
const getTierDisplayName = (tier: string): string => {
  if (!tier || tier === 'custom') return t('subscription.tiers.custom.name')
  const key = `subscription.tiers.${tier}.name`
  return te(key) ? t(key) : `¥${tier}`
}

/**
 * 获取支付渠道对应品牌图标
 *
 * @param {string} platform - 支付渠道
 * @returns {string} MDI 图标名称
 */
const getPlatformIcon = (platform: string): string => {
  switch (platform) {
    case 'paypal':
      return 'mdi-paypal'
    case 'stripe':
      return 'mdi-credit-card-outline'
    case 'afdian':
      return 'mdi-lightning-bolt'
    default:
      return 'mdi-cash-multiple'
  }
}

/**
 * 获取支付渠道对应品牌颜色
 *
 * @param {string} platform - 支付渠道
 * @returns {string} 颜色标识
 */
const getPlatformColor = (platform: string): string => {
  switch (platform) {
    case 'paypal':
      return 'blue-darken-3'
    case 'stripe':
      return 'deep-purple'
    case 'afdian':
      return 'purple'
    default:
      return 'amber'
  }
}

/**
 * 获取订单状态对应颜色
 *
 * @param {string} status - 订单状态
 * @returns {string} 颜色标识
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return 'success'
    case 'pending':
      return 'warning'
    case 'closed':
      return 'grey'
    case 'refunded':
      return 'error'
    default:
      return 'grey'
  }
}

/**
 * 获取订单状态本地化文本
 *
 * @param {string} status - 订单状态
 * @returns {string} 状态文案
 */
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'paid':
      return t('account.orders.statusPaid')
    case 'pending':
      return t('account.orders.statusPending')
    case 'closed':
      return t('account.orders.statusClosed')
    case 'refunded':
      return t('account.orders.statusRefunded')
    default:
      return status || '—'
  }
}

/**
 * 获取订阅周期本地化文本
 *
 * @param {string} period - 周期标识
 * @returns {string} 周期文案
 */
const getPeriodLabel = (period: string): string => {
  switch (period) {
    case 'monthly':
      return t('subscription.perMonth')
    case 'yearly':
      return t('subscription.perYear')
    case 'once':
    default:
      return t('subscription.once')
  }
}

/**
 * 请求用户自己的订单分页列表
 *
 * @returns {Promise<void>}
 */
const fetchOrders = async (): Promise<void> => {
  try {
    loading.value = true
    const params: any = {
      page: currentPage.value,
      pageSize,
      keyword: searchQuery.value?.trim() || undefined
    }
    if (selectedStatus.value !== 'all') {
      params.status = selectedStatus.value
    }
    if (selectedPlatform.value !== 'all') {
      params.platform = selectedPlatform.value
    }

    const res = await apis.userApi().getMyOrders(params)
    const resultData = res?.data?.data || res?.data || {}
    ordersList.value = resultData.data || []
    if (resultData.pagination) {
      totalCount.value = resultData.pagination.totalCount || 0
      totalPages.value = resultData.pagination.totalPages || 1
    }
  } catch (e: any) {
    notice.error(e?.message || t('account.orders.fetchError'))
  } finally {
    loading.value = false
  }
}

/**
 * 切换筛选条件并重置页码刷新
 */
const onFilterChange = () => {
  currentPage.value = 1
  fetchOrders()
}

/**
 * 页码改变事件处理
 *
 * @param {number} page - 目标页码
 */
const onPageChange = (page: number) => {
  currentPage.value = page
  fetchOrders()
}

/**
 * 对未完成支付的订单发起继续支付流程
 * 于新标签页打开第三方收银台，保留当前管理界面
 *
 * @param {any} order - 订单对象
 * @returns {Promise<void>}
 */
const onContinuePay = async (order: any): Promise<void> => {
  if (continuingOrderId.value !== null) return
  continuingOrderId.value = order.id
  try {
    const payload: CreateOrderParams = {
      tier: order.tier,
      period: (['monthly', 'yearly', 'once'] as const).includes(order.period as any)
          ? order.period as 'monthly' | 'yearly' | 'once'
          : 'once',
      platform: order.platform === 'paypal' ? 'paypal' : (order.platform === 'stripe' ? 'stripe' : 'afdian'),
      ...(order.tier === 'custom' ? {amount: Number(order.amountCny || order.amount)} : {})
    }
    const result = await subApi.createOrder(payload)
    if (result.redirectUrl) {
      window.open(result.redirectUrl, '_blank')
    }
  } catch (e: any) {
    notice.error(e?.message || t('subscription.checkoutFailed'))
  } finally {
    continuingOrderId.value = null
  }
}

/**
 * 手动同步指定待支付订单的第三方平台支付状态
 *
 * @param {any} order - 订单对象
 * @returns {Promise<void>}
 */
const onSyncOrder = async (order: any): Promise<void> => {
  if (syncingOrderId.value !== null) return
  syncingOrderId.value = order.id
  try {
    const res = await subApi.syncOrder(order.id)
    if (res?.synced && res?.status === 'paid') {
      notice.success(t('subscription.orderSyncedPaid'))
      await authStore.fetchAccountProfile(true).catch(() => null)
    } else {
      notice.info(t('subscription.orderStillPending'))
    }
    await fetchOrders()
  } catch (e: any) {
    notice.error(e?.message || t('basic.networkError'))
  } finally {
    syncingOrderId.value = null
  }
}

/**
 * 取消待支付订单
 *
 * @param {any} order - 订单对象
 * @returns {Promise<void>}
 */
const onCancelOrder = async (order: any): Promise<void> => {
  if (!confirm(t('account.orders.deleteConfirm'))) return
  if (cancellingOrderId.value !== null) return
  cancellingOrderId.value = order.id
  try {
    await subApi.cancelOrder(order.id)
    notice.success(t('account.orders.deleteSuccess'))
    await fetchOrders()
  } catch (e: any) {
    notice.error(e?.message || t('basic.networkError'))
  } finally {
    cancellingOrderId.value = null
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
    notice.error(t('basic.copyFail') || '复制失败')
  })
}

defineOptions({
  name: 'AccountOrders'
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
              :placeholder="t('account.orders.searchPlaceholder')"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              style="width: 220px;"
              class="flex-shrink-0"
              @keydown.enter="onFilterChange"
              @click:clear="onFilterChange">
          </v-text-field>

          <!-- 状态筛选 -->
          <v-select
              v-model="selectedStatus"
              :items="statusOptions"
              density="compact"
              variant="outlined"
              hide-details
              style="width: 130px;"
              class="flex-shrink-0"
              @update:model-value="onFilterChange">
          </v-select>

          <!-- 平台筛选 -->
          <v-select
              v-model="selectedPlatform"
              :items="platformOptions"
              density="compact"
              variant="outlined"
              hide-details
              style="width: 130px;"
              class="flex-shrink-0"
              @update:model-value="onFilterChange">
          </v-select>
        </div>

        <v-spacer></v-spacer>

        <div class="d-flex align-center ga-2">
          <v-btn
              color="amber"
              variant="tonal"
              prepend-icon="mdi-compass-rose"
              to="/setting/subscriptions">
            {{ t('subscription.title') }}
          </v-btn>

          <v-btn
              variant="flat"
              :loading="loading"
              @click="fetchOrders">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </v-card>
    </AffixContainerView>
    <!-- 操作头 E -->

    <!-- 订单列表 S -->
    <div v-if="ordersList && ordersList.length > 0">
      <v-list lines="three" variant="text" class="bg-transparent">
        <template v-for="(i, index) in ordersList" :key="i.id || index">
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar size="50" rounded="lg" class="mr-3 flex-shrink-0">
                <v-icon size="26" color="white">mdi-lightning-bolt</v-icon>
              </v-avatar>
            </template>

            <template v-slot:title>
              <div class="d-flex align-center flex-wrap ga-2">
                <p class="font-weight-bold">{{ getTierDisplayName(i.tier) }}</p>

                <!-- 订单金额 -->
                <v-chip size="x-small" color="amber" variant="tonal" class="font-weight-bold">
                  ¥{{ i.amountCny ?? i.amount }}
                </v-chip>

                <!-- 状态标签 -->
                <v-chip
                    size="x-small"
                    :color="getStatusColor(i.status)"
                    variant="tonal">
                  {{ getStatusLabel(i.status) }}
                </v-chip>

                <!-- 周期标签 -->
                <v-chip
                    v-if="i.period"
                    size="x-small"
                    variant="outlined"
                    class="opacity-70">
                  {{ getPeriodLabel(i.period) }}
                </v-chip>

                <!-- 授予身份 -->
                <v-chip
                    v-if="i.roleGranted"
                    size="x-small"
                    color="amber"
                    variant="outlined">
                  {{ i.roleGranted }}
                </v-chip>
              </div>
            </template>

            <template v-slot:subtitle>
              <div class="d-flex align-center flex-wrap ga-2 mt-2">
                <!-- 渠道 -->
                <p class="d-flex align-center">
                  <v-icon size="14" class="mr-1">mdi-credit-card-outline</v-icon>
                  {{ i.platform === 'paypal' ? 'PayPal' : (i.platform === 'stripe' ? 'Stripe' : t('subscription.platformAfdian')) }}
                </p>

                <v-divider vertical inset class="mx-1"></v-divider>

                <!-- 订单号 -->
                <p class="d-flex align-center cursor-pointer" :title="i.customOrderId" @click="copyText(i.customOrderId)">
                  <v-icon size="14" class="mr-1">mdi-pound</v-icon>
                  {{ i.customOrderId }}
                </p>

                <template v-if="i.orderNo">
                  <v-divider vertical inset class="mx-1"></v-divider>
                  <p class="d-flex align-center cursor-pointer" :title="i.orderNo" @click="copyText(i.orderNo)">
                    <v-icon size="14" class="mr-1">mdi-identifier</v-icon>
                    {{ i.orderNo }}
                  </p>
                </template>

                <v-divider vertical inset class="mx-1"></v-divider>

                <!-- 下单时间 -->
                <p class="d-flex align-center">
                  <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                  <TimeView :time="i.createdTime"></TimeView>
                </p>

                <!-- 到期时间 -->
                <template v-if="i.subscriptionEndTime">
                  <v-divider vertical inset class="mx-1"></v-divider>
                  <p class="d-flex align-center text-amber">
                    <v-icon size="14" class="mr-1">mdi-calendar-end</v-icon>
                    {{ t('account.orders.expireTime') }}:
                    <TimeView :time="i.subscriptionEndTime"></TimeView>
                  </p>
                </template>
              </div>
            </template>

            <template v-slot:append>
              <div class="d-flex align-center ga-2">
                <!-- 待支付快捷操作 -->
                <template v-if="i.status === 'pending'">
                  <v-btn
                      size="x-small"
                      variant="tonal"
                      color="amber"
                      :loading="syncingOrderId === i.id"
                      prepend-icon="mdi-sync"
                      @click="onSyncOrder(i)">
                    {{ t('account.orders.syncOrder') }}
                  </v-btn>
                  <v-btn
                      size="x-small"
                      variant="tonal"
                      color="red"
                      :loading="cancellingOrderId === i.id"
                      prepend-icon="mdi-close-circle-outline"
                      @click="onCancelOrder(i)">
                    {{ t('account.orders.cancelPay') }}
                  </v-btn>
                  <v-btn
                      size="x-small"
                      variant="flat"
                      color="amber"
                      :loading="continuingOrderId === i.id"
                      prepend-icon="mdi-credit-card-fast-outline"
                      @click="onContinuePay(i)">
                    {{ t('account.orders.continuePay') }}
                  </v-btn>
                </template>

                <!-- 更多操作菜单 -->
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
                        @click="copyText(i.customOrderId)">
                      <v-list-item-title>{{ t('basic.button.copy') }} {{ t('account.orders.customOrderId') }}</v-list-item-title>
                    </v-list-item>

                    <v-list-item
                        v-if="i.orderNo"
                        prepend-icon="mdi-content-copy"
                        @click="copyText(i.orderNo)">
                      <v-list-item-title>{{ t('basic.button.copy') }} {{ t('account.orders.orderNo') }}</v-list-item-title>
                    </v-list-item>

                    <template v-if="i.status === 'pending'">
                      <v-divider class="my-1"></v-divider>
                      <v-list-item
                          prepend-icon="mdi-sync"
                          @click="onSyncOrder(i)">
                        <v-list-item-title>{{ t('account.orders.syncOrder') }}</v-list-item-title>
                      </v-list-item>
                      <v-list-item
                          prepend-icon="mdi-close-circle-outline"
                          class="text-error"
                          @click="onCancelOrder(i)">
                        <v-list-item-title>{{ t('account.orders.cancelPay') }}</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>
          <v-divider inset v-if="index < ordersList.length - 1"></v-divider>
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
            size="small"
            @update:model-value="onPageChange">
        </v-pagination>
      </div>
      <!-- 分页器 E -->
    </div>

    <div class="text-center py-12" v-else>
      <EmptyView>
        <template v-slot:description>
          {{ t('account.orders.empty') }}
        </template>
      </EmptyView>
    </div>
    <!-- 订单列表 E -->
  </div>
</template>

<style scoped lang="less">
.cursor-pointer {
  cursor: pointer;
}
</style>
