<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8" lg="6">
        <AffixBoxHasTitleView>
          <p class="text-caption opacity-60 mb-5">
            {{ t('setting.advanced.hint') }}
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

          <p class="mt-3 text-caption opacity-60">
            {{ t('setting.advanced.debugDesc') }}
          </p>

          <template v-slot:title>
            {{ t('setting.advanced.cardTitle') }}
          </template>
        </AffixBoxHasTitleView>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'
import AffixBoxHasTitleView from '@/components/AffixBoxHasTitleView.vue'
import {useAppStore} from '~/stores/appStore'

const {t} = useI18n()
const appStore = useAppStore()

const debugSwitch = ref(appStore.isDebug)

const onDebugSwitch = (val: boolean) => {
  appStore.setDebug(val)
}
</script>
