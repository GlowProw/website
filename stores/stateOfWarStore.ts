import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import {apis} from '@/assets/sripts';
import type {StateOfWarData, StateOfWarHistoryPoint} from '@/assets/types/StateOfWar';

export const useStateOfWarStore = defineStore('stateOfWar', () => {
    // 当前展示赛季的 State of War 数据
    const warData = ref<StateOfWarData | null>(null);
    // 按赛季 ID 缓存数据，避免切换或多组件重复拉取
    const seasonDataMap = ref<Record<string, StateOfWarData>>({});

    // 历史战事发展数据
    const historyData = ref<StateOfWarHistoryPoint[]>([]);
    // 按 `${seasonId}_${range}` 缓存历史数据
    const historyDataMap = ref<Record<string, StateOfWarHistoryPoint[]>>({});

    // 加载与刷新状态
    const loading = ref<boolean>(false);
    const historyLoading = ref<boolean>(false);
    const refreshing = ref<boolean>(false);
    const currentSeasonId = ref<string>('');

    // 计算属性
    const factions = computed(() => warData.value?.factions);
    const factionAKey = computed(() => warData.value?.factions?.[0]);
    const factionBKey = computed(() => warData.value?.factions?.[1]);

    const totals = computed(() => warData.value?.totals || {compagnieRoyale: 0, phoenixsTalon: 0, total: 0});
    const dailyTotals = computed(() => warData.value?.dailyTotals || {compagnieRoyale: 0, phoenixsTalon: 0, total: 0});
    const regions = computed(() => warData.value?.regions || []);
    const zones = computed(() => warData.value?.zones || []);
    const progression = computed(() => warData.value?.progression || []);

    /**
     * 判断区域是否已结算/已结束 (Ended)
     */
    const isZoneEnded = (zone: any): boolean => {
        if (!zone) return false;
        if (zone.status === 'ended') return true;
        const now = Date.now();
        // 排除未来的战区
        if (zone.startDate && new Date(zone.startDate).getTime() > now) {
            return false;
        }
        if (zone.cycleStartDate && new Date(zone.cycleStartDate).getTime() > now) {
            return false;
        }
        // 战期已结束（cycleEndDate <= now）
        if (zone.cycleEndDate && new Date(zone.cycleEndDate).getTime() <= now) {
            return true;
        }
        // 或者根据战期序号：cycleNumber 小于当前活跃的 cycleNumber
        const activeCycle = (progression.value || []).find((c: any) => c.status === 'active');
        if (activeCycle && zone.cycleNumber && zone.cycleNumber < activeCycle.cycleNumber) {
            return true;
        }
        return false;
    };

    /**
     * 判断区域是否正在进行争夺中 (Currently Contested)
     */
    const isZoneContested = (zone: any): boolean => {
        if (!zone) return false;
        if (zone.status === 'ended' || isZoneEnded(zone)) return false;
        if (zone.status === 'upcoming' || isZoneUpcoming(zone)) return false;
        if (zone.status === 'active') return true;
        const now = Date.now();
        if (zone.cycleStartDate && zone.cycleEndDate) {
            const s = new Date(zone.cycleStartDate).getTime();
            const e = new Date(zone.cycleEndDate).getTime();
            return s <= now && now < e;
        }
        const activeCycle = (progression.value || []).find((c: any) => c.status === 'active');
        if (activeCycle && zone.cycleNumber && zone.cycleNumber === activeCycle.cycleNumber) {
            return true;
        }
        return false;
    };

    /**
     * 判断区域是否为未来战区 (Upcoming / Future)
     */
    const isZoneUpcoming = (zone: any): boolean => {
        if (!zone) return false;
        if (zone.status === 'upcoming') return true;
        const now = Date.now();
        if (zone.cycleStartDate && new Date(zone.cycleStartDate).getTime() > now) {
            return true;
        }
        const activeCycle = (progression.value || []).find((c: any) => c.status === 'active');
        if (activeCycle && zone.cycleNumber && zone.cycleNumber > activeCycle.cycleNumber) {
            return true;
        }
        return false;
    };

    /**
     * 当前处于争夺中的区域 (严格剔除非争夺区域：排除已结算与未开启区域)
     */
    const contestedZones = computed(() => {
        const allZones = zones.value || [];
        const fA = factionAKey.value;
        const fB = factionBKey.value;
        return allZones
            .filter((z: any) => isZoneContested(z))
            .sort((a: any, b: any) => {
                const scoreA_fA = a[fA] ?? a.compagnieRoyale ?? 0;
                const scoreA_fB = a[fB] ?? a.phoenixsTalon ?? 0;
                const scoreB_fA = b[fA] ?? b.compagnieRoyale ?? 0;
                const scoreB_fB = b[fB] ?? b.phoenixsTalon ?? 0;
                const diffA = Math.abs(scoreA_fA - scoreA_fB);
                const diffB = Math.abs(scoreB_fA - scoreB_fB);
                return diffA - diffB;
            });
    });

    /**
     * 当前争夺中按大区域归类的数据 (Region -> Sub-zones)
     */
    const contestedRegions = computed(() => {
        const cZones = contestedZones.value;
        if (!cZones || cZones.length === 0) return [];

        const map: Record<string, any> = {};
        const fA = factionAKey.value;
        const fB = factionBKey.value;

        cZones.forEach((z: any) => {
            const regId = z.region;
            if (!map[regId]) {
                map[regId] = {
                    id: regId,
                    name: regId,
                    total: 0,
                    zones: [],
                };
                map[regId][fA] = 0;
                map[regId][fB] = 0;
                map[regId].compagnieRoyale = 0;
                map[regId].phoenixsTalon = 0;
            }
            map[regId].zones.push(z);
            map[regId].total += (z.total || 0);
            map[regId][fA] += (z[fA] ?? z.compagnieRoyale ?? 0);
            map[regId][fB] += (z[fB] ?? z.phoenixsTalon ?? 0);
            map[regId].compagnieRoyale += (z.compagnieRoyale ?? z[fA] ?? 0);
            map[regId].phoenixsTalon += (z.phoenixsTalon ?? z[fB] ?? 0);
        });

        return Object.values(map);
    });

    // 阵营上一期（已结束战期）占领的区域数量：
    // 只统计时间范围（startDate 和 lastModified）处于过去且已结算的战区，严格不包含当前正在争夺中和未来的战区
    const previousCycleFactionAScore = computed(() => {
        const fA = factionAKey.value;
        const fB = factionBKey.value;
        const allZones = zones.value || [];
        if (allZones.length === 0) {
            if (warData.value?.previousPeriodTotals && warData.value.previousPeriodTotals[fA] !== undefined) {
                return warData.value.previousPeriodTotals[fA] ?? 0;
            }
            return 0;
        }

        let count = 0;
        allZones.forEach((z: any) => {
            // 必须满足已结束条件，且严格排除争夺中和未来
            if (!isZoneEnded(z) || isZoneContested(z) || isZoneUpcoming(z)) {
                return;
            }
            const scoreA = z[fA] ?? z.compagnieRoyale ?? 0;
            const scoreB = z[fB] ?? z.phoenixsTalon ?? 0;
            if (scoreA >= scoreB && (scoreA > 0 || scoreB > 0)) {
                count++;
            }
        });
        return count;
    });

    const previousCycleFactionBScore = computed(() => {
        const fA = factionAKey.value;
        const fB = factionBKey.value;
        const allZones = zones.value || [];
        if (allZones.length === 0) {
            if (warData.value?.previousPeriodTotals && warData.value.previousPeriodTotals[fB] !== undefined) {
                return warData.value.previousPeriodTotals[fB] ?? 0;
            }
            return 0;
        }

        let count = 0;
        allZones.forEach((z: any) => {
            // 必须满足已结束条件，且严格排除争夺中和未来
            if (!isZoneEnded(z) || isZoneContested(z) || isZoneUpcoming(z)) {
                return;
            }
            const scoreA = z[fA] ?? z.compagnieRoyale ?? 0;
            const scoreB = z[fB] ?? z.phoenixsTalon ?? 0;
            if (scoreB > scoreA && (scoreA > 0 || scoreB > 0)) {
                count++;
            }
        });
        return count;
    });

    /**
     * 获取战事数据 (支持缓存，若已有缓存则不重复拉取，除非指定 force = true)
     */
    const getStateOfWarData = async (seasonId?: string, force: boolean = false): Promise<StateOfWarData | null> => {
        const targetSeason = seasonId || currentSeasonId.value;
        currentSeasonId.value = targetSeason;

        // 检查缓存
        if (!force && seasonDataMap.value[targetSeason]) {
            warData.value = seasonDataMap.value[targetSeason];
            return warData.value;
        }

        try {
            loading.value = true;
            let res: any;
            if (!targetSeason || targetSeason === 'crimsonWaters' || targetSeason === '10') {
                res = await apis.stateOfWarApi().getLatestStateOfWar();
            } else {
                res = await apis.stateOfWarApi().getSeasonStateOfWar(targetSeason);
            }
            const payload = res?.data?.data || res?.data || res;
            if (payload && (payload.zones || payload.totals)) {
                warData.value = payload;
                seasonDataMap.value[targetSeason] = payload;
                if (payload.seasonId) {
                    currentSeasonId.value = payload.seasonId;
                    seasonDataMap.value[payload.seasonId] = payload;
                }
                return payload;
            }
            return warData.value;
        } finally {
            loading.value = false;
        }
    };

    /**
     * 获取历史战事数据 (支持缓存)
     */
    const fetchHistoryData = async (range: '1h' | '1d' = '1d', seasonId?: string, force: boolean = false): Promise<StateOfWarHistoryPoint[]> => {
        const targetSeason = seasonId || currentSeasonId.value || 'crimsonWaters';
        const cacheKey = `${targetSeason}_${range}`;

        if (!force && historyDataMap.value[cacheKey]) {
            historyData.value = historyDataMap.value[cacheKey];
            return historyData.value;
        }

        try {
            historyLoading.value = true;
            const res = await apis.stateOfWarApi().getStateOfWarHistory(range, targetSeason);
            const list = res?.data?.data || res?.data || res;
            if (Array.isArray(list)) {
                historyData.value = list;
                historyDataMap.value[cacheKey] = list;
                return list;
            }
            historyData.value = [];
            return [];
        } catch (e) {
            historyData.value = [];
            return [];
        } finally {
            historyLoading.value = false;
        }
    };

    /**
     * 刷新战事数据
     */
    const refreshData = async (seasonId?: string): Promise<StateOfWarData | null> => {
        try {
            refreshing.value = true;
            const res = await apis.stateOfWarApi().refreshStateOfWar();
            const payload = res?.data?.data || res?.data || res;
            if (payload) {
                warData.value = payload;
                const sKey = payload.seasonId || seasonId || currentSeasonId.value;
                seasonDataMap.value[sKey] = payload;
                await fetchHistoryData('1d', sKey, true);
                return payload;
            }
            return null;
        } finally {
            refreshing.value = false;
        }
    };

    return {
        warData,
        seasonDataMap,
        historyData,
        historyDataMap,
        loading,
        historyLoading,
        refreshing,
        currentSeasonId,
        factions,
        factionAKey,
        factionBKey,
        totals,
        dailyTotals,
        regions,
        zones,
        progression,
        previousCycleFactionAScore,
        previousCycleFactionBScore,
        isZoneEnded,
        isZoneContested,
        isZoneUpcoming,
        contestedZones,
        contestedRegions,
        getStateOfWarData,
        fetchHistoryData,
        refreshData,
    };
});
