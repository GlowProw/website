/**
 * Twitch 掉宝 (Drop Campaign) 相关类型定义
 */

export interface DropBenefit {
    id: string;
    name: string;
    imageAssetURL?: string;
}

export interface TimeBasedDrop {
    id: string;
    name: string;
    requiredMinutesWatched?: number;
    startAt?: string;
    endAt?: string;
    benefits?: DropBenefit[];
}

export interface StreamerChannel {
    id: string;
    login: string;
    displayName: string;
    title?: string;
    viewersCount?: number;
    profileImageURL?: string;
}

export interface DropCampaignData {
    id?: string | number;
    campaignId?: string;
    name: string;
    gameId?: string;
    gameName?: string;
    detailsUrl?: string;
    detailsURL?: string;
    imageUrl?: string;
    imageURL?: string;
    startAt?: string;
    endAt: string;
    status?: 'active' | 'upcoming' | 'ended' | string;
    drops?: TimeBasedDrop[];
    timeBasedDrops?: TimeBasedDrop[];
    channels?: StreamerChannel[];
    totalDrops?: number;
    maxWatchMinutes?: number;
}

export interface DropCurrentResponse {
    activeStreams: StreamerChannel[];
    campaigns: DropCampaignData[];
}

export interface DropHistoryParams {
    page?: number;
    pageSize?: number;
    status?: 'all' | 'active' | 'upcoming' | 'ended' | string;
    keyword?: string;
}

export interface DropHistoryResponse {
    list: DropCampaignData[];
    total: number;
    page?: number;
    pageSize?: number;
}

export interface DropWidgetProps {
    campaign: DropCampaignData;
    isActiveCard?: boolean;
}
