<script setup lang="ts">
import {computed, ref, toRaw} from "vue";
import {useI18n} from "vue-i18n";
import {Ships, Items, Modifications} from "glow-prow-data";
import type {Item, Ship, Modification} from "glow-prow-data";
import {CoreCalc, ItemCalcResult, type WeaponDirection} from "@/assets/sripts/item_carc";
import CalcResultTable from "@/components/CalcResultTable.vue";
import EmptyView from "@/components/EmptyView.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ShipIconWidget from "@/components/snbWidget/shipIconWidget.vue";
import ShipName from "@/components/snbWidget/shipName.vue";

const props = withDefaults(defineProps<{
      assemblyData?: any,
      assemblyWorkshopRef?: any,
      readonly?: boolean
    }>(), {
      assemblyData: null,
      assemblyWorkshopRef: null,
      readonly: true
    }),
    {t} = useI18n()

const internalData = ref<any>(null),
    settingAttr = ref<any>({})


/**
 * 解析物品对象
 */
const resolveItem = (slot: any): Item | null => {
  if (!slot) return null;
  const id = typeof slot === 'string' ? slot : slot.id;
  if (id && Items[id]) return Items[id];
  if (typeof slot === 'object' && slot.id && slot.type) return slot as Item;
  return null;
}

/**
 * 解析船只对象
 */
const resolveShip = (slot: any): Ship | null => {
  if (!slot) return null;
  const id = typeof slot === 'string' ? slot : slot.id;
  if (id && Ships[id]) return Ships[id];
  if (typeof slot === 'object' && slot.id && slot.size) return slot as Ship;
  return null;
}

/**
 * 解析模组对象
 */
const resolveMod = (mod: any): Modification | null => {
  if (!mod) return null;
  const modId = mod?.value?.id || mod?.value || mod?.id || (typeof mod === 'string' ? mod : null);
  if (modId && Modifications[modId]) return Modifications[modId];
  if (typeof mod === 'object' && mod.effectType) return mod as Modification;
  return null;
}

/**
 * 取得当前生效的 assembly 数据
 */
const currentData = computed(() => {
  if (props.assemblyData) {
    return toRaw(props.assemblyData);
  }
  if (internalData.value) {
    return toRaw(internalData.value);
  }
  if (props.assemblyWorkshopRef) {
    const raw = props.assemblyWorkshopRef.value || props.assemblyWorkshopRef;
    if (raw?.workshopData?.data) return toRaw(raw.workshopData.data);
    if (raw?.workshopData?.value?.data) return toRaw(raw.workshopData.value.data);
    if (raw?.onExport) return raw.onExport();
  }
  return null;
})

/**
 * 将 assembly 格式数据转换为 ItemCalcResult 计算结果
 */
const calcResult = computed<ItemCalcResult | null>(() => {
  const data = currentData.value;
  if (!data) return null;

  const ship = resolveShip(data.shipSlot);
  if (!ship) return null;

  let builder: any = CoreCalc.create().addShip(ship);

  // 船只升级
  if (data.shipUpgradeSlot) {
    const upgradeItem = resolveItem(data.shipUpgradeSlot);
    if (upgradeItem) {
      builder = builder.addShipUpgrade(upgradeItem);
    }
  }

  // 船甲及模组
  if (data.armorSlot) {
    const armorItem = resolveItem(data.armorSlot);
    if (armorItem) {
      const armorMods: Modification[] = [];
      if (Array.isArray(data.armorModification)) {
        for (const m of data.armorModification) {
          const mod = resolveMod(m);
          if (mod) armorMods.push(mod);
        }
      }
      builder = builder.addArmor(armorItem, armorMods);
    }
  }

  // 家具陈设
  if (Array.isArray(data.displaySlots)) {
    const furnitures: Item[] = [];
    for (const slot of data.displaySlots) {
      const fItem = resolveItem(slot);
      if (fItem) furnitures.push(fItem);
    }
    if (furnitures.length > 0) {
      builder = builder.addFurniture(furnitures);
    }
  }

  // 武器
  if (Array.isArray(data.weaponSlots)) {
    for (let i = 0; i < data.weaponSlots.length; i++) {
      const wSlot = data.weaponSlots[i];
      const wItem = resolveItem(wSlot);
      if (!wItem) continue;

      const dir = data.weaponDirections?.[i] || 'frontWeapon';

      const mods: Modification[] = [];
      const rawMods = data.weaponModifications?.[i];
      if (Array.isArray(rawMods)) {
        for (const m of rawMods) {
          const mod = resolveMod(m);
          if (mod) mods.push(mod);
        }
      }

      builder = builder.addWeapon(wItem, dir, mods);
    }
  }

  // 副武器
  if (Array.isArray(data.secondaryWeaponSlots)) {
    for (let i = 0; i < data.secondaryWeaponSlots.length; i++) {
      const secSlot = data.secondaryWeaponSlots[i];
      const secItem = resolveItem(secSlot);
      if (!secItem) continue;

      const mods: Modification[] = [];
      const rawMods = data.secondaryWeaponModifications?.[i];
      if (Array.isArray(rawMods)) {
        for (const m of rawMods) {
          const mod = resolveMod(m);
          if (mod) mods.push(mod);
        }
      }

      builder = builder.addAuxiliaryWeapon(secItem, mods);
    }
  }

  return builder.run();
})

/**
 * 暴露方法与标准工作坊适配
 */
const onLoad = (data: any) => {
  internalData.value = data;
}

const setSetting = (setting: any) => {
  settingAttr.value = setting;
  return {onLoad};
}

defineExpose({
  onLoad,
  setSetting,
  calcResult,
  currentData
})

defineOptions({
  name: "AssemblyDataInfoResultWidget"
})
</script>

<template>
  <div class="assembly-data-info-result-widget">
    <template v-if="calcResult && calcResult.shipId">
      <v-row align="center">
        <v-col cols="auto" class="d-flex ga-2 align-center">
          <ItemSlotBase size="40px">
            <ShipIconWidget :id="calcResult.shipId"></ShipIconWidget>
          </ItemSlotBase>
          <ShipName :id="calcResult.shipId"></ShipName>
        </v-col>
        <v-col>
          <v-divider opacity=".2"></v-divider>
        </v-col>
      </v-row>

      <CalcResultTable :result="calcResult" />
    </template>
    <template v-else>
      <v-card variant="text" border class="pa-10 text-center rounded-lg">
        <EmptyView>
          <template v-slot:title>
            {{ t('assembly.workshop.emptyShip') }}
          </template>
          <template v-slot:description>
            {{ t('assembly.workshop.emptyShipDesc') }}
          </template>
        </EmptyView>
      </v-card>
    </template>
  </div>
</template>

<style scoped lang="less">
.assembly-data-info-result-widget {
  width: 100%;
}
</style>
