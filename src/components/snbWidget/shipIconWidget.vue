<script setup lang="ts">

import {onMounted, type Ref, ref, watch} from "vue";
import {Ship, Ships} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useAssetsStore} from "~/stores/assetsStore";

import ShinyText from "@/components/ShinyText.vue";
import ShipBaseInfoSlotWidget from "@/components/snbWidget/shipBaseInfoSlotWidget.vue";
import ShipWeaponInfoSlotWidget from "@/components/snbWidget/shipWeaponInfoSlotWidget.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import EmptyView from "../EmptyView.vue";
import PerksWidget from "./perksWidget.vue";
import ShipDescription from "@/components/snbWidget/shipDescription.vue";

const props = withDefaults(defineProps<{
      id: string,
      isClickOpenDetail?: boolean,
      isShowOpenDetail?: boolean,
      isShowDescription?: boolean,
      isShowTooltip?: boolean,
      padding?: number
      margin?: number
    }>(), {
      id: 'dhow',
      isClickOpenDetail: true,
      isShowOpenDetail: true,
      isShowDescription: true,
      isShowTooltip: true,
      padding: 1,
      margin: 1
    }),
    ships: Ships = Ships,
    router = useRouter(),
    {t} = useI18n(),
    {ships: shipsAssets} = useAssetsStore()

let shipCardData = ref({
      icon: '',
      model: false,
      panel: null
    }),
    shipData: Ref<Ship> = ref({});

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = async () => {
  shipData.value = ships[props.id];

  shipCardData.value.panel = null;
  shipCardData.value.model = false;

  if (shipsAssets[props.id]) {
    shipCardData.value.icon = shipsAssets[props.id];
  } else {
    shipCardData.value.icon = '';
  }
}
</script>

<template>
  <v-tooltip v-model="shipCardData.model"
             min-width="450"
             max-width="450"
             interactive
             :disabled="!props.isShowTooltip"
             :offset="[40, 0]"
             location="right top"
             content-class="pa-0" target="cursor">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          v-bind="activatorProps"
          width="100%"
          :to="isClickOpenDetail ? `/codex/ship/${id}` : ''"
          :class="[
              'prohibit-drag',
              `ma-${props.margin}`,
              `pa-${props.padding}`,
          ]">
        <v-img :src="shipCardData.icon" class="pointer-events-none prohibit-drag"></v-img>
      </v-card>
    </template>

    <v-card class="demo-reel bg-black" flat border>
      <div class="demo-reel-header pa-10 position-relative">
        <h1 class="font-weight-bold">
          <ShinyText :text="t(`snb.ships.${props.id}.name`)" :speed="1" class-name="text-amber" class=""></ShinyText>
        </h1>
        <p class="mb-1">{{ props.id }}</p>

        <div class="d-flex ga-2">
          <v-chip inline
                   class="badge-flavor text-center tag-badge"
                   v-if="shipData && shipData.size">
            {{ t(`codex.size.${shipData.size}`) }}
          </v-chip>
          <v-chip inline
                  class="badge-flavor text-center text-black tag-badge"
                  v-if="shipData.archetype">
            {{ t(`codex.ships.archetypes.${shipData.archetype}.name`) }}
          </v-chip>
        </div>

        <v-img :src="shipCardData.icon" class="prohibit-drag right-show-image position-absolute w-33"></v-img>
      </div>
      <div class="demo-reel-content background-flavor overflow-auto">
        <template v-if="isShowDescription">
          <div class="mb-2 pa-5 description">
            <ShipDescription :id="props.id"></ShipDescription>
          </div>
        </template>

        <v-expansion-panels v-model="shipCardData.panel">
          <v-expansion-panel
              selected-class="bg-black"
              class="bg-transparent"
              color="transparent"
              tile
              static>
            <template v-slot:title>
              <div class="title-long-flavor bg-black">
                {{ t('codex.ship.baseInfo') }}
              </div>
            </template>
            <template v-slot:text>
              <ShipBaseInfoSlotWidget :data="shipData" :isSimulationShipSailSpeed="false"/>
            </template>
          </v-expansion-panel>
          <v-expansion-panel
              class="bg-transparent"
              color="transparent"
              tile
              static>
            <template v-slot:title>
              <div class="title-long-flavor bg-black">
                {{ t('codex.ship.perks') }}
              </div>
            </template>
            <template v-slot:text>
              <PerksWidget class="mt-n0" :data="shipData" v-if="shipData.perks.length > 0"></PerksWidget>
              <template v-else>
                <EmptyView></EmptyView>
              </template>
            </template>
          </v-expansion-panel>
          <v-expansion-panel
              class="bg-transparent"
              color="transparent"
              tile
              static>
            <template v-slot:title>
              <div class="title-long-flavor bg-black">
                {{ t('codex.ship.deckInfo') }}
              </div>
            </template>
            <template v-slot:text>
              <ShipWeaponInfoSlotWidget :data="shipData"/>
            </template>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
      <v-divider></v-divider>
      <v-card-actions class="pa-5 pt-0">
        <BtnWidget @action-complete="router.push(`/codex/ship/${props.id}`)"
                   class="mt-1 ml-1"
                   v-if="isShowOpenDetail">
          {{ t('codex.ship.lookDetail') }}
        </BtnWidget>
      </v-card-actions>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";

.description {
  font-size: 18px;
}
</style>
