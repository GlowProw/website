<script setup lang="ts">
import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useHttpToken} from "@/assets/sripts/httpUtil";
import {api} from "@/assets/sripts/index";
import Loading from "@/components/Loading.vue";
import AssemblySettingWidget from "@/components/AssmblySettingWidget.vue"
import AssemblyDataProcessing from "@/assets/sripts/assemblyDataProcessing";

const {t,locale} = useI18n(),
    http = useHttpToken()

const props = defineProps<{ id: string }>()

let show = ref(false),
    getSettingLoading = ref(false),
    setSettingLoading = ref(false),
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

        <v-row class="mt-5 pa-5">
          <v-col cols="2">
            常规
          </v-col>
          <v-divider vertical class="mr-4 ml-4"></v-divider>
          <AssemblySettingWidget v-model="settingData"></AssemblySettingWidget>
        </v-row>
        <v-divider></v-divider>
        <v-card-actions class="pa-5">
          <v-btn :loading="setSettingLoading" @click="setAssemblySetting" class="bg-amber">确定</v-btn>
          <v-btn @click="show = !show">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </v-dialog>
</template>

<style scoped lang="less">

</style>
