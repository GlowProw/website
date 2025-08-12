<script setup lang="ts">

import {computed, onMounted, type Ref, ref, type UnwrapRef} from "vue";
import {useI18n} from "vue-i18n";
import {Materials, Ships} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";

import EmptyView from "@/components/EmptyView.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import PerksWidget from "@/components/snbWidget/perksWidget.vue";
import {Ship} from "glow-prow-data/src/entity/Ships.ts";
import {storage} from "@/assets/sripts";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {useAuthStore} from "~/stores";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import ShipWeaponInfoSlotWidget from "@/components/snbWidget/shipWeaponInfoSlotWidget.vue";
import ShipBaseInfoSlotWidget from "@/components/snbWidget/shipBaseInfoSlotWidget.vue";

const shipImages = import.meta.glob('@glow-prow-assets/ships/*.png', {eager: true});

const
    {t} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    authStore = useAuthStore(),

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
    shipDetailData: Ref<Ship> = ref(shipsData['dhow'] as Ship),
    isShowShipRawList = ref(false),

    // 蓝图
    bluePrint = computed(() => {
      const bluePrints = shipDetailData.value?.blueprint;

      if (!bluePrints)
        return null;

      if (bluePrints)
        return t(`snb.locations.${bluePrints}`)

      return Object.values(bluePrints).map(i => t(`snb.locations.${i}`))
    })

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
  onDisplayCabinetHistory()

  shipDetailPageData.value.loading = false;
})

const onDisplayCabinetHistory = () => {
  const {id} = route.params;

  let name = 'displayCabinet.history'

  const d = storage.session.get(name)

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id]: {
      id,
      type: 'ship',
      time: new Date().getTime()
    }
  })
}

/**
 * 处理计算必要材料对应原材料
 */
