<script setup lang="ts">

import {onMounted, type Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Ship} from "glow-prow-data/src/entity/Ships.ts";
import {Material} from "glow-prow-data/src/entity/Materials.ts";
import {Materials, Ships} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";

import EmptyView from "../../../components/EmptyView.vue";
import ItemSlot from "../../../components/v/ItemSlot.vue";
import ShipSailSpeedWidget from "../../../components/v/shipSailSpeedWidget.vue";

const
    {t} = useI18n(),
    router = useRouter(),
    route = useRoute(),

    // 船只数据
    shipsData: Ship[] = Ships,
    materials: Material[] = Materials,
    // 后期处理所需物品 对应计算 原材料
    shipRawMaterials: [] = ref([])

let
    shipDetailPageData = ref({
      id: 'dhow',
      img: ''
    }),
    shipDetailData
        :
        Ref<Ship> = ref(shipsData['dhow'])

onMounted(() => {
  if (!route.params.id) {
    router.push('/')
    return;
  }
  shipDetailData.value = shipsData[route.params.id];
  shipDetailPageData.value.id = route.params.id;
  shipDetailPageData.value.img = new URL(`../../../assets/images/snb/ships/${route.params.id}.png`, import.meta.url).href;

  onStatisticsRawMaterial()
})

/**
 * 处理计算必要材料对应原材料
 */
const onStatisticsRawMaterial = () => {
  shipRawMaterials.value = Object.entries(shipDetailData.value.required).reduce(
      (acc, [key, value]) => {
        if (materials[key]?.raw) {
          Object.entries(materials[key].raw).forEach(([nKey, nValue]) => {
            acc[nKey] = (acc[nKey] || 0) + nValue * value; // 累加逻辑（可选）
          });
        }
        return acc;
      },
      {} as Record<string, number>
  );
}
</script>

