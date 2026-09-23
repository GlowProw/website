export interface ZoneWarStat {
    id: string;
    name: string;
    region?: string;
    startDate?: number | string;
    lastModified?: number | string;
    endDate?: number | string | null;
    cycleNumber?: number;
    cycleStartDate?: number | string;
    cycleEndDate?: number | string;
    status?: "ended" | "active" | "upcoming";
    compagnieRoyale?: number;
    phoenixsTalon?: number;
    total: number;
    updateTime?: number | string;
    [key: string]: any;
}

export interface RegionWarStat {
    id: string;
    name: string;
    compagnieRoyale?: number;
    phoenixsTalon?: number;
    total: number;
    zones: ZoneWarStat[];
    [key: string]: any;
}

export interface WarCycleZoneDetail {
    id?: string;
    name: string;
    region?: string;
    startDate?: number | string;
    lastModified?: number | string;
    endDate?: number | string | null;
    cycleNumber?: number;
    cycleStartDate?: number | string;
    cycleEndDate?: number | string;
    status?: "ended" | "active" | "upcoming";
    total: number;
    compagnieRoyale?: number;
    phoenixsTalon?: number;
    [key: string]: any;
}

export interface WarCycle {
    cycleNumber: number;
    name?: string;
    startDate: number | string;
    endDate: number | string;
    durationDays: number;
    status: "ended" | "active" | "upcoming";
    winner: string | null;
    compagnieRoyaleZones: string[];
    phoenixsTalonZones: string[];
    compagnieRoyaleZoneDetails?: WarCycleZoneDetail[];
    phoenixsTalonZoneDetails?: WarCycleZoneDetail[];
    totals: {
        compagnieRoyale: number;
        phoenixsTalon: number;
        [key: string]: number;
    };
    [key: string]: any;
}

export interface StateOfWarHistoryPoint {
    id: number;
    createdTime: number | string;
    updateTime: number | string;
    compagnieRoyale: number;
    phoenixsTalon: number;
    total: number;
    [key: string]: any;
}

export interface AvailableWarSeason {
    seasonNumber: number;
    seasonId: string;
    alternativeName?: string;
    nameZh?: string;
    supported?: boolean;
    startDate?: number | string;
    endDate?: number | string;
    cycleDays?: number;
    factions?: string[];
    factionColors?: Record<string, string>;
    isEnded?: boolean;
    status?: "ended" | "active" | "upcoming";
    [key: string]: any;
}

export interface StateOfWarData {
    id?: number;
    season: number;
    seasonId?: string;
    alternativeName?: string;
    availableSeasons?: AvailableWarSeason[];
    factions?: string[];
    factionColors?: Record<string, string>;
    isEnded?: boolean;
    status?: "ended" | "active" | "upcoming";
    updateTime: number | string;
    createdTime?: number | string;
    totals: {
        compagnieRoyale: number;
        phoenixsTalon: number;
        total: number;
        [key: string]: number;
    };
    dailyTotals?: {
        compagnieRoyale: number;
        phoenixsTalon: number;
        total: number;
        [key: string]: number;
    };
    previousPeriodTotals?: {
        compagnieRoyale?: number;
        phoenixsTalon?: number;
        total?: number;
        [key: string]: number | undefined;
    };
    progression?: WarCycle[];
    regions?: RegionWarStat[];
    zones: ZoneWarStat[];
}

