<script setup lang="ts">

import type {Ship} from "glow-prow-data/src/entity/Ships.ts";
import {onMounted, ref, watch} from "vue";

let simulationValue = ref(1),
    simulationArray = ref([]);

const props = defineProps<{ data: Ship }>()

watch(() => props.data, (value) => {
  simulationArray.value = Object.values(value.sailSpeed);
})

onMounted(() => {
  // console.log(this.data.sailSpeed)
  //
})

// 分段
const ticks = () => {
  return this.data.sailSpeed
}
</script>

<template>
  <div v-if="data.sailSpeed" class="pt-3">
    <v-card class="pa-5 card-flavor" variant="text">
      <p class="text-center text-h4 mb-3 ">
        <span :class="[
          simulationValue  >= simulationArray.length - 1 ? 'text-green' : '',
          simulationValue  <= 0 ? 'text-red' : ''
        ]"> {{ simulationArray[simulationValue] || 0 }}</span>
        <span class="opacity-50 text-md-h6 ml-2">kts</span>
      </p>
      <v-slider
          :max="simulationArray.length - 1"
          :ticks="ticks"
          v-model="simulationValue"
          show-ticks="always"
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
        <p class="text-no-wrap">最低</p>
      </template>
    </v-text-field>
    <v-text-field :value="data.sailSpeed.fullSail" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">全速</p>
      </template>
    </v-text-field>
    <v-text-field :value="data.sailSpeed.fullSail" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">极限</p>
      </template>
    </v-text-field>
  </div>
</template>

<style scoped lang="less">

</style>