<template>
  <div class="ships-detail" v-if="shipDetailPageData.id">
    <div class="pt-10 ships-detail-header">
      <v-container class="position-relative">
        <v-row>
          <v-col>
            <h1 class="text-amber text-h2">{{ t(`snb.ships.${shipDetailPageData.id}.name`) }}</h1>
            <p class="mt-2 mb-3">{{ shipDetailPageData.id || 'none' }}</p>

            <v-badge inline color="transparent" class="badge-flavor text-center tag-badge pl-3">{{ t(`displayCabinet.size.${shipsData[shipDetailPageData.id].size}`) }}</v-badge>
          </v-col>
          <v-spacer></v-spacer>
        </v-row>

        <v-img :src="shipDetailPageData.img"
               inline
               class="ships-detail-header-img  pointer-events-none"></v-img>
      </v-container>
    </div>
    <div class="background-flavor">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="8" lg="8">

            <p class="text-pre-wrap mb-4">
              {{ t(`snb.ships.${shipDetailPageData.id}.description`) }}
            </p>

            <v-divider></v-divider>

            <v-row>
              <v-col cols="6">
                <template v-if="shipDetailData.slots.attachement">
                  <v-text-field :value="shipDetailData.slots.attachement[0]" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">附件</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="shipDetailData.slots.frontWeapon">
                  <p class="mt-4">
                    <v-row align="center">
                      <v-col><b>前武器</b></v-col>
                      <v-col cols>
                        <v-divider></v-divider>
                      </v-col>
                      <v-col align="right">
                        {{ shipDetailData.slots.frontWeapon[0] }}
                      </v-col>
                    </v-row>
                  </p>
                  <v-text-field :value="shipDetailData.slots.frontWeapon[1].top" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">顶层甲板</p>
                    </template>
                  </v-text-field>
                  <v-text-field :value="shipDetailData.slots.frontWeapon[1].lower" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">下层甲板</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="shipDetailData.slots.leftSideWeapon">
                  <p class="mt-4">
                    <v-row align="center">
                      <v-col><b>左侧武器</b></v-col>
                      <v-col cols>
                        <v-divider></v-divider>
                      </v-col>
                      <v-col align="right" v-if="shipDetailData.slots.leftSideWeapon[0]">
                        {{ shipDetailData.slots.leftSideWeapon[0] }}
                      </v-col>
                    </v-row>
                  </p>
                  <v-text-field :value="shipDetailData.slots.leftSideWeapon[1].top" readonly
                                hide-details
                                v-if="shipDetailData.slots.leftSideWeapon[1].top"
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">顶层甲板</p>
                    </template>
                  </v-text-field>
                  <v-text-field :value="shipDetailData.slots.leftSideWeapon[1].lower" readonly
                                hide-details
                                v-if="shipDetailData.slots.leftSideWeapon[1].lower"
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">下层甲板</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="shipDetailData.slots.rightSideWeapon">
                  <p class="mt-4">
                    <v-row align="center">
                      <v-col><b>右侧武器</b></v-col>
                      <v-col cols>
                        <v-divider></v-divider>
                      </v-col>
                      <v-col align="right" v-if="shipDetailData.slots.rightSideWeapon[0]">
                        {{ shipDetailData.slots.rightSideWeapon[0] }}
                      </v-col>
                    </v-row>
                  </p>
                  <v-text-field :value="shipDetailData.slots.rightSideWeapon[1].top" readonly
                                hide-details
                                v-if="shipDetailData.slots.rightSideWeapon[1].top"
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">顶层甲板</p>
                    </template>
                  </v-text-field>
                  <v-text-field :value="shipDetailData.slots.rightSideWeapon[1].lower" readonly
                                hide-details
                                v-if="shipDetailData.slots.rightSideWeapon[1].lower"
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">下层甲板</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="shipDetailData.slots.aftWeapon">
                  <p class="mt-4">
                    <v-row align="center">
                      <v-col><b>后置武器</b></v-col>
                      <v-col cols>
                        <v-divider></v-divider>
                      </v-col>
                      <v-col align="right" v-if="shipDetailData.slots.aftWeapon[0]">
                        {{ shipDetailData.slots.aftWeapon[0] }}
                      </v-col>
                    </v-row>
                  </p>
                  <v-text-field :value="shipDetailData.slots.aftWeapon[1].top" readonly
                                hide-details
                                v-if="shipDetailData.slots.aftWeapon[1].top"
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">顶层甲板</p>
                    </template>
                  </v-text-field>
                  <v-text-field :value="shipDetailData.slots.aftWeapon[1].lower" readonly
                                hide-details
                                v-if="shipDetailData.slots.aftWeapon[1].lower"
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">下层甲板</p>
                    </template>
                  </v-text-field>
                </template>

                <template v-if="shipDetailData.slots.auxiliaryWeapon">
                  <p class="mt-4"></p>
                  <v-text-field :value="shipDetailData.slots.auxiliaryWeapon[0]" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">辅助武器</p>
                    </template>
                  </v-text-field>
                </template>

                <template v-if="shipDetailData.slots.furniture">
                  <p class="mt-4"></p>
                  <v-text-field :value="shipDetailData.slots.furniture[0]" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">家具</p>
                    </template>
                  </v-text-field>
                </template>

                <template v-if="shipDetailData.slots.ultimate">
                  <p class="mt-4"></p>
                  <v-text-field :value="shipDetailData.slots.ultimate[0]" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ultimate</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
              <v-col cols="6">
                <v-text-field :value="shipDetailData.hitpoints" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">血量</p>
                  </template>
                </v-text-field>

                <v-text-field :value="shipDetailData.braceStrength" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">增强力量</p>
                  </template>
                </v-text-field>

                <p class="mt-4"><b>速度 (kts)</b></p>
                <ShipSailSpeedWidget :data="shipDetailData"></ShipSailSpeedWidget>

                <p class="mt-4"><b>容器</b></p>
                <v-text-field :value="shipDetailData.cargo.cargoSlots" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">格子</p>
                  </template>
                </v-text-field>
                <v-text-field :value="shipDetailData.cargo.cargoMaxWeight" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">容量</p>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12">
                <v-divider>材料</v-divider>
              </v-col>
              <v-col cols="6">
                <template v-if="shipDetailData.required">
                  <p class="mt-4"><b>建造所需物品</b></p>
                  <div v-for="([key, value], rIndex) in Object.entries(shipDetailData.required)"
                       :key="rIndex">
                    <v-text-field
                        :value="value"
                        readonly
                        hide-details
                        variant="underlined"
                        density="compact">
                      <template v-slot:append-inner>
                        <p class="text-no-wrap">{{ key }}</p>
                      </template>
                      <template v-slot:prepend>
                        <ItemSlot :size="10" class="pa-0">
                          <img src="../../../assets/images/loading.gif" width="20px" height="20px">
                        </ItemSlot>
                      </template>
                    </v-text-field>
                  </div>
                </template>
              </v-col>
              <v-col cols="6">
                <p class="mt-4"><b>原材料</b></p>
                <div v-for="([key, value], rIndex) in Object.entries(shipRawMaterials)"
                     :key="rIndex">
                  <v-text-field
                      :value="value"
                      readonly
                      hide-details
                      variant="underlined"
                      density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ key }}</p>
                    </template>
                    <template v-slot:prepend>
                      <ItemSlot :size="10" class="pa-0">
                        <img src="../../../assets/images/loading.gif" width="20px" height="20px">
                      </ItemSlot>
                    </template>
                  </v-text-field>
                </div>
              </v-col>
              <v-col>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4">

            <v-card class="mb-4 pl-3">
              <v-text-field :value="shipDetailData.bySeason || 'none'" readonly
                            hide-details
                            variant="solo-filled">
                <template v-slot:prepend>
                  <p class="text-no-wrap">出自</p>
                </template>
                <template v-slot:append-inner>
                  <p class="text-no-wrap">赛季</p>
                </template>
              </v-text-field>
            </v-card>

            <v-text-field :value="shipDetailData.blueprint" readonly
                          hide-details
                          variant="underlined" density="compact">
              <template v-slot:append-inner>
                <p class="text-no-wrap">蓝图</p>
              </template>
              <template v-slot:append>
                <ItemSlot :size="10" class="pa-0">
                  <img src="../../../assets/images/loading.gif" width="20px" height="20px">
                </ItemSlot>
              </template>
            </v-text-field>
            <v-text-field :value="shipDetailData.requiredRank || 'none'" readonly
                          hide-details
                          variant="underlined" density="compact">
              <template v-slot:append-inner>
                <p class="text-no-wrap">最低使用等级</p>
              </template>
            </v-text-field>
            <v-text-field :value="shipDetailData.dateAdded" readonly
                          hide-details
                          variant="underlined" density="compact">
              <template v-slot:append-inner>
                <p class="text-no-wrap">添加日期</p>
              </template>
            </v-text-field>
            <v-text-field :value="shipDetailData.lastUpdated" readonly
                          hide-details
                          variant="underlined" density="compact">
              <template v-slot:append-inner>
                <p class="text-no-wrap">更新日期</p>
              </template>
            </v-text-field>

            <v-card class="mt-5 pa-5">
              <template v-if="shipDetailData.perks.length > 0">
                <div v-for="(p, pIndex) in shipDetailData.perks" :key="pIndex" class="mb-4">
                  <p class="text-amber"><b>
                    {{ t(`snb.ships.${shipDetailData.id}.perks.${p}.title`) }}
                  </b></p>
                  <p class="opacity-80 text-pre-wrap mt-1" v-html="t(`snb.ships.${shipDetailData.id}.perks.${p}.description`)"></p>
                </div>
              </template>
              <template v-else>
                <EmptyView></EmptyView>
              </template>
            </v-card>
          </v-col>
        </v-row>

      </v-container>
    </div>
  </div>

</template>

<style scoped lang="less">
.ships-detail {
  .ships-detail-header {
    background-color: #000;
    position: relative;
    padding-bottom: 40px;
    min-height: 320px;

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

    .ships-detail-header-img {
      position: absolute;
      right: 20px;
      bottom: -120px;
      width: 300px;
      min-height: 300px;
    }
  }
}
</style>
