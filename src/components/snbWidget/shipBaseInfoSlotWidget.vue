<script setup lang="ts">

import ShipSailSpeedWidget from "@/components/snbWidget/shipSailSpeedWidget.vue";
import {Ship} from "glow-prow-data";
import {useI18n} from "vue-i18n";

const props = withDefaults(defineProps<{ data: Ship, isSimulationShipSailSpeed?: boolean }>(), {
      data: null,
      isSimulationShipSailSpeed: true,
    }),
    {t} = useI18n()

</script>

<template>
  <template v-if="data">
    <v-text-field :value="data.hitPoints" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t('codex.ship.hitPoints') }}</p>
      </template>
    </v-text-field>

    <v-text-field :value="data.stamina" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t('codex.ship.stamina') }}</p>
      </template>
    </v-text-field>

    <v-text-field :value="data.braceStrength" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t('codex.ship.braceStrength') }}</p>
      </template>
    </v-text-field>

    <p class="mt-4"><b>{{ t('codex.ship.sailSpeed.title') }}{{ t('codex.ship.sailSpeed.knot') }}</b></p>
    <ShipSailSpeedWidget :data="data" :isSimulationShipSailSpeed="isSimulationShipSailSpeed"></ShipSailSpeedWidget>

    <p class="mt-4"><b>{{ t('codex.ship.cargo') }}</b></p>
    <v-text-field :value="data.cargo.cargoSlots" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t('codex.ship.cargoSlots') }}</p>
      </template>
    </v-text-field>
    <v-text-field :value="data.cargo.cargoMaxWeight" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t('codex.ship.cargoMaxWeight') }}</p>
      </template>
    </v-text-field>
  </template>
</template>

<style scoped lang="less">

</style>
