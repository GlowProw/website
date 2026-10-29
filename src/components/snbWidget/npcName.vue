<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {MapLocation, MapLocations, Npc} from "glow-prow-data";
import {computed} from "vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ItemCardTooltip from "@/components/snbWidget/itemCardTooltip.vue";
import NpcCardDetail from "@/components/snbWidget/npcCardDetail.vue";

const props = defineProps<{ id?: string, data?: Npc, isShowTooltip?: boolean }>(),
    {t} = useI18n(),
    mapLocations = MapLocations,
    {npc} = useI18nReadName()


let nameLocations = computed(() => {
      const rawLocations: any[] = props.data?.location || []
      let d: any[] = []
      if (rawLocations.includes('anyoneOutpost'))
        d = d.concat(Object.values(mapLocations).filter((i: MapLocation) => i.category == 'outpost'))
      if (rawLocations.includes('anyoneDen'))
        d = d.concat(Object.values(mapLocations).filter((i: MapLocation) => i.category == 'den'))

      // 具体地点 id 需要先转成地图地点实体，才能取到翻译名称
      rawLocations.forEach((location: any) => {
        if (typeof location !== 'string') {
          if (location) d.push(location)
          return
        }
        const mapLocation = (mapLocations as any)[location]
        if (mapLocation) d.push(mapLocation)
      })

      // 同一地点只保留一次
      return [...new Map(d.map((i: any) => [i.id, i])).values()]
    }),
    nameLocationAsLang = computed(
        () => nameLocations.value.filter(i => i.id != undefined).map(i => t(`snb.mapLocations.${i.id}.name`))
    )

let getTitle = computed(() => {
  const id = props.id || props.data?.id || ''
  if (!id) return '-'
  return `${npc(id).name(nameLocationAsLang.value.length > 0 ? `(${nameLocationAsLang.value.join(' ')})` : '') || '-'}`
})

defineOptions({
  name: "NpcName"
})
</script>

<template>
  <ItemCardTooltip :disabled="props.isShowTooltip === false || !(props.id || props.data?.id)">
    <template v-slot:activator="{ props: activatorProps }">
      <span :title="getTitle" v-bind="activatorProps">{{ getTitle }}</span>
    </template>
    <NpcCardDetail :id="props.id" :data="props.data" />
  </ItemCardTooltip>
</template>

<style scoped lang="less">

</style>
