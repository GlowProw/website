<script setup lang="ts">
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {computed} from "vue";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import QuestCardDetail from "@/components/snbWidget/questCardDetail.vue";

const props = withDefaults(defineProps<{
  id: string,
  rawKey?: boolean,
  isShowTooltip?: boolean,
}>(), {
  rawKey: false,
});

const i18nReadName = useI18nReadName();
const name = computed(() => {
  if (!props.id) return '';
  return i18nReadName.quest(props.id).name();
});

defineOptions({
  name: "QuestName"
});
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false || !props.id">
    <template v-slot:activator="{ props: activatorProps }">
      <span v-bind="activatorProps">{{ name || id }}</span>
    </template>
    <QuestCardDetail v-if="props.id" :id="props.id" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">
</style>
