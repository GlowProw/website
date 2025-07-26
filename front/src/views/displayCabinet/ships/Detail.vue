<script setup lang="ts">

import {computed, onMounted, type Ref, ref, type UnwrapRef} from "vue";
import {useI18n} from "vue-i18n";
import {Materials, Ships} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";

import EmptyView from "../../../components/EmptyView.vue";
import ItemSlotBase from "../../../components/snbWidget/ItemSlotBase.vue";
import ShipSailSpeedWidget from "../../../components/snbWidget/shipSailSpeedWidget.vue";
import MaterialIconWidget from "../../../components/snbWidget/materialIconWidget.vue";
import FactionIconWidget from "../../../components/snbWidget/factionIconWidget.vue";
import ShipWidget from "../../../components/snbWidget/shipWidget.vue";
import PerksWidget from "../../../components/snbWidget/perksWidget.vue";

const shipImages = import.meta.glob('@glow-prow-assets/ships/*.png', {eager: true});

const
    {t} = useI18n(),
    router = useRouter(),
    route = useRoute(),

    // 船只数据
    shipsData: Ships = Ships,
    materials: Materials = Materials,
    // 后期处理所需物品 对应计算 原材料
    shipRawMaterials: Ref<UnwrapRef<any[]>, UnwrapRef<any[]> | any[]> = ref([])

let
    shipDetailPageData: Ref<{ id: string, img: string, loading: boolean }> = ref({
      id: 'dhow',
      img: '',
      loading: false
    }),
    shipDetailData: Ref<Ships> = ref(shipsData['dhow']),
    isShowShipRawList = ref(false),

    // 蓝图
    bluePrint = computed(() => shipDetailData.value.blueprint ? t(`snb.locations.${shipDetailData.value?.blueprint}`) : null);

onMounted(() => {
  const {id} = route.params;

  if (!id) {
    router.push('/')
    return;
  }

  shipDetailPageData.value.loading = true;

  const imageKey = `/node_modules/glow-prow-assets/ships/${id}.png`;

  shipDetailData.value = shipsData[id];
  shipDetailPageData.value.id = id as string;

  if (shipImages[imageKey]) {
    shipDetailPageData.value.img = shipImages[imageKey].default;
  } else {
    shipDetailPageData.value.img = "";
  }

  onStatisticsRawMaterial()

  shipDetailPageData.value.loading = false;
})

/**
 * 处理计算必要材料对应原材料
 */
const onStatisticsRawMaterial = () => {
  shipRawMaterials.value = Object.entries(shipDetailData.value.required).reduce(
      (acc, [key, value]) => {
        if (materials[key]?.raw) {
          Object.entries(materials[key].raw).forEach(([nKey, nValue]) => {
            acc[nKey] = (acc[nKey] || 0) + nValue * value;
          });
        }
        return acc;
      },
      {} as any
  );
}
</script>

