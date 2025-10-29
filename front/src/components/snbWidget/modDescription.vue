<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed} from "vue";

const props = defineProps<{ id: string, variants, grade, type }>(),
    {t, rt, tm, te} = useI18n()

let isDescriptionMultipleLines = computed(() => {
  return tm(`snb.modifications.${props.id}.description`)
})

/**
 * 格式数据
 * @param data
 */
const onFormatRange = (data: []) => {
  return data.map((num, index) => {
    if (num < 1) {
      return [Math.floor(num * 100 * 10) / 10, Math.ceil(num * 100 * 10) / 10][index];
    } else {
      return num;
    }
  });
}
</script>

<template>
  <div v-for="(v, vIndex) in variants.filter(e => e.itemType.indexOf(type) >= 0)" :key="vIndex"
       :class="`grade-${grade}-description`" class="opacity-50 description">



    <template v-if="isDescriptionMultipleLines">
      {{ t(`snb.modifications.${id}.description`, {
        __: onFormatRange(v.range)
      }) }}
    </template>
    <template v-else-if="isDescriptionMultipleLines && !Array.isArray(t(`snb.modifications.${id}.description`)) && te(`snb.modifications.${id}.description`)">
      {{
        t(`snb.modifications.${id}.description`, {
          __: onFormatRange(v.range)
        })
      }}
    </template>
    <template v-else v-for="content in tm(`snb.modifications.${id}.description`)" :key="content">
      {{ rt(content, {__: onFormatRange(v.range)}) }}<br>
    </template>
  </div>
</template>

<style scoped lang="less">

</style>
