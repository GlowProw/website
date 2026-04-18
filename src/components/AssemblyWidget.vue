<script setup lang="ts">
import {computed, provide, reactive, Ref, ref, toRaw, useAttrs, useSlots, watch} from "vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useRoute} from "vue-router";
import {AssemblyAttr, AssemblyWidgetProps, AssemblyWorkshopData} from "@/assets/types";
import {number} from "@/assets/sripts/index"
import {Ships, Ultimates} from "glow-prow-data";
import {Item, Items} from "glow-prow-data/src/entity/Items";
import {Ship} from "glow-prow-data/src/entity/Ships";

import shipSlotMapping from "@/config/shipsConfig.json";

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
import AssemblySvgIcon from "@/components/AssemblySvgIcon.vue";
import {useDisplay} from "vuetify/framework";

const poops = withDefaults(defineProps<AssemblyWidgetProps>(), {
      readonly: false,
      isShowEmpty: true,
      perfectDisplay: false,
      class: ''
    }),
    slots = useSlots(),
    attrs = useAttrs(),
    route = useRoute(),
    ships = Ships,
    items = Items,
    ultimates = Ultimates,
    assemblyDataProcessing = new AssemblyDataProcessing(),
    emit = defineEmits(['update:model-value', 'update:item-change']),
    {t} = useI18nUtils(computed(() => poops.locale)),
    {mobile} = useDisplay()

provide('context-locale', computed(() => poops.locale));

watch(() => poops.locale, (newLoc) => {
  console.log('[AssemblyWidget Debug] Prop Locale changed ->', newLoc);
}, {immediate: true});

const castToAny = (v: any) => v;

let workshopData = ref<AssemblyWorkshopData>({
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
      shipDisplaySelect: null,
      shipFrigateUpgradeList: [],

      data: {
        shipSlot: null, // 船
        ultimateSlot: null, // 技能
        shipUpgradeSlot: null, // 船 升级配方
        weaponDirections: [], // 武器朝向 信息
        weaponModifications: [], // 武器   安装模组
        weaponSlots: [], // 武器
        armorSlot: null, // 船甲
        armorModification: [], // 船甲模组
        secondaryWeaponSlots: [], // 副武器
        secondaryWeaponModifications: [], // 副武器 安装模组
        displaySlots: [], // 家具陈设
        weaponModification: [],

        // 平台版本
        // ** 它可能不存在，如果有则依靠此__version识别，没有则主要使用attr.assemblyUseVersion, 否则降级 **
        __version: AssemblyDataProcessing.nowVersion,
      },
    }),
    // 最大主陈设
    maxMajorDisplayCount = 1,
    hasImageSlot = computed(() => !!slots.image),
    hasItemChangeEvent = computed(() => !!attrs.onUpdateItemChange),
    hasModelValueEvent = computed(() => !!attrs.onUpdateModelValue),
    frigateUpgradeRef = ref(null),

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

watch(() => workshopData.value?.frigateUpgradeModel, (value) => {
  // 更新升级部件可用列表
  console.log(frigateUpgradeRef)
  if (frigateUpgradeRef.value)
    frigateUpgradeRef.value.updateData()
})

