<script setup lang="ts">
import {computed, onMounted, Ref, ref} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useRoute} from "vue-router";
import {storage_account} from "@/assets/sripts/index";

import GlobalSearchCoreView from "@/components/GlobalSearchCoreView.vue";

const route = useRoute(),
    {sanitizeString, asString} = useI18nUtils()

let model = ref(false),
    searchSettingConfig: Ref<{headerSearchSwitch?: boolean}> = ref({
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

const onPenModel = () => {
  if (isSeeIcon.value)
    model.value = true
}
</script>

<template>
  <div @click.prevent="onPenModel"
       v-if="searchSettingConfig?.headerSearchSwitch"
       :style="{'opacity': isSeeIcon ? 1 : .4}">
    <slot></slot>
  </div>

  <v-dialog z-index="800"
            class="global-search position-fixed"
            content-class="overflow-y-auto"
            noClickAnimation
            transition
            v-model="model">
    <v-container class="pa-14">
      <GlobalSearchCoreView @close="model = !model">
        <template v-slot:close>
          <v-btn icon variant="tonal" class="ml-5" @click="model = false">
            <v-icon icon="mdi-close"/>
          </v-btn>
        </template>
      </GlobalSearchCoreView>
    </v-container>
  </v-dialog>
</template>

<style scoped lang="less">
.global-search {
  background: linear-gradient(rgba(0, 0, 0, 0.47), rgba(0, 0, 0, 0.47)),
  hsl(from var(--main-color) h s l / .1);
  background-blend-mode: multiply;
  backdrop-filter: blur(100px)
}
</style>
