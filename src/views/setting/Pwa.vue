<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePwa } from '@/composables/usePwa'
import { onMounted } from 'vue'
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const { t } = useI18n()
const { status, reload, install, isInstalled, needRefresh, offlineReady, installPrompt } = usePwa()

/**
 * 刷新页面
 */
const onRefresh = () => {
  reload()
}

/**
 * 安装应用
 */
const onInstall = () => {
  install()
}

onMounted(() => {
  console.log('PWA Settings mounted. Status:', status.value)
  console.log('Install prompt available:', !!installPrompt.value)
})
</script>

<template>
  <v-row>
    <v-col cols="12" lg="6">
      <AffixBoxHasTitleView>
        <p class="text-caption">{{ t('pwa.status.description') }}</p>

        <div class="mb-5">
          <v-list lines="two" class="bg-transparent">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon :color="status === 'ready' || status === 'installed' ? 'success' : 'warning'">
                  {{ isInstalled ? 'mdi-cellphone-check' : 'mdi-web' }}
                </v-icon>
              </template>
              <v-list-item-title>{{ t('pwa.status.label') || '当前状态' }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ t(`pwa.status.${status}`) || status }}
              </v-list-item-subtitle>
            </v-list-item>

            <!-- 有新内容时的刷新项 S -->
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
            <!-- 有新内容时的刷新项 E -->

            <!-- 安装选项 S -->
            <v-list-item v-if="!isInstalled">
              <template v-slot:prepend>
                <v-icon :color="installPrompt ? 'primary' : 'grey-lighten-1'">
                  {{ installPrompt ? 'mdi-download' : 'mdi-download-off' }}
                </v-icon>
              </template>
              <v-list-item-title>{{ t('pwa.install.title') }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ installPrompt ? (t('pwa.install.description')) : (t('pwa.install.unavailable')) }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-btn :disabled="!installPrompt" variant="tonal" @click="onInstall" :color="installPrompt ? 'primary' : ''">
                  {{ t('pwa.install.button')}}
                </v-btn>
              </template>
            </v-list-item>
            <!-- 安装选项 E -->

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
  </v-row>
</template>

<style scoped lang="less">
</style>
