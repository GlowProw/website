<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";

const props = defineProps<{id: string, grade: string}>(),
    route = useRoute(),
    {t} = useI18n()
</script>

<template>
  <b :class="`grade-${grade}-title`">{{ t(`snb.modifications.${id}.name`) }}</b>
  <v-spacer v-if="route.query.debug"></v-spacer>
  <p class="opacity-30" v-if="route.query.debug">{{id}}</p>
</template>

<style scoped lang="less">

</style>
