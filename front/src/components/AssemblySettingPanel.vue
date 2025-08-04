<script setup lang="ts">
import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useHttpToken} from "@/assets/sripts/httpUtil";
import {api} from "@/assets/sripts/index";
import Loading from "@/components/Loading.vue";
import AssemblyDataProcessing from "@/assets/sripts/assemblyDataProcessing";

const {t} = useI18n(),
    http = useHttpToken()

const props = defineProps<{ id: string }>()

let show = ref(false),
    getSettingLoading = ref(false),
    setSettingLoading = ref(false),
    settingConfig = ref({
      visibilitys: [
        {
          label: t('assembly.setting.publicly'),
          value: 'publicly'
        },
        {
          label: t('assembly.setting.private'),
          value: 'private'
        }
      ]
    }),
    settingData = ref({
      visibility: 'publicly',
      attr: {
        password: ''
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
          <v-col>
            <v-row>
              <v-col>
                <b>是否可见</b>
                <p>决定是否被搜索或是直接访问</p>
              </v-col>
              <v-col>
                <v-select item-title="label" v-model="settingData.visibility" :items="settingConfig.visibilitys"></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <b>使用密码</b>
                <p>必须输入密码才可访问</p>
              </v-col>
              <v-col>
                <v-text-field item-title="label" :placeholder="settingData.password || '输入密码并保存来创建，如果空则不需密码'" v-model="settingData.attr.password">
                  <template v-slot:details>
                    至少6位到32位，仅可使用a-A 0-9 _
                  </template>
                </v-text-field>
              </v-col>
            </v-row>

            <v-divider class="mt-10 mb-10">其他</v-divider>

            <v-row>
              <v-col>
                <b>配装渲染器版本</b>
                <p>决定对配装数据以何种格式加载，如果你不清楚作用可以不需要设置，让系统以最新版本来初始加载</p>
              </v-col>
              <v-col>
                <v-select placeholder="选择版本" :items="AssemblyDataProcessing.versions" v-model="settingData.attr.assemblyUseVersion"></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <b>删除</b>
                <p>删除配装是不可逆行为, 将会删除对应评论和点赞</p>
              </v-col>
              <v-col>
                <v-btn class="bg-red">删除</v-btn>
              </v-col>
            </v-row>
          </v-col>
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
