<script setup lang="ts">

import {useRoute} from "vue-router";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";

const props = defineProps<{ id: string, grade: string }>(),
    route = useRoute(),
    {modification} = useI18nReadName()

let getTitle = computed(() => {
  return `${modification(props.id).name() || '-'}`
})

defineOptions({
  name:"ModName"
})
</script>

<template>
  <span :class="`grade-${grade}-title`">{{ getTitle }}</span>
  <v-spacer v-if="route.query.debug"></v-spacer>
  <span class="opacity-30" v-if="route.query.debug">{{ id }}</span>
</template>

<style scoped lang="less">

</style>
