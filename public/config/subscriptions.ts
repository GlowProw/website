import type { SubscriptionsConfig } from '@/assets/types/Subscription';

/**
 * 赞助档位配置
 * tier 统一采用 monthlyCny 金额标识，与后端保持一致
 */
export const subscriptionsConfig: SubscriptionsConfig = {
  tiers: [
    {
      tier: '100',
      monthlyCny: 100,
      yearlyCny: 1000,
      plans: {
        core: true
      }
    },
    {
      tier: '50',
      monthlyCny: 50,
      yearlyCny: 500,
      plans: {
        core: false
      }
    },
    {
      tier: '10',
      monthlyCny: 10,
      yearlyCny: 100,
      plans: {
        core: false
      }
    },
    {
      tier: '5',
      monthlyCny: 5,
      yearlyCny: 5,
      plans: {
        core: false
      }
    }
  ],
  tierOrder: ['100', '50', '10', '5']
}

export default subscriptionsConfig
