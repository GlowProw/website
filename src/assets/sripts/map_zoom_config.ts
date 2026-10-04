import { storage_account } from '@/assets/sripts/index';

export interface CategoryZoomRule {
  /** 最小可见 Zoom (缩小低于此层级不可见) */
  minZoom: number;
  /** 最大可见 Zoom (放大高于此层级不可见) */
  maxZoom: number;
  /** 不同 Zoom 级别的图标 scale 尺寸 */
  scales?: Record<number, number>;
  /** 默认基准 scale */
  baseScale: number;
}

/**
 * 各标记分类在地图上的默认 Zoom 显示范围与不同 ZOOM 下的图标尺寸
 */
export const DEFAULT_CATEGORY_ZOOM_CONFIG: Record<string, CategoryZoomRule> = {
  // 海盗窝点与前哨站
  den: {
    minZoom: 12,
    maxZoom: 15,
    scales: { 12: 0.12, 13: 0.14, 14: 0.16, 15: 0.18 },
    baseScale: 0.16,
  },
  outpost: {
    minZoom: 12,
    maxZoom: 15,
    scales: { 12: 0.11, 13: 0.13, 14: 0.15, 15: 0.17 },
    baseScale: 0.15,
  },

  // 定居点与生产设施、军事据点：放大到 13 及以上可见 (13 - 15)
  capitalSettlement: {
    minZoom: 13,
    maxZoom: 15,
    scales: { 13: 0.11, 14: 0.13, 15: 0.15 },
    baseScale: 0.13,
  },
  megafort: {
    minZoom: 13,
    maxZoom: 15,
    scales: { 13: 0.11, 14: 0.13, 15: 0.15 },
    baseScale: 0.13,
  },
  settlement: {
    minZoom: 13,
    maxZoom: 15,
    scales: { 13: 0.10, 14: 0.12, 15: 0.14 },
    baseScale: 0.12,
  },
  foundry: {
    minZoom: 13,
    maxZoom: 15,
    scales: { 13: 0.10, 14: 0.12, 15: 0.14 },
    baseScale: 0.12,
  },
  lumberyard: {
    minZoom: 13,
    maxZoom: 15,
    scales: { 13: 0.10, 14: 0.12, 15: 0.14 },
    baseScale: 0.12,
  },
  weaver: {
    minZoom: 13,
    maxZoom: 15,
    scales: { 13: 0.10, 14: 0.12, 15: 0.14 },
    baseScale: 0.12,
  },
  militaryBase: {
    minZoom: 13,
    maxZoom: 15,
    scales: { 13: 0.10, 14: 0.12, 15: 0.14 },
    baseScale: 0.12,
  },

  // 调查、哨塔、沉船 (14 - 15)
  guardTower: {
    minZoom: 14,
    maxZoom: 15,
    scales: { 14: 0.11, 15: 0.13 },
    baseScale: 0.12,
  },
  shipwreck: {
    minZoom: 14,
    maxZoom: 15,
    scales: { 14: 0.11, 15: 0.13 },
    baseScale: 0.12,
  },
  archive: {
    minZoom: 14,
    maxZoom: 15,
    scales: { 14: 0.11, 15: 0.13 },
    baseScale: 0.12,
  },
  treasureMap: {
    minZoom: 14,
    maxZoom: 15,
    scales: { 14: 0.11, 15: 0.13 },
    baseScale: 0.12,
  },

  // 野生动物 (14 - 15)
  crocodile: {
    minZoom: 14,
    maxZoom: 15,
    scales: { 14: 0.11, 15: 0.13 },
    baseScale: 0.12,
  },
  hippopotamus: {
    minZoom: 14,
    maxZoom: 15,
    scales: { 14: 0.11, 15: 0.13 },
    baseScale: 0.12,
  },
  shark: {
    minZoom: 14,
    maxZoom: 15,
    scales: { 14: 0.11, 15: 0.13 },
    baseScale: 0.12,
  },

  // 用户分享点位
  shareLocation: {
    minZoom: 12,
    maxZoom: 15,
    scales: { 12: 0.10, 13: 0.12, 14: 0.14, 15: 0.16 },
    baseScale: 0.14,
  },

  // 资源与标记默认范围 (14 - 15)
  default: {
    minZoom: 14,
    maxZoom: 15,
    scales: { 14: 0.11, 15: 0.13 },
    baseScale: 0.12,
  },
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
