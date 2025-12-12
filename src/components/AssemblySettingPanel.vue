<script setup lang="ts">
import {Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useHttpToken} from "@/assets/sripts/http_util";
import {apis} from "@/assets/sripts/index";
import {useNoticeStore} from "~/stores/noticeStore";
import {ApiError} from "@/assets/types/Api";
import {PublishAssemblyData} from "@/assets/types";

import Loading from "@/components/Loading.vue";
import AssemblySettingWidget from "@/components/AssmblySettingWidget.vue"
import AssemblyDataProcessing from "@/assets/sripts/assembly_data_processing";
import VueJsonPretty from 'vue-json-pretty';
import WheelDataProcessing from "@/assets/sripts/wheel_data_processing";
import WarehouseDataProcessing from "@/assets/sripts/warehouse_data_processing";

import 'vue-json-pretty/lib/styles.css';

const {t, locale} = useI18n(),
    http = useHttpToken(),
    notice = useNoticeStore(),
    assemblyDataProcessing = new AssemblyDataProcessing()

const props = defineProps<{ id: string, data?: any }>(),
    emit = defineEmits(['change'])

let show = ref(false),
    getSettingLoading = ref(false),
    setSettingLoading = ref(false),
    tabValue = ref('conventional'),
    // 属性结构
    settingData: Ref<PublishAssemblyData> = ref({
      assembly: {
        visibility: 'publicly',
        attr: {
          password: '',
          language: [locale.value],
          assemblyUseVersion: AssemblyDataProcessing.nowVersion
        }
      },
      wheel: {
        attr: {
          wheelUseVersion: WheelDataProcessing.nowVersion
        }
      },
      warehouse: {
        attr: {
          warehouseUseVersion: WarehouseDataProcessing.nowVersion
        }
      }
    })

watch(() => show.value, (value) => {
  if (value)
    getAssemblySetting()
})

/**
 * 获取配装
 */
const getAssemblySetting = async () => {
  try {
    if (!props.id)
      return;

    getSettingLoading.value = true

    const result = await apis.assemblyApi().getAssemblyAttr(props.id),
        d = result.data

    settingData.value = Object.assign(settingData.value, d.data.data)
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    getSettingLoading.value = false
  }
}

/**
 * 获取配装
 */
const setAssemblySetting = async () => {
  try {
    if (!props.id)
      return;

    setSettingLoading.value = true

    if (settingData.value.assembly.attr && settingData.value.assembly.attr.password == null)
      settingData.value.assembly.attr.password = ''
    else if (settingData.value.assembly.attr && settingData.value.assembly.attr.password == '')
      delete settingData.value.assembly.attr.password

    const result = await apis.assemblyApi().editAssemblyAttr(props.id, settingData.value),
        d = result.data

    notice.success(t(`basic.tips.${d.code}`))
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
  } finally {
    emit('change')

    show.value = false;
    setSettingLoading.value = false
  }
}
</script>

<template>
  <span @click="show = !show">
      <slot></slot>
  </span>
  <v-dialog v-model="show">
    <v-container>
      <v-card class="position-relative">
        <v-card-title class="pa-5">
          <div class="text-h5 font-weight-bold text-amber">{{ t('assembly.setting.title') }}</div>
        </v-card-title>

        <v-overlay :model-value="getSettingLoading"
                   contained
                   disabled
                   class="align-center justify-center">
          <Loading size="30"></Loading>
        </v-overlay>

        <v-divider></v-divider>
        <div class="d-flex flex-row">
          <v-tabs
              class="v-col-2 pa-0"
              v-model="tabValue"
              direction="vertical">
            <v-tab prepend-icon="mdi-cog" :text="t('assembly.setting.tagCommon')" value="conventional"></v-tab>
            <v-tab prepend-icon="mdi-database" :text="t('assembly.setting.tagData')" value="data" v-if="props?.data?.assembly?.data"></v-tab>
          </v-tabs>
          <v-divider vertical></v-divider>

          <v-card class="overflow-auto v-col-10 flex-1 w-100">
            <v-tabs-window v-model="tabValue">
              <v-tabs-window-item value="conventional">
                <AssemblySettingWidget v-model="settingData"></AssemblySettingWidget>
              </v-tabs-window-item>

              <v-tabs-window-item value="data">
                <div class="w-100">
                  <v-card elevation="0" min-height="200" max-height="60vh" class="pa-2 overflow-auto">
                    <VueJsonPretty
                        theme="dark"
                        showLine
                        showIcon
                        showDoubleQuotes
                        v-if="props.data.assembly.data"
                        :data="assemblyDataProcessing.export(props.data.assembly.data)"/>
                  </v-card>
                </div>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card>
        </div>

        <v-divider></v-divider>
        <v-card-actions class="pa-5">
          <v-spacer></v-spacer>
          <v-btn @click="show = !show">{{ t('basic.button.cancel') }}</v-btn>
          <v-btn :loading="setSettingLoading" @click="setAssemblySetting" class="bg-amber">{{ t('basic.button.submit') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </v-dialog>
</template>

<style scoped lang="less">

</style>
