<script lang="ts">
export default { name: 'ModDescription' }
</script>

<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed} from "vue";

const props = defineProps<{ id: string, variants, grade, type, class?: string }>(),
    {t, rt, tm, te} = useI18n()

let
    // 查找模组对应变种
    // 按照item中的type来决定
    modVariants = computed(() => {
      return props.variants.filter((e: any) => e.itemType.indexOf(props.type) >= 0)
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
  })
}

const getRange = (v: any) => v.range
const getModDescription = () => (tm(`snb.modifications.${props.id}.description`) as any)
</script>

<template>
  <div v-for="(v, vIndex) in modVariants" :key="vIndex"
       :class="`grade-${grade}-description ${props.class}`" class="description">
    <template v-if=" !Array.isArray(t(`snb.modifications.${id}.description`)) && te(`snb.modifications.${id}.description`)">
      {{
        t(`snb.modifications.${id}.description`, {
          __: onFormatRange(getRange(v))
        })
      }}
    </template>
    <template v-else v-for="content in getModDescription()" :key="content">
      {{ rt(content, {__: onFormatRange(getRange(v))}) }}<br>
    </template>
  </div>
</template>

<style scoped lang="less">

</style>
