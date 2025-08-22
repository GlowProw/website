<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {Item, Items} from "glow-prow-data/src/entity/Items.ts";
import {computed, onMounted, ref, type Ref, type UnwrapRef, watch} from "vue";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import EmptyView from "@/components/EmptyView.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";

import {Materials} from "glow-prow-data";
import ItemModificationWidget from "@/components/snbWidget/itemModificationWidget.vue";
import PerksWidget from "@/components/snbWidget/perksWidget.vue";

import {useI18nUtils} from "@/assets/sripts/i18n_util";
import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue"
import ItemDamageTypeWidget from "@/components/snbWidget/itemDamageTypeWidget.vue";
import {number, storage, storageCollect} from "@/assets/sripts";
import WeaponModificationWidget from "@/components/snbWidget/weaponModificationWidget.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {useAuthStore} from "~/stores/userAccountStore";
import {StorageCollectType} from "@/assets/sripts/storage_collect";
import ItemName from "@/components/snbWidget/itemName.vue";
import {useHead} from "@unhead/vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ItemContentWidget from "@/components/snbWidget/itemContentWidget.vue";
import BySeasonWidget from "@/components/bySeasonWidget.vue";

const
    {t, messages} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    authStore = useAuthStore(),
    {asArray, asString, sanitizeString} = useI18nUtils(),
    i18nReadName = useI18nReadName(),

    // 物品数据
    items: Items = Items,
    materials: Materials = Materials,
    // 后期处理所需物品 对应计算 原材料
    itemRawMaterials: Ref<UnwrapRef<any[]>, UnwrapRef<any[]> | any[]> = ref([])

let itemDetailData: Ref<Item | null> = ref(null),
    isShowShipRawList = ref(false),
    isCollect = ref(false),

    DPS = computed(() => {
      const {damagePerShot, rateOfFire, reloadSpeed} = itemDetailData.value;
      return Math.round(damagePerShot / ((rateOfFire * 0.001) + (reloadSpeed * 0.001)))
    }),
    DPSWithPerks = computed(() => {
      const {damageMitigation} = itemDetailData.value;
      return DPS / damageMitigation?.piercing || 0
    }),
    DamagePerShotWithPerks = computed(() => 0),
    obtainable = computed(() => {
      return filterByObtainable(itemDetailData.value)
    }),
    bluePrint = computed(() => {
      let bluePrints = itemDetailData.value?.blueprint;

      if (!bluePrints)
        return null;

      if (bluePrints)
        return t(`snb.locations.${bluePrints}`)

      return Object.values(bluePrints[0]).map(i => t(`snb.locations.${i}`))
    }),
    getCollectStatus = computed(() => {
      if (!itemDetailData.value && !itemDetailData.value.id) return false;
      isCollect.value = !isCollect.value;
      return !!storageCollect.get(itemDetailData.value.id, StorageCollectType.Item).data
    }),
    requiredRank = computed(() => {
      const r = sanitizeString(itemDetailData.value.requiredRank)
      return asString([
        `snb.ranks.${itemDetailData.value.requiredRank}`,
        `snb.ranks.${r.cleaned}`
      ], {
        variable: {
          lv: number.intToRoman(r.removedNumbers[0])
        }
      })
    }),
    rateFire = computed(() => 1),
    dpsWithPerksArmed = computed(() => {
      return itemDetailData.value?.damagePerShot + 1;
    }),

    // meta
    head = ref({
      title: t(route.meta.title),
      titleTemplate: `%s | ${t('name')}`,
      meta: [
        {name: 'keywords', content: t(route.meta.keywords)},
        {name: 'og:title', content: `%s | ${t('name')}`},
      ]
    })

useHead(head)

watch(() => route.path, (value) => {
  console.log(value)
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = () => {
  const {id} = route.params;

  if (!id) {
    router.push('/')
    return;
  }

  if (!items[id]) {
    setInterval(() => router.push({name: 'NotFound'}), 1000)
    return;
  }

  itemDetailData.value = items[id];

  head.value.titleTemplate = `${i18nReadName.item(id).name()} - ${head.value.titleTemplate}`
  head.value.meta = [
    {
      name: 'keywords', content: t(route.meta.keywords, {
        keywords: Object.keys(messages.value).map(lang => {
          return i18nReadName.item(id).keys.map(key => i18nReadName.getValue(messages.value[lang], key)).filter(i => i != null)
        }).concat([id])
      })
    },
    {name: 'og:title', content: `${t(route.meta.title)} | ${t('name')}`},
  ]

  onStatisticsRawMaterial();
  onDisplayCabinetHistory();
}

const onDisplayCabinetHistory = () => {
  const {id} = route.params;

  let name = 'displayCabinet.history'

  const d = storage.session.get(name)

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id]: {
      id,
      type: 'item',
      time: new Date().getTime()
    }
  })
}

