<script setup lang="ts">
import {computed, onMounted, type Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useRoute} from "vue-router";
import {storage_account} from "@/assets/sripts/index";

import GlobalSearchCoreView from "@/components/GlobalSearchCoreView.vue";
import SwipeDrawer from "@/components/SwipeDrawer.vue";

const {t} = useI18n(),
    route = useRoute(),
    {sanitizeString, asString} = useI18nUtils()

let model = ref(false),
    searchSettingConfig: Ref<{ headerSearchSwitch?: boolean }> = ref({
      headerSearchSwitch: true
    }),
    isSearchPage = computed(() => route.name == 'Search')

/**
 * 是否可见按钮
 */
let isSeeIcon = computed(() => {
  if (model.value || isSearchPage.value)
    return false
  return true
})

watch(route, () => {
  model.value = false
}, {deep: true})

onMounted(() => {
  getConfig()
})

/**
 * 获取搜索配置
 */
const getConfig = () => {
  const headerSearchSwitch = storage_account.getConfigurationItem('search', 'header.switch', {defaultValue: true})

  searchSettingConfig.value = {
    headerSearchSwitch,
  }
}

/**
 * 打开搜索抽屉
 */
const onOpenModel = () => {
  if (isSeeIcon.value)
    model.value = true
}

defineOptions({
  name: 'GlobalSearchDrawer'
})
</script>

<template>
  <div @click.prevent="onOpenModel"
       v-if="searchSettingConfig?.headerSearchSwitch"
       :style="{'opacity': isSeeIcon ? 1 : .4}">
    <slot></slot>
  </div>

  <SwipeDrawer v-model="model" side="right" width="90vw" max-width="1024px">
    <v-card tile variant="text" class="global-search-drawer d-flex flex-column h-100 border-l">
      <!-- 抽屉标题栏 -->
      <div class="d-flex align-center px-4 py-2 border-bottom flex-shrink-0">
        <span class="text-h6">{{ t('search.title') }}</span>
        <v-spacer></v-spacer>
        <v-btn
            icon="mdi-close"
            variant="text"
            :aria-label="t('common.close')"
            @click="model = false"></v-btn>
      </div>

      <!-- 搜索内容主体 -->
      <div class="global-search-drawer__body flex-grow-1 overflow-y-auto pa-4 pa-lg-8">
        <GlobalSearchCoreView embedded @close="model = false" />
      </div>
    </v-card>
  </SwipeDrawer>
</template>

<style scoped lang="less">
.global-search-drawer {
  background-color: transparent;
}
</style>
