<script setup lang="ts">
import {computed, onMounted, ref} from "vue";

import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useRoute, useRouter} from "vue-router";
import {storage_account} from "@/assets/sripts/index";

import GlobalSearchCoreView from "@/components/GlobalSearchCoreView.vue";

const {t} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    {sanitizeString, asString} = useI18nUtils()

let model = ref(false),
    searchSettingConfig = ref({}),
    isSearchPage = computed(() => route.name == 'Search')

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
</script>

<template>
  <div @click.prevent="model = true"
       v-if="searchSettingConfig.headerSearchSwitch"
       class="mx-2 cursor-pointer"
       :class="{'d-none': model || isSearchPage}">
    <slot></slot>
  </div>

  <v-dialog z-index="800"
            absolute
            class="global-search"
            content-class="pt-8 overflow-y-auto"
            v-model="model">
    <template v-slot:default>
      <v-container>
        <GlobalSearchCoreView @close="model = !model">
          <template v-slot:close>
            <v-btn icon variant="tonal" class="ml-5" @click="model = false">
              <v-icon icon="mdi-close"/>
            </v-btn>
          </template>
        </GlobalSearchCoreView>
      </v-container>
    </template>
  </v-dialog>
</template>

<style scoped lang="less">
.global-search {
  background:
      linear-gradient(rgba(0, 0, 0, 0.47), rgba(0, 0, 0, 0.47)),
      hsl(from var(--main-color) h s l / .1);
  background-blend-mode: multiply;
  backdrop-filter: blur(100px)
}
</style>