const onStatisticsRawMaterial = () => {
  if (shipDetailData.value.required)
    shipRawMaterials.value = Array.from(shipDetailData.value.required).reduce(
        (acc, [material, quantity]) => {
          if (materials[material.id]?.required) {
            Array.from(materials[material.id].required).reduce((j, [raw, rawQuantity]) => {
              acc[raw.id] = (acc[raw.id] || 0) + (rawQuantity as number) * quantity;
            })
          }
          return acc;
        },
        {} as Record<string, number>
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
    <div class="ships-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col>
            <h1 class="text-amber text-h2">{{ t(`snb.ships.${shipDetailPageData.id}.name`) }}</h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ shipDetailPageData.id || 'none' }}
            </p>

            <v-chip inline class="badge-flavor text-center text-black tag-badge pl-3" v-if="shipsData[shipDetailPageData.id].size">{{ t(`displayCabinet.size.${shipsData[shipDetailPageData.id].size}`) }}</v-chip>
          </v-col>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn>
                <LikeWidget v-if="authStore.isLogin"
                            targetType="ship"
                            :isShowCount="true"
                            :targetId="shipDetailPageData.id">
                  <template v-slot:activate>
                    <v-icon icon="mdi-thumb-up"></v-icon>
                  </template>
                  <template v-slot:unActivate>
                    <v-icon icon="mdi-thumb-up-outline"></v-icon>
                  </template>
                </LikeWidget>
              </v-btn>

              <v-btn>{{ t('displayCabinet.share.title') }}</v-btn>
            </div>
          </v-col>
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
                <ShipIconWidget :id="shipDetailPageData.id" class="pa-2"
                                :is-click-open-detail="false"
                                :isShowOpenDetail="false"
                                :isShowDescription="false"></ShipIconWidget>
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
                <template v-if="shipDetailData.id">
                  <v-text-field :value="shipDetailData.id" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="shipDetailData.slots.attachement">
                  <v-text-field :value="shipDetailData.slots.attachement[0]" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">附件</p>
                    </template>
                  </v-text-field>
                </template>

                <div class="mt-1">
                  <ShipWeaponInfoSlotWidget :data="shipDetailData"></ShipWeaponInfoSlotWidget>
                </div>

                <template v-if="shipDetailData.slots.furniture">
                  <v-text-field :value="shipDetailData.slots.furniture[0]" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.ship.furniture') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="shipDetailData.slots.ultimate">
                  <v-text-field :value="shipDetailData.slots.ultimate[0]" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.ship.ultimate') }}</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
              <v-col cols="12" sm="12" lg="6" xl="6">
                <ShipBaseInfoSlotWidget :data="shipDetailData"></ShipBaseInfoSlotWidget>
              </v-col>
              <v-col cols="12">
                <v-divider>{{ t('displayCabinet.ship.materialsTitle') }}</v-divider>
              </v-col>
              <v-col cols="12" sm="12" lg="6" xl="6">
                <p class="mt-4 mb-2"><b>{{ t('displayCabinet.ship.required') }}</b></p>
                <template v-if="shipDetailData.required">
                  <div v-for="([i, value], rIndex) in shipDetailData.required"
                       :key="rIndex">
                    <v-text-field
                        :value="value"
                        readonly
                        hide-details
                        variant="underlined"
                        density="compact">
                      <template v-slot:append-inner>
                        <div class="text-right">
                          <p class="text-no-wrap">{{ t(`snb.materials.${i.id}.name`) }}</p>
                          <p class="text-no-wrap mt-n2 opacity-30" v-if="route.query.debug">{{ i.id }}</p>
                        </div>
                      </template>
                      <template v-slot:prepend>
                        <MaterialIconWidget :id="i.id" item-type="items"></MaterialIconWidget>
                        <FactionIconWidget :name="materials[i.id].faction.id"
                                           v-if="materials[i.id].faction"
                                           size="20px"></FactionIconWidget>
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
                  <p><b>{{ t('displayCabinet.ship.rawMaterials') }}</b></p>
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
                        <FactionIconWidget :name="materials[key].faction.id"
                                           v-if="materials[key].faction"
                                           size="20px"></FactionIconWidget>
                      </template>
                    </v-text-field>

                    <ul class="ml-10 raw-list" v-if="!isShowShipRawList">
                      <li v-for="([raw,rawValue],rawIndex) in materials[key].required" :key="rawIndex" class="ml-10">
                        <v-text-field
                            :value="rawValue"
                            readonly
                            hide-details
                            variant="underlined"
                            density="compact">
                          <template v-slot:append-inner>
                            <div class="text-right">
                              <p class="text-no-wrap">{{ t(`snb.materials.${raw.id}.name`) }}</p>
                            </div>
                          </template>
                          <template v-slot:prepend>
                            <MaterialIconWidget :id="raw.id" item-type="items"></MaterialIconWidget>
                            <FactionIconWidget :name="materials[raw.id].faction.id"
                                               v-if="materials[raw.id].faction"
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

            <template v-if="shipDetailData.id">
              <v-divider>评论</v-divider>
              <CommentWidget :id="shipDetailData.id" type="ship" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <v-card class="mb-4 pl-3" v-if="shipDetailData.bySeason">
              <v-text-field :value="t(`snb.seasons.${shipDetailData.bySeason.id}`) || 'none'"
                            readonly
                            hide-details
                            tile
                            variant="solo-filled">
                <template v-slot:prepend>
                  <p class="text-no-wrap">{{ t('displayCabinet.ship.bySeason.prepend') }}</p>
                </template>
                <template v-slot:append-inner>
                  <p class="text-no-wrap">{{ t('displayCabinet.ship.bySeason.append') }}</p>
                </template>
              </v-text-field>
            </v-card>

            <template v-if="bluePrint">
              <v-combobox v-model="bluePrint" multiple chips readonly
                          hide-details
                          variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">{{ t('displayCabinet.ship.bluePrint') }}</p>
                </template>
                <template v-slot:append>
                  <ItemSlotBase :size="10" class="pa-0">
                    <v-icon icon="mdi-book"></v-icon>
                  </ItemSlotBase>
                </template>
              </v-combobox>
            </template>
            <template v-if="shipDetailData.requiredRank">
              <v-text-field :value="shipDetailData.requiredRank || 'none'" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">{{ t('displayCabinet.ship.requiredRank') }}</p>
                </template>
              </v-text-field>
            </template>
            <v-text-field :value="shipDetailData.dateAdded" readonly
                          hide-details
                          variant="underlined" density="compact">
              <template v-slot:append-inner>
                <p class="text-no-wrap">{{ t('displayCabinet.ship.dateAdded') }}</p>
              </template>
            </v-text-field>
            <v-text-field :value="shipDetailData.lastUpdated" readonly
                          hide-details
                          variant="underlined" density="compact">
              <template v-slot:append-inner>
                <p class="text-no-wrap">{{ t('displayCabinet.ship.lastUpdated') }}</p>
              </template>
            </v-text-field>

            <template v-if="shipDetailData.perks">
              <p class="mt-5 mb-1 font-weight-bold">{{ t('displayCabinet.ship.perks') }} ({{ shipDetailData.perks.length || 0 }})</p>
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
      z-index: 0;
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
      z-index: -1;
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
