<script setup lang="ts">
import {computed, onMounted, ref, type Ref, watch} from "vue";
import {Item, Material, Ultimate} from "glow-prow-data";
import {useI18n} from "vue-i18n";

const {t} = useI18n(),
    props = defineProps<{ data: Item | Material | Ultimate | unknown }>()

let
    detailData: Ref<Item | Material | Ultimate | null> = ref(null),
    worldEvent = computed(() => {
      let events = detailData.value?.worldEvent || [];
      if (Array.isArray(events))
        return events
      return [events]
    })

watch(() => props.data, (value) => {
  if (value)
    detailData.valu = value
})

onMounted(() => {
  detailData.value = props.data
})
</script>

<template>
  <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('displayCabinet.item.worldEvent') }}</p>
  <v-chip v-for="(e,eIndex) in worldEvent"
          class="d-inline-flex mb-1 mr-1"
          :key="eIndex">
    {{ t(`snb.worldEvents.${e.id}`) }}
  </v-chip>
</template>

<style scoped lang="less">

</style>
