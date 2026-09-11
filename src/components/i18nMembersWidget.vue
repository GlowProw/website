<script setup lang="ts">

import {onMounted, ref} from "vue";
import {useCrowdinApi} from "@/assets/sripts/api/crowdin_service";

withDefaults(defineProps<{ size?: number }>(), {
  size: 25
})

let members = ref<any[]>([])

onMounted(() => {
  getLanguageMembers()
})

/**
 * 获取成员
 */
const getLanguageMembers = async () => {
  try {
    members.value = await useCrowdinApi().getMembers()
  } catch (e) {
    console.error('get crowdin members failed:', e)
  }
}

defineOptions({
  name: "I18nMembersWidget",
})
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
