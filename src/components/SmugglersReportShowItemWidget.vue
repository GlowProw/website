<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {Commodities, Items, Materials} from "glow-prow-data";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";

const props = withDefaults(defineProps<{ data: any }>(), {
  data: {}
})

let processingData = ref({
  weekly: []
})

watch(() => props.data, () => {
  onProcessingData()
}, {deep: true})

onMounted(() => {
  onProcessingData()
})

/**
 * 处理数据
 */
const onProcessingData = () => {
  // 赛季
  // todo

  // 每周
  let newData = (props.data.weekly || []).map((i) => {
    const {id: key, ...o} = i
    let d = {...o}
    if (key in Items) d.data = Items[key as keyof typeof Items];
    if (key in Materials) d.data = Materials[key as keyof typeof Materials];
    if (key in Commodities) d.data = Commodities[key as keyof typeof Commodities];
    return d;
  })
  const supplementData: any[] = Array.from({length: 30 - newData.length}, () => {});
  processingData.value.weekly = newData.concat(supplementData)
}

defineExpose({
  data: processingData.value
})
</script>

<template>
  <v-tabs height="40" class="text-amber font-weight-bold" :show-arrows="true">
    <v-tab class="text-h6">每周</v-tab>
  </v-tabs>
  <v-divider thickness="2" class="mb-5"></v-divider>

  <v-row>
    <v-col cols="auto"
           v-for="(i, index) in processingData.weekly" :key="index">
      <ItemSlotBase size="99px" class="d-flex justify-center align-center">
        <template v-if="i != null">
          <ItemIconWidget :id="i.data.id" v-if="i.data._typeStringName == 'Item'"></ItemIconWidget>
        </template>

        <template v-else>
          <v-icon class="opacity-20" size="30">mdi-help</v-icon>
        </template>
      </ItemSlotBase>
    </v-col>
  </v-row>
</template>

<style scoped lang="less">

</style>
