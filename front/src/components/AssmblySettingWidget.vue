<script setup lang="ts">

import AssemblyDataProcessing from "@/assets/sripts/assemblyDataProcessing";
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {api} from "@/assets/sripts/index";
import {useHttpToken} from "@/assets/sripts/http_util";
import {useRoute} from "vue-router";

const {t, messages} = useI18n(),
    http = useHttpToken(),
    route = useRoute(),
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

let languages = computed(() => Object.keys(messages.value))

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

const passwordPlaceholder = computed(() => {
  if (props.modelValue.password && props.modelValue.attr.password === '')
    return '含密码'

  else if (props.modelValue.password && props.modelValue.attr.password === null)
    return '当前配装已设密码，但新密码已删除'

  else if (!props.modelValue.password && props.modelValue.attr.password === '')
    return '无密码'

  // if (props.modelValue.attr.password === '')
  //   return props.modelValue.password || '输入密码并保存来创建，如果空则不需密码'

  return '未设置密码'
})
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
        <template v-if="route.debug">
          {{ modelValue.password }} |
          {{ modelValue.attr.password }}
        </template>

        <v-text-field item-title="label" :placeholder="passwordPlaceholder"
                      clearable
                      v-model="modelValue.attr.password">
          <template v-slot:details>
            至少6位到32位，仅可使用a-A 0-9 _
          </template>
          <template v-slot:append>
            <v-btn icon="mdi-delete"
                   v-if="modelValue.attr.password  === ''"
                   @click="modelValue.attr.password = null"></v-btn>
          </template>
        </v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <b>配装语种</b>
        <p>你可以定义配装语言</p>
      </v-col>
      <v-col>
        <v-select item-title="label" v-model="modelValue.attr.language"
                  multiple
                  :items="languages"></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <b>背景图片</b>
        <p>它仅在配装详情页展示，固定在配装后方，使用外部图床</p>
      </v-col>
      <v-col>
        <v-card border>
          <v-img v-if="modelValue.attr.backgroundPresentation" :src="modelValue.attr.backgroundPresentation"></v-img>
          <v-text-field tile hide-details clearable persistent-hint
                        type="src"
                        placeholder="https://"
                        v-model="modelValue.attr.backgroundPresentation"></v-text-field>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <b>是否展示名称</b>
        <p>在物品图标下方显示物品名称</p>
      </v-col>
      <v-col>
        <v-checkbox v-model="modelValue.attr.isShowItemName" density="compact" hide-details></v-checkbox>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <b>是否匿名</b>
        <p>是否将你在此配装中用户名称和ID删除</p>
      </v-col>
      <v-col>
        <v-checkbox v-model="modelValue.attr.isAnonymous" density="compact" hide-details></v-checkbox>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <b>评论</b>
        <p>是否开启评论</p>
      </v-col>
      <v-col>
        <v-checkbox v-model="modelValue.attr.isComment" density="compact" hide-details></v-checkbox>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <b>点赞</b>
        <p>是否开启点赞</p>
      </v-col>
      <v-col>
        <v-checkbox v-model="modelValue.attr.isLike" density="compact" hide-details></v-checkbox>
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
