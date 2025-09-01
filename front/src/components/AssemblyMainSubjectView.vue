<script setup lang="ts">
import {assemblyViewConfig} from "@/assets/sripts/index";
import ZoomableCanvas from "@/components/ZoomableCanvas.vue";
import WarehouseShowWidget from "@/components/WarehouseShowWidget.vue";
import WheelWidget from "@/components/WheelShowWidget.vue";
import AssemblyWidget from "@/components/AssemblyWidget.vue"; // 确保导入了正确的组件
import {computed, nextTick, onMounted, ref, toRaw} from "vue";
import {useDisplay} from "vuetify/framework";
import {useI18n} from "vue-i18n";
import {Ships} from "glow-prow-data";

const props = withDefaults(defineProps<{
  assemblyBackground?: string,
  isWorkshopFillScreen?: boolean,
  isShowFooterTool?: boolean,
  modelValue?: any,
  class?: string,
  readonly?: boolean,
  perfectDisplay?: boolean
}>(), {
  assemblyBackground: '',
  isWorkshopFillScreen: false,
  isShowFooterTool: false,
  modelValue: null,
  class: '',
  readonly: true,
  perfectDisplay: false,
});

const {mobile} = useDisplay();
const {t} = useI18n();
const emit = defineEmits(['update:tab', 'ready']);

const zoomableAreaRef = ref(null);
const assemblyWorkshopRef = ref(null);
const wheelWorkshopRef = ref(null);
const warehouseWorkshopRef = ref(null);

const workshopHeight = ref(700);
const tab = ref(assemblyViewConfig.onlyRead[0]);
const refs = ref({
  zoomableAreaRef: null,
  assembly: null,
  wheel: null,
  warehouse: null
});

const isWorkshopFillScreen = ref(props.isWorkshopFillScreen);

const hasShip = computed(() => {
  return assemblyWorkshopRef.value?.onExport() == null;
});
const shipDetailInfo = computed(() => {
  const ship = assemblyWorkshopRef.value?.onExport()?.shipSlot?.id
  return Ships[ship]
})

onMounted(() => {
  nextTick(() => {
    refs.value = {
      zoomableAreaRef: zoomableAreaRef.value,
      assembly: assemblyWorkshopRef.value,
      wheel: wheelWorkshopRef.value,
      warehouse: warehouseWorkshopRef.value
    };

    emit('ready', refs)
  });
});

defineExpose({
  refs,
  tab
});

/**
 * 重制画布位置
 */
const onWorkshopRestorePosition = () => {
  if (zoomableAreaRef.value) {
    zoomableAreaRef.value.centerCanvas();
  }
};

const onWorkshopFullScreen = () => {
  isWorkshopFillScreen.value = !isWorkshopFillScreen.value;
};

const onWorkshopDelete = () => {
  if (assemblyWorkshopRef.value) {
    assemblyWorkshopRef.value.onErasure();
  }
};

/**
 * 切换附件事件
 */
const onTabs = () => {
  if (props.readonly)
    onWorkshopRestorePosition()

  emit('update:tab', tab.value)
}

/**
 * 检查widget内部数据
 */
const hasData = (name: string): boolean => {
  if (!props.modelValue)
    return false

  const modelValue = toRaw(props.modelValue[name].data);
  if (modelValue == null || modelValue.length > 0 || Object.keys(modelValue).length > 0) {
    return false;
  }
  return true;
};
</script>

<template>
  <v-card class="card-enlargement-flavor mt-n3 mb-5 ml-n10 mr-n10"
          :class="[isWorkshopFillScreen ? 'fill-screen bg-black' : 'position-relative mb-n2', props.class]">
    <v-tabs
        v-model="tab"
        @update:model-value="onTabs"
        align-tabs="center">
      <v-tab :value="i"
             v-for="(i,index) in assemblyViewConfig.onlyRead"
             :disabled="i === 'warehouse' && hasShip || hasData(i)"
             :key="index">{{ t(`assembly.additions.${i}`) }}
      </v-tab>
    </v-tabs>
    <v-divider opacity=".08"></v-divider>

    <ZoomableCanvas
        ref="zoomableAreaRef"
        :style="isWorkshopFillScreen ? 'height: calc(100vh - 50px)' : `height: ${mobile ? 300 : workshopHeight}px`"
        :min-scale="mobile ? .1 : .8"
        :max-scale="1.4"
        :default-scale="mobile ? .4 : 1"
        :is-show-tool="tab == 'assembly'"
        :boundary="mobile ? {
                left: -100,
                right: 100,
                top: -100,
                bottom: 100
              } : {
                left: -1500,
                right: 1500,
                top: -500,
                bottom: 500
              }">
      <div class="mb-5 ml-n10 mr-n10">
        <div v-show="tab === 'assembly'">
          <AssemblyWidget ref="assemblyWorkshopRef" :readonly="readonly" :perfect-display="perfectDisplay">
            <template v-slot:image v-if="assemblyBackground">
              <v-img cover class="pointer-events-none" :src="assemblyBackground"></v-img>
            </template>
          </AssemblyWidget>
        </div>
        <div v-show="tab === 'wheel'">
          <WheelWidget ref="wheelWorkshopRef" :readonly="readonly"></WheelWidget>
        </div>
        <div v-show="tab === 'warehouse'">
          <WarehouseShowWidget ref="warehouseWorkshopRef"
                               :cargo="shipDetailInfo?.cargo"
                               :readonly="readonly"></WarehouseShowWidget>
        </div>
      </div>
    </ZoomableCanvas>
  </v-card>

  <div v-if="isShowFooterTool"
       class="position-fixed left-0 bottom-0 right-0" style="z-index: 11">
    <v-container class="d-flex justify-center">
      <v-card border class="d-inline-flex mx-auto py-1 px-3">
        <v-row justify="center" align="center">
          <v-col cols="auto" class="d-flex ga-2">
            <v-btn density="comfortable"
                   @click="onWorkshopRestorePosition"
                   icon="mdi-restore"></v-btn>
            <v-btn @click="workshopHeight <= 1000 ? workshopHeight += 100 : null"
                   density="comfortable" icon>
              <v-icon icon="mdi-arrow-expand-vertical"></v-icon>
            </v-btn>
            <v-btn density="comfortable"
                   class="ml-1 mr-1"
                   @click="onWorkshopFullScreen"
                   :icon="`mdi-${!isWorkshopFillScreen ? 'fullscreen' : 'fullscreen-exit'}`"></v-btn>
            <v-btn @click="workshopHeight >= 400 ? workshopHeight -= 100 : null"
                   density="comfortable" icon>
              <v-icon icon="mdi-arrow-collapse-vertical"></v-icon>
            </v-btn>
            <v-btn density="comfortable"
                   @click="onWorkshopDelete"
                   class="ml-3"
                   icon="mdi-delete"></v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped lang="less">
.fill-screen {
  position: fixed;
  z-index: 10;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
}
</style>
