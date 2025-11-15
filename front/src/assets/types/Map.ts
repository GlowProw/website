export interface MapCollection {
    id: string;
    uuid: string;
    userId: string;
    title: string;
    description?: string;
    isPublic: boolean;
    sharedUsers: string;
    valid: number;
    createdAt: string;
    updatedAt: string;
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
    isPublic: boolean;
    sharedUsers: string;
    valid: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCollectionData {
    title: string;
    description?: string;
    isPublic?: boolean;
    sharedUsers?: string[];
}

export interface UpdateCollectionData {
    title?: string;
    description?: string;
    isPublic?: boolean;
    sharedUsers?: string[];
}

export interface CreatePointData {
    collectionId: string;
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    tags?: string[];
    isPublic?: boolean;
    sharedUsers?: string[];
}

export interface UpdatePointData {
    title?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    tags?: string[];
    isPublic?: boolean;
    sharedUsers?: string[];
}

export interface NearbySearchParams {
    latitude: number;
    longitude: number;
    radius?: number;
    limit?: number;
}
