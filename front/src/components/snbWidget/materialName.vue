<script setup lang="ts">
import {useI18n} from "vue-i18n";

const {t} = useI18n(),
    props = defineProps<{ id: string | undefined }>()
</script>

<template>
    <span :title="t(`snb.materials.${id}.name`)"
          v-tooltip="t(`snb.materials.${id}.name`)"
          v-if="id">{{ t(`snb.materials.${id}.name`) }}</span>
</template>

<style scoped lang="less">
.a {
  color: hal();
}
</style>
