<script setup lang="ts">

import {onMounted, ref, toRaw} from "vue";
import {useI18n} from "vue-i18n";
import {http, storage} from "@/assets/sripts";
import {useRoute, useRouter} from "vue-router";

const {t, locale} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    props = withDefaults(defineProps<{size?: number}>(), {
      size: 25
    })

let members = ref([]),
    selectLang = ref('')

onMounted(() => {
  selectLang.value = locale.value;
  getLanguageMembers()
})

/**
 * 获取成员
 */
const getLanguageMembers = async () => {
  let membersData = storage.session.get('lang.members')
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
      // "Accept": "application/json"
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
</script>

<template>
  <div class="d-flex ga-2">
    <span v-for="(i, index) in members" :key="index">
      <v-avatar :size="size" v-tooltip="i?.data?.username || ''">
        <v-img :src="i?.data?.avatarUrl"></v-img>
      </v-avatar>
    </span>
  </div>
</template>

<style scoped lang="less">

</style>
