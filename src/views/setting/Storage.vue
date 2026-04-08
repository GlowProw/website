<script setup lang="ts">

import {onMounted, ref} from "vue";
import {storage_capacity_monitor} from "@/assets/sripts/index";
import {useDisplay} from "vuetify/framework";
import {useI18n} from "vue-i18n";

import HtmlLink from "@/components/HtmlLink.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";

const {mobile} = useDisplay()
const {t} = useI18n()

let detailedReport = ref<any>({
      local: {},
      session: {}
    }),
    estimateCapacity = ref<any>({})

onMounted(() => {
  loadLocalReport()
})

const loadLocalReport = () => {
  estimateCapacity.value = storage_capacity_monitor.estimateCapacity()
  detailedReport.value = {
    local: storage_capacity_monitor.getDetailedReport(),
    session: storage_capacity_monitor.getDetailedReport(sessionStorage)
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
