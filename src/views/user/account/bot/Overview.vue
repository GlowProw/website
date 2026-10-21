<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {apis} from "@/assets/sripts";
import {useNoticeStore} from "~/stores/noticeStore";
import {handleApiError} from "@/assets/sripts/error_handler";
import type {BotAccountOverview} from "@/assets/types/Bot";

const {t} = useI18n(),
    notice = useNoticeStore(),
    loading = ref(false),
    overview = ref<BotAccountOverview | null>(null)

defineOptions({
  name: 'AccountBotOverview'
})

const cards = computed(() => {
  const data = overview.value
  return [
    {
      icon: 'mdi-account-group-outline',
      title: t('account.bot.overview.groups'),
      value: data?.groups ?? 0,
      suffix: t('account.bot.overview.groupsUnit')
    },
    {
      icon: 'mdi-bell-ring-outline',
      title: t('account.bot.overview.subscribedGroups'),
      value: data?.subscriptionGroups ?? 0,
      suffix: t('account.bot.overview.groupsUnit')
    },
    {
      icon: 'mdi-send-check-outline',
      title: t('account.bot.overview.sent'),
      value: data?.push.sent ?? 0,
      suffix: t('account.bot.overview.timesUnit')
    },
    {
      icon: 'mdi-alert-circle-outline',
      title: t('account.bot.overview.failed'),
      value: data?.push.failed ?? 0,
      suffix: t('account.bot.overview.timesUnit')
    }
  ]
})

/**
 * 载入概览数据
 */
const onLoad = async () => {
  loading.value = true
  try {
    const result = await apis.botApi().getOverview()
    overview.value = result.data?.data || null
  } catch (e) {
    handleApiError(e, notice, t, {component: 'BotOverview'})
  } finally {
    loading.value = false
  }
}

onMounted(onLoad)
</script>

<template>
  <div>
    <v-row>
      <v-col cols="12" md="6" lg="3" v-for="(card, index) in cards" :key="index">
        <v-card border class="pa-5 h-100">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-caption opacity-60 mb-1">{{ card.title }}</p>
              <div class="d-flex align-end">
                <span class="text-h5 font-weight-bold">{{ card.value }}</span>
                <span class="text-caption opacity-60 ml-1">{{ card.suffix }}</span>
              </div>
            </div>
            <v-icon :icon="card.icon" size="34" class="opacity-30"></v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <div class="mt-5">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3">
        <div>
          <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ t('account.bot.overview.quotaTitle') }}</h3>
          <p class="text-caption opacity-60 mb-0">
            {{ t('account.bot.overview.quotaDesc', {
              used: overview?.quota?.usedCount ?? 0,
              limit: overview?.quota?.limitCount ?? 10
            }) }}
          </p>
        </div>
<!--        <v-chip color="amber" variant="tonal">-->
<!--          {{ t('account.bot.overview.tier', {tier: overview?.access?.tier || t('account.bot.overview.tierNone')}) }}-->
<!--        </v-chip>-->
      </div>

      <v-progress-linear
          class="mt-4"
          height="10"
          rounded
          color="amber"
          :model-value="overview?.quota?.limitCount ? Math.min(100, (overview.quota.usedCount / overview.quota.limitCount) * 100) : 0"></v-progress-linear>

      <v-divider class="my-6" opacity=".08"></v-divider>

      <div class="d-flex flex-wrap ga-3">
        <v-btn color="amber" variant="flat" :to="{name: 'AccountBotManage'}">
          {{ t('account.bot.overview.toManage') }}
        </v-btn>

        <v-divider vertical inset></v-divider>

        <v-btn variant="tonal" :to="{name: 'AccountBotGuide'}">
          {{ t('account.bot.overview.toGuide') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>
