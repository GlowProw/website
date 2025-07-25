<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {Item, Items} from "glow-prow-data/src/entity/Items.ts";
import {computed, onMounted, ref, type Ref, type UnwrapRef} from "vue";

import ItemSlotBase from "../../../components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "../../../components/snbWidget/itemIconWidget.vue";
import MaterialIconWidget from "../../../components/snbWidget/materialIconWidget.vue";
import EmptyView from "../../../components/EmptyView.vue";
import FactionIconWidget from "../../../components/snbWidget/factionIconWidget.vue";

import {Materials} from "glow-prow-data";
import ItemModificationWidget from "../../../components/snbWidget/itemModificationWidget.vue";
import PerksWidget from "../../../components/snbWidget/perksWidget.vue";
import {i18n} from "../../../assets/sripts";

const
    {t} = useI18n(),
    router = useRouter(),
    route = useRoute(),

    // 物品数据
    itemsData: Items = Items,
    materials: Materials = Materials,
    // 后期处理所需物品 对应计算 原材料
    itemRawMaterials: Ref<UnwrapRef<any[]>, UnwrapRef<any[]> | any[]> = ref([])

// materials: Materials = Materials,
// 后期处理所需物品 对应计算 原材料
// shipRawMaterials: Ref<UnwrapRef<any[]>, UnwrapRef<any[]> | any[]> = ref([])

let
    itemDetailPageData: Ref<{ id: string, img: string }> = ref({
      id: 'dhow',
      img: ''
    }),
    itemDetailData: Ref<Item | null> = ref(null),
    isShowShipRawList = ref(false),

    // 射速
    bluePrint = computed(() => t(`snb.locations.${itemDetailData.value?.blueprint}`)),
    rateFire = computed(() => 1),
    dpsWithPerksArmed = computed(() => {
      return itemDetailData.value?.damagePerShot + 1;
    });

onMounted(() => {
  const {id} = route.params;

  if (!id) {
    router.push('/')
    return;
  }

  if (!itemsData[id]) {
    setInterval(() => router.push({name: 'NotFound'}), 1000)
    return;
  }

  itemDetailData.value = itemsData[id];

  onStatisticsRawMaterial();
})

/**
 * 处理计算必要材料对应原材料
 */
