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

/** 分享链接看到的公开地图集信息 */
export interface SharedCollectionInfo {
    uuid: string;
    title: string;
    description?: string | null;
    public: number;
    isOwner: boolean;
    creator: {
        id: string;
        name: string;
    };
    pointCount: number;
    shapeCount: number;
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
    /** nearby 接口附带：所属地图集名称（无地图集为 null） */
    collectionTitle?: string | null;
    /** nearby 接口附带：所属地图集公开状态 */
    collectionPublic?: number | null;
    /** nearby 接口附带：创建者名称（昵称优先） */
    creatorName?: string | null;
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
  collectionUuid?: string | null;
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
  collectionUuid?: string | null;
  latitude?: number;
  longitude?: number;
  address?: string;
  tags?: string[];
  public?: boolean;
  sharedUsers?: string[];
}

/* ===================== 地图图形（路径/区域） ===================== */

export type MapShapeType = 'path' | 'region';

/** GeoJSON 坐标统一为 [经度, 纬度] */
export interface ShapeGeometry {
  type: 'LineString' | 'Polygon';
  coordinates: number[][] | number[][][];
}

export interface ShapeStyle {
  /** 线条/边框颜色 */
  color?: string;
  /** 线条/边框不透明度 0~1 */
  opacity?: number;
  /** 线宽 */
  width?: number;
  /** 虚线 */
  dashed?: boolean;
  /** 平滑（曲线/弯曲边缘） */
  smoothed?: boolean;
  /** 区域填充色 */
  fillColor?: string;
  /** 区域填充透明度 0~1 */
  fillOpacity?: number;
}

/** 路径默认描边色 */
export const DEFAULT_PATH_COLOR = '#38545B';
/** 区域默认描边色 */
export const DEFAULT_REGION_COLOR = '#38545B';
/** 区域默认填充色 */
export const DEFAULT_REGION_FILL_COLOR = '#39545B';
/** 默认线条不透明度 */
export const DEFAULT_LINE_OPACITY = 0.6;
/** 默认区域填充不透明度 */
export const DEFAULT_FILL_OPACITY = 0.4;
/** 默认线宽 */
export const DEFAULT_SHAPE_LINE_WIDTH = 4;

/** hex 颜色转 rgba 字符串；非法 hex 回退为默认路径色 */
export function hexToRgba(hex: string, alpha: number): string {
  let h = String(hex || '').replace('#', '').trim();
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) h = DEFAULT_PATH_COLOR.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, alpha))})`;
}

/**
 * 将任意来源的样式补全为完整的有效值：
 * 旧数据缺少透明度等字段时，渲染层与编辑表单都能拿到确定的默认值。
 */
export function resolveShapeStyle(input?: ShapeStyle | null, shapeType: MapShapeType = 'path'): Required<ShapeStyle> {
  const fallbackColor = shapeType === 'region' ? DEFAULT_REGION_COLOR : DEFAULT_PATH_COLOR;
  const clamp01 = (v: unknown, fallback: number): number => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
  };
  return {
    color: input?.color || fallbackColor,
    opacity: clamp01(input?.opacity, DEFAULT_LINE_OPACITY),
    width: Math.min(20, Math.max(1, Number(input?.width) || DEFAULT_SHAPE_LINE_WIDTH)),
    dashed: !!input?.dashed,
    smoothed: !!input?.smoothed,
    fillColor: input?.fillColor || input?.color || DEFAULT_REGION_FILL_COLOR,
    fillOpacity: input?.fillOpacity === undefined
      ? DEFAULT_FILL_OPACITY
      : clamp01(input.fillOpacity, DEFAULT_FILL_OPACITY),
  };
}

/** 后端 JSON 列：MySQL 驱动会自动解析为对象，SQLite/缓存场景可能仍是字符串，两种都兼容 */
export type ShapeJsonField<T> = T | string | null;

/** 后端返回的图形（geometry/style/tags 为 JSON 对象或 JSON 字符串） */
export interface MapShape {
  id: string;
  uuid: string;
  userId: string;
  collectionId?: string | null;
  shapeType: MapShapeType;
  title: string;
  description?: string;
  geometry: ShapeJsonField<ShapeGeometry>;
  style: ShapeJsonField<ShapeStyle>;
  tags: ShapeJsonField<string[]>;
  public: number;
  sharedUsers: string | null;
  valid: number;
  createdTime?: string;
  updatedTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateShapeData {
  shapeType: MapShapeType;
  title: string;
  description?: string;
  collectionUuid?: string | null;
  geometry: ShapeGeometry;
  style?: ShapeStyle | null;
  tags?: string[];
  public?: boolean;
}

export interface UpdateShapeData {
  title?: string;
  description?: string;
  collectionUuid?: string | null;
  geometry?: ShapeGeometry;
  style?: ShapeStyle | null;
  tags?: string[];
  public?: boolean;
}

export interface UserShapesParams {
  shapeType?: MapShapeType;
  /** 不传=全部；'' 或 '__none__'=未分组；具体 uuid=该集合 */
  collectionUuid?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

/** 路径/区域编辑弹窗表单 */
export interface ShapeFormData {
  title: string;
  description: string;
  collectionUuid: string | null;
  tags: string[];
  public: boolean;
  style: ShapeStyle;
}

/** 管理页标记新建/编辑弹窗表单 */
export interface PointFormData {
  uuid?: string;
  title: string;
  description: string;
  longitude: number | string;
  latitude: number | string;
  address: string;
  collectionUuid: string | null;
  tags: string[];
  public: boolean;
}

/** 管理页图形手填坐标弹窗表单 */
export interface ShapeManualFormData {
  uuid?: string;
  title: string;
  description: string;
  collectionUuid: string | null;
  tags: string[];
  public: boolean;
  style: ShapeStyle;
  coordinatesText: string;
}

/** JSON 列兼容读取：对象直接用，字符串尝试 JSON.parse */
function readJsonField<T>(raw: unknown): T | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 解析后端图形上的几何字段（对象/JSON 字符串均可，容错） */
export function parseShapeGeometry(shape: MapShape): ShapeGeometry | null {
  const geo = readJsonField<ShapeGeometry>(shape.geometry);
  if (geo && (geo.type === 'LineString' || geo.type === 'Polygon') && Array.isArray(geo.coordinates)) {
    return geo;
  }
  return null;
}

export function parseShapeStyle(shape: MapShape): ShapeStyle {
  return readJsonField<ShapeStyle>(shape.style) || {};
}

export function parseShapeTags(shape: MapShape): string[] {
  const v = readJsonField<string[]>(shape.tags);
  return Array.isArray(v) ? v : [];
}

export interface NearbySearchParams {
    latitude: number;
    longitude: number;
    radius?: number;
    limit?: number;
}
