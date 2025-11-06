<script setup lang="ts">

import ShipTopDownPerspectiveWidget from "@/components/snbWidget/shipTopDownPerspectiveWidget.vue";
import {Ship} from "glow-prow-data";
import {useI18n} from "vue-i18n";

const props = withDefaults(defineProps<{ data: Ship }>(), {
      data: null
    }),
    {t} = useI18n()
</script>

<template>
  <template v-if="data">
    <template v-if="data.slots.frontWeapon">
      <v-row>
        <v-col cols="auto">
          <ShipTopDownPerspectiveWidget :centerTop="true"></ShipTopDownPerspectiveWidget>
        </v-col>
        <v-col>
          <p>
            <v-row align="center">
              <v-col><b>{{ t('codex.ship.frontWeapon') }}</b></v-col>
              <v-col cols>
                <v-divider></v-divider>
              </v-col>
              <v-col align="right">
                {{ data.slots.frontWeapon[0] }}
              </v-col>
            </v-row>
          </p>
          <v-text-field :value="data.slots.frontWeapon[1].top" readonly
                        hide-details
                        variant="underlined" density="compact">
            <template v-slot:append-inner>
              <p class="text-no-wrap">{{ t('codex.ship.topDeck') }}</p>
            </template>
          </v-text-field>
          <v-text-field :value="data.slots.frontWeapon[1].lower" readonly
                        hide-details
                        variant="underlined" density="compact">
            <template v-slot:append-inner>
              <p class="text-no-wrap">{{ t('codex.ship.lowerDeck') }}</p>
            </template>
          </v-text-field>
        </v-col>
      </v-row>
    </template>
    <template v-if="data.slots.leftSideWeapon">
      <v-row>
        <v-col cols="auto">
          <ShipTopDownPerspectiveWidget :left="true"></ShipTopDownPerspectiveWidget>
        </v-col>
        <v-col>
          <p>
            <v-row align="center">
              <v-col><b>{{ t('codex.ship.leftSideWeapon') }}</b></v-col>
              <v-col cols>
                <v-divider></v-divider>
              </v-col>
              <v-col align="right" v-if="data.slots.leftSideWeapon[0]">
                {{ data.slots.leftSideWeapon[0] }}
              </v-col>
            </v-row>
          </p>
          <v-text-field :value="data.slots.leftSideWeapon[1].top" readonly
                        hide-details
                        v-if="data.slots.leftSideWeapon[1].top"
                        variant="underlined" density="compact">
            <template v-slot:append-inner>
              <p class="text-no-wrap">{{ t('codex.ship.topDeck') }}</p>
            </template>
          </v-text-field>
          <v-text-field :value="data.slots.leftSideWeapon[1].lower" readonly
                        hide-details
                        v-if="data.slots.leftSideWeapon[1].lower"
                        variant="underlined" density="compact">
            <template v-slot:append-inner>
              <p class="text-no-wrap">{{ t('codex.ship.lowerDeck') }}</p>
            </template>
          </v-text-field>
        </v-col>
      </v-row>
    </template>
    <template v-if="data.slots.rightSideWeapon">
      <v-row>
        <v-col cols="auto">
          <ShipTopDownPerspectiveWidget :right="true"></ShipTopDownPerspectiveWidget>
        </v-col>
        <v-col>
          <p>
            <v-row align="center">
              <v-col><b>{{ t('codex.ship.rightSideWeapon') }}</b></v-col>
              <v-col cols>
                <v-divider></v-divider>
              </v-col>
              <v-col align="right" v-if="data.slots.rightSideWeapon[0]">
                {{ data.slots.rightSideWeapon[0] }}
              </v-col>
            </v-row>
          </p>
          <v-text-field :value="data.slots.rightSideWeapon[1].top" readonly
                        hide-details
                        v-if="data.slots.rightSideWeapon[1].top"
                        variant="underlined" density="compact">
            <template v-slot:append-inner>
              <p class="text-no-wrap">{{ t('codex.ship.topDeck') }}</p>
            </template>
          </v-text-field>
          <v-text-field :value="data.slots.rightSideWeapon[1].lower" readonly
                        hide-details
                        v-if="data.slots.rightSideWeapon[1].lower"
                        variant="underlined" density="compact">
            <template v-slot:append-inner>
              <p class="text-no-wrap">{{ t('codex.ship.lowerDeck') }}</p>
            </template>
          </v-text-field>
        </v-col>
      </v-row>
    </template>
    <template v-if="data.slots.aftWeapon">
      <v-row>
        <v-col cols="auto">
          <ShipTopDownPerspectiveWidget :centerDown="true"></ShipTopDownPerspectiveWidget>
        </v-col>
        <v-col>
          <p>
            <v-row align="center">
              <v-col><b>{{ t('codex.ship.aftWeapon') }}</b></v-col>
              <v-col cols>
                <v-divider></v-divider>
              </v-col>
              <v-col align="right" v-if="data.slots.aftWeapon[0]">
                {{ data.slots.aftWeapon[0] }}
              </v-col>
            </v-row>
          </p>
          <v-text-field :value="data.slots.aftWeapon[1].top" readonly
                        hide-details
                        v-if="data.slots.aftWeapon[1].top"
                        variant="underlined" density="compact">
            <template v-slot:append-inner>
              <p class="text-no-wrap">{{ t('codex.ship.topDeck') }}</p>
            </template>
          </v-text-field>
          <v-text-field :value="data.slots.aftWeapon[1].lower" readonly
                        hide-details
                        v-if="data.slots.aftWeapon[1].lower"
                        variant="underlined" density="compact">
            <template v-slot:append-inner>
              <p class="text-no-wrap">{{ t('codex.ship.lowerDeck') }}</p>
            </template>
          </v-text-field>
        </v-col>
      </v-row>
    </template>
    <template v-if="data.slots.auxiliaryWeapon">
      <v-row>
        <v-col cols="auto">
          <ShipTopDownPerspectiveWidget :center-center="true"></ShipTopDownPerspectiveWidget>
        </v-col>
        <v-col>
          <v-text-field :value="data.slots.auxiliaryWeapon[0]" readonly
                        hide-details
                        variant="underlined" density="compact">
            <template v-slot:append-inner>
              <p class="text-no-wrap">{{ t('codex.ship.auxiliaryWeapon') }}</p>
            </template>
          </v-text-field>
        </v-col>
      </v-row>
    </template>
  </template>
</template>

<style scoped lang="less">

</style>
