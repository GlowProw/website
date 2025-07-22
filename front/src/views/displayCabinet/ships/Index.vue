<script setup lang="ts">
import {Ships, Materials} from "glow-prow-data";
import {Ship} from "glow-prow-data/src/entity/Ships.ts";
import {Material} from "glow-prow-data/src/entity/Materials.ts";

import ItemSlot from "../../../components/v/ItemSlot.vue";
import {onMounted, ref} from "vue";
import EmptyView from "../../../components/EmptyView.vue";
import {useI18n} from "vue-i18n";

const shipsData: Ship[] = Ships,
    materialsData: any = Materials,
    {t} = useI18n()

let shipsCardData = ref({
      images: {},
      model: {},
      panel: {}
    }),
    shipsFilter = ref({
      type: 'index',
      key: ''
    });

onMounted(() => {
  console.log(materialsData)
  onReady()
})

const onReady = async () => {
  for (let key in Ships) {
    shipsCardData.value.panel[key] = 0;
    shipsCardData.value.model[key] = false;
    shipsCardData.value.images[key] = new URL(`../../../assets/images/snb/ships/${key}.png`, import.meta.url).href
  }
}

const onProcessedData = () => {
  switch (shipsFilter.value.type) {
    case 'time':
      const sortedEntries = Object.entries(shipsData).sort((a, b) => a[1].dateAdded - b[1].dateAdded);
      return Object.fromEntries(sortedEntries);
    case 'index':
    default:
      return shipsData
  }
}
</script>

<template>
  <v-container class="mt-10 mb-10">
    <v-row>
      <v-col cols="12" lg="6" xl="6">
        <h1 class="btn-flavor ships-title">船只</h1>
        <div class="w-75">
          <p>"自新大陆开拓以来，每一艘传奇战舰都在此留下印记。钢铁与风帆的交响诗，等待您的检阅。"</p>
        </div>
      </v-col>
      <v-col cols="12" lg="6" xl="6">
        <v-row>
          <v-spacer></v-spacer>
          <v-col>
            <v-text-field placeholder="搜索" hide-details variant="underlined" density="comfortable" v-model="shipsFilter.key"></v-text-field>
          </v-col>
          <v-col>
            <v-combobox density="comfortable" hide-details
                        variant="underlined"
                        v-model="shipsFilter.type" :items="['time', 'index']"></v-combobox>
          </v-col>
        </v-row>

        <v-row class="ships-list">
          <v-col cols="3" v-for="(i,index) in onProcessedData()" :key="index">
            <ItemSlot size="150px">

              <div @mouseout="shipsCardData.model[i.id] = false" class="w-100 h-100">

                <v-tooltip v-model="shipsCardData.model[i.id]"
                           min-width="450"
                           max-width="450"
                           interactive
                           content-class="pa-0" target="cursor">
                  <template v-slot:activator="{ props: activatorProps }">
                    <v-card
                        v-bind="activatorProps"
                        tile
                        border
                        variant="text"
                        class="pa-3"
                        height="100%"
                        width="100%">
                      <template v-slot:image>
                        <img class="pointer-events-none" src="../../../assets/images/portal-banner-background.png">
                      </template>

                      <v-img :src="shipsCardData.images[i.id]" class="pointer-events-none"></v-img>
                    </v-card>
                  </template>

                  <v-card class="demo-reel bg-black" flat border>
                    <div class="demo-reel-header pa-10 position-relative">
                      <h1><b>{{ t(`snb.ships.${i.id}.name`) }}</b></h1>
                      <p class="mb-1">{{ i.id }}</p>

                      <v-badge inline color="transparent" class="badge-flavor text-center tag-badge pl-3">{{ t(`displayCabinet.size.${i.size}`) }}</v-badge>

                      <v-img :src="shipsCardData.images[i.id]" class="right-show-item-image position-absolute w-33"></v-img>
                    </div>
                    <div class="demo-reel-content pa-5 background-flavor overflow-auto">
                      <v-expansion-panels v-model="shipsCardData.panel[i.id]">
                        <v-expansion-panel
                            title="描述">
                          <template v-slot:text>
                            {{ t(`snb.ships.${i.id}.description`) }}
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
                            <template v-if="i.perks.length > 0">
                              <div v-for="(p, pIndex) in i.perks" :key="pIndex" class="mb-4">
                                <p class="text-amber"><b>
                                  {{ t(`snb.ships.${i.id}.perks.${p}.title`) }}
                                </b></p>
                                <p class="opacity-80 text-pre-wrap mt-1" v-html="t(`snb.ships.${i.id}.perks.${p}.description`)"></p>
                              </div>
                            </template>
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

                      <v-btn :to="`/display-cabinet/ships/${i.id}`" class="mt-4" density="comfortable">
                        <v-icon icon="mdi-help"></v-icon>
                        详情
                      </v-btn>
                    </div>
                  </v-card>
                </v-tooltip>
              </div>
            </ItemSlot>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.ships-title {
  padding: 25px 40px;
  margin-bottom: 20px;
  font-size: 3rem;
}

.ships-list {

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
      background: url(/src/assets/images/portal-banner-background.png) 50% 0 no-repeat;
      background-size: cover;
    }
  }

  .demo-reel-content {
    max-height: 70vh;
  }

}
</style>
