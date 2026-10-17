<script setup lang="ts">

import {onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useSubscriptionApi} from '@/assets/sripts/api/subscription_service'
import {useAuthStore} from '~/stores/userAccountStore'
import UserAvatar from "@/components/UserAvatar.vue";
import AccountCardWidget from "@/components/AccountCardWidget.vue";

/**
 * 捐助者组件
 */
const {t} = useI18n()
const authStore = useAuthStore()
const api = useSubscriptionApi()

const donors = ref<any[]>([])
const isCoreDonor = ref(false)
const TOTAL = 60

const placeholder = (i: number) => ({
  id: `__empty_${i}`,
  isEmpty: true,
})


onMounted(() => {
  api.getCoreDonors().then((list: any) => {
    const real = Array.isArray(list) ? list : (list?.data ?? [])
    const filled = real.slice(0, TOTAL)

    for (let i = filled.length; i < TOTAL; i++) {
      filled.push(placeholder(i))
    }

    donors.value = filled
  }).catch(() => {
    donors.value = Array.from({length: TOTAL}, (_, i) => placeholder(i))
  })


  if (authStore.user?.token) {
    api.getMyStatus().then(s => {
      const d = s?.contributor5
      isCoreDonor.value = !!d && (!d.expiryTime || new Date(d.expiryTime).getTime() > Date.now())
    }).catch(() => {
    })
  }
})
</script>

<template>
  <div class="pt-5 pb-5">
    <v-container>
      <v-row align="start">
        <v-col cols="12" md="3">
          <div class="text-amber d-flex align-center ga-2 mb-1">
            {{ t('subscription.hallTitle') }}
          </div>
          <p class="opacity-60 mb-1">
            {{ t('subscription.introLine1', {name: t('name')}) }}
          </p>
          <p class="opacity-60 mb-1">
            {{ t('subscription.introLine2', {name: t('name')}) }}
          </p>
          <p class="opacity-60 mb-7">
            {{ t('subscription.introLine3') }}
          </p>

          <v-btn block border variant="text" :to="{ name: 'PortalSettingSubscriptions' }">
            {{ t('subscription.subscribe') }}
            <v-icon class="ml-2">mdi-arrow-right</v-icon>
          </v-btn>
        </v-col>
        <v-col cols="12" md="9">
          <div class="d-flex ga-5 gap-5 flex-wrap">
            <template v-for="d in donors" :key="d.id">
              <AccountCardWidget :id="d.id" v-if="!d.isEmpty">
                <UserAvatar :size="40" rounded="0" class="rounded-lg" :src="d.avatar || ''"></UserAvatar>
              </AccountCardWidget>
              <div v-else class="opacity-10 border rounded-lg overflow-hidden">
                <v-avatar>
                  <v-icon>mdi-account</v-icon>
                </v-avatar>
              </div>
            </template>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
