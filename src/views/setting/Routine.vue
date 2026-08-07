<template>
  <v-row>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <I18nWidget></I18nWidget>

        <div class="my-10 opacity-60">
          <p class="text-caption mb-1">{{ t('setting.routine.translationHelp') }}</p>
          <p class="text-caption d-flex align-center">{{ t('setting.routine.translationService') }}<img class="mx-3" src="../../assets/images/logos/crowdin.svg" height="15"/></p>

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
          {{ t('setting.routine.languageTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <div class="mb-5 opacity-60">
          <p class="text-caption">{{ t('setting.routine.featureDesc') }}</p>
          <p class="text-caption text-grey">{{ t('setting.routine.featureHint') }}</p>
        </div>

        <!-- 未激活列表 -->
        <v-select
            v-model="selectedToActivate"
            :items="inactiveFunctions"
            item-title="title"
            item-value="key"
            :label="t('setting.routine.inactiveFunctions', { count: inactiveFunctions.length })"
            multiple
            chips
            variant="outlined"
            density="compact"
            hide-details
            class="mb-4"
            @update:model-value="onActivateFunctions">
          <template v-slot:chip="{ props, item }">
            <v-chip v-bind="props" size="small" color="info">
              {{ t(item.raw.key) }}
            </v-chip>
          </template>
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props">
              <template v-slot:title>
                {{ t(item.raw.key) }}
              </template>
              <template v-slot:subtitle>
                <p class="opacity-50 text-caption">{{ t(item.raw.description) }}</p>
              </template>
            </v-list-item>
          </template>
          <template v-slot:no-data>
            <EmptyView></EmptyView>
          </template>
        </v-select>

        <!-- 激活列表 -->
        <div class="mt-4">
          <div class="d-flex flex-wrap ga-2">
            <v-chip
                v-for="func in activeFunctions"
                :key="func.key"
                size="x-small"
                variant="tonal"
                color="amber"
                closable
                @click:close="deactivateFunction(func.key)">
              {{ t(func.key) }}
            </v-chip>
            <span v-if="activeFunctions.length === 0" class="text-caption opacity-50">
              {{ t('setting.routine.noActiveFunctions') }}
            </span>
          </div>
        </div>

        <template v-slot:title>
          {{ t('setting.routine.featuresTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <ItemIconManager></ItemIconManager>
        <template v-slot:title>
          {{ t('setting.routine.itemConfigTitle') }}
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

            <p class="text-caption opacity-60">{{ t('setting.routine.storageReportDesc') }}</p>
          </div>

          <div class="mb-6">
            <v-row class="mb-0">
              <v-col>
                <v-btn @click="clearStorage" :disabled="estimateCapacity.used == 0">{{ t('setting.routine.clearStorage') }}</v-btn>
              </v-col>
            </v-row>

            <p class="text-caption opacity-60">{{ t('setting.routine.storageReportLinkHint') }}</p>
          </div>

          <div class="mb-6">
            <v-row class="mb-0">
              <v-col>
                <v-btn to="/setting/storage">{{ t('setting.routine.storageReportBtn') }}</v-btn>
              </v-col>
            </v-row>

            <p class="text-caption opacity-60">{{ t('setting.routine.storagePrivacyHint') }}</p>
          </div>
        </div>
        <template v-slot:title>
          {{ t('setting.routine.recordsTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <ItemIconCdnAssets></ItemIconCdnAssets>
        <template v-slot:title>
          {{ t('setting.routine.cdnTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-5">{{ t('setting.routine.posterDesc') }}</p>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.posterAutoSave') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset v-model="posterSwitch" @update:modelValue="onPosterSwitch"></v-switch>
          </v-col>
        </v-row>

        <p class="text-caption opacity-60 mt-1">{{ t('setting.routine.posterHint') }}</p>
        <template v-slot:title>
          {{ t('setting.routine.posterTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-5">{{ t('setting.routine.searchDesc') }}</p>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.searchHeaderSwitch') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="headerSearchSwitch" @update:modelValue="onHeaderSearchSwitch"></v-switch>
          </v-col>
        </v-row>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.searchIsLogs') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="searchIsLogs" @update:modelValue="onSearchIsLogs"></v-switch>
          </v-col>
        </v-row>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.searchHotkey') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="searchHotkey" @update:modelValue="onSearchHotkey"></v-switch>
          </v-col>
        </v-row>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.searchHint') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="searchHint" @update:modelValue="onSearchHint"></v-switch>
          </v-col>
        </v-row>

        <v-divider class="mt-2 mb-3"></v-divider>

        <div class="text-caption text-grey mb-1">{{ t('setting.routine.searchOpenMode') }}</div>
        <v-select
            v-model="searchOpenNewWindow"
            :items="[
              { title: t('search.openNewWindow'), value: true },
              { title: t('search.openCurrentWindow'), value: false }
            ]"
            item-title="title"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            @update:modelValue="onSearchOpenNewWindow"
        ></v-select>

        <template v-slot:title>
          {{ t('setting.routine.searchTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-5">{{ t('setting.routine.commentDesc') }}</p>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.commentGlobalSwitch') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="commentGlobalSwitch" @update:modelValue="onCommentGlobalSwitch"></v-switch>
          </v-col>
        </v-row>

        <v-divider class="my-2"></v-divider>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.commentCodexSwitch') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="commentCodexSwitch" :disabled="!commentGlobalSwitch" @update:modelValue="onCommentCodexSwitch"></v-switch>
          </v-col>
        </v-row>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.commentAssemblySwitch') }}</v-col>
          <v-col cols="auto">
            <v-switch hide-details inset density="compact" v-model="commentAssemblySwitch" :disabled="!commentGlobalSwitch" @update:modelValue="onCommentAssemblySwitch"></v-switch>
          </v-col>
        </v-row>

        <template v-slot:title>
          {{ t('setting.routine.commentTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
    <v-col cols="12" lg="4">
      <AffixBoxHasTitleView>
        <p class="text-caption opacity-60 mb-5">{{ t('setting.routine.assemblyDesc') }}</p>

        <v-row align="center" no-gutters>
          <v-col>{{ t('setting.routine.assemblyViewModel') }}</v-col>
          <v-col cols="auto">
            <v-select hide-details inset density="compact" :items="['full-extension', 'lock-window']" v-model="assemblyViewModel" @update:modelValue="onAssemblyViewModel">
              <template v-slot:item="{props, item}">
                <v-list-item v-bind="props">
                  <template v-slot:title>
                    {{ t(`setting.routine.assemblyViewModelOptions.${item.raw}.name`) }}
                  </template>
                </v-list-item>
              </template>
              <template v-slot:selection="{item}">
                {{ t(`setting.routine.assemblyViewModelOptions.${item.raw}.name`) }}
              </template>
            </v-select>
          </v-col>
        </v-row>

        <p class="mt-3 text-caption opacity-60">{{ t(`setting.routine.assemblyViewModelOptions.${assemblyViewModel}.description`) }}</p>

        <template v-slot:title>
          {{ t('setting.routine.assemblyTitle') }}
        </template>
      </AffixBoxHasTitleView>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import I18nWidget from "@/components/i18nWidget.vue";
import ItemIconManager from "@/components/itemIconManager.vue";
import HtmlLink from "@/components/HtmlLink.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import {appFuns, storage_account, storage_capacity_monitor} from "@/assets/sripts/index";
import {onMounted, Ref, ref, computed} from "vue";
import {useI18n} from "vue-i18n";
import ItemIconCdnAssets from "@/components/itemIconCdnAssets.vue";
import EmptyView from "@/components/EmptyView.vue";

const {t} = useI18n()

let estimateCapacity: Ref<any> = ref({}),
    appFunConfig = ref<any[]>([]),

    // 下拉框选中的待激活功能
    selectedToActivate = ref<string[]>([]),

    clearLoading = ref(false),
    headerSearchSwitch = ref(false),

    searchIsLogs = ref(false),
    searchHotkey = ref(false),
    searchHint = ref(false),
    searchOpenNewWindow = ref(true),

    commentGlobalSwitch = ref(true),
    commentCodexSwitch = ref(true),
    commentAssemblySwitch = ref(true),

    posterSwitch = ref(false),

    assemblyViewModel = ref('lock-window')

// 计算属性：已激活的功能列表 (value === true)
const activeFunctions = computed(() => {
  return appFunConfig.value.filter(item => item.value === true)
})

// 计算属性：未激活的功能列表 (value === false)
const inactiveFunctions = computed(() => {
  return appFunConfig.value.filter(item => item.value === false)
})

// 激活功能：从下拉框选择后，将选中的功能设置为激活状态
const onActivateFunctions = (selectedKeys: string[]) => {
  if (!selectedKeys || selectedKeys.length === 0) return

  appFunConfig.value.forEach(item => {
    if (selectedKeys.includes(item.key) && !item.value) {
      item.value = true
    }
  })

  // 保存配置
  onUpdateAppFunConfig()

  // 清空下拉框选中状态
  selectedToActivate.value = []
}

// 反激活功能：点击已激活标签的关闭按钮，将其设置为未激活
const deactivateFunction = (key: string) => {
  const target = appFunConfig.value.find(item => item.key === key)
  if (target && target.value) {
    target.value = false
    onUpdateAppFunConfig()
  }
}

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
  searchOpenNewWindow.value = storage_account.getConfigurationItem('search', 'open.newWindow', {defaultValue: true})

  commentGlobalSwitch.value = storage_account.getConfigurationItem('comment', 'global.switch', {defaultValue: true})
  commentCodexSwitch.value = storage_account.getConfigurationItem('comment', 'codex.switch', {defaultValue: true})
  commentAssemblySwitch.value = storage_account.getConfigurationItem('comment', 'assembly.switch', {defaultValue: true})

  posterSwitch.value = storage_account.getConfigurationItem('poster', 'poster.switch')

  assemblyViewModel.value = storage_account.getConfigurationItem('assembly', 'viewModel', {defaultValue: assemblyViewModel.value})
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

const onSearchOpenNewWindow = () => {
  storage_account.updateConfiguration('search', 'open.newWindow', searchOpenNewWindow.value)
}

const onCommentGlobalSwitch = () => {
  storage_account.updateConfiguration('comment', 'global.switch', commentGlobalSwitch.value)
}

const onCommentCodexSwitch = () => {
  storage_account.updateConfiguration('comment', 'codex.switch', commentCodexSwitch.value)
}

const onCommentAssemblySwitch = () => {
  storage_account.updateConfiguration('comment', 'assembly.switch', commentAssemblySwitch.value)
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

<style scoped lang="less">
</style>
