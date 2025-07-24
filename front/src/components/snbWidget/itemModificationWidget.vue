<script setup lang="ts">


import {onMounted, ref} from "vue";
import {Modifications} from "glow-prow-data";

const props = withDefaults(defineProps<{ id: string, type: string | null }>(), {
  id: null,
  type: null
})

let modData = ref({})

onMounted(() => {
  console.log(Modifications)
  modData.value = onCategorizeByGrade(Modifications)
})

/**
 * 初始化分类表
 * 以grade创建
 * @param data
 */
const onCategorizeByGrade = (data): {} => {
  const result = {};

  Object.values(data).forEach(item => {
    if (props.type) {
      const hasMatchingVariant = item.variants.some(variant =>
          variant.itemType.includes(props.type)
      );

      if (!hasMatchingVariant) return; // 不匹配则跳过
    }

    if (!result[item.grade]) {
      result[item.grade] = [];
    }
    result[item.grade].push(item);
  });

  return result;
}
</script>

<template>
  <v-card v-for="(key, value) in modData" :key="key">
    <b>{{value}}</b>
    <v-card v-for="(mod, modIndex) in key" :key="modIndex">
      {{mod.id}}
    </v-card>
  </v-card>
</template>

<style scoped lang="less">

</style>
