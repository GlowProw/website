<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, ref, toRaw, useSlots, watch} from "vue";
import {useRoute} from "vue-router";

import ItemIconWidget from "./snbWidget/itemIconWidget.vue";
import ItemSlotBase from "./snbWidget/ItemSlotBase.vue";
import EmptyView from "./EmptyView.vue";
import ShipWidget from "./snbWidget/shipWidget.vue";

import {Ships} from "../../../../glow-prow-data";
import {Item, Items} from "../../../../glow-prow-data/src/entity/Items.ts";
import {Ship} from "../../../../glow-prow-data/src/entity/Ships.ts";
import shipSlotMapping from "../../public/config/shipsConfig.json";

const poops = withDefaults(defineProps<{ readonly?: boolean }>(), {
      readonly: false
    }),
    slots = useSlots(),
    route = useRoute(),
    ships = Ships,
    items: Items = Items,
    {t, te} = useI18n()

interface ItemAssemblySave extends Item {
  direction?: string
}

let workshopData = ref({
      shipModel: false,
      frigateUpgradeModel: false,
      displayModel: false,
      weaponModel: false,
      secondaryWeaponModel: false,
      frigateUpgradeInsertIndex: 0,
      weaponInsertIndex: 0,
      secondaryWeaponInsertIndex: 0,
      shipWorkshopSelect: null,
      shipSelect: null,
      shipFrigateUpgradeSelect: null,
      shipDisplaySelect: null,

      name: '',
      description: '',

      data: {
        weaponDirection: [],                // 临时 武器朝向,
        shipFrigateUpgradeList: [],
        shipFrigateUpgradeSlot: null,       // 家具
        shipSlot: null,                     // 船
        shopUpgradeSlot: null,              // 船 升级配方
        weaponSlots: [],                    // 武器
        mortarSlots: [],                    // 弹药
        secondaryWeaponSlots: [],           // 副武器
        displaySlots: [],                   // 家具
      } as {
        shipFrigateUpgradeList: [], shipFrigateUpgradeSlot: Item | null, shipSlot: Ship,
        displaySlots: Item[], weaponSlot: ItemAssemblySave[] | Item[], shopUpgradeSlot: Item | null,
        secondaryWeaponSlots: Item[],
        weaponDirection: string[]
      }
    }),
    // 最大主陈设
    maxMajorDisplayCount = 1,
    hasImageSlot = computed(() => !!slots.image),

    // 临时缓存
    cache = ref({
      weaponDirection: {},
      shipDisplayList: [],
      shipWeaponList: [],
      shipWeaponDirectionList: []
    })

watch(() => workshopData.value?.data?.shipSlot, (value) => {
  let result = {}

  Object.entries(value.slots).forEach(i => result[i[0]] = i[1][1])

  cache.value.weaponDirection = result;
})

/**
 * 获取船只陈设列表
 */
let getShipDisplayList = computed(() => {
      let tag = ['offensiveFurniture', 'utilityFurniture']
      if (!hasMajorDisplayUpperLimit.value)
        tag.push('majorFurniture')

      if (cache.value.shipDisplayList.length > 0)
        return cache.value.shipDisplayList;

      const d = Object.values(items).filter(i => tag.indexOf(i.type) >= 0);
      cache.value.shipDisplayList = d;
      return d;
    }),
    getShipWeaponList = computed(() => {
      let tag = ['culverin', 'demicannon', 'bombard', 'longGun', 'torpedo']

      if (cache.value.shipWeaponList.length > 0)
        return cache.value.shipWeaponList;

      const d = Object.values(items).filter(i => tag.indexOf(i.type) >= 0);
      cache.value.shipWeaponList = d;
      return d;
    }),
    // 主陈设上限
    hasMajorDisplayUpperLimit = computed(() => {
      return workshopData.value.data.displaySlots.filter(i => i.type == 'majorFurniture').length >= maxMajorDisplayCount
    }),
    // 获取船只武器方向
    getShipWeaponDirection = computed(() => {
      const tag = ["frontWeapon", "leftSideWeapon", "rightSideWeapon", "aftWeapon"]

      if (cache.value.shipWeaponDirectionList.length > 0)
        return cache.value.shipWeaponDirectionList

      const d = Object.entries(workshopData.value.data.shipSlot.slots).filter((i) => {
        return tag.indexOf(i[0]) >= 0;
      });
      cache.value.shipWeaponDirectionList = d;
      return d
    })

