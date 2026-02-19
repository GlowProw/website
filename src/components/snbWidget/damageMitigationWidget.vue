<script setup lang="ts">

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import DamageIconWidget from "@/components/snbWidget/damageIconWidget.vue";
import {Item} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import {computed} from "vue";

const props = withDefaults(
        defineProps<{data: Item, showType?: 'vertical' | 'horizontal'}>(),
        {
          showType: 'vertical'
        }
    ),
    {t} = useI18n()

let damageMitigation = computed(() => {
      if (props.data && props.data.damageMitigation) {
        return Object.entries(props.data.damageMitigation)
      }
      return []
    }),
    armor = computed(() => {
      return props.data?.armor || 0
    })
</script>

<template>
  <template v-if="showType == 'vertical'">
    <v-text-field :value="armor"
                  v-if="armor"
                  readonly
                  hide-details
                  class="mb-4"
                  variant="underlined"
                  density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t(`assembly.tags.damageTypes.armor`) }}</p>
      </template>
      <template v-slot:append>
        <ItemSlotBase size="30px" :padding="0">
          <DamageIconWidget id="armor"></DamageIconWidget>
        </ItemSlotBase>
      </template>
    </v-text-field>
    <v-text-field :value="`${(dmValue * 100).toFixed(0)}%`"
                  v-for="([dmKey,dmValue]) in damageMitigation"
                  v-if="!dmValue"
                  :key="dmValue"
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

  <template v-else-if="showType == 'horizontal'">
    <v-row>
      <v-col cols="auto" class="pa-2">
        <v-card variant="text">
          <ItemSlotBase size="30px" :padding="0" class="bg-transparent">
            <DamageIconWidget id="armor" :is-border="false"></DamageIconWidget>
          </ItemSlotBase>

          <p class="text-no-wrap text-caption text-center">{{ armor }}</p>
        </v-card>
      </v-col>

      <v-divider vertical inset :thickness="2" opacity=".3" class="my-5"></v-divider>

      <template
          v-for="([dmKey,dmValue]) in damageMitigation"
          :key="dmValue">
        <v-col
            cols="auto"
            class="pa-2"
            v-if="dmValue !== 0">
          <v-card variant="text">
            <ItemSlotBase size="30px" :padding="0" class="bg-transparent">
              <DamageIconWidget :id="dmKey" :is-border="false"></DamageIconWidget>
            </ItemSlotBase>

            <p class="text-no-wrap text-caption text-center">{{ `${(dmValue * 100).toFixed(0)}%` }}</p>
          </v-card>
        </v-col>
      </template>
    </v-row>
  </template>
</template>

<style scoped lang="less">

</style>
