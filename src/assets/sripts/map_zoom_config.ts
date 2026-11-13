import { storage_account } from '@/assets/sripts/index';
import type { CategoryZoomRule } from '@/assets/types/Map';

/**
 * 敌人标记的通用 Zoom 规则，从世界视图开始就显示
 */
const ENEMY_CATEGORY_ZOOM_RULE: CategoryZoomRule = {
  minZoom: 11,
  maxZoom: 15,
  scales: { 11: 0.14, 12: 0.16, 13: 0.18, 14: 0.2, 15: 0.24 },
  baseScale: 0.18,
};

/**
 * 统一标记尺寸规则，保证各类图标在地图上的视觉大小一致
 * @param minZoom 最小显示层级
 */
const STANDARD_MARKER_ZOOM_RULE = (minZoom: number): CategoryZoomRule => ({
  ...ENEMY_CATEGORY_ZOOM_RULE,
  minZoom,
});

/**
 * 各标记分类在地图上的默认 Zoom 显示范围与不同 ZOOM 下的图标尺寸
 */
export const DEFAULT_CATEGORY_ZOOM_CONFIG: Record<string, CategoryZoomRule> = {
  // 海盗窝点与前哨站
  den: STANDARD_MARKER_ZOOM_RULE(12),
  outpost: STANDARD_MARKER_ZOOM_RULE(12),

  // 定居点与生产设施、军事据点：放大到 13 及以上可见 (13 - 15)
  capitalSettlement: STANDARD_MARKER_ZOOM_RULE(13),
  megafort: STANDARD_MARKER_ZOOM_RULE(13),
  settlement: STANDARD_MARKER_ZOOM_RULE(13),
  foundry: STANDARD_MARKER_ZOOM_RULE(13),
  lumberyard: STANDARD_MARKER_ZOOM_RULE(13),
  weaver: STANDARD_MARKER_ZOOM_RULE(13),
  militaryBase: STANDARD_MARKER_ZOOM_RULE(13),

  // 调查、哨塔、沉船 (14 - 15)
  guardTower: STANDARD_MARKER_ZOOM_RULE(14),
  shipwreck: STANDARD_MARKER_ZOOM_RULE(14),
  archive: STANDARD_MARKER_ZOOM_RULE(14),
  treasureMap: STANDARD_MARKER_ZOOM_RULE(14),

  // 野生动物 (14 - 15)
  crocodile: STANDARD_MARKER_ZOOM_RULE(14),
  hippopotamus: STANDARD_MARKER_ZOOM_RULE(14),
  shark: STANDARD_MARKER_ZOOM_RULE(14),

  // 敌人：精英战舰、领域首领、战舰队、海怪、船队等活动目标
  eliteWarship: ENEMY_CATEGORY_ZOOM_RULE,
  domains: ENEMY_CATEGORY_ZOOM_RULE,
  warfleet: ENEMY_CATEGORY_ZOOM_RULE,
  seaMonster: ENEMY_CATEGORY_ZOOM_RULE,
  convoy: ENEMY_CATEGORY_ZOOM_RULE,
  tower: ENEMY_CATEGORY_ZOOM_RULE,
  warEvent: ENEMY_CATEGORY_ZOOM_RULE,
  requiemOfTheLost: ENEMY_CATEGORY_ZOOM_RULE,
  helmActivity: ENEMY_CATEGORY_ZOOM_RULE,

  // 用户分享点位
  shareLocation: STANDARD_MARKER_ZOOM_RULE(12),

  // 资源与标记默认范围 (14 - 15)
  default: STANDARD_MARKER_ZOOM_RULE(14),
};

/**
 * 取得当前生效的分类缩放配置（合并本地用户持久化配置）
 */
export const getActiveCategoryZoomConfig = (): Record<string, CategoryZoomRule> => {
  try {
    const userCustom = storage_account.getConfigurationItem('map', 'categoryZoomConfig');
    if (userCustom && typeof userCustom === 'object') {
      return { ...DEFAULT_CATEGORY_ZOOM_CONFIG, ...userCustom };
    }
  } catch (e) { }
  return { ...DEFAULT_CATEGORY_ZOOM_CONFIG };
};

export const CATEGORY_ZOOM_CONFIG: Record<string, CategoryZoomRule> = getActiveCategoryZoomConfig();

/**
 * 兼容旧版各分类 Zoom 可见范围映射 [minZoom, maxZoom]
 */
export const CATEGORY_ZOOM_RANGES: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(DEFAULT_CATEGORY_ZOOM_CONFIG).map(([k, v]) => [k, [v.minZoom, v.maxZoom]])
);

/**
 * 获取指定分类在当前 zoom 下的图标 scale（支持平滑线性插值与自定义配置）
 */
export const getCategoryScale = (category: string, currentZoom: number): number => {
  const activeConfig = getActiveCategoryZoomConfig();
  const rule = activeConfig[category] || activeConfig.default || DEFAULT_CATEGORY_ZOOM_CONFIG.default;
  if (!rule.scales) {
    return rule.baseScale;
  }
  const zoomKeys = Object.keys(rule.scales).map(Number).sort((a, b) => a - b);
  if (zoomKeys.length === 0) return rule.baseScale;

  const minZ = zoomKeys[0];
  const maxZ = zoomKeys[zoomKeys.length - 1];

  if (currentZoom <= minZ) {
    return rule.scales[minZ];
  }
  if (currentZoom >= maxZ) {
    return rule.scales[maxZ];
  }

  const floorZ = Math.floor(currentZoom);
  const ceilZ = Math.ceil(currentZoom);
  if (floorZ === ceilZ) {
    return rule.scales[floorZ] ?? rule.baseScale;
  }

  const sFloor = rule.scales[floorZ] ?? rule.baseScale;
  const sCeil = rule.scales[ceilZ] ?? rule.baseScale;
  const t = currentZoom - floorZ;
  return sFloor + (sCeil - sFloor) * t;
};

/**
 * 检查指定分类在当前 zoom 下是否处于可显示范围（结合自定义配置）
 */
export const isCategoryVisibleAtZoom = (category: string, currentZoom: number, isDebug: boolean = false): boolean => {
  if (isDebug) return true;
  const activeConfig = getActiveCategoryZoomConfig();
  const rule = activeConfig[category] || activeConfig.default || DEFAULT_CATEGORY_ZOOM_CONFIG.default;
  return currentZoom >= (rule.minZoom - 0.05) && currentZoom <= (rule.maxZoom + 0.99);
};