watch(() => workshopData.value?.data?.shipSlot, (value) => {
  let result: Record<string, any> = {},
      workshop_data = workshopData.value.data

  // 选择船只，如果它已经有数据则不处理
  if (value && workshop_data.shipSlot?.id != null && workshop_data.displaySlots.length <= 0) {
    onSelectShip(workshopData.value.data.shipSlot!.id)
  }

  if (value && value.slots)
    Object.entries(value.slots).forEach((i: any) => {
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
    getShipUpgradeList = computed(() => {
      return ['shipUpgrade']; // get All
    }),
    // 获取船只列表
    getShipList = computed(() => {
      return []; // get All
    }),
    // 获取武器列表
    getShipWeaponList = computed(() => {
      let tag = ['culverin', 'demicannon', 'bombard', 'longGun', 'torpedo'],
          conditionsTag: Record<string, string[]> = {
            'frontWeapon': ['ballista', 'seaFire'],
            'leftSideWeapon': [],
            'rightSideWeapon': [],
            'aftWeapon': []
          },
          queryTags: string[] = []

      const direction = workshopData.value.data.weaponDirections[workshopData.value.weaponInsertIndex];
      if (direction) {
        queryTags = queryTags.concat(
            tag,
            conditionsTag[direction] || []
        )
      } else {
        queryTags = queryTags.concat(tag)
      }
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
      })
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
const onSlotRemove = (type: string, index?: number) => {
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
 * 可选船只升级
 * 自定义选择器，获取符合的船只的升级部件
 */
const getShipUpgradeFilterList = (i): boolean => {
  // <- 这里返回都是升级部件
  // <id>Upgrade<数字>
  const prefix = `${workshopData.value.data.shipSlot.id}Upgrade`
  if (i.id.startsWith(prefix) && /^\d+$/.test(i.id.slice(prefix.length))) {
    return true
  }
  return false
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

  workshopData.value.data.ultimateSlot = workshopData.value.ultimateSelect as any
  workshopData.value.ultimateSelect = null;
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
    console.error('Error in getDeckInformation:', e)
    return {};
  }
};

/**
 * 导出数据
 */
const onExport = () => {
  const data = assemblyDataProcessing.export(workshopData.value.data)

  return toRaw(data)
}

/**
 * 导入数据
 */
const onLoad = (data) => {
  let d = assemblyDataProcessing.import(data, attr.value.assemblyUseVersion)

  if (!d || JSON.stringify(d) === '{}') return;

  workshopData.value.data = reactive({
    ...toRaw(workshopData.value.data),
    ...d
  })
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

defineOptions({name: 'AssemblyWidget'})
</script>

<template>
  <v-row class="workshop-ship-interior position-relative pa-5 mt-3" :class="poops.class">
    <v-col class="position-relative" style="z-index: 5" cols="12" lg="12">
      <v-col>
        <div class="mb-12">
          <v-row no-gutters align="end">
            <v-col cols="auto" id="ship_select">
              <!-- 船只 视图卡槽 S -->
              <ItemSlotBase size="110px" v-if="!workshopData.data.shipSlot"
                            @click="workshopData.shipModel = true">
                <v-card class="w-100 d-flex align-center justify-center"
                        :disabled="readonly">
                  <v-icon icon="mdi-plus" size="50"></v-icon>
                </v-card>
              </ItemSlotBase>

              <v-hover v-slot="{ isHovering, props : propsHoverClose }" v-else>
                <v-card
                    v-bind="propsHoverClose"
                    class="mx-auto">
                  <ItemSlotBase size="110px"
                                v-if="workshopData.data.shipSlot && workshopData.data.shipSlot.id"
                                :padding="2"
                                :class="[workshopData.data.shipSlot && workshopData.data.shipSlot.id ? 'bg-amber' : '']">
                    <ShipIconWidget :id="workshopData.data.shipSlot.id"
                                    :is-show-tooltip="poops.perfectDisplay"
                                    :isOpenDetail="false"
                                    :margin="0"
                                    :padding="0"/>
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
                  <ShipName :id="workshopData.data.shipSlot.id" :locale="poops.locale"></ShipName>
                </div>
              </v-hover>
              <!-- 船只 视图卡槽 E -->
            </v-col>

            <v-col class="ml-2" cols="auto">
              <!-- 升级部件 视图卡槽 S -->
              <v-hover v-slot="{ isHovering, props : propsHoverClose }"
                       v-if="workshopData.data.shipUpgradeSlot">
                <div class="mb-1" v-if="workshopData.data.shipUpgradeSlot.tier">
                  <v-icon icon="mdi-chevron-triple-up" class="mr-1"></v-icon>
                  <b>{{ workshopData.data.shipUpgradeSlot.tier || 0 }}</b>
                </div>

                <v-card
                    class="mx-auto"
                    variant="text"
                    v-bind="propsHoverClose">
                  <ItemSlotBase
                      size="80px"
                      :class="[workshopData.data.shipUpgradeSlot ? 'bg-amber' : '']">
                    <ItemIconWidget :id="workshopData.data.shipUpgradeSlot.id"
                                    :is-open-detail="!readonly"
                                    :is-show-tooltip="poops.perfectDisplay"></ItemIconWidget>
                  </ItemSlotBase>

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
                  <ItemName :data="castToAny(workshopData.data.shipUpgradeSlot)" :locale="poops.locale"></ItemName>
                </div>
              </v-hover>

              <ItemSlotBase size="80px" :padding="1"
                            @click="workshopData.frigateUpgradeModel = true"
                            v-if="!workshopData.data.shipUpgradeSlot && workshopData.shipFrigateUpgradeList.length > 0">
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
            <v-row justify="start">
              <!-- 陈设 卡槽 S -->
              <v-col cols="12" sm="4" md="2" lg="2">
                <v-card variant="tonal" class="mb-2 py-2 px-10 font-weight-bold text-center singe-line">
                  {{ t('assembly.workshop.displayTitle') }} ({{ workshopData.data.displaySlots.length || 0 }})
                </v-card>

                <template v-if="route.query.debug">
                  {{ workshopData.data.displaySlots || [] }}
                </template>

                <v-row>
                  <v-col
                      v-for="(display, displayIndex) in workshopData.data.displaySlots"
                      :key="displayIndex"
                      cols="4"
                      sm="6"
                      md="12"
                      lg="12">
                    <v-row :justify="mobile ? 'center' : 'start'"
                           style="  display: flex;flex-wrap: nowrap;"
                           v-if="isShowEmpty || workshopData.data.displaySlots[displayIndex] && workshopData.data.displaySlots[displayIndex]?.id != null">
                      <v-col cols="auto">
                        <v-card variant="text" class="bg-transparent text-center pt-1" min-height="40" min-width="30">
                          <span class="text-amber-lighten-5">{{ number.intToRoman(displayIndex + 1) }}</span>
                          <template v-slot:image>
                            <AssemblySvgIcon name="tableFurniture" class="opacity-20" size="38"></AssemblySvgIcon>
                          </template>
                        </v-card>
                      </v-col>
                      <v-col cols="auto">
                        <div>
                          <ItemSlotBase size="80px" class="pa-2"
                                        v-if="!readonly && workshopData.data.displaySlots[displayIndex] && workshopData.data.displaySlots[displayIndex].id == null">
                            <v-card class="w-100 d-flex align-center justify-center"
                                    variant="text"
                                    :disabled="readonly"
                                    @click="workshopData.displayModel = true;workshopData.displayInsertIndex = displayIndex">
                              <v-icon icon="mdi-plus"></v-icon>
                            </v-card>
                          </ItemSlotBase>
                          <ItemSlotBase size="80px" v-if="readonly && isShowEmpty && workshopData.data.displaySlots[displayIndex]?.id == null">
                            <v-card variant="text" class="w-100 d-flex align-center justify-center">
                              <v-icon icon="mdi-block-helper" class="opacity-30" size="20"></v-icon>
                            </v-card>
                          </ItemSlotBase>

                          <v-hover v-slot="{ isHovering, props : propsHoverClose }">
                            <v-card variant="text" v-bind="propsHoverClose">
                              <ItemSlotBase size="80px" class="pa-1" v-if="display && display.id" :id="display.id">
                                <ItemIconWidget :id="display.id" :is-open-detail="false" :is-show-tooltip="readonly"></ItemIconWidget>
                              </ItemSlotBase>
                              <div class="text-center text-caption text-grey w-100" :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName && display && display.id">
                                <ItemName :data="castToAny(display)" :locale="poops.locale"></ItemName>
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
                  </v-col>
                </v-row>
              </v-col>
              <!-- 陈设 卡槽 E -->

              <!-- 武器列表 卡槽 S -->
              <v-col cols="12" sm="8" md="10" lg="6">
                <!-- 主 -->
                <v-card variant="tonal" class="mb-2 py-2 font-weight-bold text-center">
                  {{ t('assembly.workshop.weaponTitle') }}
                </v-card>

                <v-row class="font-weight-bold" align="center">
                  <v-col cols="auto">
                    <img src="../assets/images/icon-weapon.png" height="28" width="28"/>
                  </v-col>
                  <v-col>
                    <v-divider opacity=".2" thickness="2"></v-divider>
                  </v-col>
                  <v-col cols="auto" class="opacity-50">
                    {{ t('assembly.workshop.mainWeapon') }}
                  </v-col>
                </v-row>
                <div class="ml-5 mb-2"
                     v-if="workshopData.data.weaponSlots && workshopData.data.weaponSlots.length > 0"
                     v-for="(i, index) in workshopData.data.weaponSlots"
                     :key="index">

                  <template v-if="isShowEmpty || workshopData.data.weaponSlots[index] && workshopData.data.weaponSlots[index]?.id">
                    <v-row align="start">
                      <v-col cols="auto" class="d-dlex justify-center align-center">
                        <ShipTopDownPerspectiveWidget
                            :left="workshopData.data.weaponDirections[index] == 'leftSideWeapon'"
                            :right="workshopData.data.weaponDirections[index] == 'rightSideWeapon'"
                            :center-top="workshopData.data.weaponDirections[index] == 'frontWeapon'"
                            :center-down="workshopData.data.weaponDirections[index] == 'aftWeapon'"
                            class="mx-5 mt-2"></ShipTopDownPerspectiveWidget>
                      </v-col>
                      <v-col>
                        <!-- 武器方向 S -->
                        <p class="mb-2 ml-n5 pl-5">
                          <v-select v-if="!readonly" v-model="workshopData.data.weaponDirections[index]"
                                    hide-details
                                    clearable
                                    :context-locale="poops.locale"
                                    placeholder="选择武器方向"
                                    variant="solo-filled"
                                    density="compact"
                                    item-value="0"
                                    item-title="0"
                                    :disabled="readonly"
                                    :items="getOptionalShipWeaponDirection()">
                            <template v-slot:item="{ props: itemProps, item }">
                              <v-list-item v-bind="itemProps">
                                <template v-slot:title>
                                  <v-row align="center">
                                    <v-col cols="auto" class="d-dlex justify-center align-center">
                                      <ShipTopDownPerspectiveWidget
                                          :size="'sm'"
                                          :left="item.raw[0] == 'leftSideWeapon'"
                                          :right="item.raw[0] == 'rightSideWeapon'"
                                          :center-top="item.raw[0] == 'frontWeapon'"
                                          :center-down="item.raw[0] == 'aftWeapon'"></ShipTopDownPerspectiveWidget>
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
                        </p>
                        <!-- 武器方向 E -->

                        <v-row>
                          <v-col cols="auto">
                            <v-hover v-slot="{ isHovering, props : propsHoverClose }" v-if="workshopData.data.weaponSlots[index] && workshopData.data.weaponSlots[index]?.id">
                              <v-card variant="text" class="position-relative" v-bind="propsHoverClose">
                                <ItemSlotBase size="80px" class="pa-1" v-if="i && i.id" :id="i.id">
                                  <ItemIconWidget :id="i.id" :is-show-tooltip="readonly" :is-open-detail="false"></ItemIconWidget>
                                </ItemSlotBase>
                                <div class="text-center text-caption text-grey w-100" :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName">
                                  <ItemName :data="castToAny(i)" :locale="poops.locale"></ItemName>
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
                              <v-card variant="text" class="w-100 d-flex align-center justify-center">
                                <AssemblySvgIcon name="blockHelper" class="opacity-30" size="20"></AssemblySvgIcon>
                              </v-card>
                            </ItemSlotBase>
                            <ItemSlotBase size="80px" v-else>
                              <v-card class="w-100 d-flex align-center justify-center"
                                      variant="text"
                                      :disabled="readonly"
                                      @click="workshopData.weaponModel = true;workshopData.weaponInsertIndex = index">
                                <v-icon icon="mdi-plus"></v-icon>
                              </v-card>
                            </ItemSlotBase>

                            <!-- 武器模组插槽 -->
                            <div class="mb-2 mt-1" v-if="!perfectDisplay && workshopData.data.weaponSlots && workshopData.data.weaponSlots[index] && workshopData.data.weaponSlots[index]?.id != null">
                              <WeaponModificationWidget :readonly="readonly"
                                                        :disabled="workshopData.data.weaponSlots[index]?.id == null"
                                                        :data="i"
                                                        size="4"
                                                        v-model="workshopData.data.weaponModifications[index]"></WeaponModificationWidget>
                            </div>
                          </v-col>
                          <v-col class="d-flex align-start">
                            <div class="w-100">
                              <div class="opacity-80 text-deck-information d-flex align-center singe-line w-100 mt-2 mb-2">
                                <span class="u" v-if="workshopData.data.weaponDirections[index]">{{ t(`codex.ship.${workshopData.data.weaponDirections[index]}`) }}</span>
                                <v-divider thickness="2" opacity=".2"></v-divider>
                              </div>
                              <p class="opacity-80 text-deck-information">{{ t('codex.ship.topDeck') }}
                                <v-chip size="x-small" density="compact" :variant="getDeckInformation(index).top ? 'flat' : 'tonal'">{{ getDeckInformation(index).top || 0 }}</v-chip>
                              </p>
                              <p class="opacity-80 text-deck-information">{{ t('codex.ship.lowerDeck') }}
                                <v-chip size="x-small" density="compact" :variant="getDeckInformation(index).lower ? 'flat' : 'tonal'">{{ getDeckInformation(index).lower || 0 }}</v-chip>
                              </p>
                            </div>
                          </v-col>
                        </v-row>

                        <!-- 武器模组插槽 仅展示 -->
                        <div class="mb-2 mt-1" v-if="perfectDisplay">
                          <WeaponModificationOnlyShowWidget
                              :item-data="castToAny(i)"
                              :mod-data="workshopData.data.weaponModifications[index]"></WeaponModificationOnlyShowWidget>
                        </div>
                      </v-col>
                      <v-col cols="auto">
                        <v-row no-gutters v-if="i && i.id" :class="[!i.id ? 'opacity-30' : '']">
                          <v-col align="center" class="mt-n1" v-if="getDeckInformation(index).top">
                            <v-icon icon="mdi-chevron-up" size="16"></v-icon>
                            <ItemSlotBase size="40px"
                                          v-if="i.id"
                                          :padding="0"
                                          :margin="0"
                                          v-for="(p, pIndex) in getDeckInformation(index).top" :key="pIndex + p">
                              <ItemIconWidget :id="i.id" v-if="i.id"
                                              :padding="0"
                                              :margin="0"
                                              :is-show-tooltip="false"
                                              :is-open-detail="false"></ItemIconWidget>
                            </ItemSlotBase>
                          </v-col>
                          <v-col align="center" class="mt-n1" v-if="getDeckInformation(index).lower">
                            <v-icon icon="mdi-chevron-down" size="16"></v-icon>
                            <ItemSlotBase size="40px"
                                          v-if="i.id"
                                          :padding="0"
                                          :margin="0"
                                          v-for="(p, pIndex) in getDeckInformation(index).lower"
                                          :key="pIndex">
                              <ItemIconWidget :id="i.id"
                                              :padding="0"
                                              :margin="0"
                                              :is-show-tooltip="false"
                                              :is-open-detail="false"></ItemIconWidget>
                            </ItemSlotBase>
                          </v-col>
                        </v-row>
                      </v-col>
                    </v-row>
                  </template>
                </div>
                <div v-else>
                  <EmptyView></EmptyView>
                </div>

                <!-- 副 -->
                <v-row class="font-weight-bold" align="center">
                  <v-col cols="auto">
                    <img src="../assets/images/icon-weapon.png" height="28" width="28"/>
                  </v-col>
                  <v-col>
                    <v-divider opacity=".2" thickness="2"></v-divider>
                  </v-col>
                  <v-col cols="auto" class="opacity-50">
                    {{ t('assembly.workshop.secondaryWeapon') }}
                  </v-col>
                </v-row>

                <div class="ml-5 mb-2"
                     v-if="workshopData.data.secondaryWeaponSlots && workshopData.data.secondaryWeaponSlots.length > 0"
                     v-for="(i, index) in workshopData.data.secondaryWeaponSlots" :key="index">

                  <template v-if="isShowEmpty || workshopData.data.secondaryWeaponSlots[index] && workshopData.data.secondaryWeaponSlots[index]?.id != null">
                    <v-row align="center">
                      <v-col cols="auto" class="d-dlex justify-center align-center">
                        <ShipTopDownPerspectiveWidget
                            :centerCenter="i && !!i.id"
                            class="mx-5 mt-2"></ShipTopDownPerspectiveWidget>
                      </v-col>
                      <v-col>
                        <v-row>
                          <v-col cols="auto">
                            <v-hover v-slot="{ isHovering, props : propsHoverClose }" v-if="workshopData.data.secondaryWeaponSlots[index] && workshopData.data.secondaryWeaponSlots[index]?.id">
                              <v-card variant="text" class="position-relative" v-bind="propsHoverClose">
                                <ItemSlotBase size="80px" class="pa-1" v-if="i && i.id" :id="i.id">
                                  <ItemIconWidget :id="i.id" :is-show-tooltip="readonly"></ItemIconWidget>
                                </ItemSlotBase>
                                <div class="text-center text-caption text-grey w-100" :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName">
                                  <ItemName :data="castToAny(i)" :locale="poops.locale"></ItemName>
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
                            <ItemSlotBase size="80px" v-else-if="readonly && workshopData.data.secondaryWeaponSlots[index] && workshopData.data.secondaryWeaponSlots[index]?.id == null">
                              <v-card variant="text" class="w-100 d-flex align-center justify-center">
                                <AssemblySvgIcon name="blockHelper" class="opacity-30" size="20"></AssemblySvgIcon>
                              </v-card>
                            </ItemSlotBase>
                            <ItemSlotBase size="80px" v-else>
                              <v-card class="w-100 d-flex align-center justify-center"
                                      variant="text"
                                      :disabled="readonly"
                                      @click="workshopData.secondaryWeaponModel = true;workshopData.secondaryWeaponInsertIndex = index">
                                <v-icon icon="mdi-plus"></v-icon>
                              </v-card>
                            </ItemSlotBase>

                            <!-- 副武器模组插槽 -->
                            <div class="mb-2 mt-1" v-if="!perfectDisplay">
                              <WeaponModificationWidget :readonly="readonly"
                                                        :disabled="workshopData.data.secondaryWeaponSlots[index]?.id == null"
                                                        :data="i" size="4"
                                                        v-model="workshopData.data.secondaryWeaponModifications[index]"></WeaponModificationWidget>
                            </div>
                          </v-col>
                          <v-col class="d-flex align-start">
                            <div class="w-100">
                              <v-divider thickness="2" opacity=".2" class="w-100 mt-2 mb-2"></v-divider>
                              <p class="opacity-80 text-deck-information">{{ t('codex.ship.topDeck') }}
                                <v-chip size="x-small" density="compact" :variant="getDeckInformation(index, 'secondaryWeapon').top ? 'flat' : 'tonal'">{{ getDeckInformation(index, 'secondaryWeapon').top || 0 }}</v-chip>
                              </p>
                            </div>
                          </v-col>
                          <v-col cols="auto">
                            <v-row no-gutters v-if="i && i.id" :class="[!i.id ? 'opacity-30' : '']">
                              <v-col align="center" class="mt-n1">
                                <v-icon icon="mdi-chevron-up" size="16"></v-icon>
                                <ItemSlotBase size="40px"
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
                              :item-data="castToAny(i)"
                              :mod-data="workshopData.data.secondaryWeaponModifications[index]"></WeaponModificationOnlyShowWidget>
                        </div>
                      </v-col>
                    </v-row>
                  </template>
                </div>
                <div v-else>
                  <EmptyView></EmptyView>
                </div>
              </v-col>
              <!-- 武器列表 卡槽 E -->

              <!-- 船甲 卡槽 S -->
              <v-col cols="12" md="auto" lg="auto">
                <v-card variant="tonal" class="mb-2 py-2 px-10 font-weight-bold text-center singe-line">
                  {{ t('assembly.workshop.armorTitle') }}
                </v-card>

                <div>
                  <template v-if="isShowEmpty || workshopData.data.armorSlot">
                    <v-hover v-slot="{ isHovering, props : propsHoverClose }" v-if="workshopData.data.armorSlot">
                      <v-card variant="text" v-bind="propsHoverClose" class="position-relative">
                        <ItemSlotBase size="80px" class="pa-1" :id="workshopData.data.armorSlot.id">
                          <ItemIconWidget :id="workshopData.data.armorSlot.id" :is-open-detail="false" :is-show-tooltip="readonly"></ItemIconWidget>
                        </ItemSlotBase>
                        <div class="text-center text-caption text-grey w-100 " :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName">
                          <ItemName :data="castToAny(workshopData.data.armorSlot)" :locale="poops.locale"></ItemName>
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

                    <ItemSlotBase size="80px" v-if="!readonly && !workshopData.data.armorSlot">
                      <v-card class="w-100 d-flex align-center justify-center"
                              variant="text"
                              @click="workshopData.armorModel = true"
                              :disabled="readonly">
                        <v-icon icon="mdi-plus" size="30"></v-icon>
                      </v-card>
                    </ItemSlotBase>
                    <ItemSlotBase size="80px" class="pa-2 d-flex justify-center align-center" v-else-if="readonly && !workshopData.data.armorSlot">
                      <v-card variant="text" class="w-100 h-100 d-flex align-center justify-center">
                        <AssemblySvgIcon name="blockHelper" class="opacity-30" size="20"></AssemblySvgIcon>
                      </v-card>
                    </ItemSlotBase>
                  </template>
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
                  <div class="mb-2 mt-1" style="max-width: 300px" v-if="perfectDisplay">
                    <WeaponModificationOnlyShowWidget
                        :item-data="castToAny(workshopData.data.armorSlot)"
                        :mod-data="workshopData.data.armorModification[0]"></WeaponModificationOnlyShowWidget>
                  </div>
                </template>
              </v-col>
              <!-- 船甲 卡槽 E -->

              <!-- 终极技能 卡槽 S -->
              <v-col cols="12" md="auto" lg="auto">
                <v-card variant="tonal" class="mb-2 py-2 px-10 font-weight-bold text-center singe-line">
                  {{ t('assembly.workshop.ultimateTitle') }}
                </v-card>

                <template v-if="isShowEmpty || workshopData.ultimateModel">
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
                      <ItemSlotBase size="80px" v-if="!readonly && !workshopData.data.ultimateSlot">
                        <v-card variant="text" class="w-100 d-flex align-center justify-center"
                                v-bind="propsSlot"
                                :disabled="readonly">
                          <v-icon icon="mdi-plus" size="30"></v-icon>
                        </v-card>
                      </ItemSlotBase>
                      <ItemSlotBase size="80px" class="pa-2 d-flex justify-center align-center" v-else-if="readonly && !workshopData.data.ultimateSlot">
                        <v-card variant="text" class="w-100 h-100 d-flex align-center justify-center">
                          <AssemblySvgIcon name="blockHelper" class="opacity-30" size="20"></AssemblySvgIcon>
                        </v-card>
                      </ItemSlotBase>

                      <v-hover v-slot="{ isHovering, props : propsHoverClose }" v-else>
                        <v-card v-bind="propsHoverClose" variant="text" class="position-relative">
                          <ItemSlotBase size="80px"
                                        v-if="workshopData.data.ultimateSlot && workshopData.data.ultimateSlot.id">
                            <UltimateIconWidget :id="workshopData.data.ultimateSlot.id" :isOpenDetail="false"></UltimateIconWidget>
                          </ItemSlotBase>
                          <div class="text-center text-caption text-grey w-100 " :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName">
                            <UltimateName :id="castToAny(workshopData.data.ultimateSlot).id" :locale="poops.locale"></UltimateName>
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
                    <v-card>
                      <v-row class="ga-0 pa-2 pb-5">
                        <v-col cols="3"
                               v-for="(ultimate,ultimateIndex) in ultimates"
                               :key="ultimateIndex">
                          <v-card variant="text" width="92" elevation="0">
                            <ItemSlotBase
                                size="90px"
                                @click="workshopData.ultimateSelect = castToAny(ultimate)"
                                :class="[
                                          workshopData.ultimateSelect ? castToAny(workshopData.ultimateSelect)?.id == ultimate?.id ? 'bg-amber' : '' : ''
                                      ]">
                              <UltimateIconWidget :id="ultimate.id" :isOpenDetail="false"></UltimateIconWidget>
                            </ItemSlotBase>
                            <div class="text-center text-caption text-grey w-100 " :class="{'singe-line': !(isFullName || attr.isFullName)}" v-if="attr.isShowItemName">
                              <UltimateName :id="ultimate.id" :locale="poops.locale"></UltimateName>
                            </div>
                          </v-card>
                        </v-col>
                      </v-row>
                      <v-card-actions class="bg-amber">
                        <v-spacer></v-spacer>
                        <v-btn variant="tonal" class="ml-1" @click="workshopData.ultimateModel = false">{{ t('basic.button.cancel') }}</v-btn>
                        <v-btn variant="tonal" @click="onSelectUltimate()">{{ t('basic.button.submit') }}</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-tooltip>
                </template>
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
              content-class="pa-0">
      <v-container>
        <v-card class="overflow-hidden">
          <v-card-title>
            <v-row>
              <b class="font-weight-bold text-h5 pa-5">{{ t('assembly.workshop.insertShipTitle') }}</b>
              <v-spacer></v-spacer>
              <v-col cols="auto">
                <v-btn icon variant="text" class="ml-1" @click="workshopData.shipModel = false">
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
      </v-container>
    </v-dialog>
    <!-- 船只 选择器 E -->

    <!-- 船只 升级部件 选择器 S -->
    <v-dialog v-model="workshopData.frigateUpgradeModel"
              content-class="pa-0">
      <v-container>
        <v-card class="overflow-hidden">
          <v-card-title>
            <v-row>
              <b class="font-weight-bold text-h5 pa-5">{{ t('assembly.workshop.insertShipFrigateUpgradeTitle') }}</b>
              <v-spacer></v-spacer>
              <v-col cols="auto">
                <v-btn icon variant="text" class="ml-1" @click="workshopData.frigateUpgradeModel = false">
                  <v-icon icon="mdi-close"/>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-title>
          <v-row>
            <AssemblyClassificationShowList
                ref="frigateUpgradeRef"
                v-model="workshopData.data.shipUpgradeSlot"
                @clickSelectItem="workshopData.frigateUpgradeModel = false"
                loadDataType="item"
                :filterFun="getShipUpgradeFilterList"
                :tags="getShipUpgradeList"></AssemblyClassificationShowList>
          </v-row>
        </v-card>
      </v-container>
    </v-dialog>
    <!-- 船只 升级部件 选择器 E -->

    <!-- 武器 选择器 S -->
    <v-dialog v-model="workshopData.weaponModel"
              content-class="pa-0">
      <v-container>
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
      </v-container>
    </v-dialog>
    <!-- 武器 选择器 E -->

    <!-- 副武器 选择器 S -->
    <v-dialog v-model="workshopData.secondaryWeaponModel"
              ref="secondaryWeaponModel"
              content-class="pa-0">
      <v-container>
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
      </v-container>
    </v-dialog>
    <!-- 副武器 选择器 E -->

    <!-- 陈设 选择器 S-->
    <v-dialog v-model="workshopData.displayModel"
              content-class="pa-0">
      <v-container>
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
      </v-container>
    </v-dialog>
    <!-- 陈设 选择器 E-->

    <!-- 船甲 选择器 S-->
    <v-dialog v-model="workshopData.armorModel"
              content-class="pa-0">
      <v-container>
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
      </v-container>
    </v-dialog>
    <!-- 船甲 选择器 E-->

  </template>
</template>

<style lang="less">
@import "@/assets/styles/link";

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
