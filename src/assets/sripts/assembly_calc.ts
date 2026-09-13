import { Ships, Items, Modifications } from "glow-prow-data";
import type { Item, Ship, Modification } from "glow-prow-data";
import { CoreCalc, type ItemCalcResult } from "@/assets/sripts/item_carc";

/**
 * 解析物品对象
 */
export const resolveItem = (slot: any): Item | null => {
  if (!slot) return null;
  const id = typeof slot === 'string' ? slot : slot.id;
  if (id && (Items as any)[id]) return (Items as any)[id];
  if (typeof slot === 'object' && slot.id && slot.type) return slot as Item;
  return null;
};

/**
 * 解析船只对象
 */
export const resolveShip = (slot: any): Ship | null => {
  if (!slot) return null;
  const id = typeof slot === 'string' ? slot : slot.id;
  if (id && (Ships as any)[id]) return (Ships as any)[id];
  if (typeof slot === 'object' && slot.id && slot.size) return slot as Ship;
  return null;
};

/**
 * 解析模组对象
 */
export const resolveMod = (mod: any): Modification | null => {
  if (!mod) return null;
  const modId = mod?.value?.id || mod?.value || mod?.id || (typeof mod === 'string' ? mod : null);
  if (modId && (Modifications as any)[modId]) return (Modifications as any)[modId];
  if (typeof mod === 'object' && mod.effectType) return mod as Modification;
  return null;
};

/**
 * 标准化配装数据
 */
export const normalizeAssemblyPayload = (raw: any): any => {
  if (!raw) return null;
  const unwrapped = raw;
  if (unwrapped?.assembly?.data) return unwrapped.assembly.data;
  if (unwrapped?.assembly && typeof unwrapped.assembly === 'object' && unwrapped.assembly.shipSlot) return unwrapped.assembly;
  if (unwrapped?.data && (unwrapped.data.shipSlot || unwrapped.data.weaponSlots)) return unwrapped.data;
  return unwrapped;
};

/**
 * 将 assembly 格式数据转换为 ItemCalcResult 计算结果
 */
export const computeAssemblyCalcResult = (raw: any): ItemCalcResult | null => {
  const data = normalizeAssemblyPayload(raw);
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
};
