<script setup lang="ts">

import {onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useSubscriptionApi} from '@/assets/sripts/api/subscription_service'
import {useAuthStore} from '~/stores/userAccountStore'

/**
 * 捐助者组件
 */
const {t} = useI18n()
const authStore = useAuthStore()
const api = useSubscriptionApi()

const donors = ref<any[]>([])
const isCoreDonor = ref(false)

onMounted(() => {
    api.getCoreDonors().then(list => donors.value = list || []).catch(() => {})

    if (authStore.user?.token) {
        api.getMyStatus().then(s => {
            const d = s?.donor_core
            isCoreDonor.value = !!d && (!d.expiryTime || new Date(d.expiryTime).getTime() > Date.now())
        }).catch(() => {})
    }
})
</script>

<template>
  <div class="bg-black pt-5 pb-5">
    <v-container>
      <v-row align="center">
        <v-col cols="12" md="auto">
          <h1 class="text-amber d-flex align-center ga-2 mb-1">
            {{ t('subscription.hallTitle') }}
          </h1>
          <v-chip v-if="isCoreDonor"
                  color="warning"
                  variant="flat"
                  size="small"
                  prepend-icon="mdi-crown">
            {{ t('subscription.coreBadge') }}
          </v-chip>
        </v-col>
        <v-col cols="12" md>
          <div class="d-flex ga-2 flex-wrap">
            <v-avatar v-for="d in donors" :key="d.id" :size="40" v-tooltip="d.username">
              <v-img :src="d.avatar || ''"></v-img>
            </v-avatar>
          </div>
        </v-col>
        <v-col cols="12" md="auto">
          <v-btn to="/setting/subscriptions">
            {{ t('subscription.subscribe') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
