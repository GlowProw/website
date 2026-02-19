<script setup lang="ts">
import {computed, onMounted, ref, type Ref, watch} from "vue";
import {Item, Material, Ultimate} from "glow-prow-data";
import {useI18n} from "vue-i18n";

const {t} = useI18n(),
    props = defineProps<{ data: Item | Material | Ultimate | unknown }>()

let
    detailData: Ref<Item | Material | Ultimate | null> = ref(null),
    worldEvent = computed(() => {
      if (!detailData.value) return []

      const events = detailData.value.worldEvent

      // 如果没有世界事件数据，返回空数组
      if (!events) return []

      // 标准化处理：确保返回数组
      const eventsArray = Array.isArray(events) ? events : [events]

      // 过滤掉无效的事件并添加元数据
      return eventsArray
          .filter(event => event && event.id)
          .map(event => ({
            ...event,
            worldEventId: event.id,
            itemType: props.data?._typeStringName?.toLowerCase() || 'unknown',
            itemId: props.data?.id || 'unknown'
          }))
    })

watch(() => props.data, (value) => {
  if (value)
    detailData.value = value
})

onMounted(() => {
  detailData.value = props.data
})
</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('codex.item.worldEvent') }}</p>
  <v-chip v-for="(e,eIndex) in worldEvent"
          class="d-inline-flex mb-1 mr-1"
          target="_blank"
          :to="`/codex/${e.itemType}s?worldEvent=${e.worldEventId}`"
          :key="eIndex">
    {{ t(`snb.worldEvents.${e.worldEventId}`) }}
  </v-chip>
</template>

<style scoped lang="less">

</style>
