<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {computed, onMounted, reactive, Ref, ref, toRaw, useAttrs, useSlots, watch} from "vue";
import {useRoute} from "vue-router";

import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {AssemblyAttr, ItemAssemblySave} from "@/assets/types";
import {useNoticeStore} from "~/stores/noticeStore";
import {number} from "@/assets/sripts/index"
import {Ships, Ultimates} from "glow-prow-data";
import {Item, Items} from "glow-prow-data/src/entity/Items.ts";
import {Ship} from "glow-prow-data/src/entity/Ships.ts";

import shipSlotMapping from "../../public/config/shipsConfig.json";

import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import EmptyView from "./EmptyView.vue";
import ShipIconWidget from "./snbWidget/shipIconWidget.vue";
import ShipTopDownPerspectiveWidget from "./snbWidget/shipTopDownPerspectiveWidget.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import WeaponModificationWidget from "@/components/snbWidget/weaponModificationWidget.vue";
import AssemblyClassificationShowList from "@/components/AssemblyClassificationShowList.vue";
import AssemblyDataProcessing from "@/assets/sripts/assembly_data_processing";
import ShipName from "@/components/snbWidget/shipName.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";
import WeaponModificationOnlyShowWidget from "@/components/snbWidget/weaponModificationOnlyShowWidget.vue";

const poops = withDefaults(defineProps<{
      readonly?: boolean,
      isFullName?: boolean,
      perfectDisplay?: boolean,
      class?: string,
    }>(), {
      readonly: false,
      perfectDisplay: false,
      class: ''
    }),
    slots = useSlots(),
    attrs = useAttrs(),
    route = useRoute(),
    ships = Ships,
    items: Items = Items,
    ultimates = Ultimates,
    assemblyDataProcessing = new AssemblyDataProcessing(),
    noticeStore = useNoticeStore(),
    emit = defineEmits(['update:model-value', 'update:item-change']),
    {asString, sanitizeString} = useI18nUtils(),
    {t} = useI18n()

let workshopData = ref({
      shipModel: false,
      frigateUpgradeModel: false,
      displayModel: false,
      weaponModel: false,
      secondaryWeaponModel: false,
      ultimateModel: false,
      armorModel: false,
      weaponSearchValue: '',
      frigateUpgradeInsertIndex: 0,
      weaponInsertIndex: 0,
      secondaryWeaponInsertIndex: 0,
      secondaryWeaponSelect: 0,
      armorSelect: 0,
      ultimateSelect: 0,
      displayInsertIndex: 0,
      shipWorkshopSelect: null,
      shipSelect: null,
      shipFrigateUpgradeSelect: null,
      shipDisplaySelect: null,
      shipFrigateUpgradeList: [],

      data: {
        shipSlot: null,                     // 船
        ultimateSlot: null,                 // 技能
        shipUpgradeSlot: null,              // 船 升级配方
        weaponDirections: [],               // 武器朝向 信息
        weaponModifications: [],            // 武器   安装模组
        weaponSlots: [],                    // 武器
        armorSlot: null,                    // 船甲
        armorModification: [],              // 船甲模组
        secondaryWeaponSlots: [],           // 副武器
        secondaryWeaponModifications: [],   // 副武器 安装模组
        displaySlots: [],                   // 家具陈设

        // 平台版本
        // ** 它可能不存在，如果有则依靠此__version识别，没有则主要使用attr.assemblyUseVersion, 否则降级 **
        __version: AssemblyDataProcessing.nowVersion,
      } as {
        shipSlot: Ship, ultimateSlot: Item | null, armorSlot: Item | null, armorModification: any[],
        displaySlots: Item[], weaponSlots: ItemAssemblySave[] | Item[], shipUpgradeSlot: Item | null,
        secondaryWeaponSlots: Item[],
        weaponDirections: string[], weaponModification: any[]
      }
    }),
    // 最大主陈设
    maxMajorDisplayCount = 1,
    hasImageSlot = computed(() => !!slots.image),
    hasItemChangeEvent = computed(() => !!attrs.onUpdateItemChange),
    hasModelValueEvent = computed(() => !!attrs.onUpdateModelValue),

    // 临时缓存
    cache = ref({
      weaponDirections: {},
      shipDisplayList: [],
      shipArmorList: [],
      shipSecondaryWeaponList: [],
      shipWeaponList: [],
      shipWeaponDirectionList: []
    }),

    // 配装属性
    attr: Ref<AssemblyAttr> = ref({
      isShowItemName: true,
      isFullName: false,
      assemblyUseVersion: AssemblyDataProcessing.nowVersion
    })

watch(() => workshopData.value?.data, (value) => {
  if (hasModelValueEvent)
    emit('update:model-value', onExport())
  if (hasItemChangeEvent)
    emit('update:item-change', 'assembly')
}, {
  deep: true
})

watch(() => workshopData.value?.data?.shipSlot, (value) => {
  let result = {}

  if (value) {
    onSelectShip(workshopData.value.data.shipSlot.id)
  }

  if (value && value.slots)
    Object.entries(value.slots).forEach(i => {
      try {
        if (i && i[1] != undefined && i[1][1])
          return result[i[0]] = i[1][1];
        return result[i[0]] = {}
      } catch (e) {
        return {}
      }
    })

  cache.value.weaponDirections = result;
})

/**
 * 获取船只陈设列表
 */
