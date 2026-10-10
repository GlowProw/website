/**
 * 游戏数据图鉴 (Codex) 展示相关类型
 */
import type {Item} from "glow-prow-data";

// EmoteView.vue

export interface EmojiItem {
  name: string;
  key?: string;
  child?: EmojiItem[];
}

export interface EmojiConfig {
  default: string;
  child: EmojiChild[];
}

export interface EmojiChild {
  name: string;
  titleEmoteName?: string;
  child: EmojiItem[];
}

export interface Position {
  left: number;
  top: number;
}

// CodexViewData.vue

export type LoadDataType = 'ship' | 'item' | 'commoditie' | 'material' | 'ultimate' | 'cosmetic' | 'modification' | 'set' | 'treasureMap' | 'mapLocation' | 'npc' | 'empireSkill' | 'mastery' | 'quest'
export type SortField = 'dateAdded' | 'lastUpdated'
export type SortOrder = 'asc' | 'desc'

// ItemView.vue

// 选择器所加载的类型
export type ContentSelectorOption = "ship" | "item" | "material" | "cosmetic" | "ultimate" | "modification" | "set" | "treasureMap" | "commoditie" | "mapLocation"

// TimeView.vue

export interface TimeMap {
  primitive: string;
  primitiveDateString: string;
  conversionDate: string;
  conversionLocalDate: string;
  timeFormatName: string;
  localeDateString: string;
}

// ItemIconManager.vue

export interface sizeConfig {
  size: number | string
  box: {
    margin: number,
    padding: number,
  },
  icon: {
    margin: number,
    padding: number,
  },
}

// snbWidget/rhombusWidget.vue

// 快捷预设类型:
// 'none' (无 / 未插词条: 仅白色空心边框)
// 'normal' (普通: 黄色边框 + 黄色实心)
// 'normal-congenital' (普通 先天: 黄色边框 + 黄色实心 + 透明火焰)
// 'adept' (大师: 黄色角 + 黄色边框 + 黄色实心)
// 'adept-congenital' (大师 先天: 黄色角 + 黄色边框 + 黄色实心 + 透明火焰)
export type RhombusType =
  | 'none'
  | 'normal'
  | 'normal-congenital'
  | 'adept'
  | 'adept-congenital'
  | string;

export interface CommonRhombusProps {
  size?: string | number;
  activateColor?: string;
  inactiveColor?: string;
  highlightColor?: string;
  glowOpacity?: number | string;
  glowBlur?: number | string;
  flameOpacity?: number | string;
  flameBlur?: number | string;
}

// 预设模式: 传 type，排斥 border/slot/adept/glow 等细分参数
export interface TypeRhombusProps extends CommonRhombusProps {
  type: RhombusType;
  border?: never;
  borderActivate?: never;
  borderHighlightActivate?: never;
  slot?: never;
  slotActivate?: never;
  slotHighlightActivate?: never;
  adept?: never;
  adeptActivate?: never;
  adeptHighlightActivate?: never;
  glow?: never;
}

// 细分模式: 传细分参数，排斥 type
export interface CustomRhombusProps extends CommonRhombusProps {
  type?: never;
  border?: boolean;
  borderActivate?: boolean;
  borderHighlightActivate?: boolean;
  slot?: boolean;
  slotActivate?: boolean;
  slotHighlightActivate?: boolean;
  adept?: boolean;
  adeptActivate?: boolean;
  adeptHighlightActivate?: boolean;
  glow?: boolean;
}

export type RhombusWidgetProps = TypeRhombusProps | CustomRhombusProps;

// snbWidget/weaponModificationWidget.vue

export type ModSlotType = string;
export type ModRarity = 'basic' | 'advanced' | 'special' | 'mythic';
export type ModCategory = 'all' | ModRarity;

export interface ModSlot {
  rarity?: ModSlotType;
  type?: ModRarity;
  value: any | null;
}

export interface ModItem {
  id: string;
  grade: ModRarity;
  name?: string;
  description?: string;
  damageType?: string;
  requiredDamageType?: string;
  variants?: any[];
  effects?: string[];
}

// snbWidget/itemDamageTypeWidget.vue

export type ItemDamageTypeSize = 'mini' | 'default'

// snbWidget/zoneName.vue

export type EitherDataOrId =
    | { data: any; id?: never }
    | { data?: never; id: string | number };

// snbWidget/itemName.vue

export type EitherDataOrIdAndTier =
    | { data: Item; id?: never; tier?: never }
    | { data?: never; id: string; tier?: number };

// empireSkillSimulation/EmpireCanvas.vue

export interface HierarchyNodeData {
  id: string;
  parentId: string | null;
  data: any;
  skillPointValue?: number;
}
