<script setup lang="ts">
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import type {ItemCalcResult} from "@/assets/sripts/item_carc";
import {computeAssemblyCalcResult, normalizeAssemblyPayload} from "@/assets/sripts/assembly_calc";
import CalcResultTable from "@/components/CalcResultTable.vue";
import EmptyView from "@/components/EmptyView.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ShipName from "@/components/snbWidget/shipName.vue";

const props = withDefaults(defineProps<{
      assemblyData?: any,
      assemblyWorkshopRef?: any,
      readonly?: boolean,
      targetResult?: ItemCalcResult | null,
      isColOne?: boolean,
      isDisabledMoveTitle?: boolean
    }>(), {
      assemblyData: null,
      assemblyWorkshopRef: null,
      readonly: true,
      targetResult: null,
      isColOne: false,
      isDisabledMoveTitle: false,
    }),
    {t} = useI18n()

const internalData = ref<any>(null),
    settingAttr = ref<any>({})

/**
 * 取得当前生效的 assembly 数据
 */
const currentData = computed(() => {
  if (props.assemblyData) {
    return normalizeAssemblyPayload(props.assemblyData);
  }
  if (internalData.value) {
    return normalizeAssemblyPayload(internalData.value);
  }
  if (props.assemblyWorkshopRef) {
    const raw = props.assemblyWorkshopRef.value || props.assemblyWorkshopRef;
    if (raw?.workshopData?.data) return normalizeAssemblyPayload(raw.workshopData.data);
    if (raw?.workshopData?.value?.data) return normalizeAssemblyPayload(raw.workshopData.value.data);
    if (raw?.onExport) return normalizeAssemblyPayload(raw.onExport());
  }
  return null;
})

/**
 * 将 assembly 格式数据转换为 ItemCalcResult 计算结果
 */
const calcResult = computed<ItemCalcResult | null>(() => {
  return computeAssemblyCalcResult(currentData.value);
})

/**
 * 暴露方法与标准工作坊适配
 */
const onLoad = (data: any) => {
  internalData.value = data;
}

const setSetting = (setting: any) => {
  settingAttr.value = setting;
  return {onLoad};
}

defineExpose({
  onLoad,
  setSetting,
  calcResult,
  currentData
})

defineOptions({
  name: "AssemblyDataInfoResultWidget"
})
</script>

<template>
  <div class="assembly-data-info-result-widget">
    <template v-if="calcResult && calcResult.shipId">
      <v-row align="center">
        <v-col cols="auto" class="d-flex ga-2 align-center">
          <ItemSlotBase size="40px">
            <ShipIconWidget :id="calcResult.shipId"></ShipIconWidget>
          </ItemSlotBase>
          <ShipName :id="calcResult.shipId"></ShipName>
        </v-col>
        <v-col>
          <v-divider opacity=".2"></v-divider>
        </v-col>
      </v-row>

      <CalcResultTable :result="calcResult"
                       :target-result="props.targetResult"
                       :is-disabled-move-title="props.isDisabledMoveTitle"
                       :is-col-one="props.isColOne"/>
    </template>
    <template v-else>
      <v-card variant="text" border class="pa-10 text-center rounded-lg">
        <EmptyView>
          <template v-slot:title>
            {{ t('assembly.workshop.emptyShip') }}
          </template>
          <template v-slot:description>
            {{ t('assembly.workshop.emptyShipDesc') }}
          </template>
        </EmptyView>
      </v-card>
    </template>
  </div>
</template>

<style scoped lang="less">
.assembly-data-info-result-widget {
  width: 100%;
}
</style>
