<script setup lang="ts">
import {computed, onMounted, ref, type Ref, watch} from "vue";
import {Item, Material, Seasons, Ship, Ultimate} from "glow-prow-data";
import {useI18n} from "vue-i18n";

const {t, tm} = useI18n(),
    props = defineProps<{ data: Item | Ship | Material | Ultimate | unknown }>()

let detailData: Ref<Item | Ship | Material | Ultimate | null> = ref(null),
    seasonI18nMap = computed(() => {
      return tm('snb.seasons')
    }),
    i18nAdditionalAttr = computed(() => {
      return {
        ...seasonI18nMap.value
      }
    }),
    getEvent = computed(() => {
      if (!detailData.value) return []

      const events = detailData.value?.event

      // 标准化处理：确保返回数组
      const eventsArray = Array.isArray(events) ? events : [events]

      // 过滤掉无效的事件并添加元数据
      return eventsArray
          .filter(event => event && event.id)
          .map(event => ({
            ...event,
            eventId: event.id,
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
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('codex.item.event') }}</p>
  <v-chip v-for="(e,eIndex) in getEvent"
          class="d-inline-flex mb-1 mr-1"
          target="_blank"
          :key="eIndex">
    {{ t(`snb.events.${e.eventId}`, {...i18nAdditionalAttr}) }}
  </v-chip>
</template>

<style scoped lang="less">

</style>
