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

/**
 * 获取文本
 * @param o
 */
const getChipText = (o: any) => {
  return t(`snb.worldEvents.${o.worldEventId}`, {...i18nAdditionalAttr.value})
}
</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('codex.item.worldEvent') }}</p>
  <v-chip-group :column="true">
    <v-chip v-for="(o,oIndex) in worldEvent"
            class="mb-1 mr-1 py-2 "
            exact
            pill
            replace
            target="_blank"
            :key="oIndex"
            :to="`/codex/${o.itemType}s?worldEvent=${o.worldEventId}`">
      <v-tooltip content-class="pa-0">
        <template v-slot:default>
          <v-card border class="py-3 px-10">
            <span v-html="getChipText(o)"></span>
          </v-card>
        </template>
        <template v-slot:activator="{props}">
          <div class="singe-line w-100 multiline-chip blueprint-item" v-bind="props" v-html="getChipText(o)"></div>
        </template>
      </v-tooltip>
    </v-chip>
  </v-chip-group>
</template>

<style scoped lang="less">

</style>
