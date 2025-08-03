<script setup lang="ts">

import ShipTopDownPerspectiveSlotWidget from "./shipTopDownPerspectiveSlotWidget.vue";

const props = withDefaults(defineProps<{
  size?: string,
  left?: boolean,
  right?: boolean,
  centerTop?: boolean,
  centerCenter?: boolean,
  centerDown?: boolean
}>(), {
  size: 'lg',
  left: false,
  right: false,
  centerTop: false,
  centerCenter: false,
  centerDown: false,
})
</script>

<template>
  <div class="ship-perspective" :class="size">
    <svg xmlns="http://www.w3.org/2000/svg">
      <g>
        <path stroke="#fff"
              stroke-width="1"
              fill="transparent"
              d="m20.1512,5.7324c2.67678,0.02591 14.41866,18.33687 14.41866,28.83733c0,10.50045 -7.82781,28.74853 -8.79539,28.78684c-0.96758,0.03831 -2.01861,0.05048 -5.62328,0.05048l-5.53765,0.03626c-0.87434,-0.00194 -8.88101,-18.20216 -8.88101,-28.87358c0,-10.67142 11.74188,-28.86323 14.41866,-28.83733l0,-0.00001z"/>
      </g>
    </svg>

    <v-row no-gutters align="center" justify="center" class="slot-box">
      <v-col align="center">
        <ShipTopDownPerspectiveSlotWidget class="slot slot-left" :activate="props.left"></ShipTopDownPerspectiveSlotWidget>
      </v-col>
      <v-col align="center">
        <ShipTopDownPerspectiveSlotWidget class="slot slot-center-top mb-1" :activate="props.centerTop"></ShipTopDownPerspectiveSlotWidget>
        <ShipTopDownPerspectiveSlotWidget class="slot slot-center-center mb-1" :activate="props.centerCenter"></ShipTopDownPerspectiveSlotWidget>
        <ShipTopDownPerspectiveSlotWidget class="slot slot-center-down" :activate="props.centerDown"></ShipTopDownPerspectiveSlotWidget>
      </v-col>
      <v-col align="center">
        <ShipTopDownPerspectiveSlotWidget class="slot slot-right" :activate="props.right"></ShipTopDownPerspectiveSlotWidget>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">
.ship-perspective {
  user-select: none;
  pointer-events: none;
  width: 45px;
  height: 80px;
  position: relative;
  padding: 2px;

  &.lg {
    transform: scale(1);
  }
  &.sm {
    transform: scale(.7);
  }

  .slot {

  }

  .slot-box {
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
</style>