/**
 * 可选的武器方向
 */
const getOptionalShipWeaponDirection = () => {
  let selectedDirections = []
  workshopData.value.data.weaponDirection.forEach(i => {
    if (!i)
      return
    selectedDirections.push(i)
  })
  return getShipWeaponDirection.value.filter(i => selectedDirections.indexOf(i[0]) < 0) || []
}


/**
 * 选择船
 * @param shipId
 */
const onSelectShip = (shipId: string) => {
  if (poops.readonly)
    return;

  let itemsData = Object.values(items),
      shipData = ships[shipId],
      shipUpItem = itemsData.filter((i: any) => i.type == 'shipUpgrade' && i.id.indexOf(shipData.id) >= 0)

  workshopData.value.shipModel = false;
  workshopData.value.data.shipSlot = ships[shipId] as Ship;
  workshopData.value.data.shipFrigateUpgradeList = shipUpItem;

  // 创建陈设插槽
  workshopData.value.data.displaySlots = Array.from({length: workshopData.value.data.shipSlot.slots.furniture[0] || 0}, (i) => {
    return Item.fromRawData({})
  })

  // 创建武器插槽，选择初始
  workshopData.value.data.weaponSlot = Array.from({
    length: shipSlotMapping.f[workshopData.value.data.shipSlot.id].weaponsSlotCount[0].gunSlotCount || 0
  }, (i) => {
    return Item.fromRawData({})
  })

  // 创建武器插槽方向，用于排它选择以及查询甲板信息用途
  workshopData.value.data.weaponDirection = Array.from({
    length: shipSlotMapping.f[workshopData.value.data.shipSlot.id].weaponsSlotCount[0].gunSlotCount || 0
  }, () => null)

  // 创建副武器插槽
  workshopData.value.data.secondaryWeaponSlots = Array.from({
    length: shipSlotMapping.f[workshopData.value.data.shipSlot.id].weaponsSlotCount[0].secondaryWeapon || 0
  }, () => Item.fromRawData({}))
}

/**
 * 添加陈设
 */
const onAddDisplaySlot = () => {
  if (poops.readonly)
    return;

  let data: Item = Item.fromRawData({
    id: null
  });

  workshopData.value.data.displaySlots.push(data)
}

/**
 * 选择升级部件
 */
const onSelectFrigteUpgrad = () => {
  if (poops.readonly)
    return;

  workshopData.value.frigateUpgradeModel = false;
  workshopData.value.data.shipFrigateUpgradeSlot = workshopData.value.shipFrigateUpgradeSelect;

  // 更新插槽
  let furnitureBaseSlotCount = workshopData.value.data.shipSlot.slots.furniture[0],
      selectFurnitureTier = workshopData.value.shipFrigateUpgradeSelect.tier - 1,
      resultFurnitureSlotCount: any;

  resultFurnitureSlotCount = shipSlotMapping.f[workshopData.value.data.shipSlot.id].furnitureSlotCount[workshopData.value.data.shipFrigateUpgradeSlot ? selectFurnitureTier : furnitureBaseSlotCount]

  // 创建陈设插槽
  workshopData.value.data.displaySlots = Array.from({length: resultFurnitureSlotCount}, (i) => {
    return Item.fromRawData({})
  })

  // 创建武器插槽
  workshopData.value.data.weaponSlot = Array.from({
    length: shipSlotMapping.f[workshopData.value.data.shipSlot.id].weaponsSlotCount[selectFurnitureTier].gunSlotCount
  }, (i) => {
    return Item.fromRawData({})
  })
}

/**
 * 选择家具
 */
const onSelectDisplayShip = () => {
  if (poops.readonly)
    return;

  workshopData.value.displayModel = false;
  if (!workshopData.value.shipDisplaySelect)
    return;

  workshopData.value.data.displaySlots[workshopData.value.frigateUpgradeInsertIndex] = workshopData.value.shipDisplaySelect
}

