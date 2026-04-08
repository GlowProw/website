<script lang="ts">
export default {name: 'WarehouseShowWidget'}
</script>

<script setup lang="ts">
import {computed, onMounted, ref, toRaw, watch} from "vue";
import {WarehouseAttr} from "@/assets/types";

import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import AssemblyClassificationShowList from "@/components/AssemblyClassificationShowList.vue";
import {useI18n} from "vue-i18n";
import {useIconGlobalStyle} from "@/assets/sripts/useIconGlobalStyle";

import WarehouseDataProcessing from "@/assets/sripts/warehouse_data_processing";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import {Ship} from "glow-prow-data/src/entity/Ships";
import ShipName from "@/components/snbWidget/shipName.vue";

const props = withDefaults(defineProps<{
      readonly?: boolean,
      cargo?: any,
      ship?: Ship,
    }>(), {
      readonly: false,
      cargo: {}
    }),
    warehouseDataProcessing = new WarehouseDataProcessing()

let data = ref<{ id: number | null, count: number, timestamp?: number }[]>([]),
    maxSlot = ref(props.cargo.cargoSlots || 50),
    show = ref(false),
    selectIndex = ref(0),
    selectItemValue = ref<any>(null),
    wheelOptionalItemTags = ref(['consumable']),
    {t} = useI18n(),
    {useIconAdaptiveSize, useIconBoxMargin, useIconBoxPadding, useIconImageMargin, useIconImagePadding} = useIconGlobalStyle(),
    baseSize = 99,
    sizeRef = useIconAdaptiveSize(baseSize, 99),
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
    attr = ref<WarehouseAttr>({
      warehouseUseVersion: WarehouseDataProcessing.nowVersion
    }),
    useShip = computed(() => {
      return props?.ship?.id || null;
    }),
    // 已经使用的卡槽数量
    usedSlotCount = computed(() => {
      return Array.from(data.value).filter(i => i.id).length || 0
    }),
    // 是否空
    isEmpty = computed(() => {
      const warehouseSlotCount = maxSlot.value
      let szatistical = 0

      data.value.forEach(i => i.id == null ? szatistical++ : null)

      return szatistical == warehouseSlotCount
    })

watch(data, (newVal) => {
  // 重新赋值回 data.value，确保响应式更新
  if (newVal)
    newVal.sort((a, b) => {
      const aHasData = hasDataChecker(a)
      const bHasData = hasDataChecker(b)

      if (aHasData && !bHasData) return -1; // a在前
      if (!aHasData && bHasData) return 1;  // b在前

      // 如果两个都有数据，则根据时间戳排序，最新的在前面
      if (aHasData && bHasData) {
        return (a.timestamp || 0) - (b.timestamp || 0) // 升序排列
      }

      return 0; // 保持相对顺序
    })
}, {
  deep: true
})

onMounted(() => {
  data.value = Array.from({length: maxSlot.value}, () => {
    return {
      id: null,
      count: 0,
      timestamp: 0 // 初始化时间戳
    }
  })
})

const hasDataChecker = (d: any): boolean =>
    d.id !== null && d.id !== undefined;

/**
 * 插入物品
 * @param index
 */
const onInsertSlot = (index: number) => {
  const existingItemIndex = data.value.findIndex(item =>
      item && item.id === selectItemValue.value.id
  )

  if (existingItemIndex >= 0) {
    // 找到已存在的物品，增加数量
    const existingItem = data.value[existingItemIndex]
    existingItem.count += 1
    // 重新排序，将此物品移到最前面
    data.value.splice(existingItemIndex, 1)
    data.value.unshift({...existingItem, timestamp: Date.now()})
  } else {
    // 插入新物品
    data.value[index] = {
      id: selectItemValue.value.id,
      count: 1,
      timestamp: Date.now() // 记录当前时间戳
    }
  }

  show.value = false
}

/**
 * 显示面包
 * @param index
 */
const openShowPanel = (index) => {
  if (props.readonly)
    return;

  show.value = true;
  selectIndex.value = index
}

