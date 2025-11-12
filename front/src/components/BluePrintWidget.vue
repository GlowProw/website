<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed} from "vue";
import {Item} from "glow-prow-data";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const props = defineProps<{ data: Item }>(),
    {t} = useI18n(),
    {asString} = useI18nUtils()

let bluePrint = computed(() => {
  let bluePrints = props.data?.blueprint;

  if (!bluePrints)
    return null;

  if (bluePrints)
    return asString([
      `snb.mapLocations.${bluePrints}.name`,
      `snb.locations.${bluePrints}`,
    ], {
      backRawKey: true
    })

  return Object.values(bluePrints[0]).map(i => asString([
    `snb.mapLocations.${bluePrints}.name`,
    `snb.locations.${bluePrints}`,
  ], {
    backRawKey: true
  }))
})
</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('codex.item.bluePrint') }}</p>
  <v-chip class="d-inline-flex mb-1">
    {{ bluePrint }}
  </v-chip>
</template>

<style scoped lang="less">

</style>
