<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {MapLocation, MapLocations, Npc} from "glow-prow-data";
import {computed} from "vue";

const props = defineProps<{ id?: string, data?: Npc }>(),
    {t} = useI18n(),
    mapLocations = MapLocations

let nameLocations = computed(() => {
      let d = []
      if (props.data.location.includes('anyoneOutpost'))
        d = d.concat(Object.values(mapLocations).filter((i: MapLocation) => i.category == 'outpost'))
      if (props.data.location.includes('anyoneDen'))
        d = d.concat(Object.values(mapLocations).filter((i: MapLocation) => i.category == 'den'))
      return d.concat(props.data.location || [])
    }),
    nameLocationAsLang = computed(
        () => nameLocations.value.filter(i => i.id != undefined).map(i => t(`snb.mapLocations.${i.id}.name`))
    )
</script>

<template>
  {{
    t(`snb.npcs.${id || data?.id}.name`, {
      location: nameLocationAsLang.length > 0 ? `(${nameLocationAsLang.join(' ')})` : ''
    })
  }}
</template>

<style scoped lang="less">

</style>
