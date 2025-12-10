<script setup lang="ts">

import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import MapLocationIconWidget from "@/components/snbWidget/mapLocationIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import NpcIconWidget from "@/components/snbWidget/npcIconWidget.vue";
import {onMounted, ref} from "vue";
import {storage} from "@/assets/sripts/index";
import {useI18n} from "vue-i18n";

const {t} = useI18n()

let codexHistorys = ref([])

onMounted(() => {
  getCodexHistory()
})

/**
 * 获取历史记录
 */
const getCodexHistory = () => {
  let name = 'codex.history'

  const d = storage.session.get(name)

  if (d.code == 0)
    codexHistorys.value = Object.values(d.data.value);
}


/**
 * 清理历史
 */
const onCleaningHistory = () => {
  let name = 'codex.history'

  codexHistorys.value = []
  return storage.session.rem(name)
}
</script>

<template>
  <div class="w-100 mb-10" v-if="codexHistorys.length > 0">
    <v-toolbar class="py-0 px-5 bg-transparent">
      <div class="font-weight-bold text-amber text-h5">
        <v-icon>mdi-history</v-icon>
        {{ t('codex.cabinetHistoryTitle') }}
        ({{ codexHistorys.length || 0 }})
      </div>
      <v-spacer></v-spacer>
      <v-col cols="auto" class="mr-4">
        <v-btn icon="mdi-delete" @click="onCleaningHistory" v-if="codexHistorys.length >= 0"></v-btn>
      </v-col>
    </v-toolbar>

    <v-row class="px-5">
      <v-col cols="auto" v-for="(i,index) in codexHistorys" :key="index">
        <ItemSlotBase size="120px">
          <ShipIconWidget :id="i.id" v-if="i.category == 'ship'"></ShipIconWidget>
          <ItemIconWidget :id="i.id" v-if="i.category == 'item'"></ItemIconWidget>
          <CommoditieIconWidget :id="i.id" v-if="i.category == 'commoditie'"></CommoditieIconWidget>
          <UltimateIconWidget :id="i.id" v-if="i.category == 'ultimate'"></UltimateIconWidget>
          <MaterialIconWidget :id="i.id" v-if="i.category == 'material'"></MaterialIconWidget>
          <MapLocationIconWidget :id="i.id" v-if="i.category == 'mapLocation'"></MapLocationIconWidget>
          <TreasureMapIconWidget :id="i.id" v-if="i.category == 'treasureMap'"></TreasureMapIconWidget>
          <CosmeticIconWidget :id="i.id" v-if="i.category == 'cosmetic'"></CosmeticIconWidget>
          <ModIconWidget :id="i.id" v-if="i.category == 'mod'"></ModIconWidget>
          <NpcIconWidget :id="i.id" v-if="i.category == 'npc'"></NpcIconWidget>
        </ItemSlotBase>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="less">

</style>
