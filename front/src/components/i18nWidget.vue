<script setup lang="ts">

import {onMounted, ref, toRaw} from "vue";
import {useI18n} from "vue-i18n";
import {http, storage} from "@/assets/sripts";
import {useRoute, useRouter} from "vue-router";

const {t, locale} = useI18n(),
    router = useRouter(),
    route = useRoute()

let languages = ref([]),
    langLoading = ref(false),
    members = ref([]),
    selectLang = ref('');

onMounted(() => {
  selectLang.value = locale.value;
  getLanguagesData()
  getLanguageMembers()
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
 * 获取成员
 */
const getLanguageMembers = async () => {
  let membersData =  storage.session.get('lang.members')
  if (membersData.code == 0 && membersData.data) {
    members.value = membersData.data.value
    return
  }

  // public key, only read members
  const key = '5ce0d2b299f679b2bd8ecabe8317a1e7c3badc9d25f24d85865a9ddbe4d5d1835bebe89d951013fb'
  const result = await http.request('https://api.crowdin.com/api/v2/projects/810804/members', {
    method: 'get',
    headers: {
      "Authorization": `Bearer ${key}`,
      "Accept": "application/json"
    },
    params: {
      role: 'all'
    }
  })

  if (result.data.data) {
    members.value = result.data.data
    storage.session.set('lang.members', toRaw(members.value))
  }
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
    <div class="d-flex ga-2">
    <span v-for="(i, index) in members" :key="index">
      <v-avatar size="25" v-tooltip="i.data.username">
        <v-img :src="i.data.avatarUrl"></v-img>
      </v-avatar>
    </span>
    </div>
  </keep-alive>
</template>

<style scoped lang="less">

</style>
