<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useHttpToken} from "@/assets/sripts/httpUtil";
import {api} from "@/assets/sripts/index";
import Loading from "@/components/Loading.vue";
import AssemblySettingWidget from "@/components/AssmblySettingWidget.vue"
import AssemblyDataProcessing from "@/assets/sripts/assemblyDataProcessing";
import VueJsonPretty from 'vue-json-pretty';

import 'vue-json-pretty/lib/styles.css';

const {t, locale} = useI18n(),
    http = useHttpToken(),
    assemblyDataProcessing = new AssemblyDataProcessing();

const props = defineProps<{ id: string, assemblyData?: any }>()

let show = ref(false),
    getSettingLoading = ref(false),
    setSettingLoading = ref(false),
    tabValue = ref('conventional'),
    settingData = ref({
      visibility: 'publicly',
      attr: {
        password: '',
        language: locale.value,
        assemblyUseVersion: AssemblyDataProcessing.nowVersion
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
    const result = await http.get(api['assembly_attr'], {
          params: {
            uuid: props.id,
          }
        }),
        d = result.data

    if (d.error == 1)
      return;

    settingData.value = d.data;
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

    const result = await http.post(api['assembly_attr_edit'], {
          data: {
            uuid: props.id,
            ...settingData.value
          }
        }),
        d = result.data

    if (d.error == 1)
      return;

  } finally {
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
          <div class="text-h5 font-weight-bold text-amber">设置</div>
        </v-card-title>
        <v-overlay :model-value="getSettingLoading"
                   contained
                   disabled
                   class="align-center justify-center">
          <Loading size="30"></Loading>
        </v-overlay>

        <div class="d-flex flex-row">
          <v-tabs
              class="v-col-3"
              v-model="tabValue"
              direction="vertical">
            <v-tab prepend-icon="mdi-cog" text="常规" value="conventional"></v-tab>
            <v-tab prepend-icon="mdi-database" text="数据" value="data" v-if="props.assemblyData"></v-tab>
          </v-tabs>

          <v-tabs-window v-model="tabValue" class="v-col-9 flex-1 w-100">
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
                      v-if="assemblyData"
                      :data="assemblyDataProcessing.export(assemblyData)" />
                </v-card>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>

        <v-divider></v-divider>
        <v-card-actions class="pa-5">
          <v-spacer></v-spacer>
          <v-btn @click="show = !show">取消</v-btn>
          <v-btn :loading="setSettingLoading" @click="setAssemblySetting" class="bg-amber">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </v-dialog>
</template>

<style scoped lang="less">

</style>
