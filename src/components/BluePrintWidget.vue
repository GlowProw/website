<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed} from "vue";
import {Item} from "glow-prow-data";
import {useI18nUtils} from "@/assets/sripts/i18n_util";

const props = defineProps<{ data: Item }>(),
    {t, tm} = useI18n(),
    {asString} = useI18nUtils()

let seasonI18nMap = computed(() => {
      return tm('snb.seasons')
    }),
    i18nAdditionalAttr = computed(() => {
      return {
        ...seasonI18nMap.value
      }
    })

const bluePrintsList = computed(() => {
  const bluePrints = props.data?.blueprint;

  if (!bluePrints) return [];

  // 获取蓝图名称的通用函数
  const getBlueprintName = (blueprint: string): string => {
    return asString([
      `snb.mapLocations.${blueprint}.name`,
      `snb.locations.${blueprint}`,
    ], {
      variable: i18nAdditionalAttr.value,
      backRawKey: true
    })
  };

  // 扁平化处理蓝图数据的函数
  const flattenBlueprints = (data: any): string[] => {
    if (!data) return [];

    if (typeof data === 'string') {
      return [data];
    }

    if (Array.isArray(data)) {
      const result: string[] = [];
      data.forEach(item => {
        if (Array.isArray(item)) {
          // 处理嵌套数组
          result.push(...item.filter(i => typeof i === 'string'))
        } else if (typeof item === 'string') {
          // 处理字符串项
          result.push(item)
        }
      })
      return result;
    }

    return [];
  };

  // 获取所有蓝图键
  const blueprintKeys = flattenBlueprints(bluePrints)

  if (blueprintKeys.length === 0) return [];

  // 转换为名称并过滤无效项
  return blueprintKeys
      .map(key => {
        const name = getBlueprintName(key)
        // 如果转换后的名称不等于原始键，说明转换成功
        return name && name !== key ? name : null;
      })
      .filter((name): name is string => name !== null)
})
</script>

<template>
  <div v-if="bluePrintsList.length > 0">
    <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('codex.item.bluePrint') }}</p>
    <div>
      <v-chip
          v-for="(blueprint, index) in bluePrintsList"
          :key="index"
          class="d-inline-flex mb-1 mr-1">
        {{ blueprint }}
      </v-chip>
    </div>
  </div>
</template>

<style scoped lang="less">
</style>
