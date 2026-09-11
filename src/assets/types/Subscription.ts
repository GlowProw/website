/** 订阅档位计划特性配置（如核心捐助者身份） */
export interface SubscriptionTierPlanConfig {
  core: boolean
  [key: string]: any
}

/** 档位条目配置（用于前端配置与展示） */
export interface SubscriptionTierItem {
  tier: string
  monthlyCny: number
  yearlyCny: number
  plans: SubscriptionTierPlanConfig
}

/** 全局赞助档位配置对象 */
export interface SubscriptionsConfig {
  tiers: SubscriptionTierItem[]
  tierOrder: string[]
}

/** 接口返回的档位对象 */
export interface SubscriptionTier {
  tier: string
  monthlyCny: number
  yearlyCny: number
  core?: boolean
  plans?: SubscriptionTierPlanConfig
}

/** 接口返回的订阅目录与支付平台开关 */
export interface SubscriptionPlans {
  currency: string
  tiers: SubscriptionTier[]
  platforms: {
    afdian: boolean
    stripe: boolean
  }
}

/** 当月目标筹款进度 */
export interface SubscriptionProgress {
  currency: string
  goalCny: number
  totalCny: number
  orderCount: number
  percent: number
  month: string
}

/** 创建订单请求参数 */
export interface CreateOrderParams {
  tier: string
  period: 'monthly' | 'yearly' | 'once'
  platform: 'afdian' | 'stripe'
  amount?: number
}

/** 我的订单条目（待支付 / 最近记录共用） */
export interface MyOrder {
  id: number
  customOrderId: string
  orderNo: string | null
  platform: string
  tier: string
  period: string
  status: number
  amount: number | string
  currency: string
  amountCny: number | string | null
  months: number
  createdTime: string
  expireTime: string | null
  paidTime: string | null
  subscriptionEndTime: string | null
}

/** 我的订单查询结果 */
export interface MyOrdersResult {
  pending: MyOrder[]
  recent: MyOrder[]
  expireMinutes: number
}
