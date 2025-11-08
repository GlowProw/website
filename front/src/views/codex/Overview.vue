<script setup lang="ts">
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";

import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {storage} from "@/assets/sripts";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import {useDisplay} from "vuetify/framework";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import AppCodexNav from "@/assets/sripts/app_codex_nav";
import {useAssetsStore} from "~/stores/assetsStore";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import MapLocationIconWidget from "@/components/snbWidget/mapLocationIconWidget.vue";

const codexImages = import.meta.glob('@/assets/images/snb/codexIcons/*', {eager: true})

const
    {t} = useI18n(),
    {mobile} = useDisplay(),
    {serializationMap} = useAssetsStore(),
    appCodexNav = new AppCodexNav()

let codexHistorys = ref([]),
    codexIcons = ref({})

onMounted(() => {
  codexIcons.value = serializationMap(codexImages)

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
  <div class="mb-10 overview">
    <v-row class="fill-height" no-gutters>
      <!-- 游览历史 S -->
      <div class="w-100 mb-10" v-if="codexHistorys.length > 0">
        <v-toolbar class="pa-0 bg-transparent">
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

        <v-row>
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
            </ItemSlotBase>
          </v-col>
        </v-row>
      </div>
      <!-- 游览历史 E -->

      <div class="w-100">
        <template v-for="(i, index) in appCodexNav.codex" :key="index">
          <v-toolbar class="pa-0 bg-transparent">
            <div class="font-weight-bold text-amber text-h5">
              {{ t(i.title) }}
            </div>
            <v-spacer></v-spacer>
          </v-toolbar>

          <v-divider class="mb-5"></v-divider>

          <v-row class="mb-2 px-3 mb-16 pl-0 pr-0">
            <v-col cols="12" sm="12" lg="3" v-for="(n, nIndex) in i.childs" :key="nIndex" v-if="i.childs">
              <router-link :to="n.to" class="codex-overview-item">
                <div class="card-flavor px-0 py-1">
                  <v-card class="card-enlargement-flavor card px-8 py-5">
                    <v-img :src="codexIcons[n.value]" height="100"></v-img>
                  </v-card>
                </div>
                <div class="mt-2 text-center font-weight-bold name">{{ t(n.title) }}</div>
              </router-link>
            </v-col>
          </v-row>
        </template>
      </div>
    </v-row>
  </div>
</template>

<style scoped lang="less">
.codex-overview-item .card {
  background-size: calc(100% - 12px) calc(100% - 8px);
  background-position: center;
  background-color: black;
}

.codex-overview-item:hover .card {
  background-color: var(--main-color);
}
</style>
