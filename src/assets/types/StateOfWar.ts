export interface ZoneWarStat {
    id: string;
    name: string;
    region?: string;
    startDate?: string;
    lastModified?: string;
    endDate?: string | null;
    cycleNumber?: number;
    cycleStartDate?: string;
    cycleEndDate?: string;
    status?: "ended" | "active" | "upcoming";
    compagnieRoyale?: number;
    phoenixsTalon?: number;
    total: number;
    updateTime?: string;
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
    startDate?: string;
    lastModified?: string;
    endDate?: string | null;
    cycleNumber?: number;
    cycleStartDate?: string;
    cycleEndDate?: string;
    status?: "ended" | "active" | "upcoming";
    total: number;
    compagnieRoyale?: number;
    phoenixsTalon?: number;
    [key: string]: any;
}

export interface WarCycle {
    cycleNumber: number;
    name: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    status: "ended" | "active" | "upcoming";
    winner: "compagnieRoyale" | "phoenixsTalon" | "draw" | null;
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
    createdTime: string;
    updateTime: string;
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
    startDate?: string;
    endDate?: string;
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
    updateTime: string;
    createdTime?: string;
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

