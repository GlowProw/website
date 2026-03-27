<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {MapLocation, MapLocations, Npc} from "glow-prow-data";
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";

const props = defineProps<{ id?: string, data?: Npc }>(),
    {t} = useI18n(),
    mapLocations = MapLocations,
    {npc} = useI18nReadName()


let nameLocations = computed(() => {
      let d: any[] = []
      if ((props.data.location as any).includes('anyoneOutpost'))
        d = d.concat(Object.values(mapLocations).filter((i: MapLocation) => i.category == 'outpost'))
      if ((props.data.location as any).includes('anyoneDen'))
        d = d.concat(Object.values(mapLocations).filter((i: MapLocation) => i.category == 'den'))
      return d.concat(props.data.location || [])
    }),
    nameLocationAsLang = computed(
        () => nameLocations.value.filter(i => i.id != undefined).map(i => t(`snb.mapLocations.${i.id}.name`))
    )

let getTitle = computed(() => {
  return `${npc(props.id || props.data?.id).name(nameLocationAsLang.value.length > 0 ? `(${nameLocationAsLang.value.join(' ')})` : '') || '-'}`
})

defineOptions({
  name: "NpcName"
})
</script>

<template>
  <span :title="getTitle">{{ getTitle }}</span>
</template>

<style scoped lang="less">

</style>
