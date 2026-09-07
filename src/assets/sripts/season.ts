import { Seasons, Season } from 'glow-prow-data';

/**
 * 获取当前赛季
 * @param fallbackToLatest 当未匹配到当前时间区间时，是否回退到最新赛季（默认 true）
 * @returns {Season | null} 当前赛季，如果不在任何赛季范围内且不回退则返回 null
 */
export const getCurrentSeason = (fallbackToLatest: boolean = true): Season | null => {
  const currentTime = Date.now();
  const seasonList: Season[] = Object.values(Seasons || {});

  for (const season of seasonList) {
    if (!season?.startDate || !season?.endDate) continue;

    const startDate = new Date(season.startDate).getTime();
    const endDate = new Date(season.endDate).getTime();

    if (currentTime >= startDate && currentTime <= endDate) {
      return season;
    }
  }

  // 若未匹配到当前时间区间的赛季，根据配置默认回退到最新赛季
  if (fallbackToLatest && seasonList.length > 0) {
    const sorted = [...seasonList].sort((a, b) => {
      const bTime = new Date(b.endDate || b.startDate || 0).getTime();
      const aTime = new Date(a.endDate || a.startDate || 0).getTime();
      return bTime - aTime;
    });
    return sorted[0] || null;
  }

  return null;
};

/**
 * 获取当前赛季 ID
 * @param defaultSeasonId 默认/保底赛季 ID（若未匹配到且无赛季列表时的回退值）
 * @returns {string} 赛季 ID
 */
export const getCurrentSeasonId = (defaultSeasonId: string = 'crimsonWaters'): string => {
  const season = getCurrentSeason(true);
  return season?.id || defaultSeasonId;
};

export default {
  getCurrentSeason,
  getCurrentSeasonId,
};
