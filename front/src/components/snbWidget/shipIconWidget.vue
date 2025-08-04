<script setup lang="ts">

import EmptyView from "../EmptyView.vue";
import {onMounted, type Ref, ref} from "vue";
import {Ships} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import type {Ship} from "glow-prow-data/src/entity/Ships.ts";
import PerksWidget from "./perksWidget.vue";
import ShinyText from "@/components/ShinyText.vue";

const props = withDefaults(defineProps<{
      id: string,
      isClickOpenDetail?: boolean,
      isShowOpenDetail?: boolean,
      isShowDescription?: boolean,
      padding?: number
    }>(), {
      id: 'dhow',
      isClickOpenDetail: true,
      isShowOpenDetail: true,
      isShowDescription: true,
      padding: 3
    }),
    ships: Ships = Ships,
    {t} = useI18n()

let shipsData = ref({
      images: {},
      model: {},
      panel: {}
    }),
    i: Ref<Ship> = ref({});

onMounted(() => {
  onReady()
})

const shipImages = import.meta.glob('@glow-prow-assets/ships/*.png', {eager: true});

const onReady = async () => {
  i.value = ships[props.id];

  for (let key in Ships) {
    const imageKey = `/node_modules/glow-prow-assets/ships/${key}.png`;

    shipsData.value.panel[key] = 0;
    shipsData.value.model[key] = false;

    if (shipImages[imageKey].default) {
      shipsData.value.images[key] = shipImages[imageKey].default;
    } else {
      shipsData.value.images[key] = '';
    }
  }
}
</script>

