/**
 * 图鉴类型与详情路由段的对应关系
 */
const categoryPaths: Record<string, string> = {
  ship: '/codex/ship',
  item: '/codex/item',
  commoditie: '/codex/commoditie',
  ultimate: '/codex/ultimate',
  mod: '/codex/modification',
  modification: '/codex/modification',
  material: '/codex/material',
  cosmetic: '/codex/cosmetic',
  set: '/codex/set',
  treasureMap: '/codex/treasureMap',
  mapLocation: '/codex/mapLocation',
  npc: '/codex/npc',
  empireSkill: '/codex/empireSkill',
  mastery: '/codex/mastery',
  quest: '/quest'
}

/**
 * 生成图鉴条目的详情页地址
 * @param category 图鉴类型
 * @param id 条目 ID
 */
export const getCodexDetailPath = (category: string, id: string): string => {
  const base = categoryPaths[category]
  return base ? `${base}/${id}` : '/codex/overview'
}

/**
 * 图鉴类型是否支持跳转详情页
 * @param category 图鉴类型
 */
export const hasCodexDetailPage = (category: string): boolean => !!categoryPaths[category]
