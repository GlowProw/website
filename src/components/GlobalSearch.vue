<script setup lang="ts">
import {computed, ref} from "vue";

import {useI18n} from "vue-i18n";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useRoute, useRouter} from "vue-router";
import SearchView from "@/components/SearchView.vue";


const {t} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    {sanitizeString, asString} = useI18nUtils()

let model = ref(false),
    isSearchPage = computed(() => route.name == 'Search')

</script>

<template>
  <v-btn icon density="comfortable" @click="model = true" class="mx-2" :disabled="model || isSearchPage">
    <slot></slot>
  </v-btn>

  <v-dialog max-width="1024"
            z-index="51"
            class="global-search"
            content-class="pt-8"
            v-model="model">
    <template v-slot:default>
      <SearchView>
        <template v-slot:close>
          <v-btn icon variant="tonal" class="ml-5" @click="model = false" >
            <v-icon icon="mdi-close"/>
          </v-btn>
        </template>
      </SearchView>
    </template>
  </v-dialog>
</template>

<style scoped lang="less">
.global-search {
  background: rgba(0, 0, 0, 0.47);
  backdrop-filter: blur(100px)
}
</style>
