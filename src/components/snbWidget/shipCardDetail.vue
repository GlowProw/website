<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useRouter} from "vue-router";
import {Ships} from "glow-prow-data";

import ShinyText from "@/components/ShinyText.vue";
import ShipBaseInfoSlotWidget from "@/components/snbWidget/shipBaseInfoSlotWidget.vue";
import ShipWeaponInfoSlotWidget from "@/components/snbWidget/shipWeaponInfoSlotWidget.vue";
import BtnWidget from "@/components/snbWidget/btnWidget.vue";
import EmptyView from "../EmptyView.vue";
import PerksWidget from "./perksWidget.vue";
import ShipDescription from "@/components/snbWidget/shipDescription.vue";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import DamageMitigationWidget from "@/components/snbWidget/damageMitigationWidget.vue";

const props = withDefaults(defineProps<{
  id: string,
  isShowOpenDetail?: boolean,
  isShowDescription?: boolean,
  isWidget?: boolean,
}>(), {
  id: 'dhow',
  isShowOpenDetail: true,
  isShowDescription: true,
  isWidget: false,
})

const {t} = useI18nUtils()
const router = useRouter()
const {currentService: currentImageService} = useCDNAssetsServiceStore()

const shipCardData = ref<any>({
  icon: '',
  panel: props.isWidget ? Array.from({length: 100}, (i, index) => index) : null
})

const shipData = ref<any>({})

const onReady = async () => {
  shipData.value = (Ships as any)[props.id];
  shipCardData.value.panel = props.isWidget ? Array.from({length: 100}, (i, index) => index) : null;
  shipCardData.value.icon = currentImageService.url({
    id: props.id,
    category: 'ships'
  });
}

watch(() => props.id, () => {
  onReady()
})

onMounted(() => {
  onReady()
})

defineOptions({
  name: 'ShipCardDetail'
})
</script>

<template>
  <v-card class="demo-reel bg-black" flat border v-if="shipData && shipData.id">
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

      <v-img :src="shipCardData.icon" class="prohibit-drag right-show-image position-absolute w-33" v-if="isWidget"></v-img>
    </div>
    <div :class="{'demo-reel-content': !isWidget}" class="background-flavor overflow-auto">
      <template v-if="isShowDescription">
        <div class="mb-5 px-6 description">
          <ShipDescription :id="props.id"></ShipDescription>
        </div>
      </template>

      <div class="mb-5 px-7">
        <DamageMitigationWidget direction="horizontal" type="armor" :isForciblyIcon="true" :data="shipData"></DamageMitigationWidget>
      </div>

      <v-expansion-panels v-model="shipCardData.panel" :multiple="isWidget" :static="true">
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
            <PerksWidget class="mt-n0" :data="shipData" v-if="shipData?.perks?.length > 0"></PerksWidget>
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
      <v-divider></v-divider>
      <v-card-actions class="pa-5 pt-0"
                      v-if="isShowOpenDetail">
        <BtnWidget @action-complete="router.push(`/codex/ship/${props.id}`)"
                   class="mt-1 ml-1">
          {{ t('codex.ship.lookDetail') }}
        </BtnWidget>
      </v-card-actions>
    </div>
  </v-card>
</template>

<style scoped lang="less">
@import "@/assets/styles/demo-reel";
</style>
