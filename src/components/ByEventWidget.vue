<script setup lang="ts">
import {computed, onMounted, ref, type Ref, watch} from "vue";
import {useI18n} from "vue-i18n";

const {t, tm} = useI18n(),
    props = defineProps<{ data: any }>()

let detailData: Ref<any> = ref(null),
    seasonI18nMap = computed(() => {
      return (tm as any)('snb.seasons')
    }),
    i18nAdditionalAttr = computed(() => {
      return {
        ...(seasonI18nMap.value as any)
      }
    }),
    getEvent = computed(() => {
      if (!detailData.value) return []

      const events = (detailData.value as any)?.event

      // 标准化处理：确保返回数组
      const eventsArray = Array.isArray(events) ? events : [events]

      // 过滤掉无效的事件并添加元数据
      return eventsArray
          .filter(event => event && event.id)
          .map(event => ({
            ...event,
            eventId: event.id,
            itemType: (detailData.value as any)?._typeStringName?.toLowerCase() || 'unknown',
            itemId: (detailData.value as any)?.id || 'unknown'
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
  return t(`snb.events.${o.eventId}`, {...i18nAdditionalAttr.value})
}

defineOptions({name: 'EventWidget'})
</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('codex.item.event') }}</p>
  <v-chip-group :column="true">
    <v-chip v-for="(o,oIndex) in getEvent"
            class="mb-1 mr-1 py-2 "
            exact
            pill
            replace
            target="_blank"
            :key="oIndex"
            :to="o.to">
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
