import type {ModRarity} from "@/assets/types/Codex";

/**
 * 各稀有度武器对应的改装卡槽配置表
 */
export const WEAPON_MOD_SLOT_CONFIG: Record<string, ModRarity[]> = {
  common: ['basic', 'basic', 'advanced', 'special'],
  uncommon: ['basic', 'advanced', 'special', 'mythic'],
  rare: ['basic', 'advanced', 'special', 'mythic'],
  epic: ['basic', 'advanced', 'advanced', 'mythic'],
  legendary: ['basic', 'advanced', 'mythic', 'mythic'],
};

/**
 * 具有治疗属性的词条集合
 */
const REPAIR_PERKS: ReadonlySet<string> = new Set([
  'repair',
  'repair1',
  'repair2',
  'repair3',
  'repairBomb',
  'repairBlast',
]);

/**
 * 判断指定物品是否为治疗类武器
 *
 * @param item 物品数据对象
 * @returns 是否属于治疗武器
 */
export function isRepairWeapon(item: any): boolean {
  if (!item?.perks || !Array.isArray(item.perks)) {
    return false;
  }
  return item.perks.some((p: string) => REPAIR_PERKS.has(p));
}

/**
 * 获取武器所具备的元素与伤害类型集合
 * 包含武器固有词条转化以及已装配模组带来的元素属性
 *
 * @param item 武器数据对象
 * @param installedMods 武器当前已装配的模组插槽列表
 * @returns 伤害类型字符串集合
 */
export function getWeaponElementalDamageTypes(item: any, installedMods?: any[]): Set<string> {
  const types = new Set<string>();
  const perks = Array.isArray(item?.perks) ? item.perks : [];

  if (perks.some((p: string) => p.includes('explosive') || p.includes('combustion') || p === 'blast' || p === 'precisionBlast')) {
    types.add('explosive');
  }
  if (perks.some((p: string) => p.includes('flooding'))) {
    types.add('flooding');
  }
  if (perks.some((p: string) => p.includes('burning'))) {
    types.add('burning');
  }
  if (perks.some((p: string) => p.includes('piercing'))) {
    types.add('piercing');
  }
  if (perks.some((p: string) => p.includes('electric'))) {
    types.add('electric');
  }
  if (perks.some((p: string) => p.includes('toxic'))) {
    types.add('toxic');
  }

  // 累计装配模组带来的额外元素属性
  if (installedMods && Array.isArray(installedMods)) {
    installedMods.forEach((slot: any) => {
      const modValue = slot?.value || slot;
      if (modValue?.damageType && modValue?.effectType === 'addElementalDamage') {
        types.add(modValue.damageType);
      } else if (modValue?.damageType) {
        types.add(modValue.damageType);
      }
    });
  }

  return types;
}

/**
 * 根据武器稀有度获取允许装配的模组等级集合
 *
 * @param rarity 武器稀有度
 * @returns 允许的模组等级集合
 */
export function getWeaponAllowedGrades(rarity?: string): Set<ModRarity> {
  const slots = WEAPON_MOD_SLOT_CONFIG[rarity || 'common'] || WEAPON_MOD_SLOT_CONFIG.common;
  return new Set<ModRarity>(slots);
}

/**
 * 根据武器稀有度获取标准卡槽类型列表
 *
 * @param rarity 武器稀有度
 * @returns 卡槽类型列表
 */
export function getWeaponExpectedSlotTypes(rarity?: string): ModRarity[] {
  return WEAPON_MOD_SLOT_CONFIG[rarity || 'common'] || WEAPON_MOD_SLOT_CONFIG.common;
}

/**
 * 筛选物品可用的改装模组
 * 稀有度卡槽限制、武器类型匹配、治疗权限、特殊武器限制以及前置元素伤害需求
 *
 * @param item 目标物品对象
 * @param modificationsRaw 全部模组字典或数组
 * @param options 筛选选项配置
 * @returns 按等级划分的可用模组列表字典
 */
export function filterAvailableModifications(
  item: any,
  modificationsRaw: Record<string, any> | any[],
  options: {
    installedMods?: any[];
    ignoreConditions?: boolean;
    filterByAllowedGrades?: boolean;
  } = {}
): Record<ModRarity, any[]> {
  const result: Record<ModRarity, any[]> = {
    basic: [],
    advanced: [],
    special: [],
    mythic: [],
  };

  if (!item?.type) {
    return result;
  }

  const { installedMods = [], ignoreConditions = false, filterByAllowedGrades = true } = options;
  const isRepair = isRepairWeapon(item);
  const elementalTypes = getWeaponElementalDamageTypes(item, installedMods);
  const allowedGrades = getWeaponAllowedGrades(item.rarity);

  const modEntries = Array.isArray(modificationsRaw)
    ? modificationsRaw
    : Object.values(modificationsRaw);

  modEntries.forEach((mod: any) => {
    if (!mod || !mod.grade) {
      return;
    }

    const grade = mod.grade as ModRarity;

    // 检查武器稀有度是否开放该等级插槽
    if (filterByAllowedGrades && !ignoreConditions && !allowedGrades.has(grade)) {
      return;
    }

    // 检查武器类别是否有适配的变体
    const matchingVariants = mod.variants?.filter((variant: any) =>
      variant.itemType?.includes(item.type)
    ) || [];

    if (matchingVariants.length === 0) {
      return;
    }

    if (!ignoreConditions) {
      // 治疗武器权限校验
      const repairAccess = mod.repairAccess || 'none';
      if (isRepair) {
        if (repairAccess !== 'shared' && repairAccess !== 'exclusive') {
          return;
        }
      } else {
        if (repairAccess !== 'none' && repairAccess !== 'shared') {
          return;
        }
      }

      // 特殊武器限制（如 blightkeeper）
      if (
        item.id === 'blightkeeper' &&
        !['rapidReload', 'haste', 'reach', 'hardyBuoys', 'durableBuoys', 'lifeline', 'purify'].includes(mod.id)
      ) {
        return;
      }

      // supreme 模组专属武器限制
      if (
        mod.id === 'supreme' &&
        !['wrathfulWard', 'stormwovenSymphony', 'celestialDance', 'novaArma'].includes(item.id)
      ) {
        return;
      }

      // 前置元素伤害要求校验
      if (mod.requiredDamageType && !elementalTypes.has(mod.requiredDamageType)) {
        return;
      }
    }

    if (result[grade]) {
      const modCopy = {
        ...mod,
        variants: matchingVariants,
      };
      result[grade].push(modCopy);
    }
  });

  return result;
}

/**
 * 支持模组改装的物品类型集合
 * 参考 AssemblyWidget.vue 中的武器、副武器与船甲配置
 */
export const MOD_SUPPORTED_ITEM_TYPES: ReadonlySet<string> = new Set([
  // 武器 (Ship Weapons)
  'culverin',
  'demicannon',
  'bombard',
  'longGun',
  'torpedo',
  'ballista',
  'seaFire',
  // 副武器 (Secondary Weapons)
  'springloader',
  'mortar',
  'rocket',
  // 船甲 (Ship Armor)
  'armor',
]);

/**
 * 判断物品是否支持模组改装卡槽
 *
 * @param item 目标物品或物品类型
 * @returns 是否支持改装
 */
export function isItemSupportsModification(item: any): boolean {
  if (!item) return false;
  const itemType = typeof item === 'string' ? item : item.type;
  if (!itemType) return false;
  return MOD_SUPPORTED_ITEM_TYPES.has(itemType);
}