/**
 * 设置船仓属性
 * @param attrData
 */
const setSetting = (attrData: WarehouseAttr) => {
  if (!attrData) return {onLoad};

  attr.value = attrData

  return {onLoad}
}

/**
 * 导入
 */
const onLoad = (importDataRaw) => {
  const importData = toRaw(importDataRaw)

  if (!importData || importData.length <= 0)
    return;

  data.value = warehouseDataProcessing.import(importData, attr.value.warehouseUseVersion)
}

/**
 * 导出
 */
const onExport = () => {
  return warehouseDataProcessing.export(data.value)
}

/**
 * 验证
 */
const verify = () => {
  return warehouseDataProcessing.verify(data.value, attr.value.warehouseUseVersion)
}

defineExpose({
  onExport,
  onLoad,
  setSetting,
  verify,
  data: isEmpty ? null : data.value
})
</script>

<template>
  <v-row align="center">
    <v-col cols="auto" v-if="useShip" class="d-flex ga-2 align-center">
      <ItemSlotBase size="40px">
        <ShipIconWidget :id="useShip"></ShipIconWidget>
      </ItemSlotBase>
      <ShipName :id="useShip"></ShipName>
    </v-col>
    <v-col>
      <v-divider opacity=".2"></v-divider>
    </v-col>
    <v-col cols="auto">
      <template v-if="cargo.cargoMaxWeight">
        {{ cargo.cargoMaxWeight || 0 }}
      </template>
      <v-divider vertical class="mx-2"></v-divider>
      <template v-if="cargo.cargoSlots">
        {{ usedSlotCount }} / {{ cargo.cargoSlots }}
      </template>
      <v-icon class="ml-2" size="15" v-tooltip="t('warehouse.capacityImpact')">mdi-help</v-icon>
    </v-col>
  </v-row>
  <v-row align="center" justify="center" :style="`--grid-min-width: ${size}px`">
    <v-col cols="auto" v-for="(i, index) in data" :key="index">
      <v-card variant="text" :class="{'bg-amber': i && i.id}">
        <div @click="openShowPanel(index)">
          <ItemSlotBase :size="`${size}px`" class="d-flex justify-center align-center">
            <ItemIconWidget :id="String(i.id)" v-if="i && i.id" :padding="0" :margin="0"></ItemIconWidget>
            <v-icon size="35" v-else class="opacity-30">mdi-block-helper</v-icon>
            <v-icon size="35" v-if="!readonly && i && i.id">mdi-plus</v-icon>
          </ItemSlotBase>
        </div>

        <template v-if="!readonly">
          <v-number-input hide-details hide-spin-buttons variant="solo"
                          density="compact"
                          control-variant="split"
                          :readonly="readonly"
                          inset
                          tile
                          :min="1"
                          :max="999999"
                          :disabled="!i.id"
                          v-model="i.count">
            <template v-slot:increment="{props}">
              <v-btn density="compact" v-bind="props">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>
            <template v-slot:decrement="{props}">
              <v-btn density="compact" v-bind="props">
                <v-icon>mdi-minus</v-icon>
              </v-btn>
            </template>
          </v-number-input>
        </template>
        <template v-else-if="readonly && i && i.id">
          <div class="my-1 d-flex align-center justify-center">
            <ItemName :id="i.id"></ItemName> x {{ i.count || 0 }}
          </div>
        </template>
      </v-card>
    </v-col>
  </v-row>

  <v-container>
    <v-dialog v-model="show" max-width="1024">
      <v-card>
        <v-card-title>
          {{ t('warehouse.insertItem') }}
        </v-card-title>
        <AssemblyClassificationShowList :tags="wheelOptionalItemTags" v-model="selectItemValue"></AssemblyClassificationShowList>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="onInsertSlot(selectIndex)">{{ t('basic.button.submit') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped lang="less">
:root {
  --v-input-control-height: 20px;
  --v-field-padding-start: 0px;
  --v-field-padding-end: 0px;
}
</style>