/**
 * 处理计算必要材料对应原材料
 */
const onStatisticsRawMaterial = () => {
  console.log(itemDetailData)
  if (itemDetailData.value.required)
    itemRawMaterials.value = Array.from(itemDetailData.value.required).reduce(
        (acc, [material, quantity]) => {
          if (materials[material.id]?.required) {
            Array.from(materials[material.id].required).forEach(([raw, rawQuantity]) => {
              acc[raw.id] = (acc[raw.id] || 0) + (rawQuantity as number) * quantity;
            })
          }
          return acc;
        },
        {} as Record<string, number>
    );
}

/**
 * 收藏物品
 */
const onStarItem = (data: Item) => {
  isCollect.value = !isCollect.value;

  if (isCollect.value)
    return storageCollect.delete(data.id, StorageCollectType.Item)

  storageCollect.updata(
      {collectTime: new Date().getTime()}
      , StorageCollectType.Item,
      data.id
  )
}

const filterByObtainable = (item: Item) => {
  let array = []
  if (!item.id) return [];

  const obtainable = item.obtainable;

  if (typeof obtainable === 'string') {

    array.push({
      id: obtainable,
      to: `/display-cabinet/item/obtainable/${obtainable}`
    });

  } else if (obtainable && typeof obtainable === 'object' && 'id' in obtainable) {

    array.push({
      id: obtainable.id,
      to: `/display-cabinet/item/${obtainable.id}`,
      item: items[obtainable.id]
    })

  } else if (Array.isArray(obtainable)) {

    const flatArray = obtainable.flat();

    flatArray.forEach(element => {
      if (typeof element === 'string') {
        array.push({
          id: element,
          to: `/display-cabinet/item/obtainable/${element}`
        });
      } else if (element && typeof element === 'object' && 'id' in element) {
        array.push({
          id: element.id,
          to: `/display-cabinet/item/${element.id}`,
          item: items[element.id]
        });
      }
    });
  }

  return array;
};
</script>

