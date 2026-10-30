<script setup lang="ts">

import {onMounted, ref} from "vue";
import {storage_capacity_monitor} from "@/assets/sripts/index";
import {useDisplay} from "vuetify/framework";
import {useI18n} from "vue-i18n";
import {useNoticeStore} from "~/stores/noticeStore";
import {zipSync, unzipSync, strToU8, strFromU8} from "fflate";

import HtmlLink from "@/components/HtmlLink.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {mobile} = useDisplay()
const {t} = useI18n()
const notice = useNoticeStore()

// 存储使用报告
let detailedReport = ref<any>({
      local: {},
      session: {}
    }),
    estimateCapacity = ref<any>({})

// 备份导出加载状态
const exportLoading = ref(false)

// 恢复导入加载状态
const restoreLoading = ref(false)

// 隐藏文件上传输入框引用
const fileInputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  loadLocalReport()
})

/**
 * 加载并统计本地存储使用指标
 */
const loadLocalReport = () => {
  estimateCapacity.value = storage_capacity_monitor.estimateCapacity()
  detailedReport.value = {
    local: storage_capacity_monitor.getDetailedReport(),
    session: storage_capacity_monitor.getDetailedReport(sessionStorage)
  }
}

/**
 * 收集当前客户端的本地存储数据并打包下载为 zip 压缩包
 */
const onDownloadBackup = async () => {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    exportLoading.value = true
    const localData: Record<string, string> = {}
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key) {
        const val = window.localStorage.getItem(key)
        if (val !== null) {
          localData[key] = val
        }
      }
    }

    const payload = {
      app: 'glow-prow',
      version: 1,
      createdAt: new Date().toISOString(),
      storage: localData
    }

    const jsonBytes = strToU8(JSON.stringify(payload, null, 2))
    const zipBytes = zipSync({
      'glow_prow_storage.json': jsonBytes
    })

    const blob = new Blob([zipBytes], { type: 'application/zip' })
    const downloadUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const dateStr = new Date().toISOString().slice(0, 10)
    anchor.href = downloadUrl
    anchor.download = `glow-prow-backup-${dateStr}.zip`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(downloadUrl)

    notice.success(t('setting.storage.backupSuccess'))
  } catch (err: any) {
    notice.error(err?.message || 'Backup failed')
  } finally {
    exportLoading.value = false
  }
}

/**
 * 触发备份恢复文件选择
 */
const onTriggerRestore = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
    fileInputRef.value.click()
  }
}

/**
 * 处理选择的备份压缩包并恢复到本地存储
 * @param event 文件变更事件
 */
const onRestoreFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target?.files?.[0]
  if (!file) return

  if (!confirm(t('setting.storage.restoreConfirm'))) {
    if (target) target.value = ''
    return
  }

  try {
    restoreLoading.value = true
    const buffer = await file.arrayBuffer()
    const unzipped = unzipSync(new Uint8Array(buffer))

    let jsonBytes: Uint8Array | undefined
    for (const fileName of Object.keys(unzipped)) {
      if (fileName.endsWith('.json')) {
        jsonBytes = unzipped[fileName]
        break
      }
    }

    if (!jsonBytes && Object.keys(unzipped).length > 0) {
      jsonBytes = Object.values(unzipped)[0]
    }

    if (!jsonBytes) {
      notice.error(t('setting.storage.restoreFailed'))
      return
    }

    const jsonStr = strFromU8(jsonBytes)
    const parsed = JSON.parse(jsonStr)

    const storageMap: Record<string, string> = parsed?.storage || (typeof parsed === 'object' && !parsed?.storage && parsed !== null ? parsed : null)

    if (!storageMap || typeof storageMap !== 'object' || Array.isArray(storageMap)) {
      notice.error(t('setting.storage.restoreFailed'))
      return
    }

    for (const [k, v] of Object.entries(storageMap)) {
      if (typeof v === 'string') {
        window.localStorage.setItem(k, v)
      } else {
        window.localStorage.setItem(k, JSON.stringify(v))
      }
    }

    loadLocalReport()
    notice.success(t('setting.storage.restoreSuccess'))
  } catch (err: any) {
    notice.error(t('setting.storage.restoreFailed') + ': ' + (err?.message || err))
  } finally {
    restoreLoading.value = false
    if (target) target.value = ''
  }
}
</script>

