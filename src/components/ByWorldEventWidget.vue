<script setup lang="ts">
import {computed, onMounted, ref, type Ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const {t} = useI18n(),
    props = defineProps<{ data: any }>(),
    {worldEvent: readWorldEvent} = useI18nReadName()

let detailData: Ref<any> = ref(null),
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
 * 获取世界事件名称
 * @param o
 */
const getChipText = (o: any) => {
  return readWorldEvent(o.worldEventId).name()
}

/**
 * 获取世界事件描述
 * @param o
 */
const getEventDescription = (o: any) => {
  return readWorldEvent(o.worldEventId).description()
}

defineOptions({
  name: 'WorldEventWidget'
})
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
          <v-card border class="py-3 px-6" max-width="400">
            <div class="font-weight-bold">{{ getChipText(o) }}</div>
            <div v-if="getEventDescription(o)" class="text-caption opacity-80 mt-1" style="white-space: pre-line;">
              {{ getEventDescription(o) }}
            </div>
          </v-card>
        </template>
        <template v-slot:activator="{props}">
          <div class="singe-line w-100 multiline-chip blueprint-item" v-bind="props">{{ getChipText(o) }}</div>
        </template>
      </v-tooltip>
    </v-chip>
  </v-chip-group>
</template>

<style scoped lang="less">

</style>
