<script setup lang="ts">

import EmptyView from "../EmptyView.vue";
import {onMounted, type Ref, ref} from "vue";
import {Ships} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import type {Ship} from "glow-prow-data/src/entity/Ships.ts";
import PerksWidget from "./perksWidget.vue";
import ShinyText from "@/components/ShinyText.vue";
import ShipBaseInfoSlotWidget from "@/components/snbWidget/shipBaseInfoSlotWidget.vue";
import ShipWeaponInfoSlotWidget from "@/components/snbWidget/shipWeaponInfoSlotWidget.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";

const props = withDefaults(defineProps<{
      id: string,
      isClickOpenDetail?: boolean,
      isShowOpenDetail?: boolean,
      isShowDescription?: boolean,
      isShowTooltip?: boolean,
      padding?: number
    }>(), {
      id: 'dhow',
      isClickOpenDetail: true,
      isShowOpenDetail: true,
      isShowDescription: true,
      isShowTooltip: true,
      padding: 3
    }),
    ships: Ships = Ships,
    {t} = useI18n()

let shipConfig = ref({
      images: {},
      model: {},
      panel: {}
    }),
    shipData: Ref<Ship> = ref({});

onMounted(() => {
  onReady()
})

const shipImages = import.meta.glob('@glow-prow-assets/ships/*.png', {eager: true});

const onReady = async () => {
  shipData.value = ships[props.id];

  for (let key in Ships) {
    const imageKey = `/node_modules/glow-prow-assets/ships/${key}.png`;

    shipConfig.value.panel[key] = null;
    shipConfig.value.model[key] = false;

    if (shipImages[imageKey].default) {
      shipConfig.value.images[key] = shipImages[imageKey].default;
    } else {
      shipConfig.value.images[key] = '';
    }
  }
}
</script>

<template>
  <v-tooltip v-model="shipConfig.model[props.id]"
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
          tile
          border
          variant="text"
          :to="isClickOpenDetail ? `/display-cabinet/ship/${id}` : ''"
          :class="`pa-${props.padding} cursor-pointer`"
          height="100%"
          width="100%">
        <v-img :src="shipConfig.images[props.id]" class="pointer-events-none prohibit-drag"></v-img>
      </v-card>
    </template>

    <v-card class="demo-reel bg-black" flat border>
      <div class="demo-reel-header pa-10 position-relative">
        <h1 class="font-weight-bold">
          <ShinyText :text="t(`snb.ships.${props.id}.name`)" :speed="1" class-name="text-amber" class=""></ShinyText>
        </h1>
        <p class="mb-1">{{ props.id }}</p>

        <v-badge inline color="transparent" class="badge-flavor text-center tag-badge pl-3" v-if="shipData && shipData.size">{{ t(`displayCabinet.size.${shipData.size}`) }}</v-badge>

        <v-img :src="shipConfig.images[props.id]" class="prohibit-drag right-show-item-image position-absolute w-33"></v-img>
      </div>
      <div class="demo-reel-content background-flavor overflow-auto">
        <template v-if="isShowDescription">
          <div class="mb-2 pa-5 description">
            {{ t(`snb.ships.${props.id}.description.general`) }}
          </div>
        </template>

        <v-expansion-panels v-model="shipConfig.panel[props.id]">
          <v-expansion-panel
              selected-class="bg-black"
              class="bg-transparent"
              color="transparent"
              tile
              static>
            <template v-slot:title>
              <div class="title-long-flavor bg-black">
                {{ t('displayCabinet.ship.baseInfo') }}
              </div>
            </template>
            <template v-slot:text>
              <ShipBaseInfoSlotWidget :data="shipData" :isSimulationShipSailSpeed="false"  />
            </template>
          </v-expansion-panel>
          <v-expansion-panel
              class="bg-transparent"
              color="transparent"
              tile
              static>
            <template v-slot:title>
              <div class="title-long-flavor bg-black">
                {{ t('displayCabinet.ship.perks') }}
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
                {{ t('displayCabinet.ship.deckInfo') }}
              </div>
            </template>
            <template v-slot:text>
              <ShipWeaponInfoSlotWidget :data="shipData" />
            </template>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
      <v-divider></v-divider>
      <v-card-actions class="pa-5 pt-0">
        <BtnWidget @action-complete="router.push(`/display-cabinet/ship/${props.id}`)"
                   class="mt-1 ml-1"
                   v-if="isShowOpenDetail">
          {{ t('displayCabinet.ship.lookDetail') }}
        </BtnWidget>
      </v-card-actions>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">
.description {
  font-size: 18px;
}

.demo-reel {
  .right-show-item-image {
    transform: scale(1.5);
    right: 0;
    bottom: 15px;
  }

  .item {
    pointer-events: none;
  }

  .tag-badge {
    color: hsl(from var(--main-color) h s calc(l * 0.3));
  }

  .demo-reel-header {
    height: 200px;
    overflow: hidden;
    background-color: #000;

    &:before {
      content: "";
      position: absolute;
      z-index: 1;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 0;
      padding: 10% 0 0;
      background: url('@/assets/images/portal-banner-background.png') 50% 0 no-repeat;
      background-size: cover;
    }
  }

  .demo-reel-content {
    max-height: 70vh;
  }
}
</style>
