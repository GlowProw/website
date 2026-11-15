import {
  Cosmetics,
  Items,
  Commodities,
  Materials,
  Modifications,
  Ships,
  Ultimates,
  Sets,
  MapLocations,
  Masterys,
  Enemies,
} from 'glow-prow-data';
import type { TimeBasedDrop } from '@/assets/types/Drop';

export type RewardCategoryType =
  | 'cosmetic'
  | 'item'
  | 'material'
  | 'commodity'
  | 'modification'
  | 'ship'
  | 'ultimate'
  | 'set'
  | 'mapLocation'
  | 'mastery'
  | 'enemy';

export interface MatchedReward {
  /**
   * 实体唯一标识
   */
  id: string;

  /**
   * 实体对应的挂件类型
   */
  type: RewardCategoryType;

  /**
   * 原始数据源分类名
   */
  rawCategory: string;
}

// 分类名与组件类型的映射字典
const CATEGORY_MAP: Record<string, RewardCategoryType> = {
  cosmetics: 'cosmetic',
  cosmetic: 'cosmetic',
  items: 'item',
  item: 'item',
  commodities: 'commodity',
  commodity: 'commodity',
  materials: 'material',
  material: 'material',
  modifications: 'modification',
  modification: 'modification',
  ships: 'ship',
  ship: 'ship',
  ultimates: 'ultimate',
  ultimate: 'ultimate',
  sets: 'set',
  set: 'set',
  mapLocations: 'mapLocation',
  mapLocation: 'mapLocation',
  masterys: 'mastery',
  mastery: 'mastery',
  enemies: 'enemy',
  enemy: 'enemy',
};

// 静态实体对象集合
const STATIC_ENTITIES: Array<{ category: string; data: Record<string, any> }> = [
  { category: 'cosmetics', data: Cosmetics },
  { category: 'items', data: Items },
  { category: 'commodities', data: Commodities },
  { category: 'materials', data: Materials },
  { category: 'modifications', data: Modifications },
  { category: 'ships', data: Ships },
  { category: 'ultimates', data: Ultimates },
  { category: 'sets', data: Sets },
  { category: 'mapLocations', data: MapLocations },
  { category: 'enemies', data: Enemies },
];

// 全局检索索引缓存
let cachedIndex: Map<string, MatchedReward> | null = null;
// 记录最近合入的 messages 对象标识
let lastIndexedMessages: any = null;

/**
 * 规范化匹配键文本
 * 去除常见掉落修饰前缀、品类后缀、括号说明以及非字母数字字符并转为小写
 *
 * @param text 待规范化文本
 * @param stripAffixes 是否剔除品类修饰前后缀
 */
export function normalizeKey(text?: string | null, stripAffixes = true): string {
  if (!text) return '';
  let s = String(text).trim().toLowerCase();
  if (stripAffixes) {
    s = s.replace(/^(hull\s*color|sail\s*color|sail\s*pattern|pattern|emblem|figurehead|pet)\s*-\s*/i, '');
    s = s.replace(/^.*custom_id_/i, '');
    s = s.replace(/\s+(emblem|sail\s*color|sail\s*pattern|pattern|hull|figurehead|pet)(\s*\(.*\))?$/i, '');
    s = s.replace(/\([^)]*\)/g, '');
  }
  return s.replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
}

/**
 * 注册实体键到查找索引中
 *
 * @param index 目标 Map 索引
 * @param key 原始键文本
 * @param target 实体匹配信息
 */
function registerIndexKey(index: Map<string, MatchedReward>, key: string | undefined | null, target: MatchedReward): void {
  if (!key) return;
  const n1 = normalizeKey(key, true);
  if (n1 && !index.has(n1)) {
    index.set(n1, target);
  }
  const n2 = normalizeKey(key, false);
  if (n2 && !index.has(n2)) {
    index.set(n2, target);
  }
}

/**
 * 构建或刷新基础实体检索索引
 *
 * @param messages 国际化消息对象
 */
