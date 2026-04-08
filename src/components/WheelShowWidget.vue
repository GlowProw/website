<script lang="ts">
export default { name: 'WheelShowWidget' }
</script>

<script setup lang="ts">

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {computed, onMounted, ref, toRaw} from "vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import AssemblyClassificationShowList from "@/components/AssemblyClassificationShowList.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import RhombusWidget from "@/components/snbWidget/rhombusWidget.vue";
import WheelDataProcessing from "@/assets/sripts/wheel_data_processing";
import {WheelAttr} from "@/assets/types";
import {useI18n} from "vue-i18n";
import { useIconGlobalStyle } from "@/assets/sripts/useIconGlobalStyle";

const props = withDefaults(defineProps<{
      readonly?: boolean,
    }>(), {
      readonly: false,
    }),
    wheelDataProcessing = new WheelDataProcessing()

let show = ref(false),
    wheelTabValue = ref(0),
    wheelTabs = ref<any[]>([]),

    wheelCount = 3,
    wheelSlotMax = 8,
    rotation = ref(0),
    selectWheelIndex = ref(0),
    selectWheelValue = ref<any>(null),
    wheelOptionalItemTags = ref(['consumable']),
    {t} = useI18n(),
    { useIconAdaptiveSize, useIconBoxMargin, useIconBoxPadding, useIconImageMargin, useIconImagePadding } = useIconGlobalStyle(),
    baseSize = 90,
    sizeRef = useIconAdaptiveSize(baseSize, 90),
    computedOuterPadding = useIconBoxPadding(1),
    computedOuterMargin = useIconBoxMargin(1),
    computedInnerPadding = useIconImagePadding(0),
    computedInnerMargin = useIconImageMargin(1),

    size = computed(() => {
        let coreSize = parseInt(String(sizeRef.value)) || baseSize;
        const outerPad = (computedOuterPadding.value as number) * 8;
        const outerMar = (computedOuterMargin.value as number) * 8;
        const innerPad = (computedInnerPadding.value as number) * 8;
        const innerMar = (computedInnerMargin.value as number) * 8;
        return coreSize + outerPad + outerMar + innerPad + innerMar;
    }),

    // 属性
    attr = ref<WheelAttr>({
      wheelUseVersion: WheelDataProcessing.nowVersion
    }),
    // 是否空
    isEmpty = computed(() => {
      const wheelSlotCount = wheelCount * wheelSlotMax
      let szatistical = 0

      wheelTabs.value.forEach(i => i.data.forEach(j => j == null ? szatistical++ : null))

      return szatistical == wheelSlotCount
    })

onMounted(() => {
  wheelTabs.value = Array.from({length: wheelCount}, () => {
    return {
      data: Array.from({length: wheelSlotMax}, () => null)
    }
  })
})

/**
 * 添加
 */
const onAddItem = (index) => {
  selectWheelIndex.value = index
  show.value = true
}

/**
 * 插入物品
 */
const onInsertSlot = () => {
  const currentTabData = wheelTabs.value[wheelTabValue.value].data

  const existingIndex = currentTabData.findIndex(item =>
      item && item.id === selectWheelValue.value.id
  )

  if (existingIndex >= 0) {
    currentTabData.splice(existingIndex, 1, null)
  }

  currentTabData[selectWheelIndex.value] = selectWheelValue.value
  show.value = false
}

/**
 * 删除卡槽内容
 * @param index
 */
const onSlotRemove = (index: number) => {
  wheelTabs.value[wheelTabValue.value].data[index] = null
}

/**
 * 切换上一个轮盘
 */
const prev = () => {
  if (wheelTabValue.value <= 0) {
    return wheelTabValue.value = 2
  }

  wheelTabValue.value -= 1
}

/**
 * 切换下一个轮盘
 */
const next = () => {
  if (wheelTabValue.value >= 2) {
    return wheelTabValue.value = 0
  }

  wheelTabValue.value += 1
}

