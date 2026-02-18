<script setup lang="ts">

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import DamageIconWidget from "@/components/snbWidget/damageIconWidget.vue";
import {Item} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import {computed} from "vue";

const props = defineProps({data: Item}),
    {t} = useI18n()

let damageMitigation = computed(() => {
  if (props.data && props.data.damageMitigation) {
    return Object.entries(props.data.damageMitigation)
  }
  return []
})
</script>

<template>
  <v-text-field :value="`${(dmValue * 100).toFixed(0)}%`"
                v-for="([dmKey,dmValue]) in damageMitigation"
                :key="dmValue"
                :class="[dmValue ? '' : 'opacity-30']"
                readonly
                hide-details
                variant="underlined"
                density="compact">
    <template v-slot:append-inner>
      <p class="text-no-wrap">{{ t(`assembly.tags.damageTypes.${dmKey}`) }}</p>
    </template>
    <template v-slot:append>
      <ItemSlotBase size="30px" :padding="0">
        <DamageIconWidget :id="dmKey"></DamageIconWidget>
      </ItemSlotBase>
    </template>
  </v-text-field>
</template>

<style scoped lang="less">

</style>
