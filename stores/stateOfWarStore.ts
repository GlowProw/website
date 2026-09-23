import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import {apis} from '@/assets/sripts';
import type {StateOfWarData, StateOfWarHistoryPoint} from '@/assets/types/StateOfWar';

export const FACTION_COLORS: Record<string, string> = {
    compagnieRoyale: "#42A5F5",
    phoenixsTalon: "#c23d3a",
    dutchMerchantCompany: "#FFA726",
    britishTradingAlliance: "#5C6BC0",
    confederationOfUngwana: "#26A69A",
    clanOfFara: "#FFB300",
    seaPeople: "#26C6DA",
    dominionOfRempah: "#AB47BC",
    pirates: "#78909C",
    chorusFleet: "#EC407A",
    shadowLegion: "#7E57C2",
};

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

    // 可用赛季列表
    const availableSeasons = ref<any[]>([]);

    /**
     * 安全时间解析函数（支持毫秒时间戳 number、ISO 字符串、纯日期字符串）
     */
    const parseDateToMs = (dateVal: any): number => {
        if (dateVal === null || dateVal === undefined || dateVal === '') return 0;
        if (typeof dateVal === 'number') return isNaN(dateVal) ? 0 : dateVal;
        if (typeof dateVal === 'string') {
            if (/^\d+$/.test(dateVal)) {
                const num = Number(dateVal);
                return isNaN(num) ? 0 : num;
            }
            const str = dateVal.includes('T') ? dateVal : dateVal + 'T06:00:00Z';
            const t = new Date(str).getTime();
            return isNaN(t) ? 0 : t;
        }
        const t = new Date(dateVal).getTime();
        return isNaN(t) ? 0 : t;
    };

    // 计算属性
    const factions = computed(() => warData.value?.factions);
    const factionAKey = computed(() => warData.value?.factions?.[0] || '');
    const factionBKey = computed(() => warData.value?.factions?.[1] || '');

    /**
     * 判断当前展示赛季是否已结束 (是否有结束变量判断)
     */
    const isSeasonEnded = computed<boolean>(() => {
        if (warData.value?.isEnded !== undefined) {
            return Boolean(warData.value.isEnded);
        }
        if (warData.value?.status === 'ended') {
            return true;
        }
        const curSeason = availableSeasons.value.find(
            (s: any) => s.seasonId === currentSeasonId.value || String(s.seasonNumber) === String(currentSeasonId.value)
        );
        if (curSeason?.isEnded !== undefined) {
            return Boolean(curSeason.isEnded);
        }
        if (curSeason?.status === 'ended') {
            return true;
        }
        if (curSeason?.endDate) {
            const endMs = parseDateToMs(curSeason.endDate);
            return endMs > 0 && Date.now() >= endMs;
        }
        return false;
    });

    /**
     * 阵营主题颜色动态映射
     */
    const factionColors = computed<Record<string, string>>(() => {
        return warData.value?.factionColors || {};
    });

    const getFactionColor = (factionKey: string, fallbackColor?: string): string => {
        if (!factionKey) return fallbackColor || '#42A5F5';
        if (factionColors.value[factionKey]) return factionColors.value[factionKey];
        if (FACTION_COLORS[factionKey]) return FACTION_COLORS[factionKey];
        return fallbackColor || '#42A5F5';
    };

    const factionAColor = computed<string>(() => {
        const fA = factionAKey.value;
        return getFactionColor(fA, '#42A5F5');
    });

    const factionBColor = computed<string>(() => {
        const fB = factionBKey.value;
        return getFactionColor(fB, '#EF5350');
    });

    const totals = computed(() => warData.value?.totals || { total: 0 });
    const dailyTotals = computed(() => warData.value?.dailyTotals || { total: 0 });
    const regions = computed(() => warData.value?.regions || []);
    const zones = computed(() => warData.value?.zones || []);
    const progression = computed(() => warData.value?.progression || []);

    /**
     * 判断区域是否已结算/已结束 (Ended)
     */
    const isZoneEnded = (zone: any): boolean => {
        if (!zone) return false;
        // 如果整个赛季已结束，所有战区均属于已结束
        if (isSeasonEnded.value) return true;
        // 属于当前正在进行的战期或状态为 active，绝不是已结束
        const activeCycle = (progression.value || []).find((c: any) => c.status === 'active');
        if (activeCycle && zone.cycleNumber && zone.cycleNumber === activeCycle.cycleNumber) {
            return false;
        }
        if (zone.status === 'active') return false;
        if (zone.status === 'ended') return true;
        const now = Date.now();
        // 排除未来的战区
        if (zone.startDate && parseDateToMs(zone.startDate) > now) {
            return false;
        }
        if (zone.cycleStartDate) {
            const s = parseDateToMs(zone.cycleStartDate);
            if (s > now) return false;
        }
        // 根据战期序号：cycleNumber 小于当前活跃的 cycleNumber
        if (activeCycle && zone.cycleNumber && zone.cycleNumber < activeCycle.cycleNumber) {
            return true;
        }
        // 若无 activeCycle 匹配，检查战期日期 (以 06:00 UTC / 14:00 北京时间为基准)
        if (zone.cycleEndDate) {
            const endMs = parseDateToMs(zone.cycleEndDate);
            if (endMs <= now && !activeCycle) {
                return true;
            }
        }
        return false;
    };

    /**
     * 判断区域是否正在进行争夺中 (Currently Contested)
     */
    const isZoneContested = (zone: any): boolean => {
        if (!zone) return false;
        // 赛季已结束，不再有正在进行争夺的战区
        if (isSeasonEnded.value) return false;
        if (zone.status === 'ended') return false;
        if (zone.status === 'upcoming') return false;
        // 属于当前活跃战期，即为争夺中
        const activeCycle = (progression.value || []).find((c: any) => c.status === 'active');
        if (activeCycle && zone.cycleNumber && zone.cycleNumber === activeCycle.cycleNumber) {
            return true;
        }
        if (zone.status === 'active') return true;
        if (isZoneEnded(zone) || isZoneUpcoming(zone)) return false;
        const now = Date.now();
        if (zone.cycleStartDate && zone.cycleEndDate) {
            const s = parseDateToMs(zone.cycleStartDate);
            const e = parseDateToMs(zone.cycleEndDate);
            return s <= now && now < e;
        }
        return false;
    };

    /**
     * 判断区域是否为未来战区 (Upcoming / Future)
     */
    const isZoneUpcoming = (zone: any): boolean => {
        if (!zone) return false;
        // 赛季已结束，不再有未开启的战区
        if (isSeasonEnded.value) return false;
        const activeCycle = (progression.value || []).find((c: any) => c.status === 'active');
        if (activeCycle && zone.cycleNumber) {
            if (zone.cycleNumber === activeCycle.cycleNumber) return false;
            if (zone.cycleNumber > activeCycle.cycleNumber) return true;
        }
        if (zone.status === 'upcoming') return true;
        if (zone.status === 'active' || zone.status === 'ended') return false;
        const now = Date.now();
        if (zone.cycleStartDate) {
            const s = parseDateToMs(zone.cycleStartDate);
            if (s > now) return true;
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
                const scoreA_fA = fA ? (a[fA] ?? 0) : 0;
                const scoreA_fB = fB ? (a[fB] ?? 0) : 0;
                const scoreB_fA = fA ? (b[fA] ?? 0) : 0;
                const scoreB_fB = fB ? (b[fB] ?? 0) : 0;
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
                if (fA) map[regId][fA] = 0;
                if (fB) map[regId][fB] = 0;
            }
            map[regId].zones.push(z);
            map[regId].total += (z.total || 0);
            if (fA) map[regId][fA] += (z[fA] ?? 0);
            if (fB) map[regId][fB] += (z[fB] ?? 0);
        });

        return Object.values(map);
    });

    // 阵营上一期（已结束战期）或已结束赛季占领的区域数量：
    // 对应已结束的赛季，会统计所有阵营争夺下地区，根据 isSeasonEnded 变量进行判断；
    // 进行中的赛季只统计时间范围处于过去且已结算的战区，严格不包含当前正在争夺中和未来的战区。
    const previousCycleFactionAScore = computed(() => {
        const fA = factionAKey.value;
        const fB = factionBKey.value;
        if (!fA) return 0;
        const allZones = zones.value || [];
        if (allZones.length === 0) {
            if (warData.value?.previousPeriodTotals && warData.value.previousPeriodTotals[fA] !== undefined) {
                return warData.value.previousPeriodTotals[fA] ?? 0;
            }
            return 0;
        }

        const seasonEnded = isSeasonEnded.value;

        let count = 0;
        allZones.forEach((z: any) => {
            // 赛季未结束时，必须满足已结束条件，且严格排除争夺中和未来；
            // 赛季已结束时，直接统计该赛季所有争夺下的地区
            if (!seasonEnded) {
                if (!isZoneEnded(z) || isZoneContested(z) || isZoneUpcoming(z)) {
                    return;
                }
            }
            const scoreA = z[fA] ?? 0;
            const scoreB = fB ? (z[fB] ?? 0) : 0;
            if (scoreA >= scoreB && (scoreA > 0 || scoreB > 0)) {
                count++;
            }
        });
        return count;
    });

    const previousCycleFactionBScore = computed(() => {
        const fA = factionAKey.value;
        const fB = factionBKey.value;
        if (!fB) return 0;
        const allZones = zones.value || [];
        if (allZones.length === 0) {
            if (warData.value?.previousPeriodTotals && warData.value.previousPeriodTotals[fB] !== undefined) {
                return warData.value.previousPeriodTotals[fB] ?? 0;
            }
            return 0;
        }

        const seasonEnded = isSeasonEnded.value;

        let count = 0;
        allZones.forEach((z: any) => {
            if (!seasonEnded) {
                if (!isZoneEnded(z) || isZoneContested(z) || isZoneUpcoming(z)) {
                    return;
                }
            }
            const scoreA = fA ? (z[fA] ?? 0) : 0;
            const scoreB = z[fB] ?? 0;
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
            if (!targetSeason || targetSeason === 'latest') {
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
    const fetchHistoryData = async (range: '1h' | '1d' | '7d' = '1d', seasonId?: string, force: boolean = false): Promise<StateOfWarHistoryPoint[]> => {
        const targetSeason = seasonId || currentSeasonId.value;
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

    /**
     * 获取可用赛季列表
     */
    const fetchAvailableSeasons = async (): Promise<any[]> => {
        try {
            const res = await apis.stateOfWarApi().getAvailableSeasons();
            const data = res?.data?.data || res?.data || res;
            if (data?.availableSeasons && Array.isArray(data.availableSeasons)) {
                availableSeasons.value = data.availableSeasons;
                return data.availableSeasons;
            }
            return [];
        } catch (e) {
            return [];
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
        availableSeasons,
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
        isSeasonEnded,
        factionColors,
        factionAColor,
        factionBColor,
        getFactionColor,
        getStateOfWarData,
        fetchHistoryData,
        fetchAvailableSeasons,
        refreshData,
    };
});
