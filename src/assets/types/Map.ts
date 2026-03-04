import {PaginationResult} from "@/assets/types/Pagination";

export interface MapCollection {
    id: string;
    uuid: string;
    userId: string;
    title: string;
    description?: string;
    public: number;
    sharedUsers: string[];
    valid: number;
    createdAt: string;
    updatedAt: string;
}

export interface MapCollectionResult {
    data: MapCollection[]
    pagination?: PaginationResult
}

export interface MapPoint {
    id: string;
    uuid: string;
    userId: string;
    collectionId: string;
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    tags: string;
    public: number;
    sharedUsers: string;
    valid: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCollectionData {
    title: string;
    description?: string;
    public?: boolean;
    sharedUsers?: string[];
}

export interface UpdateCollectionData {
    title?: string;
    description?: string;
    public?: boolean;
    sharedUsers?: string[];
}

export interface CreatePointData {
    collectionUuid: string;
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    tags?: string[];
    public?: boolean;
    sharedUsers?: string[];
}

export interface UpdatePointData {
    title?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    tags?: string[];
    public?: boolean;
    sharedUsers?: string[];
}

export interface NearbySearchParams {
    latitude: number;
    longitude: number;
    radius?: number;
    limit?: number;
}