/**
 * 选择武器
 */
const onSelectWorkshopShip = () => {
  if (poops.readonly)
    return;

  workshopData.value.weaponModel = false;
  if (!workshopData.value.shipWorkshopSelect)
    return;

  workshopData.value.data.weaponSlot[workshopData.value.weaponInsertIndex] = workshopData.value.shipWorkshopSelect
}

/**
 * 重制配置
 */
const onAssemblyClear = () => {
  if (poops.readonly)
    return;

  workshopData.value.data.displaySlots = []
  workshopData.value.data.shipFrigateUpgradeSlot = null
  workshopData.value.data.shopUpgradeSlot = []
}

/**
 * 获取甲板信息
 */
const getDeckInformation = (index: number): Record<string, any> => {
  try {
    const weaponDirection = workshopData.value?.data?.weaponDirection?.[index];
    if (weaponDirection === undefined) return {};

    return cache.value.weaponDirection[weaponDirection] || {};
  } catch (e) {
    console.error('Error in getDeckInformation:', e);
    return {};
  }
};


/**
 * 处理罗马信息
 * int 转 罗马数字
 * @param num
 */
const intToRoman = (num: number) => {
  const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const sym = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];

  let result = '';
  let i = 0;

  while (num > 0) {
    while (num >= val[i]) {
      num -= val[i];
      result += sym[i];
    }
    i++;
  }

  return result;
}

/**
 * 导出数据
 */
const onExpostJson = () => {
  return toRaw(workshopData.value.data);
}

/**
 * 导入数据
 */
const onLoadJson = (data) => {
  const d = (data);
  if (!d || JSON.stringify(d) === '{}')
    return;

  workshopData.value.data = {
    ...workshopData.value.data,
    ...data
  };
}

defineExpose({
  onExpostJson,
  onLoadJson,
})
</script>