<template>
  <v-breadcrumbs>
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
    <div class="items-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col cols="8">
            <h1 class="text-amber text-h2 singe-line">
              <ItemName :data="itemDetailData"></ItemName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ itemDetailData.id || 'none' }}
            </p>

            <div class="mt-5 d-flex ga-2">
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      :to="`/display-cabinet/item/category/${itemDetailData.type}`">
                {{ t(`displayCabinet.type.${itemDetailData.type}`) || '' }}
              </v-chip>
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      :to="`/display-cabinet/item/tier/${itemDetailData.tier}`"
                      v-if="itemDetailData.tier">{{ t(`displayCabinet.tier`, {num: number.intToRoman(itemDetailData.tier)}) }}
              </v-chip>
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      :to="`/display-cabinet/item/rarity/${itemDetailData.rarity}`"
                      v-if="itemDetailData.rarity">{{ t(`displayCabinet.rarity.${itemDetailData.rarity}`) }}
              </v-chip>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn @click="onStarItem(itemDetailData)" variant="text" :class="getCollectStatus ? 'text-amber' : ''">
                <v-icon :icon="`mdi-${getCollectStatus ? 'star' : 'star-outline'}`"></v-icon>
              </v-btn>

              <v-btn v-if="authStore.isLogin">
                <LikeWidget targetType="item"
                            :isShowCount="true"
                            :targetId="itemDetailData.id">
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
      </v-container>
    </div>
    <div class="background-flavor">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="8" lg="8" order="2" order-sm="1">
            <v-row>
              <div>
                <ItemSlotBase size="130px">
                  <ItemIconWidget :id="itemDetailData.id" :isOpenDetail="false" :isShowOpenDetail="false"></ItemIconWidget>
                </ItemSlotBase>
                <WeaponModificationWidget :data="itemDetailData"></WeaponModificationWidget>
              </div>
              <v-col>
                <p class="text-pre-wrap mb-4">
                  <span v-for="(i ,index) in asArray([
                      `snb.items.${itemDetailData.id}.description`,
                      `snb.items.${itemDetailData.id}.description.general`,
                      `snb.items.${sanitizeString(itemDetailData.id).cleaned}.description.general`
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
                <template v-if="itemDetailData.id">
                  <v-text-field :value="itemDetailData.id" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="itemDetailData.tier">
                  <v-text-field :value="itemDetailData.tier" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.item.tier') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="itemDetailData.weight">
                  <v-text-field :value="itemDetailData.weight" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.item.weight') }}</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
              <v-col cols="12" sm="12" lg="6" xl="6">

                <template v-if="itemDetailData.projectilesPerShot">
                  <v-text-field :value="itemDetailData.projectilesPerShot" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.item.projectilesPerShot') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="itemDetailData.rateOfFire">
                  <v-text-field :value="itemDetailData.rateOfFire * .001" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.item.rateOfFire') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="DPS">
                  <v-text-field :value="DPS" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.item.DPS') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="DPSWithPerks">
                  <v-text-field :value="DPSWithPerks" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.item.DPSWithPerks') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="itemDetailData.damagePerShot">
                  <v-text-field :value="itemDetailData.damagePerShot" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.item.damagePerShot') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="DamagePerShotWithPerks">
                  <v-text-field :value="DamagePerShotWithPerks" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">Damage per Shot with Perks</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="typeof itemDetailData.damageMitigation == 'string'">
                  <v-text-field :value="itemDetailData.damageMitigation" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.item.DamagePerShotWithPerks') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="typeof itemDetailData.damageMitigation == 'object'">
                  <p class="mb-2 font-weight-bold">
                    <v-icon icon="mdi-shield" size="18" class="mr-2"></v-icon>
                    {{ t('displayCabinet.item.damageMitigation') }}
                  </p>
                  <v-text-field :value="dmValue"
                                v-for="([dmKey,dmValue]) in Object.entries(itemDetailData.damageMitigation)"
                                :key="dmValue"
                                :class="[dmValue ? '' : 'opacity-30']"
                                readonly
                                hide-details
                                variant="underlined"
                                density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t(`snb.perks.${dmKey}.name`) }}</p>
                    </template>
                    <template v-slot:append>
                      <ItemSlotBase size="30px">
                        <ItemIconWidget :id="dmKey"></ItemIconWidget>
                      </ItemSlotBase>
                    </template>
                  </v-text-field>
                </template>

                <template v-if="itemDetailData.reloadSpeed">
                  <v-text-field :value="itemDetailData.reloadSpeed / 1000" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.item.reloadSpeed') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="itemDetailData.optimalRange">
                  <v-text-field :value="itemDetailData.optimalRange" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.item.optimalRange') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="itemDetailData.projectileSpeed">
                  <v-text-field :value="itemDetailData.projectileSpeed" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('displayCabinet.item.projectileSpeed') }}</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
              <v-col cols="12" sm="12" lg="12" xl="12">
                <ItemContentWidget :data="itemDetailData">
                  <v-divider>{{ t('displayCabinet.item.contentsTitle') }}</v-divider>
                </ItemContentWidget>
              </v-col>
              <v-col cols="12">
                <v-divider>{{ t('displayCabinet.item.materialsTitle') }}</v-divider>
              </v-col>
              <v-col cols="12" sm="12" lg="6" xl="6">
                <p class="mt-4 mb-2"><b>{{ t('displayCabinet.item.required') }}</b></p>
                <template v-if="itemDetailData.required && Array.from(itemDetailData.required).length > 0">
                  <div v-for="([i, value], rIndex) in itemDetailData.required"
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
                  <v-card border>
                    <EmptyView></EmptyView>
                  </v-card>
                </template>
              </v-col>
              <v-col cols="12" sm="12" lg="6" xl="6">
                <v-row no-gutters class="mt-4 mb-2">
                  <v-col>
                    <p><b>{{ t('displayCabinet.item.rawMaterials') }}</b></p>
                  </v-col>
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
                        <FactionIconWidget :name="materials[key].faction.id"
                                           v-if="materials[key].faction"
                                           size="20px"></FactionIconWidget>
                      </template>
                    </v-text-field>

                    <ul class="ml-10 raw-list" v-if="!isShowShipRawList">
                      <li v-for="([raw,rawValue],rawIndex) in materials[key].required" :key="rawIndex += rawValue" class="ml-10">
                        <v-text-field
                            :value="value"
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
                  <v-card border>
                    <EmptyView></EmptyView>
                  </v-card>
                </template>
              </v-col>
              <v-col cols="12 mb-3">
                <template v-if="itemDetailData && itemDetailData.id">
                  <ItemModificationWidget :id="itemDetailData.id" :type="itemDetailData.type">
                    <template v-slot:title>
                      <p class="mt-5 mb-3 font-weight-bold">{{ t('displayCabinet.item.modifications') }}</p>
                    </template>
                  </ItemModificationWidget>
                </template>
              </v-col>
            </v-row>

            <template v-if="itemDetailData.id">
              <v-divider>评论</v-divider>
              <CommentWidget :id="itemDetailData.id" type="item" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget :data="itemDetailData"></BySeasonWidget>

            <template v-if="bluePrint">
              <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('displayCabinet.item.bluePrint') }}</p>
              <v-chip class="d-inline-flex mb-1">
                {{ t(bluePrint) }}
              </v-chip>
            </template>
            <template v-if="itemDetailData.obtainable">
              <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('displayCabinet.item.obtainable') }}</p>
              <v-chip v-for="(o,oIndex) in obtainable"
                      class="d-inline-flex mb-1 mr-1"
                      :key="oIndex"
                      :to="o.to">
                <template v-if="o.item">
                  <ItemName :data="o.item"></ItemName>
                </template>
                <template v-else>
                  {{ t(`snb.locations.${o.id}`) }}
                </template>
              </v-chip>
            </template>
            <template v-if="itemDetailData.faction">
              <v-text-field
                  :value="t(`snb.factions.${itemDetailData.faction.id}.name`)"
                  readonly
                  hide-details
                  variant="underlined" density="compact">
                <template v-slot:prepend-inner>
                  <ItemSlotBase size="25px" class="d-flex justify-center align-center mb-2" :padding="0">
                    <FactionIconWidget :name="itemDetailData.faction.id"
                                       size="25px"></FactionIconWidget>
                  </ItemSlotBase>
                </template>
                <template v-slot:append-inner>
                  <p class="text-no-wrap">{{ t('displayCabinet.item.faction') }}</p>
                </template>
              </v-text-field>
            </template>
            <template v-if="itemDetailData.requiredRank">
              <v-text-field readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:prepend-inner>
                  <router-link class="singe-line text-no-wrap" :to="`/display-cabinet/item/requiredRank/${itemDetailData.requiredRank}`">
                    {{ requiredRank }}
                  </router-link>
                </template>
                <template v-slot:append-inner>
                  <p class="text-no-wrap">{{ t('displayCabinet.item.requiredRank') }}</p>
                </template>
              </v-text-field>
            </template>
            <template v-if="itemDetailData.gearScore">
              <v-text-field :value="itemDetailData.gearScore || 'none'" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">{{ t('displayCabinet.item.gearScore') }}</p>
                </template>
                <template v-slot:prepend>
                  <img src="@/assets/images/snb/icon-gearScore.png" alt="gear-score" width="25px" height="25px">
                </template>
              </v-text-field>
            </template>
            <template v-if="itemDetailData.rarity">
              <v-text-field :value="t(`displayCabinet.rarity.${itemDetailData.rarity}`) || 'none'" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">{{ t('displayCabinet.item.rarity') }}</p>
                </template>
              </v-text-field>
            </template>

            <v-row no-gutters align="center" class="mt-2">
              <v-col cols="auto">
                <v-icon icon="mdi-calendar-range" class="mr-3"></v-icon>
              </v-col>
              <v-col>
                <TimeView class="mt-1" :time="itemDetailData.dateAdded">
                  <Time :time="itemDetailData.dateAdded"/>
                </TimeView>
              </v-col>
              <v-col cols="auto">
                <p class="text-no-wrap">{{ t('displayCabinet.item.dateAdded') }}</p>
              </v-col>
            </v-row>

            <v-row no-gutters align="center" class="mt-2">
              <v-col cols="auto">
                <v-icon icon="mdi-calendar-range" class="mr-3"></v-icon>
              </v-col>
              <v-col>
                <TimeView class="mt-1" :time="itemDetailData.lastUpdated">
                  <Time :time="itemDetailData.lastUpdated"/>
                </TimeView>
              </v-col>
              <v-col cols="auto">
                <p class="text-no-wrap">{{ t('displayCabinet.item.lastUpdated') }}</p>
              </v-col>
            </v-row>

            <template v-if="itemDetailData.id">
              <p class="mt-5 mb-4 font-weight-bold">{{ t('displayCabinet.item.damageType') }}</p>
              <ItemDamageTypeWidget :data="itemDetailData"></ItemDamageTypeWidget>
            </template>

            <template v-if="itemDetailData.perks">
              <p class="mt-5 mb-1 font-weight-bold">{{ t('displayCabinet.item.perks') }} ({{ itemDetailData.perks.length || 0 }})</p>
              <PerksWidget :data="itemDetailData"></PerksWidget>
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
