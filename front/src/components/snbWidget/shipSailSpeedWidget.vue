<script setup lang="ts">
import type {Ship} from "glow-prow-data/src/entity/Ships.ts";
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import CountUp from "@/components/CountUp.vue";
import WindFlowsWidget from "@/components/WindFlowsWidget.vue"
import RhombusWidget from "@/components/snbWidget/rhombusWidget.vue";

let simulationValue = ref(1),
    simulationArray = ref([]);

const props = withDefaults(defineProps<{ data: Ship, isSimulationShipSailSpeed?: boolean }>(), {
      data: null,
      isSimulationShipSailSpeed: true,
    }),
    {t} = useI18n()

watch(() => props.data, (value) => {
  simulationArray.value = Object.values(value.sailSpeed);
})

/**
 * 航速分段
 */
const ticks = computed(() => {
  return Object.keys(props.data.sailSpeed) || []
})
</script>

<template>
  <div v-if="data" class="pt-3">
    <v-card v-if="isSimulationShipSailSpeed" class="pa-5 card-flavor" variant="text">
      <v-row class="mb-2 mt-2" align="center">
        <v-spacer></v-spacer>
        <div class="d-flex ml-n4 speed-dot">
          <div
              class="mb-1 mt-1"
              v-for="(i,index) in ticks"
              :key="i += index">
            <RhombusWidget
                :activateColor="ticks.length - 1 == index ? '#4CAF50' : 'rgba(242,242,242,0.76)'"
                :solid="index <= simulationValue"
                :activate="index <= simulationValue">
            </RhombusWidget>
          </div>
        </div>
        <v-col cols="auto">

          <v-progress-circular
              size="150"
              :color="{
                0: '#ff8484',
                1: '#f2f2f2',
                2: '#a6ffab'
              }[simulationValue || 0]"
              model-value="100">
            <div class="position-absolute">
              <WindFlowsWidget
                  style="transform: rotate(-45deg);width: calc(100% - 5px);"
                  :pathCount="4"
                  :speed="1"
                  :opacity=".3"
                  :mid-point="3">
              </WindFlowsWidget>
            </div>
            <div class="h-100 text-center">
              <CountUp
                  :from="0"
                  :to="simulationArray[simulationValue] || 0"
                  separator=","
                  direction="up"
                  class="text-center text-h4 mb-3 "
                  :duration=".5"
                  :delay="0"
                  :start-when="true"
                  :class="[
              simulationValue  >= simulationArray.length - 1 ? 'text-green' : '',
              simulationValue  <= 0 ? 'text-red' : ''
            ]"/>

              <p class="opacity-50 text-body-1 ml-2">
                <v-icon icon="mdi-arrow-top-right-thick"></v-icon>
                {{ t('displayCabinet.ship.sailSpeed.knot') }}
              </p>
            </div>
          </v-progress-circular>
        </v-col>
        <v-spacer></v-spacer>
      </v-row>

      <v-slider
          :max="simulationArray.length - 1"
          :ticks="ticks"
          v-model="simulationValue"
          hide-details
          step="1"
          tick-size="4">
        <template v-slot:prepend>
          <v-icon icon="mdi-weather-windy"></v-icon>
        </template>
        <template v-slot:append>
          <v-icon icon="mdi-weather-dust"></v-icon>
        </template>
      </v-slider>
    </v-card>

    <v-text-field :value="data.sailSpeed.halfSail" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t('displayCabinet.ship.sailSpeed.halfSail') }}</p>
      </template>
    </v-text-field>
    <v-text-field :value="data.sailSpeed.fullSail" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t('displayCabinet.ship.sailSpeed.fullSail') }}</p>
      </template>
    </v-text-field>
    <v-text-field :value="data.sailSpeed.travelSail" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t('displayCabinet.ship.sailSpeed.travelSail') }}</p>
      </template>
    </v-text-field>
  </div>
</template>

<style scoped lang="less">
.speed-dot {
  flex-direction: column-reverse;
  align-items: center;
}
</style>
