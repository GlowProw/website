<script setup lang="ts">

import {useI18n} from "vue-i18n";

const props = defineProps({
      size: {
        type: [Number, String],
        default: 25
      },
      class: {
        type: String,
        default: ''
      }
    }),
    {t} = useI18n()

defineOptions({
  name: "Logo",
})
</script>

<template>
  <router-link to="/" class="logo" :class="props.class">
    <v-img src="/favicon.svg"
         class="icon mx-1"
         :alt="`${t('name')} Logo`"
         :title="`${t('name')} Logo`"
         :style="`height:${size}px;width:${size}px`"/>
  </router-link>
</template>

<style scoped lang="less">
</style>
