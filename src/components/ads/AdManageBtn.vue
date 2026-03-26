<script setup lang="ts">
import {storage_account} from "@/assets/sripts/index";
import {onMounted, ref} from "vue";

// 所有广告开关状态
let adValue = ref(false)

onMounted(() => {
  adValue.value = storage_account.getConfigurationItem('ad', 'google.switch', {defaultValue: true}) !== false;
})

/**
 * 切换广告状态
 */
const toggleAds = (value: boolean) => {
  storage_account.updateConfiguration('ad', 'google.switch', value)
};
</script>

<template>
  <v-switch v-model="adValue" hide-details inset @update:modelValue="toggleAds"></v-switch>
</template>

<style scoped lang="less">

</style>
