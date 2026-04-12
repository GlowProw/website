<script setup lang="ts">
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {inject} from "vue";

const props = defineProps<{ data: any }>(),
    {t} = useI18nUtils()

defineOptions({
  name: "PerksWidget"
})
</script>

<template>
  <div class="px-5">
    <div v-for="(i, index) in props.data.perks" :key="index" class="mb-4">
      <div class="perk-title-flavor mb-1 d-inline-flex align-center">
        <v-icon icon="mdi-star" size="14" class="mr-1"></v-icon>
        {{ t(`snb.perks.${i.id}.name`) }}
      </div>
      <div class="text-caption opacity-80 pl-5">
        {{ t(`snb.perks.${i.id}.description`) }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