/**
 * 设置轮盘属性
 * @param attrData
 */
const setSetting = (attrData: WheelAttr) => {
  if (!attrData) return {onLoad};

  attr.value = attrData

  return {onLoad}
}

/**
 * 导入
 * @param importData
 */
const onLoad = (importDataRaw) => {
  const importData = toRaw(importDataRaw)

  if (!importData || Object.keys(importData).length <= 0)
    return;

  wheelTabs.value = wheelDataProcessing.import(toRaw(importData), attr.value.wheelUseVersion)
}

/**
 * 导出
 */
const onExport = () => {
  return wheelDataProcessing.export(toRaw(wheelTabs.value))
}

/**
 * 验证
 */
const verify = () => {
  return wheelDataProcessing.verify(toRaw(wheelTabs.value), attr.value.wheelUseVersion)
}

defineExpose({
  onExport,
  onLoad,
  setSetting,
  verify,
  data: isEmpty ? null : wheelTabs.value
})
</script>

<template>
  <div class="position-relative mt-3">
    <div class="wheel-controller">
      <v-row align="center" justify="center">
        <v-col cols="auto">
          <btn-widget keyboard-shortcut="q" size="40" class="my-2" @action-complete="prev" @click="prev"></btn-widget>
        </v-col>
        <v-col class="d-flex justify-center">
          <div class="d-flex ga-1 align-center">
            <RhombusWidget :activate="tabIndex == wheelTabValue"
                           :solid="tabIndex == wheelTabValue"
                           v-for="(tab, tabIndex) in wheelTabs"
                           :key="tabIndex"
                           @click="wheelTabValue = tabIndex"></RhombusWidget>
          </div>
        </v-col>
        <v-col cols="auto">
          <btn-widget keyboard-shortcut="e" size="40" class="my-2" @action-complete="next" @click="next"></btn-widget>
        </v-col>
      </v-row>
    </div>

    <v-tabs-window v-model="wheelTabValue" class="wheel-padding-box">
      <v-tabs-window-item :value="tabIndex" v-for="(tab, tabIndex) in wheelTabs" :key="tabIndex">
        <div class="wheel-box">
          <div class="wheel" :style="{ transform: `rotate(${rotation}deg)`, '--slot-size': `${size}px` }">
            <template v-for="(i,index) in tab.data" :key="index">

              <!-- 1 -->
              <v-badge :color="`rgb(57 57 57)`" :location="'bottom center'" class="slot bg-amber" v-if="(index + 1) % 2">
                <v-card border
                        class="rounded-circle position-relative"
                        :disabled="readonly">
                  <ItemSlotBase :size="`${baseSize}px`"
                                :padding="0"
                                @click=" readonly ? null :onAddItem(index)"
                                v-if="!wheelTabs[wheelTabValue].data[index]?.id"
                                class="overflow-hidden d-flex justify-center align-center">
                    <v-icon size="40">
                      {{ !readonly ? 'mdi-plus' : 'mdi-close' }}
                    </v-icon>
                  </ItemSlotBase>

                  <v-hover v-slot="{ isHovering, props }"
                           v-else-if="wheelTabs[wheelTabValue].data[index]?.id">
                    <v-card v-bind="props">
                      <ItemSlotBase :size="`${baseSize}px`" :padding="0"
                                    class="overflow-hidden d-flex justify-center align-center">
                        <ItemIconWidget :padding="0"
                                        :margin="0"
                                        :is-open-detail="readonly"
                                        :is-show-tooltip="readonly"
                                        :id="wheelTabs[wheelTabValue].data[index].id"></ItemIconWidget>
                      </ItemSlotBase>

                      <v-overlay
                          v-if="!readonly"
                          :model-value="!!isHovering"
                          class="align-center justify-center"
                          scrim="#000"
                          @click="onSlotRemove(index)"
                          contained>
                        <v-icon icon="mdi-delete" color="red" size="50"></v-icon>
                      </v-overlay>
                    </v-card>
                  </v-hover>
                </v-card>
                <template v-slot:badge>
                  {{ Math.ceil(index / 2) + 1 }}
                </template>
              </v-badge>

              <!-- 2 -->
              <div class="slot bg-amber" v-else>
                <v-card border
                        class="rounded-circle position-relative">
                  <ItemSlotBase :size="`${baseSize}px`"
                                @click="readonly ? null :onAddItem(index)"
                                v-if="wheelTabs[wheelTabValue].data[index] == null"
                                :padding="0"
                                class="rounded-circle d-flex justify-center align-center">
                    <v-icon size="40" class="opacity-60">
                      {{ !readonly ? 'mdi-plus' : 'mdi-close' }}
                    </v-icon>
                  </ItemSlotBase>


                  <v-hover v-slot="{ isHovering, props }"
                           v-else-if="wheelTabs[wheelTabValue].data[index] != null">
                    <div v-bind="props">
                      <ItemSlotBase :size="`${baseSize}px`"
                                    :padding="0"
                                    class="rounded-circle d-flex justify-center align-center">
                        <ItemIconWidget :padding="0"
                                        :margin="0"
                                        :is-open-detail="readonly"
                                        :is-show-tooltip="readonly"
                                        :id="wheelTabs[wheelTabValue].data[index].id"></ItemIconWidget>
                      </ItemSlotBase>

                      <v-overlay
                          v-if="!readonly"
                          :model-value="!!isHovering"
                          class="align-center justify-center"
                          scrim="#000"
                          @click="onSlotRemove(index)"
                          contained>
                        <v-icon icon="mdi-delete" color="red" size="50"></v-icon>
                      </v-overlay>
                    </div>
                  </v-hover>
                </v-card>
              </div>
            </template>
          </div>
        </div>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>

  <v-container>
    <v-dialog v-model="show" max-width="1024">
      <v-card>
        <v-card-title>
          {{ t('wheel.insertItem') }}
        </v-card-title>
        <AssemblyClassificationShowList :tags="wheelOptionalItemTags" v-model="selectWheelValue"></AssemblyClassificationShowList>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="onInsertSlot">{{ t('basic.button.submit') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped lang="less">
.wheel-controller {
  width: 700px;
  position: absolute;
  top: calc(50% - 45px);
  left: calc(50% - 700px);
  transform: translateX(50%) translateY(50%);
}

.wheel-padding-box {
  width: 525px;
  height: 530px;
  margin: 0 auto;
}

.wheel-box {
  width: 500px;
  height: 500px;
  margin: 11px auto;
}

.wheel {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transform: rotate(0deg);
  transition: transform 2.5s cubic-bezier(0.45, 0.05, 0.55, 0.95);
}

.slot {
  position: absolute;
  width: var(--slot-size, 90px);
  height: var(--slot-size, 90px);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.slot:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* 定位8个卡槽 */
.slot:nth-child(1) { /* 上 */
  top: 0;
  left: 50%;
  transform: translateX(-50%) translateY(-10px);
}

.slot:nth-child(2) { /* 右上 */
  top: 10%;
  right: 10%;
}

.slot:nth-child(3) { /* 右 */
  top: 50%;
  right: 0;
  transform: translateY(-50%) translateX(10px);
}

.slot:nth-child(4) { /* 右下 */
  bottom: 10%;
  right: 10%;
}

.slot:nth-child(5) { /* 下 */
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
}

.slot:nth-child(6) { /* 左下 */
  bottom: 10%;
  left: 10%;
}

.slot:nth-child(7) { /* 左 */
  top: 50%;
  left: 0;
  transform: translateY(-50%) translateX(-10px);
}

.slot:nth-child(8) { /* 左上 */
  top: 10%;
  left: 10%;
}

@media (max-width: 600px) {
  .wheel-container {
    width: 350px;
    height: 350px;
  }
}
</style>
