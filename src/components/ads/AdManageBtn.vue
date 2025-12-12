<script setup lang="ts">
import {storage_account} from "@/assets/sripts/index";
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref, watch} from "vue";

const route = useRoute(),
    router = useRouter()

// 所有广告开关状态
let adsSwitch = computed<boolean>(() => {
      return storage_account.getConfigurationItem('ad', 'google.switch', {defaultValue: true}) !== false;
    }),
    adValue = ref(false)

onMounted(() => {
  adValue.value = adsSwitch.value
})

watch(() => adValue.value, () => {
  offAds()
})

/**
 * 禁用所有广告
 */
const offAds = () => {
  storage_account.updateConfiguration('ad', 'google.switch', adValue.value)
};
</script>

<template>
  <v-switch v-model="adValue" hide-details></v-switch>
</template>

<style scoped lang="less">

</style>
