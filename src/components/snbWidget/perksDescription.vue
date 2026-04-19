<script setup lang="ts">
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const props = defineProps<{ data: any, perkKey: string, class?: string }>(),
    {t, te, tm, sanitizeString, asArray} = useI18nUtils(),
    {perk} = useI18nReadName()

/**
 * 获取词条描述内容
 */
const getDescription = () => {
  const perksName = sanitizeString(props.perkKey)
  let keys = []

  switch (props.data?.type) {
    case "shipUpgrade":
      keys = [
        `snb.perks.${perksName.cleaned}.description.${props.data.tier}`,
        `snb.perks.${perksName.cleaned}.description.general`,
      ]

      return asArray(keys)
    case "":
    default:
      keys = [
        `snb.perks.${props.perkKey}.description.general`,
        `snb.perks.${perksName.cleaned}.description.general`,
        `snb.perks.${perksName.cleaned}.description.${perksName.removedNumbers[0]}`
      ]

      return asArray(keys)
  }
}

defineOptions({
  name: "PerkDescription"
})
</script>

<template>
  <p class="opacity-80 text-pre-wrap mt-3 pl-5 pr-5" v-for="(pPkey, pIndex) in getDescription()" :key="pIndex">
    {{ pPkey }}
  </p>
</template>

<style scoped lang="less">

</style>
