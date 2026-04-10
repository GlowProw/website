import {TreasureMapType} from "glow-prow-data/src/types/TreasureMapProperties";

/**
 * 图像查询数据接口
 */
export interface QueryImageData {
  url: string;
  hash?: string;
  colorHistogram?: number[];
  structuralFeatures?: number[];
  blockFeatures?: number[];
  imageData?: ImageData;
}

/**
 * 藏宝图数据接口
 */
export interface TreasureMapData {
  id: string;
  rarity: string;
  category: TreasureMapType;
  territory: string;
  obtainable: string[];
  type: string;
  dateAdded: string;
  lastUpdated: string;
}

/**
 * 相似度搜索结果接口
 */
export interface SearchResult {
  id: string;
  index: number;
  similarity: number;
  imageUrl: string;
  original: any;
  category: string;
  obtainable: string[];
}

/**
 * 算法配置接口
 */
export interface Algorithm {
  value: string;
}

/**
 * 正在对比的图片接口
 */
export interface ComparingImage {
  id: string;
  url: string;
  category: string;
  index: number;
}
