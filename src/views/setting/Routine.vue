<script setup lang="ts">

import I18nWidget from "@/components/i18nWidget.vue";
import ItemIconManager from "@/components/itemIconManager.vue";
import HtmlLink from "@/components/HtmlLink.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {appFuns, storage_account, storage_capacity_monitor} from "@/assets/sripts/index";
import {onMounted, Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import SetIconWidget from "@/components/snbWidget/setIconWidget.vue";

const {t} = useI18n()

let estimateCapacity: Ref<any> = ref({}),
    appFunConfig = ref([]),

    clearLoading = ref(false),
    headerSearchSwitch = ref(false),

    searchIsLogs = ref(false),
    searchHotkey = ref(false),
    searchHint = ref(false),

    posterSwitch = ref(false),

    assemblyViewModel = ref('lock-window')

onMounted(() => {
  getConfig()
})

/**
 * 格式化应用列表
 */
const appFunFormatting = () => {
  return appFuns.original.map(i => ({
    key: i.title,
    description: i.title,
    value: true
  }))
}

const getConfig = () => {
  estimateCapacity.value = storage_capacity_monitor.estimateCapacity()

  appFunConfig.value = storage_account.getConfigurationItem('appFun', 'config', {defaultValue: appFunFormatting()})
  headerSearchSwitch.value = storage_account.getConfigurationItem('search', 'header.switch')

  searchIsLogs.value = storage_account.getConfigurationItem('search', 'log.switch')
  searchHotkey.value = storage_account.getConfigurationItem('search', 'hotkey.switch')
  searchHint.value = storage_account.getConfigurationItem('search', 'hint.switch')

  posterSwitch.value = storage_account.getConfigurationItem('poster', 'poster.switch')

  assemblyViewModel.value =  storage_account.getConfigurationItem('assembly', 'viewModel', {defaultValue: assemblyViewModel.value})
}

const onUpdateAppFunConfig = () => {
  storage_account.updateConfiguration('appFun', 'config', appFunConfig.value)
}

/**
 * 处理搜索设置
 */
const onHeaderSearchSwitch = async () => {
  storage_account.updateConfiguration('search', 'header.switch', headerSearchSwitch.value)
}

const onSearchIsLogs = () => {
  storage_account.updateConfiguration('search', 'log.switch', searchIsLogs.value)
}

const onSearchHotkey = () => {
  storage_account.updateConfiguration('search', 'hotkey.switch', searchHotkey.value)
}

const onSearchHint = () => {
  storage_account.updateConfiguration('search', 'hint.switch', searchHint.value)
}

const onPosterSwitch = () => {
  storage_account.updateConfiguration('poster', 'poster.switch', posterSwitch.value)
}

const onAssemblyViewModel = () => {
  storage_account.updateConfiguration('assembly', 'viewModel', assemblyViewModel.value)
}

/**
 * 擦除数据
 */
const clearStorage = () => {
  clearLoading.value = true

  storage_capacity_monitor.clearStorage(localStorage)
  storage_capacity_monitor.clearStorage(sessionStorage)

  getConfig()

  clearLoading.value = false
}
</script>

<template>
  <v-row>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <I18nWidget></I18nWidget>

        <div class="my-10 opacity-60">
          <p class="text-caption mb-1">如果你对翻译感兴趣，可以通过下方链接这里帮助我们内容纠正或翻译，对于翻译成员我们将公示中网站中，并为账户赋予译者身份</p>
          <p class="text-caption d-flex align-center">翻译服务由<img class="mx-3" src="../../assets/images/logos/crowdin.svg" height="15"/>来提供</p>

          <div class="text-caption mt-3">
            <p>
              <HtmlLink href="https://zh.crowdin.com/project/glow-prow"></HtmlLink>
            </p>
            <p>
              <HtmlLink href="https://crowdin.com/project/glow-prow"></HtmlLink>
            </p>
          </div>
        </div>
        <template v-slot:title>
          语言
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <v-row align="start" no-gutters>
          <v-col></v-col>
          <v-col cols="auto">
          </v-col>
        </v-row>

        <div class="mb-5 opacity-60">
          <p class="text-caption">管理功能列表，由你决定是否显示</p>
        </div>

        <v-list variant="text" lines density="compact" class="bg-transparent mx-n4" max-height="300px">
          <v-list-item v-for="(nav,index) in appFunConfig" :key="index" link density="compact">
            <template v-slot:append>
              <v-switch hide-details inset density="compact" v-model="appFunConfig[index].value" @update:modelValue="onUpdateAppFunConfig"></v-switch>
            </template>
            <template v-slot:title>
              {{ t(nav.key) }}
            </template>
            <template v-slot:subtitle>
              <p class="opacity-50 text-caption">{{ t(nav.description) }}</p>
            </template>
          </v-list-item>
        </v-list>

        <template v-slot:title>
          功能
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-5">管理海报设置</p>

        <v-row align="center" no-gutters>
          <v-col>自动保存生成海报选项</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset v-model="posterSwitch" @update:modelValue="onPosterSwitch"></v-switch>
          </v-col>
        </v-row>

        <p class="text-caption opacity-60 mt-1">当用户修改海报生成设置将立即保存记录，再次访问海报加载配置内容</p>
        <template v-slot:title>
          海报
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="8">
      <AffixBoxHasTitleView>
        <div>
          <div class="mb-10">
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

            <p class="text-caption opacity-60">闪耀船首使用本地缓存存储数据，包含用户配置/操作记录等</p>
          </div>

          <div class="mb-6">
            <v-row class="mb-0">
              <v-col>
                <v-btn @click="clearStorage" :disabled="estimateCapacity.used == 0">清空缓存</v-btn>
              </v-col>
            </v-row>

            <p class="text-caption opacity-60">前往这里查看具体数据报告</p>
          </div>

          <div class="mb-6">
            <v-row class="mb-0">
              <v-col>
                <v-btn to="/setting/storage">使用报告</v-btn>
              </v-col>
            </v-row>

            <p class="text-caption opacity-60">查看具体数据使用报告，不要分享它们，包含用户操作隐私记录</p>
          </div>
        </div>
        <template v-slot:title>
          记录
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <ItemIconManager></ItemIconManager>
        <template v-slot:title>
          物品尺寸
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-5">管理全局搜索配置</p>

        <v-row align="center" no-gutters>
          <v-col>网页头搜索开启</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="headerSearchSwitch" @update:modelValue="onHeaderSearchSwitch"></v-switch>
          </v-col>
        </v-row>

        <v-row align="center" no-gutters>
          <v-col>保存搜索记录</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="searchIsLogs" @update:modelValue="onSearchIsLogs"></v-switch>
          </v-col>
        </v-row>

        <v-row align="center" no-gutters>
          <v-col>是否快捷键触发</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="searchHotkey" @update:modelValue="onSearchHotkey"></v-switch>
          </v-col>
        </v-row>

        <v-row align="center" no-gutters>
          <v-col>关闭提示</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="searchHint" @update:modelValue="onSearchHint"></v-switch>
          </v-col>
        </v-row>
        <template v-slot:title>
          搜索
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-5">配装配装选项</p>

        <v-row align="center" no-gutters>
          <v-col>配装视图模式</v-col>
          <v-col cols="auto">
            <v-select hide-details inset density="compact" :items="['full-extension', 'lock-window']" v-model="assemblyViewModel" @update:modelValue="onAssemblyViewModel">
              <template v-slot:item="{props, item}">
                <v-list-item v-bind="props">
                  <template v-slot:title>
                    {{ t(`setting.routine.assemblyViewModel.${item.raw}.name`) }}
                  </template>
                </v-list-item>
              </template>
              <template v-slot:selection="{props, item}">
                {{ t(`setting.routine.assemblyViewModel.${item.raw}.name`) }}
              </template>
            </v-select>
          </v-col>
        </v-row>

        <p class="mt-3 text-caption opacity-60">{{ t(`setting.routine.assemblyViewModel.${assemblyViewModel}.description`) }}</p>

        <template v-slot:title>
          配装
        </template>
      </AffixBoxHasTitleView>
    </v-col>
  </v-row>
</template>

<style scoped lang="less">

</style>
