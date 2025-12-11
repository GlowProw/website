<script setup lang="ts">
import type {Ship} from "glow-prow-data/src/entity/Ships.ts";
import {computed, onUnmounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import WindFlowsWidget from "@/components/WindFlowsWidget.vue"
import RhombusWidget from "@/components/snbWidget/rhombusWidget.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemName from "@/components/snbWidget/itemName.vue";

const props = withDefaults(defineProps<{ data: Ship, isSimulationShipSailSpeed?: boolean }>(), {
      data: null,
      isSimulationShipSailSpeed: true,
    }),
    {t} = useI18n()

let simulationValue = ref(1),
    simulationArray = ref([]),

    // 添加状态管理
    speedBoost = ref(0),        // 当前速度提升百分比
    boostTimer = ref(null),     // 提升效果计时器
    remainingTime = ref(0),     // 剩余时间（秒）
    countdownInterval = ref(null), // 倒计时计时器
    currentBoostType = ref(''), // 当前生效的道具类型
    strongBreeze = ref(false);  // 强风状态


const
    // 计算强风带来的百分比提升
    strongBreezeBoost = computed(() => {
      return strongBreeze.value ? 50 : 0;
    }),
    // 总速度提升计算
    totalSpeedBoost = computed(() => {
      return speedBoost.value + strongBreezeBoost.value;
    }),
    // 应用提升后的速度数组
    boostedSpeedArray = computed(() => {
      if (totalSpeedBoost.value === 0) return simulationArray.value;

      return simulationArray.value.map(speed => {
        return speed * (1 + totalSpeedBoost.value / 100);
      });
    }),
    // 当前显示的速度（应用提升后）
    currentDisplaySpeed = computed(() => {
      const baseSpeed = simulationArray.value[simulationValue.value] || 0;
      return (baseSpeed * (1 + totalSpeedBoost.value / 100)).toFixed(0);
    }),
    // 格式化剩余时间显示
    formattedRemainingTime = computed(() => {
      const minutes = Math.floor(remainingTime.value / 60);
      const seconds = remainingTime.value % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    });

watch(() => props.data, (value) => {
  simulationArray.value = Object.values(value.sailSpeed);
}, {immediate: true})

onUnmounted(() => {
  clearAllTimers();
});

/**
 * 清理所有计时器
 */
const clearAllTimers = () => {
  if (boostTimer.value) {
    clearTimeout(boostTimer.value);
    boostTimer.value = null;
  }
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
}

/**
 * 航速分段
 */
const ticks = computed(() => {
  return Object.keys(props.data.sailSpeed) || []
})

/**
 * 应用速度提升
 * @param boostPercent
 * @param duration
 * @param boostType
 */
const applySpeedBoost = (boostPercent: number, duration: number, boostType: string) => {
  // 清除之前的计时器
  clearAllTimers();

  // 应用新的提升
  speedBoost.value = boostPercent;
  remainingTime.value = duration;
  currentBoostType.value = boostType;

  // 设置倒计时
  countdownInterval.value = setInterval(() => {
    remainingTime.value--;
    if (remainingTime.value <= 0) {
      clearAllTimers();
      speedBoost.value = 0;
      currentBoostType.value = '';
    }
  }, 1000);

  // 设置总时长定时器（备用）
  boostTimer.value = setTimeout(() => {
    clearAllTimers();
    speedBoost.value = 0;
    currentBoostType.value = '';
  }, duration * 1000);
}

/**
 * 终止当前效果
 */
const cancelBoostEffect = () => {
  clearAllTimers();
  speedBoost.value = 0;
  remainingTime.value = 0;
  currentBoostType.value = '';
}

/**
 * waterFlask 加成处理
 */
const onWaterFlaskClick = () => {
  applySpeedBoost(10, 20, 'waterFlask');
}

/**
 * waterBarrel 加成处理
 */
const onWaterBarrelClick = () => {
  applySpeedBoost(15, 20, 'waterBarrel');
}
</script>

<template>
  <div v-if="data" class="pt-3">
    <v-card v-if="isSimulationShipSailSpeed" class="mx-n1 card-enlargement-flavor" variant="text">
      <!-- 速度提升状态显示 S -->
      <v-alert v-if="totalSpeedBoost > 0" density="compact" class="ma-3">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon :icon="strongBreeze ? 'mdi-weather-windy' : 'mdi-sail-boat'" class="mr-2"></v-icon>
            <span>
              {{ t('codex.ship.sailSpeed.boost.title', { percent: totalSpeedBoost.toFixed(1) }) }}
              <span v-if="speedBoost > 0">
                {{ boostDescription }}
              </span>
              <span v-if="strongBreeze">
                ({{ t('codex.ship.sailSpeed.boost.strongBreezeEffect') }})
              </span>
            </span>
          </div>
          <v-btn
              v-if="speedBoost > 0"
              @click="cancelBoostEffect"
              size="small"
              variant="text"
              color="error"
              icon
              :title="t('codex.ship.sailSpeed.boost.cancelEffect')">
            <v-icon>mdi-close-circle</v-icon>
          </v-btn>
        </div>
      </v-alert>
      <!-- 速度提升状态显示 E -->

      <div class="px-5">
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
                    :speed="1 + totalSpeedBoost / 100"
                    :opacity="strongBreeze ? 0.6 : 0.3"
                    :mid-point="3">
                </WindFlowsWidget>
              </div>
              <div class="h-100 text-center">
                <div class="text-center text-h4 mb-3 "
                     :class="[
                      simulationValue  >= simulationArray.length - 1 ? 'text-green' : '',
                      simulationValue  <= 0 ? 'text-red' : ''
                    ]"/>
                <div class="text-h4" :class="{ 'text-orange': strongBreeze }">
                  {{ currentDisplaySpeed }}
                </div>

                <p class="opacity-50 text-body-1 ml-2">
                  <v-icon icon="mdi-arrow-top-right-thick"></v-icon>
                  {{ t('codex.ship.sailSpeed.unit.knot') }}
                  <span v-if="totalSpeedBoost > 0" class="text-success text-caption">
                    (+{{ totalSpeedBoost.toFixed(1) }}%)
                    <span v-if="strongBreeze" class="text-orange">
                      ({{ t('codex.ship.sailSpeed.boost.strongBreeze') }})
                    </span>
                  </span>
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
      </div>

      <v-divider class="my-5"></v-divider>

      <v-row dense class="pb-3" justify="center">
        <v-col cols="auto">
          <v-btn
              @click="onWaterFlaskClick"
              :disabled="speedBoost > 0"
              :color="currentBoostType === 'waterFlask' ? '' : undefined"
              :title="t('codex.ship.sailSpeed.boost.waterFlaskTooltip')">
            <ItemSlotBase size="32px" :padding="0" class="mr-2">
              <ItemIconWidget :id="'waterFlask'" :is-show-tooltip="false" :is-open-detail="false"></ItemIconWidget>
            </ItemSlotBase>
            <ItemName id="waterFlask"></ItemName>
            <v-badge
                v-if="currentBoostType === 'waterFlask'"
                color="error"
                @click="cancelBoostEffect"
                :content="formattedRemainingTime"
                inline
                class="ml-2"
            ></v-badge>
          </v-btn>
        </v-col>
        <v-col cols="auto">
          <v-btn
              @click="onWaterBarrelClick"
              :disabled="speedBoost > 0"
              :color="currentBoostType === 'waterBarrel' ? '' : undefined"
              :title="t('codex.ship.sailSpeed.boost.waterBarrelTooltip')">
            <ItemSlotBase size="32px" :padding="0" class="mr-2">
              <ItemIconWidget :id="'waterBarrel'" :is-show-tooltip="false" :is-open-detail="false"></ItemIconWidget>
            </ItemSlotBase>
            <ItemName id="waterBarrel"></ItemName>
            <v-badge
                v-if="currentBoostType === 'waterBarrel'"
                color="error"
                @click="cancelBoostEffect"
                :content="formattedRemainingTime"
                inline
                class="ml-2"
            ></v-badge>
          </v-btn>
        </v-col>

        <v-col cols="12" class="d-flex justify-center">
          <v-checkbox
              v-model="strongBreeze"
              :label="t('codex.ship.sailSpeed.boost.strongBreeze')"
              density="compact"
              hide-details
              color="orange"
              :title="t('codex.ship.sailSpeed.boost.strongBreezeTooltip')"
          ></v-checkbox>
        </v-col>
      </v-row>
    </v-card>

    <!-- 速度 S -->
    <v-text-field :value="data.sailSpeed.halfSail" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t('codex.ship.sailSpeed.halfSail') }}</p>
      </template>
    </v-text-field>
    <v-text-field :value="data.sailSpeed.fullSail" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t('codex.ship.sailSpeed.fullSail') }}</p>
      </template>
    </v-text-field>
    <v-text-field :value="data.sailSpeed.travelSail" readonly
                  hide-details
                  variant="underlined" density="compact">
      <template v-slot:append-inner>
        <p class="text-no-wrap">{{ t('codex.ship.sailSpeed.travelSail') }}</p>
      </template>
    </v-text-field>
    <!-- 速度 E -->
  </div>
</template>

<style scoped lang="less">
.speed-dot {
  flex-direction: column-reverse;
  align-items: center;
}

.text-orange {
  color: #ff9800;
}

:deep(.v-badge__badge) {
  font-size: 0.7rem;
  min-width: 40px;
}
</style>