<template>
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet/ships">{{ t('displayCabinet.ships.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.ship.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>

  <div class="ships-detail" v-if="shipDetailPageData.id && !shipDetailPageData.loading">
    <div class="ships-detail-header">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col>
            <h1 class="text-amber text-h2">{{ t(`snb.ships.${shipDetailPageData.id}.name`) }}</h1>
            <p class="mt-2 mb-3">{{ shipDetailPageData.id || 'none' }}</p>

            <v-badge inline color="transparent" class="badge-flavor text-center tag-badge pl-3" v-if="shipsData[shipDetailPageData.id].size">{{ t(`displayCabinet.size.${shipsData[shipDetailPageData.id].size}`) }}</v-badge>
          </v-col>
          <v-spacer></v-spacer>
        </v-row>

        <v-img :src="shipDetailPageData.img"
               inline
               class="ships-detail-header-img pointer-events-none"></v-img>
      </v-container>
    </div>
    <div class="background-flavor">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="8" lg="8" order="2" order-sm="1">

            <v-row>
              <ItemSlotBase size="150px" class="mr-3">
                <ShipWidget :id="shipDetailPageData.id" class="pa-2"
                            :is-click-open-detail="false"
                            :isShowOpenDetail="false"
                            :isShowDescription="false"></ShipWidget>
              </ItemSlotBase>
              <v-col>
                <p class="text-pre-wrap mb-4">
                  {{ t(`snb.ships.${shipDetailPageData.id}.description.general`) }}
                </p>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row>
              <v-col cols="12" sm="12" lg="6" xl="6">
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
              <v-col cols="12" sm="12" lg="6" xl="6">
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
              <v-col cols="12" sm="12" lg="6" xl="6">
                <p class="mt-4 mb-2"><b>建造所需物品</b></p>
                <template v-if="shipDetailData.required && Object.keys(shipDetailData.required).length > 0">
                  <div v-for="([key, value], rIndex) in Object.entries(shipDetailData.required)"
                       :key="rIndex">
                    <v-text-field
                        :value="value"
                        readonly
                        hide-details
                        variant="underlined"
                        density="compact">
                      <template v-slot:append-inner>
                        <div class="text-right">
                          <p class="text-no-wrap">{{ t(`snb.materials.${key}.name`) }}</p>
                          <p class="text-no-wrap mt-n2 opacity-30" v-if="route.query.debug">{{ key }}</p>
                        </div>
                      </template>
                      <template v-slot:prepend>
                        <MaterialIconWidget :id="key" item-type="items"></MaterialIconWidget>
                      </template>
                    </v-text-field>
                  </div>
                </template>
                <template v-else>
                  <EmptyView></EmptyView>
                </template>
              </v-col>
              <v-col cols="12" sm="12" lg="6" xl="6">
                <v-row class="mt-4 mb-1">
                  <p><b>原材料</b></p>
                  <v-spacer></v-spacer>
                  <v-btn density="compact" icon @click="isShowShipRawList = !isShowShipRawList" v-if="Object.keys(shipRawMaterials).length > 0">
                    <v-icon :icon="`mdi-menu-${isShowShipRawList ? 'down' : 'up'}`"></v-icon>
                  </v-btn>
                </v-row>
                <template v-if="Object.entries(shipRawMaterials).length > 0">
                  <div v-for="([key, value], rIndex) in Object.entries(shipRawMaterials)"
                       :key="rIndex">
                    <v-text-field
                        :value="value"
                        readonly
                        hide-details
                        variant="underlined"
                        density="compact">
                      <template v-slot:append-inner>
                        <div class="text-right">
                          <p class="text-no-wrap">{{ t(`snb.materials.${key}.name`) }}</p>
                          <p class="text-no-wrap mt-n2 opacity-30" v-if="route.query.debug">{{ key }}</p>
                        </div>
                      </template>
                      <template v-slot:prepend>
                        <MaterialIconWidget :id="key" item-type="items"></MaterialIconWidget>
                        <FactionIconWidget :name="materials[key].faction"
                                           v-if="materials[key].faction"
                                           size="20px"></FactionIconWidget>
                      </template>
                    </v-text-field>

                    <ul class="ml-10 raw-list" v-if="!isShowShipRawList">
                      <li v-for="(rawKey,rawValue) in materials[key].raw" :key="rawKey" class="ml-10">
                        <v-text-field
                            :value="value"
                            readonly
                            hide-details
                            variant="underlined"
                            density="compact">
                          <template v-slot:append-inner>
                            <div class="text-right">
                              <p class="text-no-wrap">{{ t(`snb.materials.${rawValue}.name`) }}</p>
                            </div>
                          </template>
                          <template v-slot:prepend>
                            <MaterialIconWidget :id="rawValue.toString()" item-type="items"></MaterialIconWidget>
                            <FactionIconWidget :name="materials[key].faction"
                                               v-if="materials[key].faction"
                                               size="20px"></FactionIconWidget>
                          </template>
                        </v-text-field>
                      </li>
                    </ul>
                  </div>
                </template>
                <template v-else>
                  <EmptyView></EmptyView>
                </template>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <v-card class="mb-4 pl-3" v-if="shipDetailData.bySeason">
              <v-text-field :value="t(`snb.seasons.${shipDetailData.bySeason}`) || 'none'" readonly
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

            <template v-if="bluePrint">
              <v-text-field :value="bluePrint" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">蓝图</p>
                </template>
                <template v-slot:append>
                  <ItemSlotBase :size="10" class="pa-0">
                    <v-icon icon="mdi-book"></v-icon>
                  </ItemSlotBase>
                </template>
              </v-text-field>
            </template>
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

            <template v-if="shipDetailData.perks">
              <p class="mt-5 mb-1 font-weight-bold">词条 ({{ shipDetailData.perks.length || 0 }})</p>
              <PerksWidget :data="shipDetailData"></PerksWidget>
            </template>
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
      background: url(@/assets/images/portal-banner-background.png) 50% 0 no-repeat;
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

  .raw-list {
    list-style-type: none !important;
  }
}
</style>
