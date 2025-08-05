<script setup lang="ts">

import AssemblyDataProcessing from "@/assets/sripts/assemblyDataProcessing";
import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {api} from "@/assets/sripts/index";
import {useHttpToken} from "@/assets/sripts/httpUtil";

const {t} = useI18n(),
    http = useHttpToken(),
    props = withDefaults(defineProps<{ modelValue: any, isShowDelete?: boolean }>(), {
      isShowDelete: true
    })

let emit = defineEmits(['update:modelValue']),
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
    delAssemblyLoading = ref(false)

watch(() => props.modelValue.value, (value, oldValue) => {
  const changes = {}
  for (const key in value) {
    if (!isEqual(value[key], oldValue[key])) {
      changes[key] = value[key]
    }
  }

  if (Object.keys(changes).length > 0) {
    emit('update:modelValue', {...props.modelValue, ...changes})
  }
}, {flush: 'sync'})

const isEqual = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * 删除配装
 */
const delAssembly = async () => {
  try {
    const {uuid} = route.params;
    delAssemblyLoading.value = true
    const result = await http.post(api['assembly_delete'], {
          data: {uuid},
        }),
        d = result.data;

    if (d.error == 1)
      throw Error(d.message || d.code);

    await router.push("/assembly")
  } catch (e) {
    if (e instanceof Error)
      console.error(e)
  } finally {
    delAssemblyLoading.value = false
  }
}
</script>

<template>
  <v-col>
    <v-row>
      <v-col>
        <b>是否可见</b>
        <p>决定是否被搜索或是直接访问</p>
      </v-col>
      <v-col>
        <v-select item-title="label" v-model="modelValue.visibility" :items="settingConfig.visibilitys"></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <b>使用密码</b>
        <p>必须输入密码才可访问</p>
      </v-col>
      <v-col>
        <v-text-field item-title="label" :placeholder="modelValue.attr.password || '输入密码并保存来创建，如果空则不需密码'" v-model="modelValue.attr.password">
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
        <v-select placeholder="选择版本" :items="AssemblyDataProcessing.versions" v-model="modelValue.attr.assemblyUseVersion"></v-select>
      </v-col>
    </v-row>

    <v-row v-if="isShowDelete">
      <v-col>
        <b>删除</b>
        <p>删除配装是不可逆行为, 将会删除对应评论和点赞</p>
      </v-col>
      <v-col>
        <v-btn class="bg-red" @click="delAssembly">删除</v-btn>
      </v-col>
    </v-row>
  </v-col>
</template>

<style scoped lang="less">

</style>
