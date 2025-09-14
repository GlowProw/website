<script setup lang="ts">
import {computed, onMounted, ref, toRaw, watch} from "vue";
import {WarehouseAttr} from "@/assets/types";

import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import AssemblyClassificationShowList from "@/components/AssemblyClassificationShowList.vue";

import WarehouseDataProcessing from "@/assets/sripts/warehouse_data_processing";

const props = withDefaults(defineProps<{
      readonly?: boolean,
      cargo?: any,
    }>(), {
      readonly: false,
      cargo: {}
    }),
    warehouseDataProcessing = new WarehouseDataProcessing()

let data = ref<{ id: number | null, count: number, timestamp?: number }[]>([]),
    maxSlot = ref(props.cargo.cargoSlots || 50),
    show = ref(false),
    selectIndex = ref(0),
    selectItemValue = ref(null),
    wheelOptionalItemTags = ref(['consumable']),
    // 属性
    attr = ref({
      warehouseUseVersion: WarehouseDataProcessing.nowVersion
    }),
    // 已经使用的卡槽数量
    usedSlotCount = computed(() => {
      return Array.from(data.value).filter(i => i.id).length || 0
    }),
    // 是否空
    isEmpty = computed(() => {
      const warehouseSlotCount = maxSlot.value
      let szatistical = 0

      wheelTabs.value.forEach(i => i == null ? szatistical++ : null)

      return szatistical == warehouseSlotCount
    })

watch(props.slotCount, (value) => {
  maxSlot.value = value
})

watch(data.value, (data) => {
  // 重新赋值回 data.value，确保响应式更新
  if (data.value)
    data.value = data.sort((a, b) => {
      const aHasData = hasDataChecker(a);
      const bHasData = hasDataChecker(b);

      if (aHasData && !bHasData) return -1; // a在前
      if (!aHasData && bHasData) return 1;  // b在前

      // 如果两个都有数据，则根据时间戳排序，最新的在前面
      if (aHasData && bHasData) {
        return (a.timestamp || 0) - (b.timestamp || 0); // 升序排列
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

const hasDataChecker = (d): boolean =>
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
    data.value.splice(existingItemIndex, 1);
    data.value.unshift({...existingItem, timestamp: Date.now()});
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

  data.value = warehouseDataProcessing.import(importData, attr.value.assemblyUseVersion)
}

/**
 * 导出
 */
const onExport = () => {
  return warehouseDataProcessing.export(data.value, attr.value.assemblyUseVersion)
}

/**
 * 验证
 */
const verify = () => {
  return warehouseDataProcessing.verify(data.value, attr.value.assemblyUseVersion)
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
    <v-spacer></v-spacer>
    <v-col cols="auto">
      <template v-if="cargo.cargoMaxWeight">
        {{ cargo.cargoMaxWeight || 0 }}
      </template>
      <v-divider vertical class="mx-2"></v-divider>
      <template v-if="cargo.cargoSlots">
        {{ usedSlotCount }} / {{ cargo.cargoSlots }}
      </template>
      <v-icon class="ml-2" size="15" v-tooltip="'仓库的容量由所选船只或升级部件来影响'">mdi-help</v-icon>
    </v-col>
  </v-row>
  <v-row align="center" justify="center">
    <v-col cols="auto" v-for="(i, index) in data" :key="index">
      <v-card width="100">
        <div @click="openShowPanel(index)">
          <ItemSlotBase size="100px" class="w-100 d-flex justify-center align-center">
            <ItemIconWidget :id="i.id" v-if="i && i.id"></ItemIconWidget>
            <v-icon size="35" v-else>mdi-plus</v-icon>
          </ItemSlotBase>
        </div>
        <v-number-input hide-details hide-spin-buttons variant="solo"
                        density="compact"
                        control-variant="split"
                        :hide-details="readonly"
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
        <v-divider></v-divider>
      </v-card>
      <div class="w-100 singe-line mt-1" align="center" no-gutters>
        <ItemName :id="i && i.id"></ItemName>
      </div>
    </v-col>
  </v-row>

  <v-container>
    <v-dialog v-model="show" max-width="1024">
      <v-card>
        <v-card-title>
          插入物品
        </v-card-title>
        <AssemblyClassificationShowList :tags="wheelOptionalItemTags" v-model="selectItemValue"></AssemblyClassificationShowList>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="onInsertSlot(selectIndex)">确认</v-btn>
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