<template>
  <v-row>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption">{{ t('setting.storage.reportDesc') }}</p>

        <div class="my-10">
          <v-row align="center" class="mb-1">
            <v-col>
              <v-progress-linear
                  color="var(--main-color)"
                  :model-value="estimateCapacity?.used"
                  :max="estimateCapacity?.estimatedMax"
                  striped
                  height="25">
                {{ estimateCapacity?.percentage || '0%' }}
              </v-progress-linear>
            </v-col>
            <v-col cols="auto">{{ estimateCapacity?.usedFormatted }} / {{ estimateCapacity?.estimatedMaxFormatted }}</v-col>
          </v-row>

          <p class="text-caption opacity-60">{{ t('setting.storage.usageDesc') }}</p>
        </div>

        <!-- 备份与恢复 S -->
        <div class="mt-8 pt-6 border-t">
          <p class="text-subtitle-2 font-weight-bold mb-2">{{ t('setting.storage.backupAndRestore') }}</p>
          <p class="text-caption opacity-60 mb-4">{{ t('setting.storage.backupDesc') }}</p>
          <div class="d-flex flex-column ga-2">
            <v-btn
                block
                color="amber"
                variant="tonal"
                prepend-icon="mdi-download"
                :loading="exportLoading"
                @click="onDownloadBackup">
              {{ t('setting.storage.downloadBackup') }}
            </v-btn>
            <v-btn
                block
                prepend-icon="mdi-upload"
                :loading="restoreLoading"
                @click="onTriggerRestore">
              {{ t('setting.storage.restoreFromBackup') }}
            </v-btn>
            <input
                ref="fileInputRef"
                type="file"
                accept=".zip"
                class="d-none"
                @change="onRestoreFileChange" />
          </div>
        </div>
        <!-- 备份与恢复 E -->

        <template v-slot:title>
          {{ t('setting.storage.dataTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="8">
      <v-row>
        <v-col cols="12" v-if="detailedReport.local && detailedReport.local.details">
          <AffixBoxHasTitleView>
            <div v-for="(i, index) in detailedReport.local.details" :key="index">
              <v-row align="center">
                <v-col cols="auto" class="singe-line" :class="{'w-50': mobile}">
                  <HtmlLink :text="i.key" :is-iframe-show="false" :is-icon="false"></HtmlLink>
                </v-col>
                <v-col v-if="!mobile">
                  <v-divider></v-divider>
                </v-col>
                <v-spacer v-if="mobile"></v-spacer>
                <v-col cols="4">
                  <v-progress-linear
                      color="var(--main-color)"
                      :model-value="i?.used"
                      :max="estimateCapacity?.estimatedMax"
                      striped
                      height="25">
                    {{ i.totalSize || 'N/A' }}
                  </v-progress-linear>
                </v-col>
              </v-row>
            </div>
            <template v-slot:title>
              {{ t('setting.storage.persistentStorage') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
        <v-col cols="12" class="mt-10" v-if="detailedReport.session && detailedReport.session.details">
          <AffixBoxHasTitleView>
            <div v-for="(i, index) in detailedReport.session.details" :key="index">
              <v-row align="center">
                <v-col cols="auto" class="singe-line" :class="{'w-50': mobile}">
                  <HtmlLink :text="i.key" :is-iframe-show="false" :is-icon="false"></HtmlLink>
                </v-col>
                <v-col v-if="!mobile">
                  <v-divider></v-divider>
                </v-col>
                <v-spacer v-if="mobile"></v-spacer>
                <v-col cols="4">
                  <v-progress-linear
                      color="var(--main-color)"
                      :model-value="i?.used"
                      :max="estimateCapacity?.estimatedMax"
                      striped
                      height="25">
                    {{ i.totalSize || 'N/A' }}
                  </v-progress-linear>
                </v-col>
              </v-row>
            </div>
            <template v-slot:title>
              {{ t('setting.storage.sessionStorage') }}
            </template>
          </AffixBoxHasTitleView>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<style scoped lang="less">

</style>
