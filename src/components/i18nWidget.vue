<script lang="ts">
export default { name: 'I18nWidget' }
</script>

<script setup lang="ts">

import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {http, storage} from "@/assets/sripts";
import {useRoute, useRouter} from "vue-router";
import I18nMembersWidget from "@/components/i18nMembersWidget.vue";
import languagesConfig from "@/config/languages";

const {t, locale} = useI18n(),
    router = useRouter(),
    route = useRoute()

let languages = ref([] as any[]),
    langLoading = ref(false),
    selectLang = ref('')

onMounted(() => {
  getLanguagesData()
})

// 保证与 i18n locale 保持同步更新
watch(
  () => locale.value,
  (newLocale) => {
    if (newLocale && selectLang.value !== newLocale) {
      selectLang.value = newLocale;
    }
  },
  { immediate: true }
);

/**
 * 获取语言配置
 */
const getLanguagesData = () => {
  languages.value = languagesConfig.child || [];
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

  <keep-alive>
    <I18nMembersWidget></I18nMembersWidget>
  </keep-alive>
</template>

<style scoped lang="less">

</style>
