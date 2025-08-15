<script setup lang="ts">

import {onMounted, ref, toRaw} from "vue";
import {useI18n} from "vue-i18n";
import {http, storage} from "@/assets/sripts";
import {useRoute, useRouter} from "vue-router";
import I18nMembersWidget from "@/components/i18nMembersWidget.vue";

const {t, locale} = useI18n(),
    router = useRouter(),
    route = useRoute()

let languages = ref([]),
    langLoading = ref(false),
    selectLang = ref('');

onMounted(() => {
  selectLang.value = locale.value;
  getLanguagesData()
})

/**
 * 获取语言配置
 */
const getLanguagesData = async () => {
  langLoading.value = true
  const result = await http.request(new URL('/config/languages.json', import.meta.url).href)
  languages.value = result.data.child;
  langLoading.value = false
}

/**
 * 改变语音
 */
const onChangeLang = () => {
  router.push({
    name: route.name,
    query: {...route.query, 'lang': selectLang.value},
    params: {...route.params}
  })
  storage.local.set('lang', {value: selectLang.value})
  locale.value = selectLang.value;
}
</script>

<template>
  <v-select :items="languages"
            :disabled="langLoading"
            item-title="label"
            item-value="value"
            prepend-icon="mdi-translate"
            hide-no-data
            hide-spin-buttons
            persistent-hint
            variant="plain"
            density="compact"
            v-model="selectLang" @update:modelValue="onChangeLang"></v-select>

  <p class="mb-2 opacity-60 text-body-1">感谢以下翻译成员:</p>
  <keep-alive>
    <I18nMembersWidget></I18nMembersWidget>
  </keep-alive>
</template>

<style scoped lang="less">

</style>
