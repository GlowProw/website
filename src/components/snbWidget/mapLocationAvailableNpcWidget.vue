<script setup lang="ts">
import {Npc, Npcs} from "glow-prow-data";
import {computed} from "vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import EmptyView from "@/components/EmptyView.vue";
import NpcIconWidget from "@/components/snbWidget/npcIconWidget.vue";
import NpcName from "@/components/snbWidget/npcName.vue";
import HorizontalScrollList from "@/components/HorizontalScrollList.vue";

const props = defineProps<{ id: string, category: string }>(),
    npcs = computed(() =>
        Object.values(Npcs)
            .filter((i: Npc) => {
              let anyoneOutpost = i.location.includes('anyoneOutpost') && props.category == 'outpost'
              let anyoneDen = i.location.includes('anyoneDen') && props.category == 'den'
              return i.location.indexOf(props.id) >= 0 || anyoneOutpost || anyoneDen
            }) || []
    )
</script>

<template>
  <HorizontalScrollList btn-size="30" :is-indicator="false">
    <div class="d-inline-flex ga-4" v-if="npcs && npcs.length > 0">
      <template v-for="(i, index) in npcs" :key="index">
        <v-card class="bg-transparent" width="99" variant="text" :class="{'ml-5': index == 0, 'mr-5': index == npcs.length - 1}">
          <ItemSlotBase size="99px" :padding="0">
            <NpcIconWidget :data="i"></NpcIconWidget>
          </ItemSlotBase>
          <div class="mt-1 text-center singe-line">
            <NpcName :data="i"></NpcName>
          </div>
        </v-card>
      </template>
    </div>
    <EmptyView v-else></EmptyView>
  </HorizontalScrollList>
</template>

<style scoped lang="less">

</style>