function ensureSearchIndex(messages?: Record<string, any>): Map<string, MatchedReward> {
  if (!cachedIndex) {
    cachedIndex = new Map<string, MatchedReward>();

    // 载入静态数据包中所有实体的 ID 与自身属性
    for (const group of STATIC_ENTITIES) {
      const type = CATEGORY_MAP[group.category];
      if (!type || !group.data) continue;

      for (const [id, entity] of Object.entries(group.data)) {
        if (!id) continue;
        const reward: MatchedReward = { id, type, rawCategory: group.category };
        registerIndexKey(cachedIndex, id, reward);
        if (entity && typeof entity === 'object') {
          if (entity.name && typeof entity.name === 'string') {
            registerIndexKey(cachedIndex, entity.name, reward);
          }
          if (entity.key && typeof entity.key === 'string') {
            registerIndexKey(cachedIndex, entity.key, reward);
          }
        }
      }
    }

    // 额外处理专精树节点
    if (Masterys && typeof Masterys === 'object') {
      const type: RewardCategoryType = 'mastery';
      for (const tree of Object.values(Masterys) as any[]) {
        if (tree && tree.nodes && typeof tree.nodes === 'object') {
          for (const node of Object.values(tree.nodes) as any[]) {
            if (node && node.id) {
              const reward: MatchedReward = { id: node.id, type, rawCategory: 'masterys' };
              registerIndexKey(cachedIndex, node.id, reward);
              if (node.name && typeof node.name === 'string') {
                registerIndexKey(cachedIndex, node.name, reward);
              }
            }
          }
        }
      }
    }
  }

  // 若传入了新的国际化消息包，将 snb 翻译字典中的各分类名称扩充入索引
  if (messages && messages !== lastIndexedMessages) {
    lastIndexedMessages = messages;

    for (const localeKey of Object.keys(messages)) {
      const snb = messages[localeKey]?.snb;
      if (!snb || typeof snb !== 'object') continue;

      for (const [catName, catEntries] of Object.entries(snb)) {
        const type = CATEGORY_MAP[catName];
        if (!type || !catEntries || typeof catEntries !== 'object') continue;

        for (const [id, val] of Object.entries(catEntries as Record<string, any>)) {
          if (!id || !val) continue;
          const name = typeof val === 'string' ? val : val.name;
          if (typeof name === 'string') {
            const reward: MatchedReward = { id, type, rawCategory: catName };
            registerIndexKey(cachedIndex, name, reward);
          }
        }
      }
    }
  }

  return cachedIndex;
}

/**
 * 从掉落自定义 benefit ID 中提取候选道具名
 *
 * @param benefitId benefit 的唯一 ID
 */
function extractCustomIdKeyword(benefitId?: string): string {
  if (!benefitId || !benefitId.includes('CUSTOM_ID_')) return '';
  const part = benefitId.split('CUSTOM_ID_')[1] || '';
  return part
    .replace(/^SAB_[^_]+_/i, '')
    .replace(/_(sept|aug|oct|nov|dec|jan|feb|mar|apr|may|jun|jul)\w*$/i, '')
    .replace(/_[0-9]+$/g, '')
    .replace(/_/g, ' ')
    .trim();
}

/**
 * 通过掉宝奖励信息检索匹配游戏实体
 *
 * @param drop 掉宝奖励条目数据
 * @param messages 全局国际化消息字典
 * @returns 匹配到的实体标识与类型，未匹配时返回 null
 */
export function matchDropReward(
  drop?: TimeBasedDrop | null,
  messages?: Record<string, any>
): MatchedReward | null {
  if (!drop) return null;

  const index = ensureSearchIndex(messages);
  const candidates: string[] = [];

  // 收集所有可能的候选名称
  if (drop.benefits && Array.isArray(drop.benefits)) {
    for (const b of drop.benefits) {
      if (b?.name) candidates.push(b.name);
      if (b?.id) {
        const customKw = extractCustomIdKeyword(b.id);
        if (customKw) candidates.push(customKw);
      }
    }
  }
  if (drop.name) {
    candidates.push(drop.name);
  }

  // 依次对候选文本应用精确匹配与剥离前后缀匹配
  for (const cand of candidates) {
    if (!cand) continue;

    // 策略 1：剥离品类前后缀的规范化全等匹配
    const k1 = normalizeKey(cand, true);
    if (k1 && index.has(k1)) {
      return index.get(k1)!;
    }

    // 策略 2：保留品类的纯净规范化全等匹配
    const k2 = normalizeKey(cand, false);
    if (k2 && index.has(k2)) {
      return index.get(k2)!;
    }

    // 策略 3：带短横线连字符的分割匹配（如 "Sail Color - Rotbreath"）
    if (cand.includes('-')) {
      const segments = cand.split('-').map(seg => seg.trim());
      for (const seg of segments) {
        const sk = normalizeKey(seg, true);
        if (sk && index.has(sk)) {
          return index.get(sk)!;
        }
      }
    }
  }

  return null;
}

