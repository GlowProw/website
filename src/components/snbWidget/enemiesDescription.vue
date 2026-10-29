<script setup lang="ts">
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {use_local_locale} from "@/assets/sripts/use_local_locale";

const props = defineProps<{
  id: string,
  // 变种 id，传入时优先显示该航线状态的描述
  variantId?: string,
  // 是否改为显示参与挑战的说明
  isDifficulty?: boolean,
  locale?: string
}>(),
    {enemy} = useI18nReadName(),
    {localLocale} = use_local_locale()

let getDescription = computed(() => {
  const lang = props.locale || localLocale.value;
  const data = enemy(props.id);

  if (props.isDifficulty) {
    return data.difficultyDescription(lang);
  }
  if (props.variantId) {
    return data.variantDescription(props.variantId, lang) || data.description(lang);
  }
  return data.description(lang);
}),
    isHasDescription = computed(() => getDescription.value.length > 0)

defineExpose({
  isHasDescription
})

defineOptions({
  name: "EnemiesDescription"
})
</script>

<template>
  <span v-if="isHasDescription">{{ getDescription }}</span>
</template>

<style scoped lang="less">

</style>
