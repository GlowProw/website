<script lang="ts">
export default { name: 'WorldEventWidget' }
</script>

<script setup lang="ts">
import {computed, onMounted, ref, type Ref, watch} from "vue";
import {Item, Material, Ship, Ultimate} from "glow-prow-data";
import {useI18n} from "vue-i18n";

const {t,tm} = useI18n(),
    props = defineProps<{ data: any }>()

let detailData: Ref<any> = ref(null),
    seasonI18nMap = computed(() => {
      return (tm('snb.seasons') as any[])
    }),
    i18nAdditionalAttr = computed(() => {
      return {
        ...(seasonI18nMap.value as any)
      }
    }),
    worldEvent = computed(() => {
      if (!detailData.value) return []

      const worldEvents = (detailData.value as any)?.worldEvent

      // 标准化处理：确保返回数组如果没有世界事件数据，返回空数组
      if (!worldEvents) return []

      // 标准化处理：确保返回数组
      const eventsArray = Array.isArray(worldEvents) ? worldEvents : [worldEvents]

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
    {{ t(`snb.worldEvents.${e.worldEventId}`, {...i18nAdditionalAttr}) }}
  </v-chip>
</template>

<style scoped lang="less">

</style>
