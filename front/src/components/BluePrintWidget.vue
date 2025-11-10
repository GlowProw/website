<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed} from "vue";
import {Item} from "glow-prow-data";

const props = defineProps<{ data: Item }>(),
    {t} = useI18n()

let bluePrint = computed(() => {
  let bluePrints = props.data?.blueprint;

  if (!bluePrints)
    return null;

  if (bluePrints)
    return t(`snb.locations.${bluePrints}`)

  return Object.values(bluePrints[0]).map(i => t(`snb.locations.${i}`))
})
</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('codex.item.bluePrint') }}</p>
  <v-chip class="d-inline-flex mb-1">
    {{ t(bluePrint) }}
  </v-chip>
</template>

<style scoped lang="less">

</style>