let // 获取陈设
    getShipDisplayList = computed(() => {
      let tags = ['offensiveFurniture', 'utilityFurniture']
      if (!hasMajorDisplayUpperLimit.value)
        tags.push('majorFurniture')
      return tags;
    }),
    // 获取船只列表
    getShipList = computed(() => {
      return []; // get All
    }),
    // 获取武器列表
    getShipWeaponList = computed(() => {
      let tag = ['culverin', 'demicannon', 'bombard', 'longGun', 'torpedo'],
          conditionsTag = {
            'frontWeapon': ['ballista', 'seaFire'],
            'leftSideWeapon': [],
            'rightSideWeapon': [],
            'aftWeapon': []
          },
          queryTags = []
      queryTags = queryTags.concat(
          tag,
          conditionsTag[workshopData.value.data.weaponDirections[workshopData.value.weaponInsertIndex]]
      )
      return queryTags;
    }),
    // 获取副武器
    getSecondaryWeapon = computed(() => {
      return ['springloader', 'mortar', 'rocket'];
    }),
    // 获取船甲列表
    getShipArmorList = computed(() => {
      return ['armor'];
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
  workshopData.value.data.weaponDirections.forEach(i => {
    if (!i)
      return
    selectedDirections.push(i)
  })
  return getShipWeaponDirection.value.filter(i => selectedDirections.indexOf(i[0]) < 0) || []
}

/**
 * 移除插槽
 * @param type
 * @param index
 */
const onSlotRemove = (type, index?: number) => {
  switch (type) {
    case 'ship':
      workshopData.value.data.shipSlot = null
      workshopData.value.data.weaponSlots = []
      workshopData.value.data.displaySlots = []
      workshopData.value.data.shipUpgradeSlot = null
      workshopData.value.data.secondaryWeaponSlots = [];
      return;
    case 'weapon':
      workshopData.value.data.weaponSlots[index] = Item.fromRawData({})
      break;
    case 'secondaryWeapon':
      workshopData.value.data.secondaryWeaponSlots[index] = Item.fromRawData({})
      break;
    case 'upgrade':
      workshopData.value.data.shipUpgradeSlot = null
      break;
    case 'armor':
      workshopData.value.data.armorSlot = null
      break;
    case 'ultimate':
      workshopData.value.data.ultimateSlot = null
      break;
    case 'display':
      workshopData.value.data.displaySlots[index] = Item.fromRawData({})
      break;
  }
}

/**
 * 选择船
 * @param shipId
 */
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
  workshopData.value.shipFrigateUpgradeList = shipUpItem;

  // 创建陈设插槽
  const furnitureCount = workshopData.value.data.shipSlot.slots.furniture?.[0] || 0;
  workshopData.value.data.displaySlots = Array.from({length: furnitureCount}, () => {
    return Item.fromRawData({})
  })

  // 创建船甲
  workshopData.value.data.armorSlot = null

  // 创建武器插槽，选择初始
  const shipConfig = shipSlotMapping.f[workshopData.value.data.shipSlot.id];
  const weaponSlotCount = shipConfig?.weaponsSlotCount?.[0]?.gunSlotCount || 0;

  workshopData.value.data.weaponSlots = Array.from({length: weaponSlotCount}, () => {
    return Item.fromRawData({})
  })

  // 创建武器插槽方向，用于排它选择以及查询甲板信息用途
  workshopData.value.data.weaponDirections = Array.from({length: weaponSlotCount}, () => null)

  // 创建武器插槽模组
  workshopData.value.data.weaponModification = Array.from({length: weaponSlotCount}, () => null)

  // 创建副武器插槽
  const secondaryWeaponCount = shipConfig?.weaponsSlotCount?.[0]?.secondaryWeapon || 0;
  workshopData.value.data.secondaryWeaponSlots = Array.from({length: secondaryWeaponCount}, () => Item.fromRawData({}))
}

/**
 * 选择终结技能
 */
const onSelectUltimate = () => {
  if (poops.readonly)
    return;

  workshopData.value.ultimateModel = false;
  if (!workshopData.value.ultimateSelect)
    return;

  workshopData.value.data.ultimateSlot = workshopData.value.ultimateSelect
  workshopData.value.ultimateSelect = null;
}

/**
 * 选择升级部件
 */
const onSelectFrigteUpgrad = () => {
  if (poops.readonly)
    return;

  workshopData.value.frigateUpgradeModel = false;
  workshopData.value.data.shipUpgradeSlot = workshopData.value.shipFrigateUpgradeSelect;

  // 更新插槽
  let furnitureBaseSlotCount = workshopData.value.data.shipSlot.slots.furniture[0],
      selectFurnitureTier = workshopData.value.shipFrigateUpgradeSelect.tier - 1,
      resultFurnitureSlotCount: any;

  resultFurnitureSlotCount = shipSlotMapping.f[workshopData.value.data.shipSlot.id].furnitureSlotCount[workshopData.value.data.shipUpgradeSlot ? selectFurnitureTier : furnitureBaseSlotCount]

  // 创建陈设插槽
  workshopData.value.data.displaySlots = Array.from({length: resultFurnitureSlotCount}, () => {
    return Item.fromRawData({})
  })

  // 创建武器插槽
  workshopData.value.data.weaponSlots = Array.from({
    length: shipSlotMapping.f[workshopData.value.data.shipSlot.id].weaponsSlotCount[selectFurnitureTier].gunSlotCount
  }, () => {
    return Item.fromRawData({})
  })
}

/**
 * 获取甲板信息
 */
const getDeckInformation = (index: number, type = 'weapon'): Record<string, any> => {
  try {
    // 添加索引边界检查
    if (index < 0 || index >= workshopData.value.data.weaponDirections.length) {
      return {};
    }

    switch (type) {
      case 'weapon':
        const weaponDirections = workshopData.value?.data?.weaponDirections?.[index],
            weapons = workshopData.value?.data?.weaponSlots?.[index];

        // 检查武器是否存在
        if (!weapons || !weapons.type) return {};

        // 顶层甲板武器 大型甲板仅有一个Top
        if (['ballista', 'seaFire'].includes(weapons.type)) return {top: 1, down: 0}
        if (weaponDirections === undefined) return {};

        // 顶层甲板武器仅能使用Top
        if (['bombard', 'longGun', 'torpedo'].includes(weapons.type)) {
          const {top} = cache.value.weaponDirections[weaponDirections] || {}
          return {top: top || 0, down: 0}
        }
        return cache.value.weaponDirections[weaponDirections] || {};

      case 'secondaryWeapon':
        const auxiliaryWeapon = cache.value.weaponDirections;
        if (!auxiliaryWeapon) return {};

        if (typeof auxiliaryWeapon['auxiliaryWeapon'] == 'number')
          return {top: auxiliaryWeapon['auxiliaryWeapon']}

        return auxiliaryWeapon['auxiliaryWeapon'] || {};

      default:
        return {};
    }
  } catch (e) {
    console.error('Error in getDeckInformation:', e);
    return {};
  }
};