<template>
  <v-row class="workshop-ship-interior position-relative pa-10 ml-5 mt-3">
    <v-col class="position-relative" style="z-index: 5" cols="6" sm="6" lg="6">
      <div>
        <div class="mb-10">
          <v-row no-gutters align="end">
            <v-col cols="auto">
              <!-- 船只 -->
              <v-tooltip
                  v-model="workshopData.shipModel"
                  :open-on-hover="false"
                  location="bottom left"
                  :offset="[-100, -120]"
                  content-class="pa-0"
                  min-width="450"
                  max-width="450"
                  interactive
                  open-on-click>
                <template v-slot:activator="{ props }">
                  <ItemSlotBase size="110px" class="pa-2" v-if="!workshopData.data.shipSlot">
                    <v-card class="w-100 d-flex align-center justify-center" v-bind="props"
                            :disabled="readonly">
                      <v-icon icon="mdi-plus" size="50"></v-icon>
                    </v-card>
                  </ItemSlotBase>
                  <ItemSlotBase size="110px" class="pa-2"
                                :class="[workshopData.data.shipSlot.id ? 'bg-amber' : '']"
                                v-else>
                    <v-card class="w-100">
                      <ShipWidget :id="workshopData.data.shipSlot.id" :isClickOpenDetail="false"/>
                    </v-card>
                  </ItemSlotBase>
                </template>
                <v-card v-slot:default>
                  <v-row class="ga-0 pa-2 pb-5">
                    <v-col cols="3"
                           v-for="(ship,shipIndex) in ships"
                           :key="shipIndex">
                      <v-badge :color="workshopData.shipSelect ? workshopData.shipSelect!.id == ship!.id ? `var(--main-color)` : 'transparent' : 'transparent'">
                        <template v-slot:badge>
                          <v-icon icon="mdi-check" v-if="workshopData.shipSelect && workshopData.shipSelect!.id == ship!.id"></v-icon>
                        </template>
                        <ItemSlotBase
                            size="92px" class="pa-1"
                            @click="workshopData.shipSelect = ship"
                            :class="[
                                          workshopData.shipSelect ? workshopData.shipSelect!.id == ship!.id ? 'bg-amber' : '' : ''
                                      ]">
                          <ShipWidget :id="ship.id" :isClickOpenDetail="false"></ShipWidget>
                        </ItemSlotBase>
                      </v-badge>
                    </v-col>
                  </v-row>
                  <v-card-actions class="bg-amber">
                    <v-btn variant="tonal" @click="onSelectShip(workshopData.shipSelect.id)">确定</v-btn>
                    <v-btn variant="tonal" class="ml-1" @click="workshopData.shipModel = false">取消</v-btn>
                  </v-card-actions>
                </v-card>
              </v-tooltip>
            </v-col>
            <v-col class="ml-2">
              <!-- 升级部件 -->
              <v-tooltip
                  v-model="workshopData.frigateUpgradeModel"
                  content-class="pa-0"
                  location="bottom left"
                  :offset="[20, 10]"
                  :open-on-hover="false"
                  min-width="450"
                  max-width="450"
                  interactive
                  open-on-click>
                <template v-slot:activator="{ props }">
                  <v-badge :color="`var(--main-color)`" v-if="workshopData.data.shipFrigateUpgradeSlot">
                    <template v-slot:badge class="d-flex align-center justify-center">
                      <div class="pt-2 pb-2">
                        <v-icon icon="mdi-chevron-triple-up mr-1" size="18"></v-icon>
                        <b>{{ workshopData.data.shipFrigateUpgradeSlot.tier || 0 }}</b>
                      </div>
                    </template>
                    <ItemSlotBase
                        size="80px" class="pa-1"
                        :class="[workshopData.data.shipFrigateUpgradeSlot ? 'bg-amber' : '']">
                      <ItemIconWidget :id="workshopData.data.shipFrigateUpgradeSlot.id" :is-open-detail="false"></ItemIconWidget>
                    </ItemSlotBase>
                  </v-badge>
                  <ItemSlotBase size="80px" class="pa-2"
                                v-if="!workshopData.data.shipFrigateUpgradeSlot && workshopData.data.shipFrigateUpgradeList.length > 0">
                    <v-card class="w-100 d-flex align-center justify-center"
                            :disabled="readonly"
                            v-bind="props">
                      <v-icon icon="mdi-plus" size="20"></v-icon>
                    </v-card>
                  </ItemSlotBase>
                </template>
                <v-card class="demo-reel bg-black pt-3" flat border>
                  <v-row class="ga-0 pa-2 pb-5">
                    <v-col cols="3"
                           v-for="(upgrade,upgradeIndex) in workshopData.data.shipFrigateUpgradeList"
                           :key="upgradeIndex">
                      <v-badge :color="`var(--main-color)`">
                        <template v-slot:badge>
                          {{ upgradeIndex + 1 }}
                        </template>
                        <ItemSlotBase
                            size="92px" class="pa-1"
                            @click="workshopData.shipFrigateUpgradeSelect = upgrade"
                            :class="[
                                          workshopData.shipFrigateUpgradeSelect ? workshopData.shipFrigateUpgradeSelect!.id == upgrade!.id ? 'bg-amber' : '' : ''
                                      ]">
                          <ItemIconWidget :id="upgrade.id" :is-open-detail="false"></ItemIconWidget>
                        </ItemSlotBase>
                      </v-badge>
                    </v-col>
                  </v-row>
                  <v-card-actions class="bg-amber">
                    <v-btn variant="tonal"
                           v-if="workshopData.shipFrigateUpgradeSelect"
                           @click="onSelectFrigteUpgrad()">确认
                    </v-btn>
                    <v-btn variant="tonal" class="ml-2" @click="workshopData.frigateUpgradeModel = false">取消</v-btn>
                  </v-card-actions>
                </v-card>
              </v-tooltip>

            </v-col>
          </v-row>


        </div>

        <div>
          <div class="">
            <v-row justify="space-around">
              <v-col cols="auto" class="mr-5">
                <p class="mb-2 font-weight-bold badge-flavor text-center">陈设</p>
                <template v-if="route.query.debug">
                  {{ workshopData.data.displaySlots || [] }}
                </template>

                <v-row v-for="(display, displayIndex) in workshopData.data.displaySlots"
                       :key="displayIndex">
                  <v-col cols="auto">
                    <v-card class="bg-transparent text-center pt-1" min-height="40" min-width="30">
                      {{ intToRoman(displayIndex + 1) }}
                      <template v-slot:image>
                        <v-icon icon="mdi-table-furniture" class="opacity-20" size="30"></v-icon>
                      </template>
                    </v-card>
                  </v-col>
                  <v-col>
                    <div>
                      <ItemSlotBase size="80px" class="pa-2" v-if="workshopData.data.displaySlots[displayIndex] && !workshopData.data.displaySlots[displayIndex].id">
                        <v-card class="w-100 d-flex align-center justify-center"
                                :disabled="readonly"
                                @click="workshopData.displayModel = true;workshopData.frigateUpgradeInsertIndex = displayIndex">
                          <v-icon icon="mdi-plus"></v-icon>
                        </v-card>
                      </ItemSlotBase>
                      <ItemSlotBase size="80px" class="pa-1" v-if="workshopData.data.displaySlots[displayIndex] && workshopData.data.displaySlots[displayIndex].id">
                        <ItemIconWidget :id="workshopData.data.displaySlots[displayIndex].id"></ItemIconWidget>
                      </ItemSlotBase>
                    </div>
                  </v-col>
                </v-row>

                <v-dialog v-model="workshopData.displayModel"
                          content-class="pa-0"
                          max-height="90%"
                          min-height="300"
                          min-width="450"
                          max-width="700">
                  <v-card v-slot:default>
                    <b class="font-weight-bold text-h5 pa-5"> 插入陈设</b>
                    <v-row class="ga-0 pa-2 pb-5">
                      <v-col cols="2"
                             v-for="(display, displayIndex) in getShipDisplayList"
                             :key="displayIndex">
                        <v-badge :color="workshopData.shipDisplaySelect ? workshopData.shipDisplaySelect!.id == display!.id ? `var(--main-color)` : 'transparent' : 'transparent'">
                          <template v-slot:badge>
                            <v-icon icon="mdi-check" v-if="workshopData.shipDisplaySelect && workshopData.shipDisplaySelect!.id == display!.id"></v-icon>
                          </template>
                          <ItemSlotBase
                              size="92px" class="pa-1"
                              @click="workshopData.shipDisplaySelect = display"
                              :class="[
                                          workshopData.shipDisplaySelect ? workshopData.shipDisplaySelect!.id == display!.id ? 'bg-amber' : '' : ''
                                      ]">
                            <ItemIconWidget :id="display.id" :is-open-detail="false" :is-show-open-detail="false"></ItemIconWidget>
                          </ItemSlotBase>
                        </v-badge>
                      </v-col>
                    </v-row>
                  </v-card>
                  <v-alert class="pa-5 card-flavor bg-red" v-if="hasMajorDisplayUpperLimit">
                    已到达主陈设上限，将主陈设隐藏
                  </v-alert>
                  <v-card-actions class="bg-amber">
                    <v-btn variant="tonal" @click="onSelectDisplayShip" v-if="workshopData.shipDisplaySelect">确定</v-btn>
                    <v-btn variant="tonal" class="ml-1" @click="workshopData.displayModel = false">取消</v-btn>
                  </v-card-actions>
                </v-dialog>
                <ItemSlotBase size="80px" class="pa-2"
                              v-if="workshopData.data.displaySlots.length <= 0">
                  <v-card class="w-100 d-flex align-center justify-center">
                    <v-icon icon="mdi-close-octagon-outline" class="opacity-50" size="30"></v-icon>
                  </v-card>
                </ItemSlotBase>
              </v-col>

              <v-col>
                <p class="mb-2 font-weight-bold badge-flavor text-center">武装</p>
                <p class="mb-1">主武器</p>
                <div class="ml-5 mb-2" v-if="workshopData.data.weaponSlot && workshopData.data.weaponSlot.length > 0" v-for="(i, index) in workshopData.data.weaponSlot" :key="index">
                  <p class="mb-2 ml-n5 mr-n5 pl-5 title-long-flavor bg-black"
                     v-if="te(`displayCabinet.ship.${workshopData.data.weaponDirection[index]}`)">
                    <v-select v-if="!readonly" v-model="workshopData.data.weaponDirection[index]"
                              hide-details
                              clearable
                              placeholder="选择武器方向"
                              variant="underlined"
                              density="compact"
                              item-value="0"
                              :disabled="readonly"
                              :items="getOptionalShipWeaponDirection()">
                      <template v-slot:item="{ props: itemProps, item }">
                        <v-list-item v-bind="itemProps" :title="t(`displayCabinet.ship.${item.raw[0]}`)"></v-list-item>
                      </template>
                      <template v-slot:chip="{item}">
                        {{ t(`displayCabinet.ship.${workshopData.data.weaponDirection[index]}`) }}
                      </template>
                    </v-select>
                    <template v-else>
                      {{ t(`displayCabinet.ship.${workshopData.data.weaponDirection[index]}`) }}
                    </template>
                  </p>
                  <v-row>
                    <v-col cols="3">
                      <ItemSlotBase size="80px" class="pa-1" v-if="workshopData.data.weaponSlot[index] && workshopData.data.weaponSlot[index].id">
                        <ItemIconWidget :id="i.id"></ItemIconWidget>
                      </ItemSlotBase>
                      <ItemSlotBase size="80px" class="pa-2" v-else-if="!workshopData.data.weaponDirection[index]">
                        <v-card class="w-100 d-flex align-center justify-center">
                          <v-icon icon="mdi-close-octagon-outline" size="30"></v-icon>
                        </v-card>
                      </ItemSlotBase>
                      <ItemSlotBase size="80px" class="pa-2" v-else>
                        <v-card class="w-100 d-flex align-center justify-center"
                                :disabled="readonly"
                                @click="workshopData.weaponModel = true;workshopData.weaponInsertIndex = index">
                          <v-icon icon="mdi-plus"></v-icon>
                        </v-card>
                      </ItemSlotBase>
                    </v-col>
                    <v-col class="d-flex align-start">
                      <div class="w-100">
                        <v-divider thickness="4" opacity="1" color="#000" class="w-100 mt-2 mb-2"></v-divider>
                        <p class="opacity-80 text-body-1">上甲板 {{ getDeckInformation(index).top || 0 }}</p>
                        <p class="opacity-80 text-body-1">下甲板 {{ getDeckInformation(index).lower || 0 }}</p>
                      </div>
                    </v-col>
                    <v-col cols="auto">
                      <v-row no-gutters :class="[
                                    !i.id ? 'opacity-30' : ''
                                ]">
                        <v-col align="center" class="mt-n1 mr-1">
                          <v-icon icon="mdi-chevron-up" size="16"></v-icon>
                          <ItemSlotBase class="mb-1 mt-1" size="30px"
                                        padding="0"
                                        v-for="(p, pindex) in getDeckInformation(index).top" :key="pindex">
                            <ItemIconWidget :id="i.id" v-if="i.id" :is-open-detail="false"></ItemIconWidget>
                          </ItemSlotBase>
                        </v-col>
                        <v-col align="center" class="mt-n1">
                          <v-icon icon="mdi-chevron-down" size="16"></v-icon>
                          <ItemSlotBase class="mb-1 mt-1" size="30px"
                                        padding="0"
                                        :id="i.id"
                                        v-if="i.id"
                                        v-for="(p, pindex) in getDeckInformation(index).lower" :key="pindex">
                            <ItemIconWidget :id="i.id" :is-open-detail="false"></ItemIconWidget>
                          </ItemSlotBase>
                        </v-col>
                      </v-row>
                    </v-col>
                    <template v-if="false">
                      <v-col class="d-flex align-start">
                        <v-divider thickness="4" opacity="1" color="#000" class="mt-2"></v-divider>
                      </v-col>
                      <v-col cols="1">
                        <ItemSlotBase size="60px">
                          皮肤
                        </ItemSlotBase>
                      </v-col>
                    </template>
                  </v-row>
                </div>
                <div v-else>
                  <EmptyView></EmptyView>
                </div>
                <v-dialog v-model="workshopData.weaponModel"
                          content-class="pa-0"
                          max-height="90%"
                          min-height="300"
                          min-width="450"
                          max-width="700">
                  <v-card v-slot:default>
                    <b class="font-weight-bold text-h5 pa-5"> 插入陈设</b>
                    <v-row class="ga-0 pa-2 pb-5">
                      <v-col cols="2"
                             v-for="(workshop, workshopIndex) in getShipWeaponList"
                             :key="workshopIndex">
                        <v-badge :color="workshopData.shipWorkshopSelect ? workshopData.shipWorkshopSelect!.id == workshop!.id ? `var(--main-color)` : 'transparent' : 'transparent'">
                          <template v-slot:badge>
                            <v-icon icon="mdi-check" v-if="workshopData.shipWorkshopSelect && workshopData.shipWorkshopSelect!.id == workshop!.id"></v-icon>
                          </template>
                          <ItemSlotBase
                              size="92px" class="pa-1"
                              @click="workshopData.shipWorkshopSelect = workshop"
                              :class="[
                                          workshopData.shipWorkshopSelect ? workshopData.shipWorkshopSelect!.id == workshop!.id ? 'bg-amber' : '' : ''
                                      ]">
                            <ItemIconWidget :id="workshop.id" :is-open-detail="false" :is-show-open-detail="false"></ItemIconWidget>
                          </ItemSlotBase>
                        </v-badge>
                      </v-col>
                    </v-row>
                  </v-card>
                  <v-card-actions class="bg-amber">
                    <v-btn variant="tonal" @click="onSelectWorkshopShip">确定</v-btn>
                    <v-btn variant="tonal" class="ml-1" @click="workshopData.weaponModel = false">取消</v-btn>
                  </v-card-actions>
                </v-dialog>

                <p class="mt-1 mb-1">副武器</p>
                <div class="ml-5 mb-2" v-if="workshopData.data.secondaryWeaponSlots && workshopData.data.secondaryWeaponSlots.length > 0" v-for="(i, index) in workshopData.data.secondaryWeaponSlots" :key="index">
                  <v-row>
                    <v-col cols="3">
                      <ItemSlotBase size="80px" class="pa-1" v-if="workshopData.data.secondaryWeaponSlots[index] && workshopData.data.secondaryWeaponSlots[index].id">
                        <ItemIconWidget :id="i.id"></ItemIconWidget>
                      </ItemSlotBase>
                      <ItemSlotBase size="80px" class="pa-2" v-else>
                        <v-card class="w-100 d-flex align-center justify-center"
                                :disabled="readonly"
                                @click="workshopData.secondaryWeaponModel = true;workshopData.secondaryWeaponInsertIndex = index">
                          <v-icon icon="mdi-plus"></v-icon>
                        </v-card>
                      </ItemSlotBase>
                    </v-col>
                    <v-col class="d-flex align-start">
                      <div class="w-100">
                        <v-divider thickness="4" opacity="1" color="#000" class="w-100 mt-2 mb-2"></v-divider>
                      </div>
                    </v-col>
                    <v-col cols="auto">
                      <v-row no-gutters :class="[
                                    !i.id ? 'opacity-30' : ''
                                ]">
                        <v-col align="center" class="mt-n1 mr-1">
                          <v-icon icon="mdi-chevron-up" size="16"></v-icon>
                          <ItemSlotBase class="mb-1 mt-1" size="30px"
                                        padding="0"
                                        v-for="(p, pIndex) in getDeckInformation(index).top" :key="pIndex">
                            <ItemIconWidget :id="i.id" v-if="i.id" :is-open-detail="false"></ItemIconWidget>
                          </ItemSlotBase>
                        </v-col>
                        <v-col align="center" class="mt-n1">
                          <v-icon icon="mdi-chevron-down" size="16"></v-icon>
                          <ItemSlotBase class="mb-1 mt-1" size="30px"
                                        padding="0"
                                        :id="i.id"
                                        v-if="i.id"
                                        v-for="(p, pIndex) in getDeckInformation(index).lower" :key="pIndex">
                            <ItemIconWidget :id="i.id" :is-open-detail="false"></ItemIconWidget>
                          </ItemSlotBase>
                        </v-col>
                      </v-row>
                    </v-col>
                    <template v-if="false">
                      <v-col class="d-flex align-start">
                        <v-divider thickness="4" opacity="1" color="#000" class="mt-2"></v-divider>
                      </v-col>
                      <v-col cols="1">
                        <ItemSlotBase size="60px">
                          皮肤
                        </ItemSlotBase>
                      </v-col>
                    </template>
                  </v-row>
                </div>
                <div v-else>
                  <EmptyView></EmptyView>
                </div>
                <v-dialog v-model="workshopData.weaponModel"
                          content-class="pa-0"
                          max-height="90%"
                          min-height="300"
                          min-width="450"
                          max-width="700">
                  <v-card v-slot:default>
                    <b class="font-weight-bold text-h5 pa-5"> 插入陈设</b>
                    <v-row class="ga-0 pa-2 pb-5">
                      <v-col cols="2"
                             v-for="(workshop, workshopIndex) in getShipWeaponList"
                             :key="workshopIndex">
                        <v-badge :color="workshopData.shipWorkshopSelect ? workshopData.shipWorkshopSelect!.id == workshop!.id ? `var(--main-color)` : 'transparent' : 'transparent'">
                          <template v-slot:badge>
                            <v-icon icon="mdi-check" v-if="workshopData.shipWorkshopSelect && workshopData.shipWorkshopSelect!.id == workshop!.id"></v-icon>
                          </template>
                          <ItemSlotBase
                              size="92px" class="pa-1"
                              @click="workshopData.shipWorkshopSelect = workshop"
                              :class="[
                                          workshopData.shipWorkshopSelect ? workshopData.shipWorkshopSelect!.id == workshop!.id ? 'bg-amber' : '' : ''
                                      ]">
                            <ItemIconWidget :id="workshop.id" :is-open-detail="false" :is-show-open-detail="false"></ItemIconWidget>
                          </ItemSlotBase>
                        </v-badge>
                      </v-col>
                    </v-row>
                  </v-card>
                  <v-card-actions class="bg-amber">
                    <v-btn variant="tonal" @click="onSelectWorkshopShip">确定</v-btn>
                    <v-btn variant="tonal" class="ml-1" @click="workshopData.weaponModel = false">取消</v-btn>
                  </v-card-actions>
                </v-dialog>
              </v-col>
            </v-row>
          </div>
        </div>
      </div>
    </v-col>

    <div class="assembly-show-image-box" :class="hasImageSlot ? 'overflow-hidden' : ''">
      <slot name="image"></slot>
      <div class="assembly-variable-gradient" v-if="hasImageSlot"></div>
      <div class="background-dot-grid" v-if="hasImageSlot"></div>
    </div>
  </v-row>
</template>

<style lang="less">
.workshop-ships-show-image {
  img {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
  }
}
</style>

<style scoped lang="less">
.workshop-ship {
  background-color: #000;
  user-select: none;

  .workshop-ship-interior {
  }
}

.workshop-ships-show-image {
  -webkit-user-drag: none;
  position: absolute;
  z-index: 1;
  right: 0;
  width: 400px;
}

.assembly-show-image-box {
  position: absolute !important;
  right: 0;
  top: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  min-height: 300px;
  max-height: 500px;
}

.assembly-variable-gradient {
  --gradient-start: rgba(0, 0, 0, 0);
  --gradient-end: #000000;

  pointer-events: none;
  position: absolute;
  z-index: 2;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  box-shadow: inset -60px 30px 30px #000,
  inset 10px 10px 30px #000,
  inset 300px 40px 100px #000,
  inset 600px 0 1000px rgba(0, 0, 0, 0.58),
  inset 0px -30px 30px #000;

  &:after {
    content: "";
    display: block;
    width: 100%;
    height: 100%;
    background: #000;
    opacity: .8;
  }
}
</style>
