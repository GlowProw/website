<script setup lang="ts">
import {useI18n} from "vue-i18n";

const props = withDefaults(defineProps<{ pieces?: [] | string | unknown }>(), {pieces: null}),
    {t} = useI18n()
</script>

<template>
  <div v-if="pieces">
    <v-chip class="badge-flavor text-center tag-badge text-black bg-blue-accent-1 text-blue-darken-4"
            v-for="(i, index) in pieces"
            :key="index"
            v-if="Array.isArray(pieces)">
      {{ t(`codex.types.${i}`) }}
    </v-chip>
    <v-chip class="badge-flavor text-center tag-badge text-black bg-blue-accent-1 text-blue-darken-4"
            v-else-if="!Array.isArray(pieces)">
      {{ t(`codex.types.${pieces}`) }}
    </v-chip>
  </div>
</template>

<style scoped lang="less">

</style>