/**
 * 导出数据
 */
const onExport = () => {
  const data = assemblyDataProcessing.export(workshopData.value.data)

  return toRaw(data);
}

/**
 * 导入数据
 */
const onLoad = (data) => {
  const d = assemblyDataProcessing.import(data, attr.value.assemblyUseVersion);

  if (!d || JSON.stringify(d) === '{}') return;

  workshopData.value.data = reactive({
    ...workshopData.value.data,
    ...d
  });
}

const verify = () => {
  return assemblyDataProcessing.verify(workshopData.value.data, attr.value.assemblyUseVersion)
}

const setSetting = (attrData: AssemblyAttr) => {
  if (!attrData) return {onLoad};

  attr.value = attrData

  return {onLoad}
}

/**
 * 清理
 */
const onErasure = () => {
  onSlotRemove('ship')
  onSlotRemove('armor')
  onSlotRemove('ultimate')
}

defineExpose({
  onExport,
  onLoad,
  onErasure,
  setSetting,
  verify,
  data: workshopData.value.data
})
</script>

<template>
  <v-row class="workshop-ship-interior position-relative pa-10 ml-5 mt-3" :class="poops.class">
    <v-col class="position-relative" style="min-width: 650px;z-index: 5" cols="12" sm="12" md="10" lg="10" xl="10">
      <v-col>
        <div class="mb-12">
          <v-row no-gutters align="end">
            <v-col cols="auto">
              <!-- 船只 视图卡槽 S -->
              <ItemSlotBase id="ship_select" size="110px" v-if="!workshopData.data.shipSlot"
                            @click="workshopData.shipModel = true">
                <v-card class="w-100 d-flex align-center justify-center"
                        :disabled="readonly">
                  <v-icon icon="mdi-plus" size="50"></v-icon>
                </v-card>
              </ItemSlotBase>

              <v-hover v-slot="{ isHovering, props : propsHoverClose }" v-else>
                <v-card
                    v-bind="propsHoverClose"
                    class="mx-auto"
                    width="110">
                  <ItemSlotBase size="110px" class="pa-2"
                                v-if="workshopData.data.shipSlot && workshopData.data.shipSlot.id"
                                :class="[workshopData.data.shipSlot && workshopData.data.shipSlot.id ? 'bg-amber' : '']">
                    <v-card class="w-100">
                      <ShipIconWidget :id="workshopData.data.shipSlot.id" :is-show-tooltip="false" :isClickOpenDetail="false"/>
                    </v-card>
                  </ItemSlotBase>

                  <v-overlay
                      v-if="!readonly"
                      :model-value="!!isHovering"
                      class="align-center justify-center"
                      scrim="#000"
                      @click="onSlotRemove('ship')"
                      contained>
                    <v-icon icon="mdi-delete" color="red" size="50"></v-icon>
                  </v-overlay>
                </v-card>

                <div class="mt-2 text-center text-caption text-grey w-100 " :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName">
                  <ShipName :id="workshopData.data.shipSlot.id"></ShipName>
                </div>
              </v-hover>
              <!-- 船只 视图卡槽 E -->
            </v-col>
            <v-col class="ml-2" cols="auto">
              <!-- 升级部件 视图卡槽 S -->
              <v-hover v-slot="{ isHovering, props : propsHoverClose }" v-if="workshopData.data.shipUpgradeSlot">
                <v-card
                    class="mx-auto"
                    width="80"
                    v-bind="propsHoverClose">
                  <v-badge bordered rounded :color="`var(--main-color)`" :offset-x="25" :offset-y="63" class="d-flex">
                    <template v-slot:badge
                              id="ship_frigate_upgrade_select"
                              class="d-flex align-center justify-center">
                      <div class="pt-2 pb-2">
                        <v-icon icon="mdi-chevron-triple-up mr-1"></v-icon>
                        <b>{{ workshopData.data.shipUpgradeSlot.tier || 0 }}</b>
                      </div>
                    </template>
                    <ItemSlotBase
                        size="80px" class="pa-1"
                        :class="[workshopData.data.shipUpgradeSlot ? 'bg-amber' : '']">
                      <ItemIconWidget :id="workshopData.data.shipUpgradeSlot.id" :is-open-detail="false" :is-show-tooltip="!readonly"></ItemIconWidget>
                    </ItemSlotBase>
                  </v-badge>

                  <v-overlay
                      v-if="!readonly"
                      :model-value="!!isHovering"
                      class="align-center justify-center"
                      scrim="#000"
                      @click="onSlotRemove('upgrade')"
                      contained>
                    <v-icon icon="mdi-delete" color="red" size="40"></v-icon>
                  </v-overlay>
                </v-card>

                <div class="mt-2 text-center text-caption text-grey w-100 " :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName">
                  <ItemName :data="workshopData.data.shipUpgradeSlot"></ItemName>
                </div>
              </v-hover>

              <ItemSlotBase size="80px" :padding="1"
                            @click="workshopData.frigateUpgradeModel = true"
                            v-else-if="!workshopData.data.shipUpgradeSlot && workshopData.shipFrigateUpgradeList.length > 0">
                <v-card class="w-100 d-flex align-center justify-center"
                        :disabled="readonly">
                  <v-icon icon="mdi-plus" size="20"></v-icon>
                </v-card>
              </ItemSlotBase>
              <!-- 升级部件 视图卡槽 E -->
            </v-col>
          </v-row>
        </div>

        <div>
          <div>
            <v-row justify="space-around">
              <!-- 陈设 卡槽 S -->
              <v-col cols="auto" class="mr-5">
                <p class="mb-2 px-5 font-weight-bold badge-flavor text-center text-black">{{ t('assembly.workshop.displayTitle') }} ({{ workshopData.data.displaySlots.length || 0 }})</p>
                <template v-if="route.query.debug">
                  {{ workshopData.data.displaySlots || [] }}
                </template>

                <v-row v-for="(display, displayIndex) in workshopData.data.displaySlots"
                       :key="displayIndex">
                  <v-col cols="auto">
                    <v-card class="bg-transparent text-center pt-1" min-height="40" min-width="30">
                      <span class="text-amber-lighten-5">{{ number.intToRoman(displayIndex + 1) }}</span>
                      <template v-slot:image>
                        <v-icon icon="mdi-table-furniture" class="opacity-20" size="30"></v-icon>
                      </template>
                    </v-card>
                  </v-col>
                  <v-col>
                    <div>
                      <ItemSlotBase size="80px" class="pa-2"
                                    v-if="!readonly && workshopData.data.displaySlots[displayIndex] && workshopData.data.displaySlots[displayIndex].id == null">
                        <v-card class="w-100 d-flex align-center justify-center"
                                :disabled="readonly"
                                @click="workshopData.displayModel = true;workshopData.displayInsertIndex = displayIndex">
                          <v-icon icon="mdi-plus"></v-icon>
                        </v-card>
                      </ItemSlotBase>
                      <ItemSlotBase size="80px" v-else-if="readonly && workshopData.data.displaySlots[displayIndex] && workshopData.data.displaySlots[displayIndex].id == null">
                        <v-card class="w-100 d-flex align-center justify-center">
                          <v-icon icon="mdi-block-helper" class="opacity-30" size="20"></v-icon>
                        </v-card>
                      </ItemSlotBase>

                      <v-hover v-slot="{ isHovering, props : propsHoverClose }">
                        <v-card v-bind="propsHoverClose" max-width="80">
                          <ItemSlotBase size="80px" class="pa-1" v-if="display && display.id">
                            <ItemIconWidget :id="display.id" :is-open-detail="false" :is-show-tooltip="readonly"></ItemIconWidget>
                          </ItemSlotBase>
                          <div class="text-center text-caption text-grey w-100" :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName && display && display.id">
                            <ItemName :data="display"></ItemName>
                          </div>

                          <v-overlay
                              v-if="!readonly"
                              :model-value="!!isHovering"
                              class="align-center justify-center"
                              scrim="#000"
                              @click="onSlotRemove('display', displayIndex)"
                              contained>
                            <v-icon icon="mdi-delete" color="red" size="40"></v-icon>
                          </v-overlay>
                        </v-card>
                      </v-hover>
                    </div>
                  </v-col>
                </v-row>

                <ItemSlotBase size="80px" class="pa-2"
                              v-if="workshopData.data.displaySlots.length <= 0">
                  <v-card class="w-100 d-flex align-center justify-center">
                    <v-icon icon="mdi-close-octagon-outline" class="opacity-50" size="30"></v-icon>
                  </v-card>
                </ItemSlotBase>

              </v-col>
              <!-- 陈设 卡槽 E -->

              <!-- 武器列表 卡槽 S -->
              <v-col>
                <!-- 主 -->
                <p class="mb-2 px-3 font-weight-bold badge-flavor text-center text-black">{{ t('assembly.workshop.weaponTitle') }}</p>

                <p class="mb-3 card-flavor bg-black">{{ t('assembly.workshop.mainWeapon') }}</p>
                <div class="ml-5 mb-2"
                     v-if="workshopData.data.weaponSlots && workshopData.data.weaponSlots.length > 0"
                     v-for="(i, index) in workshopData.data.weaponSlots"
                     :key="index">
                  <v-row align="center">
                    <v-col cols="auto" class="pa-0">
                      <ShipTopDownPerspectiveWidget
                          :left="workshopData.data.weaponDirections[index] == 'leftSideWeapon'"
                          :right="workshopData.data.weaponDirections[index] == 'rightSideWeapon'"
                          :center-top="workshopData.data.weaponDirections[index] == 'frontWeapon'"
                          :center-down="workshopData.data.weaponDirections[index] == 'aftWeapon'"
                          class="ml-5"></ShipTopDownPerspectiveWidget>
                    </v-col>
                    <v-divider vertical class="ml-3 mr-2"></v-divider>
                    <v-col>
                      <!-- 武器方向 -->
                      <p class="mb-2 ml-n5 mr-n5 pl-5 title-long-flavor bg-black">
                        <v-select v-if="!readonly" v-model="workshopData.data.weaponDirections[index]"
                                  hide-details
                                  clearable
                                  placeholder="选择武器方向"
                                  variant="underlined"
                                  density="compact"
                                  item-value="0"
                                  item-title="0"
                                  :disabled="readonly"
                                  :items="getOptionalShipWeaponDirection()">
                          <template v-slot:item="{ props: itemProps, item }">
                            <v-list-item v-bind="itemProps">
                              <template v-slot:title>
                                <v-row align="center">
                                  <v-col cols="auto" class="pa-0">
                                    <ShipTopDownPerspectiveWidget
                                        :size="'sm'"
                                        :left="item.raw[0] == 'leftSideWeapon'"
                                        :right="item.raw[0] == 'rightSideWeapon'"
                                        :center-top="item.raw[0] == 'frontWeapon'"
                                        :center-down="item.raw[0] == 'aftWeapon'"
                                        class="ml-5"></ShipTopDownPerspectiveWidget>
                                  </v-col>
                                  <v-col>
                                    {{ t(`codex.ship.${item.raw[0]}`) }}
                                  </v-col>
                                </v-row>
                              </template>
                            </v-list-item>
                          </template>
                          <template v-slot:chip="{item}">
                            {{ t(`codex.ship.${workshopData.data.weaponDirections[index]}`) }}
                          </template>
                          <template v-slot:no-data>
                            <EmptyView></EmptyView>
                          </template>
                        </v-select>
                        <template v-else>
                          <template v-if="workshopData.data.weaponDirections[index]">
                            {{ t(`codex.ship.${workshopData.data.weaponDirections[index]}`) }}
                          </template>
                        </template>
                      </p>

                      <v-row>
                        <v-col cols="auto">
                          <v-hover v-slot="{ isHovering, props : propsHoverClose }" v-if="workshopData.data.weaponSlots[index] && workshopData.data.weaponSlots[index].id">
                            <v-card class="position-relative" v-bind="propsHoverClose" max-width="80">
                              <ItemSlotBase size="80px" class="pa-1">
                                <ItemIconWidget :id="i.id" :is-show-tooltip="readonly" :is-open-detail="false"></ItemIconWidget>
                              </ItemSlotBase>
                              <div class="text-center text-caption text-grey w-100" :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName">
                                <ItemName :data="i"></ItemName>
                              </div>

                              <v-overlay
                                  v-if="!readonly"
                                  :model-value="!!isHovering"
                                  class="align-center justify-center"
                                  scrim="#000"
                                  @click="onSlotRemove('weapon', index)"
                                  contained>
                                <v-icon icon="mdi-delete" color="red" size="40"></v-icon>
                              </v-overlay>
                            </v-card>
                          </v-hover>
                          <ItemSlotBase size="80px" v-else-if="!workshopData.data.weaponDirections[index]">
                            <v-card class="w-100 d-flex align-center justify-center">
                              <v-icon icon="mdi-block-helper" class="opacity-30" size="20"></v-icon>
                            </v-card>
                          </ItemSlotBase>
                          <ItemSlotBase size="80px" v-else>
                            <v-card class="w-100 d-flex align-center justify-center"
                                    :disabled="readonly"
                                    @click="workshopData.weaponModel = true;workshopData.weaponInsertIndex = index">
                              <v-icon icon="mdi-plus"></v-icon>
                            </v-card>
                          </ItemSlotBase>

                          <!-- 武器模组插槽 -->
                          <div class="mb-2 mt-1" v-if="!perfectDisplay">
                            <WeaponModificationWidget :readonly="readonly"
                                                      :disabled="workshopData.data.weaponSlots[index].id == null"
                                                      :data="i"
                                                      size="4"
                                                      v-model="workshopData.data.weaponModifications[index]"></WeaponModificationWidget>
                          </div>
                        </v-col>
                        <v-col class="d-flex align-start">
                          <div class="w-100">
                            <v-divider thickness="4" opacity="1" color="#000" class="w-100 mt-2 mb-2"></v-divider>
                            <p class="opacity-80 text-deck-information">{{ t('codex.ship.topDeck') }}
                              <v-chip size="x-small" density="compact" :variant="getDeckInformation(index).top ? 'flat' : 'tonal'">{{ getDeckInformation(index).top || 0 }}</v-chip>
                            </p>
                            <p class="opacity-80 text-deck-information">{{ t('codex.ship.lowerDeck') }}
                              <v-chip size="x-small" density="compact" :variant="getDeckInformation(index).lower ? 'flat' : 'tonal'">{{ getDeckInformation(index).lower || 0 }}</v-chip>
                            </p>
                          </div>
                        </v-col>
                        <v-col cols="auto">
                          <v-row no-gutters v-if="i && i.id" :class="[!i.id ? 'opacity-30' : '']">
                            <v-col align="center" class="mt-n1">
                              <v-icon icon="mdi-chevron-up" size="16"></v-icon>
                              <ItemSlotBase size="30px"
                                            padding="0"
                                            v-for="(p, pIndex) in getDeckInformation(index).top" :key="pIndex + p">
                                <ItemIconWidget :id="i.id" v-if="i.id"
                                                :is-show-tooltip="false"
                                                :is-open-detail="false"></ItemIconWidget>
                              </ItemSlotBase>
                            </v-col>
                            <v-col align="center" class="mt-n1">
                              <v-icon icon="mdi-chevron-down" size="16"></v-icon>
                              <ItemSlotBase size="30px"
                                            padding="0"
                                            :id="i.id"
                                            v-if="i.id"
                                            v-for="(p, pIndex) in getDeckInformation(index).lower" :key="pIndex">
                                <ItemIconWidget :id="i.id"
                                                :is-show-tooltip="false"
                                                :is-open-detail="false"></ItemIconWidget>
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

                      <!-- 武器模组插槽 仅展示 -->
                      <div class="mb-2 mt-1" v-if="perfectDisplay">
                        <WeaponModificationOnlyShowWidget
                            :item-data="i"
                            :mod-data="workshopData.data.weaponModifications[index]"></WeaponModificationOnlyShowWidget>
                      </div>
                    </v-col>
                  </v-row>
                  <v-divider></v-divider>
                </div>
                <div v-else>
                  <EmptyView></EmptyView>
                </div>

                <!-- 副 -->
                <p class="mt-2 mb-3 card-flavor bg-black">{{ t('assembly.workshop.secondaryWeapon') }}</p>

                <div class="ml-5 mb-2"
                     v-if="workshopData.data.secondaryWeaponSlots && workshopData.data.secondaryWeaponSlots.length > 0"
                     v-for="(i, index) in workshopData.data.secondaryWeaponSlots" :key="index">
                  <v-row align="center">
                    <v-col cols="auto" class="pa-0">
                      <ShipTopDownPerspectiveWidget
                          :centerCenter="i && !!i.id"
                          class="ml-5"></ShipTopDownPerspectiveWidget>
                    </v-col>
                    <v-divider vertical class="ml-3 mr-2"></v-divider>
                    <v-col>
                      <v-row>
                        <v-col cols="auto">
                          <v-hover v-slot="{ isHovering, props : propsHoverClose }" v-if="workshopData.data.secondaryWeaponSlots[index] && workshopData.data.secondaryWeaponSlots[index].id">
                            <v-card class="position-relative" v-bind="propsHoverClose" max-width="80">
                              <ItemSlotBase size="80px" class="pa-1">
                                <ItemIconWidget :id="i.id" :is-show-tooltip="readonly"></ItemIconWidget>
                              </ItemSlotBase>
                              <div class="text-center text-caption text-grey w-100" :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName">
                                <ItemName :data="i"></ItemName>
                              </div>

                              <v-overlay
                                  v-if="!readonly"
                                  :model-value="!!isHovering"
                                  class="align-center justify-center"
                                  scrim="#000"
                                  @click="onSlotRemove('secondaryWeapon', index)"
                                  contained>
                                <v-icon icon="mdi-delete" color="red" size="40"></v-icon>
                              </v-overlay>
                            </v-card>
                          </v-hover>
                          <ItemSlotBase size="80px" v-else-if="readonly && workshopData.data.secondaryWeaponSlots[index] && workshopData.data.secondaryWeaponSlots[index].id == null">
                            <v-card class="w-100 d-flex align-center justify-center">
                              <v-icon icon="mdi-block-helper" class="opacity-30" size="20"></v-icon>
                            </v-card>
                          </ItemSlotBase>
                          <ItemSlotBase size="80px" v-else>
                            <v-card class="w-100 d-flex align-center justify-center"
                                    :disabled="readonly"
                                    @click="workshopData.secondaryWeaponModel = true;workshopData.secondaryWeaponInsertIndex = index">
                              <v-icon icon="mdi-plus"></v-icon>
                            </v-card>
                          </ItemSlotBase>

                          <!-- 副武器模组插槽 -->
                          <div class="mb-2 mt-1" v-if="!perfectDisplay">
                            <WeaponModificationWidget :readonly="readonly"
                                                      :disabled="workshopData.data.secondaryWeaponSlots[index].id == null"
                                                      :data="i" size="4"
                                                      v-model="workshopData.data.secondaryWeaponModifications[index]"></WeaponModificationWidget>
                          </div>
                        </v-col>
                        <v-col class="d-flex align-start">
                          <div class="w-100">
                            <v-divider thickness="4" opacity="1" color="#000" class="w-100 mt-2 mb-2"></v-divider>
                            <p class="opacity-80 text-deck-information">{{ t('codex.ship.topDeck') }}
                              <v-chip size="x-small" density="compact" :variant="getDeckInformation(index, 'secondaryWeapon').top ? 'flat' : 'tonal'">{{ getDeckInformation(index, 'secondaryWeapon').top || 0 }}</v-chip>
                            </p>
                          </div>
                        </v-col>
                        <v-col cols="auto">
                          <v-row no-gutters v-if="i && i.id" :class="[!i.id ? 'opacity-30' : '']">
                            <v-col align="center" class="mt-n1">
                              <v-icon icon="mdi-chevron-up" size="16"></v-icon>
                              <ItemSlotBase size="30px"
                                            padding="0"
                                            v-for="(p, pIndex) in getDeckInformation(index, 'secondaryWeapon').top" :key="pIndex + p">
                                <ItemIconWidget :id="i.id" v-if="i.id"
                                                :is-show-tooltip="false"
                                                :is-open-detail="false"></ItemIconWidget>
                              </ItemSlotBase>
                            </v-col>
                          </v-row>
                        </v-col>
                      </v-row>

                      <!-- 武器模组插槽 仅展示 -->
                      <div class="mb-2 mt-1" v-if="perfectDisplay">
                        <WeaponModificationOnlyShowWidget
                            :item-data="i"
                            :mod-data="workshopData.data.secondaryWeaponModifications[index]"></WeaponModificationOnlyShowWidget>
                      </div>
                    </v-col>
                  </v-row>
                </div>
                <div v-else>
                  <EmptyView></EmptyView>
                </div>
              </v-col>
              <!-- 武器列表 卡槽 E -->

              <!-- 船甲 卡槽 S -->
              <v-col cols="auto">
                <p class="mb-3 px-3 font-weight-bold badge-flavor text-center text-black">{{ t('assembly.workshop.armorTitle') }}</p>

                <div>
                  <v-hover v-slot="{ isHovering, props : propsHoverClose }" v-if="workshopData.data.armorSlot">
                    <v-card v-bind="propsHoverClose" class="position-relative" width="80">
                      <ItemSlotBase size="80px" class="pa-1">
                        <ItemIconWidget :id="workshopData.data.armorSlot.id" :is-open-detail="false" :is-show-tooltip="readonly"></ItemIconWidget>
                      </ItemSlotBase>
                      <div class="text-center text-caption text-grey w-100 " :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName">
                        <ItemName :data="workshopData.data.armorSlot"></ItemName>
                      </div>
                      <v-overlay
                          v-if="!readonly"
                          :model-value="!!isHovering"
                          class="align-center justify-center"
                          scrim="#000"
                          @click="onSlotRemove('armor')"
                          contained>
                        <v-icon icon="mdi-delete" color="red" size="40"></v-icon>
                      </v-overlay>
                    </v-card>
                  </v-hover>

                  <ItemSlotBase id="ship_select" size="80px" v-if="!readonly && !workshopData.data.armorSlot">
                    <v-card class="w-100 d-flex align-center justify-center"
                            @click="workshopData.armorModel = true"
                            :disabled="readonly">
                      <v-icon icon="mdi-plus" size="30"></v-icon>
                    </v-card>
                  </ItemSlotBase>
                  <ItemSlotBase size="80px" class="pa-2 d-flex justify-center align-center" v-else-if="readonly && !workshopData.data.armorSlot">
                    <v-card class="w-100 h-100 d-flex align-center justify-center">
                      <v-icon icon="mdi-block-helper" class="opacity-30" size="20"></v-icon>
                    </v-card>
                  </ItemSlotBase>
                </div>

                <template v-if="workshopData.data.armorSlot != null">
                  <!-- 船甲模组插槽 -->
                  <div class="mb-2 mt-1" v-if="!perfectDisplay">
                    <WeaponModificationWidget :readonly="readonly"
                                              :data="workshopData.data.armorSlot"
                                              size="4"
                                              v-model="workshopData.data.armorModification[0]"></WeaponModificationWidget>
                  </div>

                  <!-- 船甲模组插槽 仅展示 -->
                  <div class="mb-2 mt-1" v-if="perfectDisplay">
                    <WeaponModificationOnlyShowWidget
                        :item-data="workshopData.data.armorSlot"
                        :mod-data="workshopData.data.armorModification[0]"></WeaponModificationOnlyShowWidget>
                  </div>
                </template>
              </v-col>
              <!-- 船甲 卡槽 E -->

              <!-- 终极技能 卡槽 S -->
              <v-col cols="auto">
                <p class="mb-3 px-3 font-weight-bold badge-flavor text-center text-black">{{ t('assembly.workshop.ultimateTitle') }}</p>

                <v-tooltip
                    v-model="workshopData.ultimateModel"
                    :open-on-hover="false"
                    :offset="[-100, -120]"
                    location="bottom left"
                    content-class="pa-0"
                    min-width="450"
                    max-width="450"
                    interactive
                    open-on-click>
                  <template v-slot:activator="{ props: propsSlot }">
                    <ItemSlotBase id="ship_select" size="80px" v-if="!readonly && !workshopData.data.ultimateSlot">
                      <v-card class="w-100 d-flex align-center justify-center" v-bind="propsSlot"
                              :disabled="readonly">
                        <v-icon icon="mdi-plus" size="30"></v-icon>
                      </v-card>
                    </ItemSlotBase>
                    <ItemSlotBase size="80px" class="pa-2 d-flex justify-center align-center" v-else-if="readonly && !workshopData.data.ultimateSlot">
                      <v-card class="w-100 h-100 d-flex align-center justify-center">
                        <v-icon icon="mdi-block-helper" class="opacity-30" size="20"></v-icon>
                      </v-card>
                    </ItemSlotBase>

                    <v-hover v-slot="{ isHovering, props : propsHoverClose }" v-else>
                      <v-card v-bind="propsHoverClose" class="position-relative" width="80">
                        <ItemSlotBase size="80px" class="pa-2"
                                      v-if="workshopData.data.ultimateSlot && workshopData.data.ultimateSlot.id">
                          <UltimateIconWidget :id="workshopData.data.ultimateSlot.id" :isClickOpenDetail="false"></UltimateIconWidget>
                        </ItemSlotBase>
                        <div class="text-center text-caption text-grey w-100 " :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName">
                          <UltimateName :id="workshopData.data.ultimateSlot.id"></UltimateName>
                        </div>
                        <v-overlay
                            v-if="!readonly"
                            :model-value="!!isHovering"
                            class="align-center justify-center"
                            scrim="#000"
                            @click="onSlotRemove('ultimate')"
                            contained>
                          <v-icon icon="mdi-delete" color="red" size="30"></v-icon>
                        </v-overlay>
                      </v-card>
                    </v-hover>
                  </template>
                  <v-card v-slot:default>
                    <v-row class="ga-0 pa-2 pb-5">
                      <v-col cols="3"
                             v-for="(ultimate,ultimateIndex) in ultimates"
                             :key="ultimateIndex">
                        <v-card width="92" elevation="0">
                          <ItemSlotBase
                              size="92px" class="pa-1"
                              @click="workshopData.ultimateSelect = ultimate"
                              :class="[
                                          workshopData.ultimateSelect ? workshopData.ultimateSelect!.id == ultimate!.id ? 'bg-amber' : '' : ''
                                      ]">
                            <UltimateIconWidget :id="ultimate.id" :isClickOpenDetail="false"></UltimateIconWidget>
                          </ItemSlotBase>
                          <div class="text-center text-caption text-grey w-100 " :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName">
                            <UltimateName :id="ultimate.id"></UltimateName>
                          </div>
                        </v-card>
                      </v-col>
                    </v-row>
                    <v-card-actions class="bg-amber">
                      <v-spacer></v-spacer>
                      <v-btn variant="tonal" class="ml-1" @click="workshopData.ultimateModel = false">{{ t('basic.button.cancel') }}</v-btn>
                      <v-btn variant="tonal" @click="onSelectUltimate(workshopData.ultimateSelect.id)">{{ t('basic.button.submit') }}</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-tooltip>
              </v-col>
              <!-- 终极技能 卡槽 E -->

            </v-row>
          </div>
        </div>
      </v-col>
    </v-col>

    <div class="assembly-show-image-box" :class="hasImageSlot ? 'overflow-hidden' : ''">
      <slot name="image"></slot>
      <div class="assembly-variable-gradient" v-if="hasImageSlot"></div>
      <div class="background-dot-grid" v-if="hasImageSlot"></div>
    </div>
  </v-row>

  <template v-if="!readonly">
    <!-- 船只 选择器 S -->
    <v-dialog v-model="workshopData.shipModel"
              content-class="pa-0"
              max-height="90%"
              min-width="450"
              max-width="700">
      <v-card v-slot:default class="overflow-hidden">
        <v-card-title>
          <v-row>
            <b class="font-weight-bold text-h5 pa-5">{{ t('assembly.workshop.insertShipTitle') }}</b>
            <v-spacer></v-spacer>
            <v-col cols="auto">
              <v-btn icon variant="text" class="ml-1" @click="workshopData.weaponModel = false">
                <v-icon icon="mdi-close"/>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>
        <v-row>
          <AssemblyClassificationShowList
              v-model="workshopData.data.shipSlot"
              @clickSelectItem="workshopData.shipModel = false"
              loadDataType="ship"
              :tags="getShipList"></AssemblyClassificationShowList>
        </v-row>
      </v-card>
    </v-dialog>
    <!-- 船只 选择器 E -->

    <!-- 船只 升级部件 选择器 S -->
    <v-dialog v-model="workshopData.frigateUpgradeModel"
              content-class="pa-0"
              max-height="90%"
              min-width="450"
              max-width="700">
      <v-card v-slot:default class="overflow-hidden">
        <v-card-title>
          <v-row>
            <b class="font-weight-bold text-h5 pa-5">{{ t('assembly.workshop.insertShipFrigateUpgradeTitle') }}</b>
            <v-spacer></v-spacer>
            <v-col cols="auto">
              <v-btn icon variant="text" class="ml-1" @click="workshopData.weaponModel = false">
                <v-icon icon="mdi-close"/>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>
        <v-card class="demo-reel bg-black pt-3" flat border>
          <v-row class="ga-0 pa-5 pb-5">
            <v-col cols="auto"
                   v-for="(upgrade,upgradeIndex) in workshopData.shipFrigateUpgradeList"
                   :key="upgradeIndex">
              <v-card variant="text" width="99">
                <ItemSlotBase
                    size="99px"
                    @click="workshopData.shipFrigateUpgradeSelect = upgrade"
                    :class="[workshopData.shipFrigateUpgradeSelect ? workshopData.shipFrigateUpgradeSelect!.id == upgrade!.id ? 'bg-amber' : '' : '']">
                  <ItemIconWidget :padding="2" :id="upgrade.id" :is-open-detail="false" :is-show-tooltip="false"></ItemIconWidget>
                </ItemSlotBase>

                <div class="text-center d-flex w-100" :class="{'singe-line': !(isFullName || attr.isFullName)}">
                  <ItemName :id="upgrade.id"></ItemName>
                </div>
              </v-card>
            </v-col>
          </v-row>
          <v-card-actions class="bg-amber-lighten-1">
            <v-spacer></v-spacer>
            <v-btn variant="text" class="ml-2" @click="workshopData.frigateUpgradeModel = false">{{ t('basic.button.cancel') }}</v-btn>
            <v-btn variant="tonal"
                   class="bg-amber"
                   v-if="workshopData.shipFrigateUpgradeSelect"
                   @click="onSelectFrigteUpgrad">
              {{ t('basic.button.submit') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-card>
    </v-dialog>
    <!-- 船只 升级部件 选择器 E -->

    <!-- 武器 选择器 S -->
    <v-dialog v-model="workshopData.weaponModel"
              content-class="pa-0"
              max-height="90%"
              min-width="450"
              max-width="700">
      <v-card v-slot:default class="overflow-hidden">
        <v-card-title>
          <v-row>
            <b class="font-weight-bold text-h5 pa-5">{{ t('assembly.workshop.insertWeaponTitle') }}</b>
            <v-spacer></v-spacer>
            <v-col cols="auto">
              <v-btn icon variant="text" class="ml-1" @click="workshopData.weaponModel = false">
                <v-icon icon="mdi-close"/>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>
        <v-row>
          <AssemblyClassificationShowList
              v-model="workshopData.data.weaponSlots[workshopData.weaponInsertIndex]"
              @clickSelectItem="workshopData.weaponModel = false"
              :tags="getShipWeaponList"></AssemblyClassificationShowList>
        </v-row>
      </v-card>
    </v-dialog>
    <!-- 武器 选择器 E -->

    <!-- 副武器 选择器 S -->
    <v-dialog v-model="workshopData.secondaryWeaponModel"
              ref="secondaryWeaponModel"
              content-class="pa-0"
              max-height="90%"
              min-height="300"
              min-width="450"
              max-width="700">
      <v-card v-slot:default>
        <v-card-title>
          <v-row>
            <b class="font-weight-bold text-h5 pa-5">{{ t('assembly.workshop.insertSecondaryWeaponTitle') }}</b>
            <v-spacer></v-spacer>
            <v-col cols="auto">
              <v-btn icon variant="text" class="ml-1" @click="workshopData.secondaryWeaponModel = false">
                <v-icon icon="mdi-close"/>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>
        <v-row>
          <AssemblyClassificationShowList
              v-model="workshopData.data.secondaryWeaponSlots[workshopData.secondaryWeaponInsertIndex]"
              @clickSelectItem="workshopData.secondaryWeaponModel = false"
              :tags="getSecondaryWeapon"></AssemblyClassificationShowList>
        </v-row>
      </v-card>
    </v-dialog>
    <!-- 副武器 选择器 E -->

    <!-- 陈设 选择器 S-->
    <v-dialog v-model="workshopData.displayModel"
              content-class="pa-0"
              max-height="90%"
              min-height="300"
              min-width="450"
              max-width="700">
      <v-card v-slot:default class="overflow-hidden">
        <v-card-title>
          <v-row>
            <b class="font-weight-bold text-h5 pa-5">{{ t('assembly.workshop.insertDisplayTitle') }}</b>
            <v-spacer></v-spacer>
            <v-col cols="auto">
              <v-btn icon variant="text" class="ml-1" @click="workshopData.displayModel = false">
                <v-icon icon="mdi-close"/>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>
        <v-row>
          <AssemblyClassificationShowList
              v-model="workshopData.data.displaySlots[workshopData.displayInsertIndex]"
              @clickSelectItem="workshopData.displayModel = false"
              :tags="getShipDisplayList"></AssemblyClassificationShowList>
        </v-row>
      </v-card>
    </v-dialog>
    <!-- 陈设 选择器 E-->

    <!-- 船甲 选择器 S-->
    <v-dialog v-model="workshopData.armorModel"
              content-class="pa-0"
              max-height="90%"
              min-height="300"
              min-width="450"
              max-width="700">
      <v-card v-slot:default class="overflow-hidden">
        <v-card-title>
          <v-row>
            <b class="font-weight-bold text-h5 pa-5">{{ t('assembly.workshop.insertArmorTitle') }}</b>
            <v-spacer></v-spacer>
            <v-col cols="auto">
              <v-btn icon variant="text" class="ml-1" @click="workshopData.armorModel = false">
                <v-icon icon="mdi-close"/>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>
        <v-row>
          <AssemblyClassificationShowList
              v-model="workshopData.data.armorSlot"
              @clickSelectItem="workshopData.armorModel = false"
              :tags="getShipArmorList"></AssemblyClassificationShowList>
        </v-row>
      </v-card>
    </v-dialog>
    <!-- 船甲 选择器 E-->

  </template>
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
}

.workshop-ship-interior {
  user-select: none;
}

.workshop-ships-show-image {
  -webkit-user-drag: none;
  position: absolute;
  z-index: 1;
  right: 0;
  width: 400px;
}

.text-deck-information {
  font-size: 12px;
}

.assembly-show-image-box {
  position: absolute !important;
  right: 0;
  top: 0;
  z-index: 0;
  opacity: .3;
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
    opacity: .8;
  }
}
</style>
