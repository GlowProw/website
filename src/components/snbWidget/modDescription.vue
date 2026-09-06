<script setup lang="ts">
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const props = defineProps<{ id: string, variants, grade, type?, class?: string }>(),
    {t, tm, te, rt, locale: localLocale} = useI18nUtils(),
    {modification} = useI18nReadName()

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
const isArrayDescription = computed(() => Array.isArray(getModDescription()))
const getAllModDescription = computed(() => modification(props.id).description(localLocale.value, props.type))

defineOptions({
  name: "ModDescription"
})
</script>

<template>
  <template v-if="type">
    <div v-for="(v, vIndex) in modVariants" :key="vIndex"
       :class="`grade-${grade}-description ${props.class}`" class="description text-pre-wrap">
      <template v-if="!isArrayDescription && te(`snb.modifications.${id}.description`)">
        {{
          t(`snb.modifications.${id}.description`, {
            __: onFormatRange(getRange(v))
          })
        }}
      </template>
      <template v-else-if="isArrayDescription">
        <div v-for="(_, cIndex) in getModDescription()" :key="cIndex">
          {{
            t(`snb.modifications.${id}.description.${cIndex}`, {
              __: onFormatRange(getRange(v))
            })
          }}
        </div>
      </template>
    </div>
  </template>
  <template v-else>
    <div class="text-pre-wrap" :class="props.class">{{ getAllModDescription }}</div>
  </template>
</template>

<style scoped lang="less">
.text-pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