<template>
  <v-tooltip v-model="shipsData.model[props.id]"
             min-width="450"
             max-width="450"
             interactive
             :offset="[30,10]"
             location="right top"
             content-class="pa-0" target="cursor">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
          v-bind="activatorProps"
          tile
          border
          variant="text"
          :to="isClickOpenDetail ? `/display-cabinet/ships/${id}` : ''"
          :class="`pa-${props.padding} cursor-pointer`"
          height="100%"
          width="100%">
        <v-img :src="shipsData.images[props.id]" class="pointer-events-none"></v-img>
      </v-card>
    </template>

    <v-card class="demo-reel bg-black" flat border>
      <div class="demo-reel-header pa-10 position-relative">
        <h1 class="font-weight-bold">
          <ShinyText :text="t(`snb.ships.${props.id}.name`)" :speed="1" class-name="text-amber" class=""></ShinyText>
        </h1>
        <p class="mb-1">{{ props.id }}</p>

        <v-badge inline color="transparent" class="badge-flavor text-center tag-badge pl-3" v-if="i && i.size">{{ t(`displayCabinet.size.${i.size}`) }}</v-badge>

        <v-img :src="shipsData.images[props.id]" class="right-show-item-image position-absolute w-33"></v-img>
      </div>
      <div class="demo-reel-content pa-5 background-flavor overflow-auto">
        <v-expansion-panels v-model="shipsData.panel[props.id]">
          <v-expansion-panel
              v-if="isShowDescription"
              title="描述">
            <template v-slot:text>
              {{ t(`snb.ships.${props.id}.description.general`) }}
            </template>
          </v-expansion-panel>
          <v-expansion-panel
              title="基础信息">
            <template v-slot:text>
              <v-text-field :value="i.hitPoints" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">血量</p>
                </template>
              </v-text-field>

              <v-text-field :value="i.braceStrength" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">增强力量</p>
                </template>
              </v-text-field>

              <p class="mt-4"><b>速度 (kts)</b></p>
              <v-text-field :value="i.sailSpeed.halfSail" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">最低</p>
                </template>
              </v-text-field>
              <v-text-field :value="i.sailSpeed.fullSail" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">全速</p>
                </template>
              </v-text-field>
              <v-text-field :value="i.sailSpeed.fullSail" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">极限</p>
                </template>
              </v-text-field>

              <p class="mt-4"><b>容器</b></p>
              <v-text-field :value="i.cargo.cargoSlots" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">格子</p>
                </template>
              </v-text-field>
              <v-text-field :value="i.cargo.cargoMaxWeight" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">容量</p>
                </template>
              </v-text-field>
            </template>
          </v-expansion-panel>
          <v-expansion-panel
              title="词条">
            <template v-slot:text>
              <PerksWidget class="mt-n0 ml-n4 mr-n4" :data="i" v-if="i.perks.length > 0"></PerksWidget>
              <template v-else>
                <EmptyView></EmptyView>
              </template>
            </template>
          </v-expansion-panel>
          <v-expansion-panel
              text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
              title="插槽">
            <template v-slot:text>
              <template v-if="i.slots.attachement">
                <v-text-field :value="i.slots.attachement[0]" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">附件</p>
                  </template>
                </v-text-field>
              </template>

              <template v-if="i.slots.frontWeapon">
                <p class="mt-4">
                  <v-row align="center">
                    <v-col><b>前武器</b></v-col>
                    <v-col cols>
                      <v-divider></v-divider>
                    </v-col>
                    <v-col align="right">
                      {{ i.slots.frontWeapon[0] }}
                    </v-col>
                  </v-row>
                </p>
                <v-text-field :value="i.slots.frontWeapon[1].top" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">顶层甲板</p>
                  </template>
                </v-text-field>
                <v-text-field :value="i.slots.frontWeapon[1].lower" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">下层甲板</p>
                  </template>
                </v-text-field>
              </template>

              <template v-if="i.slots.leftSideWeapon">
                <p class="mt-4">
                  <v-row align="center">
                    <v-col><b>左侧武器</b></v-col>
                    <v-col cols>
                      <v-divider></v-divider>
                    </v-col>
                    <v-col align="right" v-if="i.slots.leftSideWeapon[0]">
                      {{ i.slots.leftSideWeapon[0] }}
                    </v-col>
                  </v-row>
                </p>
                <v-text-field :value="i.slots.leftSideWeapon[1].top" readonly
                              hide-details
                              v-if="i.slots.leftSideWeapon[1].top"
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">顶层甲板</p>
                  </template>
                </v-text-field>
                <v-text-field :value="i.slots.leftSideWeapon[1].lower" readonly
                              hide-details
                              v-if="i.slots.leftSideWeapon[1].lower"
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">下层甲板</p>
                  </template>
                </v-text-field>
              </template>

              <template v-if="i.slots.rightSideWeapon">
                <p class="mt-4">
                  <v-row align="center">
                    <v-col><b>右侧武器</b></v-col>
                    <v-col cols>
                      <v-divider></v-divider>
                    </v-col>
                    <v-col align="right" v-if="i.slots.rightSideWeapon[0]">
                      {{ i.slots.rightSideWeapon[0] }}
                    </v-col>
                  </v-row>
                </p>
                <v-text-field :value="i.slots.rightSideWeapon[1].top" readonly
                              hide-details
                              v-if="i.slots.rightSideWeapon[1].top"
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">顶层甲板</p>
                  </template>
                </v-text-field>
                <v-text-field :value="i.slots.rightSideWeapon[1].lower" readonly
                              hide-details
                              v-if="i.slots.rightSideWeapon[1].lower"
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">下层甲板</p>
                  </template>
                </v-text-field>
              </template>

              <template v-if="i.slots.aftWeapon">
                <p class="mt-4">
                  <v-row align="center">
                    <v-col><b>后置武器</b></v-col>
                    <v-col cols>
                      <v-divider></v-divider>
                    </v-col>
                    <v-col align="right" v-if="i.slots.aftWeapon[0]">
                      {{ i.slots.aftWeapon[0] }}
                    </v-col>
                  </v-row>
                </p>
                <v-text-field :value="i.slots.aftWeapon[1].top" readonly
                              hide-details
                              v-if="i.slots.aftWeapon[1].top"
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">顶层甲板</p>
                  </template>
                </v-text-field>
                <v-text-field :value="i.slots.aftWeapon[1].lower" readonly
                              hide-details
                              v-if="i.slots.aftWeapon[1].lower"
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">下层甲板</p>
                  </template>
                </v-text-field>
              </template>

              <template v-if="i.slots.auxiliaryWeapon">
                <p class="mt-4"></p>
                <v-text-field :value="i.slots.auxiliaryWeapon[0]" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">辅助武器</p>
                  </template>
                </v-text-field>
              </template>

              <template v-if="i.slots.furniture">
                <p class="mt-4"></p>
                <v-text-field :value="i.slots.furniture[0]" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">家具</p>
                  </template>
                </v-text-field>
              </template>

              <template v-if="i.slots.ultimate">
                <p class="mt-4"></p>
                <v-text-field :value="i.slots.ultimate[0]" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">ultimate</p>
                  </template>
                </v-text-field>
              </template>
            </template>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-btn :to="`/display-cabinet/ships/${props.id}`" target="_blank" class="mt-4" density="comfortable" v-if="isShowOpenDetail">
          <v-icon icon="mdi-help"></v-icon>
          详情
        </v-btn>
      </div>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">
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
