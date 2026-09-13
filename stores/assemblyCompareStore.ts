import { computed, ref, toRaw } from 'vue';
import { defineStore } from 'pinia';
import { apis } from '@/assets/sripts';
import type { ItemCalcResult } from '@/assets/sripts/item_carc';
import { computeAssemblyCalcResult } from '@/assets/sripts/assembly_calc';

/**
 * 最大对比方案数量（最多支持 10 个）
 */
export const MAX_COMPARE_COUNT = 10;

/**
 * 单个对比方案条目状态结构
 */
export interface CompareEntry {
  id: string;
  item: any;
  keyword: string;
  menuOpen: boolean;
  searchResults: any[];
  searchLoading: boolean;
  loading: boolean;
}

/**
 * 配装对比独立状态机
 * 集中管理对比列表、基准对比目标、检索及加载状态
 */
export const useAssemblyCompareStore = defineStore('assemblyCompare', () => {
  // 对比列表
  const compareList = ref<CompareEntry[]>([]);
  // 选中的对比目标方案索引（单选 Benchmark Target）
  const targetIndex = ref<number>(0);
  // 搜索会话缓存
  const searchSessionCache = new Map<string, any[]>();

  let idSeed = 0;
  const generateId = () => `compare_${Date.now()}_${++idSeed}`;

  /**
   * 将外部传入的各种格式配装数据标准化
   */
  const normalizeInputAssembly = (raw: any, customTitle?: string) => {
    if (!raw) return null;
    const unwrapped = toRaw(raw);

    if (unwrapped.uuid && unwrapped.assembly) {
      return unwrapped;
    }
    return {
      uuid: unwrapped.uuid || '',
      name: customTitle || unwrapped.name || 'Current',
      username: unwrapped.username || '',
      userAvatar: unwrapped.userAvatar || null,
      assembly: unwrapped.assembly || { data: unwrapped },
      createdTime: unwrapped.createdTime || Date.now(),
    };
  };

  /**
   * 创建新的空白对比条目
   */
  const createEmptyEntry = (initialItem: any = null, initialTitle: string = ''): CompareEntry => {
    const norm = initialItem ? normalizeInputAssembly(initialItem, initialTitle) : null;
    return {
      id: generateId(),
      item: norm,
      keyword: norm?.name || '',
      menuOpen: false,
      searchResults: [],
      searchLoading: false,
      loading: false,
    };
  };

  /**
   * 初始化对比方案
   */
  const initCompare = (baseAssembly?: any, targetAssembly?: any, baseTitle?: string, targetTitle?: string) => {
    if (compareList.value.length === 0) {
      compareList.value = [
        createEmptyEntry(baseAssembly, baseTitle),
        createEmptyEntry(targetAssembly, targetTitle)
      ];
      targetIndex.value = 0;
    } else {
      if (baseAssembly && !compareList.value[0]?.item) {
        setEntryItem(0, baseAssembly, baseTitle);
      }
      if (targetAssembly && compareList.value.length > 1 && !compareList.value[1]?.item) {
        setEntryItem(1, targetAssembly, targetTitle);
      }
    }
  };

  /**
   * 获取指定 entry 的 assembly 核心数据
   */
  const getEntryAssemblyData = (entry: CompareEntry) => {
    if (!entry?.item) return null;
    return entry.item.assembly?.data || entry.item.assembly || entry.item;
  };

  /**
   * 计算当前对比目标方案的计算结果 (Benchmark Target Result)
   */
  const benchmarkResult = computed<ItemCalcResult | null>(() => {
    if (targetIndex.value < 0 || targetIndex.value >= compareList.value.length) return null;
    const targetEntry = compareList.value[targetIndex.value];
    if (!targetEntry?.item) return null;
    const asm = getEntryAssemblyData(targetEntry);
    return computeAssemblyCalcResult(asm);
  });

  /**
   * 是否已达到最大对比上限
   */
  const isMaxReached = computed(() => compareList.value.length >= MAX_COMPARE_COUNT);

  /**
   * 当前方案总数
   */
  const compareCount = computed(() => compareList.value.length);

  /**
   * 添加对比方案
   */
  const addCompareEntry = (initialItem: any = null, initialTitle: string = ''): boolean => {
    if (isMaxReached.value) return false;
    compareList.value.push(createEmptyEntry(initialItem, initialTitle));
    return true;
  };

  /**
   * 移除对比方案
   */
  const removeCompareEntry = (idx: number) => {
    if (compareList.value.length <= 1) return;
    compareList.value.splice(idx, 1);

    if (targetIndex.value === idx) {
      targetIndex.value = 0;
    } else if (targetIndex.value > idx) {
      targetIndex.value--;
    }
  };

  /**
   * 设置对比目标索引
   */
  const setTargetIndex = (idx: number) => {
    if (idx >= 0 && idx < compareList.value.length) {
      targetIndex.value = idx;
    }
  };

  /**
   * 设置条目配装数据
   */
  const setEntryItem = (idx: number, rawItem: any, customTitle?: string) => {
    if (idx < 0 || idx >= compareList.value.length) return;
    const item = normalizeInputAssembly(rawItem, customTitle);
    compareList.value[idx].item = item;
    compareList.value[idx].keyword = item?.name || '';
    compareList.value[idx].menuOpen = false;
  };

  /**
   * 清空指定条目配装
   */
  const clearEntry = (idx: number) => {
    if (idx < 0 || idx >= compareList.value.length) return;
    compareList.value[idx].item = null;
    compareList.value[idx].keyword = '';
    compareList.value[idx].menuOpen = false;
  };

  /**
   * 执行搜索
   */
  const searchAssemblies = async (idx: number) => {
    const entry = compareList.value[idx];
    if (!entry) return;

    const trimmed = entry.keyword?.trim() || '';
    entry.searchLoading = true;
    entry.menuOpen = true;

    // 1. 会话缓存
    const cacheKey = `search_${trimmed}`;
    if (searchSessionCache.has(cacheKey)) {
      entry.searchResults = searchSessionCache.get(cacheKey) || [];
      entry.searchLoading = false;
      return;
    }

    try {
      // 2. UUID 精确查
      if (trimmed.length >= 32 && !trimmed.includes(' ')) {
        try {
          const directRes = await apis.assemblyApi().getAssemblyItem(trimmed);
          const directItem = directRes.data?.data;
          if (directItem) {
            const directList = [directItem];
            searchSessionCache.set(cacheKey, directList);
            entry.searchResults = directList;
            return;
          }
        } catch {}
      }

      // 3. 列表检索
      const res = await apis.assemblyApi().getAssemblyList({
        keyword: trimmed || undefined,
        page: 1,
        pageSize: 10,
        sortField: 'likes',
        sortOrder: 'desc',
        isHasPassword: false,
      } as any);

      const list = res.data?.data?.data || res.data?.data || res.data || [];
      const validList = Array.isArray(list) ? list : [];
      searchSessionCache.set(cacheKey, validList);
      entry.searchResults = validList;
    } catch (err) {
      console.error('Search assembly error:', err);
      entry.searchResults = [];
    } finally {
      entry.searchLoading = false;
    }
  };

  /**
   * 选择配装并加载详情
   */
  const selectAssembly = async (idx: number, listItem: any) => {
    const entry = compareList.value[idx];
    if (!entry) return;

    entry.loading = true;
    entry.menuOpen = false;

    try {
      const uuid = listItem.uuid;
      let detail = null;
      if (uuid) {
        const res = await apis.assemblyApi().getAssemblyItem(uuid);
        detail = res.data?.data;
      }
      const finalItem = detail || listItem;
      entry.item = finalItem;
      entry.keyword = finalItem.name || '';
    } catch (err) {
      console.error('Load assembly detail error:', err);
      entry.item = listItem;
      entry.keyword = listItem.name || '';
    } finally {
      entry.loading = false;
    }
  };

  /**
   * 交换两项配装
   */
  const swapEntries = (idxA: number, idxB: number) => {
    if (idxA < 0 || idxA >= compareList.value.length || idxB < 0 || idxB >= compareList.value.length) return;
    const temp = compareList.value[idxA];
    compareList.value[idxA] = compareList.value[idxB];
    compareList.value[idxB] = temp;
  };

  /**
   * 重置全部对比状态
   */
  const reset = () => {
    compareList.value = [];
    targetIndex.value = 0;
    searchSessionCache.clear();
  };

  return {
    MAX_COMPARE_COUNT,
    compareList,
    targetIndex,
    benchmarkResult,
    isMaxReached,
    compareCount,
    getEntryAssemblyData,
    initCompare,
    addCompareEntry,
    removeCompareEntry,
    setTargetIndex,
    setEntryItem,
    clearEntry,
    searchAssemblies,
    selectAssembly,
    swapEntries,
    reset,
  };
});