const onStatisticsRawMaterial = () => {
  if (itemDetailData.value.required)
    itemRawMaterials.value = Object.entries(itemDetailData.value.required).reduce(
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
      <v-breadcrumbs-item to="/display-cabinet/items">{{ t('displayCabinet.items.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.item.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>

  <div class="items-detail" v-if="itemDetailData && itemDetailData.id">
    <div class="items-detail-header">
      <v-container class="position-relative">

        <v-row>
          <v-col>
            <h1 class="text-amber text-h2">{{
                i18n.asString([
                  `snb.items.${itemDetailData.id}.name`,
                  `snb.items.${i18n.sanitizeString(itemDetailData.id).cleaned}.name`
                ])
              }}</h1>
            <p class="mt-2 mb-3">id: {{ itemDetailData.id || 'none' }}</p>

            <router-link :to="`/display-cabinet/item/category/${itemDetailData.type}`">
              <v-badge inline color="transparent"
                       class="badge-flavor text-center tag-badge pl-4">
                {{ t(`displayCabinet.type.${itemDetailData.type}`) }}
              </v-badge>
            </router-link>

            <v-badge inline color="transparent" class="badge-flavor text-center tag-badge pl-4 ml-2" v-if="itemDetailData.tier">{{ t(`displayCabinet.tier.${itemDetailData.tier}`) }}</v-badge>
            <v-badge inline color="transparent" class="badge-flavor text-center tag-badge pl-4 ml-2" v-if="itemDetailData.rarity">{{ t(`displayCabinet.rarity.${itemDetailData.rarity}`) }}</v-badge>

          </v-col>
          <v-spacer></v-spacer>
        </v-row>
      </v-container>
    </div>
    <div class="background-flavor">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="8" lg="8" order="2" order-sm="1">
            <v-row>
              <ItemSlotBase size="130px" class="mr-3">
                <ItemIconWidget :id="itemDetailData.id" :isOpenDetail="false" :isShowOpenDetail="false"></ItemIconWidget>
              </ItemSlotBase>
              <v-col>
                <p class="text-pre-wrap mb-4">
                  <span v-for="(i ,index) in i18n.asArray([
                      `snb.items.${itemDetailData.id}.description`,
                      `snb.items.${itemDetailData.id}.description.general`
                    ])" :key="index">
                    {{ i }}
                  </span>
                </p>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row>
              <v-col cols="12" sm="12" lg="6" xl="6">
                <template v-if="route.query.debug">
                  {{ itemDetailData }}
                </template>
                <v-text-field :value="itemDetailData.weight" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">重量</p>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12" sm="12" lg="6" xl="6">
                <template v-if="itemDetailData.projectilesPerShot">
                  <v-text-field :value="itemDetailData.projectilesPerShot" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">弹匣尺寸</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="dpsWithPerksArmed">
                  <v-text-field :value="dpsWithPerksArmed" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">DPS </p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="itemDetailData.damagePerShot">
                  <v-text-field :value="itemDetailData.damagePerShot" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">每次射击的伤害</p>
                    </template>
                  </v-text-field>
                </template>
                <!--                {{ itemDetailData.damageMitigation }}-->
                <!--                <v-text-field :value="itemDetailData.damageMitigation" readonly-->
                <!--                              hide-details-->
                <!--                              variant="underlined" density="compact">-->
                <!--                  <template v-slot:append-inner>-->
                <!--                    <p class="text-no-wrap">Damage per Shot with Perks </p>-->
                <!--                  </template>-->
                <!--                </v-text-field>-->
                <template v-if="itemDetailData.reloadSpeed">
                  <v-text-field :value="itemDetailData.reloadSpeed / 1000" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">重新加载速度（秒） </p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="itemDetailData.optimalRange">
                  <v-text-field :value="itemDetailData.optimalRange" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">范围（米）</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="itemDetailData.projectileSpeed">
                  <v-text-field :value="itemDetailData.projectileSpeed" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">射弹速度（米/秒） </p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
              <v-col cols="12">
                <v-divider>材料</v-divider>
              </v-col>
              <v-col cols="12" sm="12" lg="6" xl="6">
                <p class="mt-4 mb-2"><b>建造所需物品</b></p>
                <template v-if="itemDetailData.required && Object.keys(itemDetailData.required).length > 0">
                  <div v-for="([key, value], rIndex) in Object.entries(itemDetailData.required)"
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
                  <v-btn density="compact" icon @click="isShowShipRawList = !isShowShipRawList" v-if="Object.keys(itemRawMaterials).length > 0">
                    <v-icon :icon="`mdi-menu-${isShowShipRawList ? 'down' : 'up'}`"></v-icon>
                  </v-btn>
                </v-row>
                <template v-if="Object.entries(itemRawMaterials).length > 0">
                  <div v-for="([key, value], rIndex) in Object.entries(itemRawMaterials)"
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
            <v-card class="mb-4 pl-3" v-if="itemDetailData.bySeason">
              <v-text-field :value="itemDetailData.bySeason || 'none'" readonly
                            tile
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
            <template v-if="itemDetailData.requiredRank">
              <v-text-field :value="itemDetailData.requiredRank" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">最低使用等级</p>
                </template>
              </v-text-field>
            </template>
            <template v-if="itemDetailData.gearScore">
              <v-text-field :value="itemDetailData.gearScore || 'none'" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">分数</p>
                </template>
              </v-text-field>
            </template>
            <template v-if="itemDetailData.rarity">
              <v-text-field :value="itemDetailData.rarity || 'none'" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">稀有度</p>
                </template>
              </v-text-field>
            </template>
            <v-text-field :value="itemDetailData.dateAdded" readonly
                          hide-details
                          variant="underlined" density="compact">
              <template v-slot:append-inner>
                <p class="text-no-wrap">添加日期</p>
              </template>
            </v-text-field>
            <v-text-field :value="itemDetailData.lastUpdated" readonly
                          hide-details
                          variant="underlined" density="compact">
              <template v-slot:append-inner>
                <p class="text-no-wrap">更新日期</p>
              </template>
            </v-text-field>

            <template v-if="itemDetailData.perks">
              <p class="mt-5 mb-1 font-weight-bold">词条 ({{ itemDetailData.perks.length || 0 }})</p>
              <PerksWidget :data="itemDetailData"></PerksWidget>
            </template>

            <template v-if="itemDetailData && itemDetailData.variants && itemDetailData.variants != {}">
              <p class="mt-5 mb-1 font-weight-bold">可安装模组</p>
              <ItemModificationWidget :id="itemDetailData.id" :type="itemDetailData.type"></ItemModificationWidget>
            </template>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<style scoped lang="less">
.items-detail {
  .items-detail-header {
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
