<script setup lang="ts">

import {onMounted, ref, toRaw} from "vue";
import {useI18n} from "vue-i18n";
import {http, storage} from "@/assets/sripts";

const {locale} = useI18n(),
    props = withDefaults(defineProps<{ size?: number, reop?: string }>(), {
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
  let membersData = storage.session.get(`dev${props.reop ? `.${props.reop}` : ''}.members`)
  if (membersData.code == 0 && membersData.data) {
    members.value = membersData.data.value
    return
  }

  const result = await http.request(`https://api.github.com/repos/GlowProw${props.reop ? `/${props.reop}` : ''}/contributors`, {
    method: 'get' as any,
  })

  if (result) {
    members.value = result.data
    storage.session.set(`dev${props.reop ? `.${props.reop}` : ''}.members`, toRaw(members.value))
  }
}

defineOptions({
  name: "DevMembersWidget",
})
</script>

<template>
  <div class="d-flex ga-2">
    <a v-for="(i, index) in members" :key="index" :href="i?.html_url" target="_blank">
      <v-avatar :size="size" v-tooltip="i?.login || ''">
        <v-img :src="i?.avatar_url"></v-img>
      </v-avatar>
    </a>
  </div>
</template>

<style scoped lang="less">

</style>
