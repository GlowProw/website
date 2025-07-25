<script setup lang="ts">

import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {http, storage} from "../assets/sripts";
import {useRoute, useRouter} from "vue-router";

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
            item-title="label" item-value="value" v-model="selectLang" @update:modelValue="onChangeLang"></v-select>
</template>

<style scoped lang="less">

</style>
