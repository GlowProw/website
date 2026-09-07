import { computed, nextTick, ref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify/framework';
import LZString from 'lz-string';
import { useAppStore } from '~/stores/appStore';
import { useCDNAssetsServiceStore } from '~/stores/cdnAssetsStore';
import { storage, getCurrentSeasonId } from '@/assets/sripts/index';
import { Masterys, type Mastery, type SeasonMasteryTree } from 'glow-prow-data';

export interface EffectContributor {
  skillKey: string;
  skillName: string;
  skillCategory: string;
  buffCount: number;
  values: Record<string, number>;
  contributionText: string;
}

export interface AggregatedEffect {
  id: string;
  name: string;
  renderedDescription: string;
  contributors: EffectContributor[];
}

export function useMasteryController(props: { masterys?: Record<string, SeasonMasteryTree> }) {
  const route = useRoute();
  const router = useRouter();
  const appStore = useAppStore();
  const { t, te, locale } = useI18n();
  const { mobile } = useDisplay();

  // 资源图标 CDN
  const { currentService: currentImageService } = useCDNAssetsServiceStore();

  function getNodeIconUrl(skill: string): string {
    if (!skill) return '';
    const url = currentImageService.url({
      'glow-prow': {
        id: skill,
        category: 'mastery',
      },
      'glow-prow-zh-cn': {
        id: skill,
        category: 'mastery',
      },
      'local-test': {
        id: skill,
        category: 'mastery',
      },
    });
    return url || `https://assets.glow-prow.top/mastery/${skill}.webp`;
  }

  // 提示信息
  const snackbarShow = ref(false);
  const snackbarText = ref('');
  const snackbarColor = ref('warning');

  function notify(message: string, color = 'warning') {
    snackbarText.value = message;
    snackbarColor.value = color;
    snackbarShow.value = true;
  }

  // Debug 模式 (基于 appStore)
  const isDebug = computed(() => appStore.isDebug);

  // 缩放范围限制 (避免无限放大缩小)
  const svgScaleExtent = ref<[number, number]>([0.8, 3.5]);
  const scaleExtent = computed(() => [
    svgScaleExtent.value[0],
    2.0,
    svgScaleExtent.value[1]
  ]);

  // 赛季状态 (默认选中当前赛季)
  const defaultSeasonId = getCurrentSeasonId('crimsonWaters');
  const selectedSeasonId = ref<string>(defaultSeasonId);
  function getSeasonTitle(id: string): string {
    const key = `snb.seasons.${id}`;
    const raw = te(key) ? t(key) : id;
    return raw.replace(/^Y\d+S\d+\s*-\s*/, '').replace(/\s*\([^)]*\)$/, '');
  }

  const seasonOptions = computed(() => [
    { id: 'shatteredSeas', title: getSeasonTitle('shatteredSeas'), maxPoints: 80 },
    { id: 'crimsonWaters', title: getSeasonTitle('crimsonWaters'), maxPoints: 90 }
  ]);

  // 树数据
  const allMasterys = computed(() => props.masterys || Masterys);
  const activeTree = computed<SeasonMasteryTree>(() => {
    return allMasterys.value[selectedSeasonId.value] || allMasterys.value[defaultSeasonId] || allMasterys.value['crimsonWaters'] || allMasterys.value['shatteredSeas'];
  });
  const maxPoints = computed(() => activeTree.value?.maxPoints || 80);

  // 本地可变节点字典 (支持 debug 拖拽)
  const localNodes = ref<Record<string, Mastery>>({});

  // 选中的激活节点集合 (投入点数)
  const selectedNodeIds = ref<Set<string>>(new Set());

  // 满足点数门槛后用户手动选择激活的赛季特长 (每个点数阶梯单选: group/cost -> nodeId)
  const selectedSeasonalPerks = ref<Record<string, string>>({});

  // 当前选中供详情展示的节点
  const selectedNode = ref<Mastery | null>(null);

  // 界面状态
  const isLeftPanelOpen = ref(!mobile.value);
  const panelExpanded = ref<string[]>(['points', 'seasonal', 'aggregated']);
  const showShareDialog = ref(false);

  // 搜索
  const searchSelected = ref<string | null>(null);
  const searchItems = computed(() => {
    if (!activeTree.value?.nodes) return [];
    return Object.values(activeTree.value.nodes).map(n => ({
      id: n.id,
      key: n.key,
      skill: n.id,
      category: n.category,
      title: `${getSkillName(n.id, n.key)} (${n.key})`
    }));
  });

  // 视口变换矩阵
  const transform = ref({ k: 1, x: 0, y: 0 });

  // 初始加载节点
  watch(() => activeTree.value, (tree) => {
    if (!tree) return;
    const map: Record<string, Mastery> = {};
    for (const [k, v] of Object.entries(tree.nodes)) {
      map[k] = { ...v, key: k, position: { ...v.position } };
    }
    localNodes.value = map;
  }, { immediate: true });

  // 根据 key 或 id 查找节点
  function findNode(keyOrId: string): Mastery | undefined {
    if (!keyOrId) return undefined;
    if (localNodes.value[keyOrId]) return localNodes.value[keyOrId];
    return Object.values(localNodes.value).find(n => n.key === keyOrId || n.id === keyOrId);
  }

  // 节点名称与描述解析 (优先从 snb.masterys 取)
  function getSkillName(skillKey: string, nodeKey?: string): string {
    if (!skillKey && !nodeKey) return '-';
    const node = findNode(nodeKey || skillKey) || findNode(skillKey);
    const skillName = (node as any)?.skill;
    if (skillName) {
      const key = `snb.masterys.${skillName}.name`;
      if (te(key)) return t(key);
    }
    const resolvedId = node?.id || skillKey;
    if (resolvedId) {
      const key = `snb.masterys.${resolvedId}.name`;
      if (te(key)) return t(key);
    }
    if (skillKey) {
      const key = `snb.masterys.${skillKey}.name`;
      if (te(key)) return t(key);
    }
    if (nodeKey) {
      const key = `snb.masterys.${nodeKey}.name`;
      if (te(key)) return t(key);
    }
    if (node?.name) return node.name;
    if (node?.label) return node.label;
    return skillName || resolvedId || skillKey || nodeKey || '';
  }

  function getSkillDesc(skillKey: string, nodeKey?: string): string {
    if (!skillKey && !nodeKey) return '';
    const node = findNode(nodeKey || skillKey) || findNode(skillKey);
    const skillName = (node as any)?.skill;
    if (skillName) {
      const key = `snb.masterys.${skillName}.description`;
      if (te(key)) return t(key);
    }
    const resolvedId = node?.id || skillKey;
    if (resolvedId) {
      const key = `snb.masterys.${resolvedId}.description`;
      if (te(key)) return t(key);
    }
    if (skillKey) {
      const key = `snb.masterys.${skillKey}.description`;
      if (te(key)) return t(key);
    }
    if (nodeKey) {
      const key = `snb.masterys.${nodeKey}.description`;
      if (te(key)) return t(key);
    }
    if (node?.description) return node.description;
    return '';
  }

  // 节点状态判断
  function isNodeActive(keyOrId: string): boolean {
    const node = findNode(keyOrId);
    if (!node) return false;
    const key = node.key || keyOrId;
    if (node.role === 'seasonalPerk') {
      const tier = node.group || String(node.cost);
      return regularPointsSpent.value >= node.cost && (selectedSeasonalPerks.value[tier] === key || selectedSeasonalPerks.value[tier] === node.id);
    }
    return selectedNodeIds.value.has(key);
  }

  function isNodeAvailable(keyOrId: string): boolean {
    const node = findNode(keyOrId);
    if (!node) return false;
    if (node.role === 'seasonalPerk') {
      return regularPointsSpent.value >= node.cost;
    }
    // 根节点：第 1 环关键节点或无前置节点为树起点
    if (!node.requisite || node.requisite.length === 0 || (node.role === 'keyBuff' && node.ring === 1)) {
      return true;
    }
    // 至少一个前置节点已激活
    return node.requisite.some(reqKey => selectedNodeIds.value.has(reqKey));
  }

  function getNodeState(keyOrId: string): 'active' | 'available' | 'locked' {
    if (isNodeActive(keyOrId)) return 'active';
    if (isNodeAvailable(keyOrId)) return 'available';
    return 'locked';
  }

  function getNodeStateColor(state: string): string {
    if (state === 'active') return 'success';
    if (state === 'available') return 'warning';
    return 'default';
  }

  function getNodeStateText(state: string): string {
    if (state === 'active') return t('mastery.card.statusActive');
    if (state === 'available') return t('mastery.card.statusAvailable');
    return t('mastery.card.statusLocked');
  }

  function getCategoryColor(category?: string): string {
    switch (category) {
      case 'defensive': return 'primary';
      case 'offensive': return 'error';
      case 'impetus': return 'amber';
      case 'support': return 'teal';
      default: return 'success';
    }
  }

  // 点数统计
  const regularPointsSpent = computed(() => {
    let count = 0;
    for (const key of selectedNodeIds.value) {
      const node = localNodes.value[key] || findNode(key);
      if (node && node.role !== 'seasonalPerk') {
        count += (node.cost || 1);
      }
    }
    return count;
  });

  // 监听点数变动，若点数低于阶梯门槛则自动取消选中的特长
  watch(regularPointsSpent, (spent) => {
    let changed = false;
    const next = { ...selectedSeasonalPerks.value };
    for (const [tier, perkKey] of Object.entries(next)) {
      const perkNode = findNode(perkKey);
      if (perkNode && spent < perkNode.cost) {
        delete next[tier];
        changed = true;
      }
    }
    if (changed) {
      selectedSeasonalPerks.value = next;
    }
  });

  // 用户选择激活的赛季特长
  const activeSeasonalPerks = computed(() => {
    return Object.values(localNodes.value)
      .filter(n => n.role === 'seasonalPerk' && isNodeActive(n.key))
      .sort((a, b) => a.cost - b.cost);
  });

  // 聚合属性统计
  const aggregatedEffects = computed<AggregatedEffect[]>(() => {
    if (!activeTree.value || !activeTree.value.skills || !activeTree.value.effects) return [];
    const skillsDef = activeTree.value.skills;
    const effectsDef = activeTree.value.effects;
    void locale.value; // 建立对 locale 的响应式依赖，确保切换语言时重新渲染

    // 统计每种 effect 的总加成与来源 (包括普通节点和已选择激活的赛季特长)
    const effectMap = new Map<string, {
      id: string;
      values: Record<string, number>;
      contributors: Map<string, EffectContributor>;
    }>();

    const activePerkKeys = Object.values(selectedSeasonalPerks.value)
      .map(k => findNode(k)?.key)
      .filter(Boolean) as string[];
    const allActiveKeys = [...selectedNodeIds.value, ...activePerkKeys];

    for (const key of allActiveKeys) {
      const node = localNodes.value[key] || findNode(key);
      if (!node) continue;
      const skillId = (node as any).skill || node.id;
      if (!skillId) continue;
      const skillObj = skillsDef[skillId];
      if (!skillObj || !skillObj.effects) continue;

      for (const eff of skillObj.effects) {
        const eid = eff.id;
        if (!effectMap.has(eid)) {
          effectMap.set(eid, {
            id: eid,
            values: {},
            contributors: new Map()
          });
        }
        const record = effectMap.get(eid)!;

        if (!record.contributors.has(skillId)) {
          record.contributors.set(skillId, {
            skillKey: skillId,
            skillName: getSkillName(skillId, node.key),
            skillCategory: node.category,
            buffCount: 0,
            values: {},
            contributionText: ''
          });
        }
        const c = record.contributors.get(skillId)!;
        c.buffCount += 1;

        for (const [pk, pv] of Object.entries(eff)) {
          if (pk !== 'id' && typeof pv === 'number') {
            record.values[pk] = (record.values[pk] || 0) + pv;
            c.values[pk] = (c.values[pk] || 0) + pv;
          }
        }
      }
    }

    // 渲染文本 (优先从 snb.masterys 获取翻译)
    const result: AggregatedEffect[] = []
    for (const [eid, rec] of effectMap.entries()) {
      const eDef = effectsDef[eid];

      // 优先从 snb.masterys 读取本地化描述，fallback 到数据原文
      let template = '';
      const i18nDescKey = `snb.masterys.${eid}.description`;
      const i18nNameKey = `snb.masterys.${eid}.name`;
      if (te(i18nDescKey)) {
        template = t(i18nDescKey) as string;
      } else if (eDef && eDef.description && eDef.description.length > 0) {
        template = (Array.isArray(eDef.description) ? eDef.description.flat() : [eDef.description]).join(' ');
      } else if (te(i18nNameKey)) {
        template = t(i18nNameKey) as string;
      } else {
        template = getSkillName(eid);
      }

      // 格式化总体聚合描述
      let renderedDesc = template;
      for (const [vk, vv] of Object.entries(rec.values)) {
        renderedDesc = renderedDesc.replace(new RegExp(`{{\\s*${vk}\\s*}}`, 'g'), String(vv));
      }

      // 格式化每个贡献项的文本
      const contributorsList = Array.from(rec.contributors.values()).map(c => {
        let cText = template;
        for (const [vk, vv] of Object.entries(c.values)) {
          cText = cText.replace(new RegExp(`{{\\s*${vk}\\s*}}`, 'g'), String(vv));
        }
        c.contributionText = cText;
        return c;
      });

      const effectTitle = te(i18nNameKey) ? (t(i18nNameKey) as string) : getSkillName(eid);

      result.push({
        id: eid,
        name: effectTitle,
        renderedDescription: renderedDesc,
        contributors: contributorsList
      });
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  });

  // 过滤聚合属性
  const effectsFilter = ref('');
  const filteredAggregatedEffects = computed(() => {
    const q = effectsFilter.value.trim().toLowerCase();
    if (!q) return aggregatedEffects.value;
    return aggregatedEffects.value.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.renderedDescription.toLowerCase().includes(q) ||
      e.contributors.some(c => c.skillName.toLowerCase().includes(q))
    );
  });

  // 展开折叠控制
  const expandedEffectIds = ref<Set<string>>(new Set());
  const isAllEffectsExpanded = ref(false);

  function toggleEffectExpand(id: string) {
    const next = new Set(expandedEffectIds.value);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expandedEffectIds.value = next;
  }

  function toggleAllEffectsExpanded() {
    if (isAllEffectsExpanded.value) {
      expandedEffectIds.value = new Set();
      isAllEffectsExpanded.value = false;
    } else {
      expandedEffectIds.value = new Set(aggregatedEffects.value.map(e => e.id));
      isAllEffectsExpanded.value = true;
    }
  }

  // 点数操作：特长选择与常规节点加退点
  function toggleSeasonalPerk(keyOrId: string) {
    const node = findNode(keyOrId);
    if (!node || node.role !== 'seasonalPerk') return;
    const key = node.key || keyOrId;
    if (regularPointsSpent.value < node.cost) {
      notify(t('mastery.card.perkPointsRequired', { spent: regularPointsSpent.value, cost: node.cost }), 'warning');
      return;
    }
    const tier = node.group || String(node.cost);
    if (selectedSeasonalPerks.value[tier] === key || selectedSeasonalPerks.value[tier] === node.id) {
      const next = { ...selectedSeasonalPerks.value };
      delete next[tier];
      selectedSeasonalPerks.value = next;
    } else {
      selectedSeasonalPerks.value = {
        ...selectedSeasonalPerks.value,
        [tier]: key
      };
    }
  }

  function toggleNodeActivation(keyOrId: string) {
    const node = findNode(keyOrId);
    if (!node) return;
    const key = node.key || keyOrId;
    if (node.role === 'seasonalPerk') {
      toggleSeasonalPerk(key);
      return;
    }

    const next = new Set(selectedNodeIds.value);
    if (next.has(key)) {
      // 检查撤回时是否有下游节点依赖此节点
      const activeChildren = Object.values(localNodes.value).filter(n =>
        n.key !== key &&
        next.has(n.key) &&
        n.requisite && n.requisite.includes(key)
      );

      const orphaned = activeChildren.some(child => {
        const otherActiveParents = child.requisite.filter(pKey => pKey !== key && next.has(pKey));
        return otherActiveParents.length === 0 && !(child.role === 'keyBuff' && child.ring === 1);
      });

      if (orphaned) {
        notify('无法撤回：后续已激活的节点依赖此升级，请先撤回下游节点。', 'warning');
        return;
      }

      next.delete(key);
      selectedNodeIds.value = next;
    } else {
      // 加点
      if (!isNodeAvailable(key)) {
        notify('前置条件不足：请先激活至少一个相连的前置节点。', 'warning');
        return;
      }
      if (regularPointsSpent.value >= maxPoints.value) {
        notify(`已达到当前赛季最大专精点数 (${maxPoints.value} 点)。`, 'warning');
        return;
      }
      next.add(key);
      selectedNodeIds.value = next;
    }
  }

  function resetPoints() {
    selectedNodeIds.value = new Set();
    selectedSeasonalPerks.value = {};
    notify(t('mastery.reset') + ' (OK)', 'info');
  }

  // 选中节点
  function selectNode(node: Mastery | null) {
    selectedNode.value = node;
  }

  // 搜索与定位回调 (由 Canvas 组件监听并执行平滑平移)
  const locateTargetNode = ref<Mastery | null>(null);

  function locateNodeById(nodeId: string) {
    const node = findNode(nodeId);
    if (!node) return;
    selectedNode.value = node;
    locateTargetNode.value = node;
  }

  // 压缩分享编码与解码 (包含赛季、常规节点以及选中的赛季特长)
  function generateShareCode(): string {
    const payload = {
      s: selectedSeasonId.value,
      n: Array.from(selectedNodeIds.value),
      sp: Object.values(selectedSeasonalPerks.value)
    };
    return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  }

  function getShareUrl(): string {
    const code = generateShareCode();
    const url = new URL(window.location.href);
    url.searchParams.delete('locate');
    url.searchParams.set('season', selectedSeasonId.value);
    url.searchParams.set('share', code);
    return url.toString();
  }

  async function copyShareUrl(): Promise<boolean> {
    const url = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      notify(t('mastery.shareDialog.copySuccess'), 'success');
      return true;
    } catch (e) {
      notify(t('mastery.shareDialog.copyFailed'), 'error');
      return false;
    }
  }

  function loadFromShareCode(input: string): boolean {
    if (!input) return false;
    let code = input.trim();
    // 允许用户直接粘贴包含 ?share= 或 &share= 的链接
    if (code.includes('share=')) {
      const match = code.match(/[?&]share=([^&#]+)/);
      if (match && match[1]) {
        code = decodeURIComponent(match[1]);
      }
    }

    try {
      let raw = LZString.decompressFromEncodedURIComponent(code);
      if (!raw) {
        raw = LZString.decompressFromBase64(code) || LZString.decompress(code) || code;
      }
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.n)) {
        if (parsed.s) {
          selectedSeasonId.value = parsed.s;
        }
        nextTick(() => {
          selectedNodeIds.value = new Set(parsed.n);
          if (parsed.sp && Array.isArray(parsed.sp)) {
            const spMap: Record<string, string> = {};
            for (const spId of parsed.sp) {
              const spNode = findNode(spId);
              if (spNode) {
                const tier = spNode.group || String(spNode.cost);
                spMap[tier] = spNode.key;
              }
            }
            selectedSeasonalPerks.value = spMap;
          } else {
            selectedSeasonalPerks.value = {};
          }
          notify(t('mastery.shareDialog.importSuccess'), 'success');
        });
        return true;
      }
    } catch (err) {
      console.error('Failed to parse share code:', err);
    }
    return false;
  }

  // URL 初始化检查
  function initFromUrlParams() {
    const qSeason = route.query.season as string;
    if (qSeason && qSeason !== 'undefined') {
      selectedSeasonId.value = qSeason;
    }

    const qShare = route.query.share as string;
    if (qShare && qShare !== 'undefined') {
      loadFromShareCode(qShare);
    }

    const qLocate = route.query.locate as string;
    if (qLocate && qLocate !== 'undefined') {
      nextTick(() => {
        setTimeout(() => {
          locateNodeById(qLocate);
        }, 300);
      });
    }
  }

  // ──── 保存精通配置 ────────────────────────────────────────────────

  const SAVE_STORAGE_KEY = 'mastery.savedBuilds';

  interface MasterySavedBuild {
    id: string;
    name: string;
    season: string;
    code: string;
    createdAt: number;
    updatedAt: number;
  }

  const savedBuilds = ref<MasterySavedBuild[]>([]);
  const showSaveDialog = ref(false);

  function _loadSavedBuilds() {
    try {
      const res = storage.local.get(SAVE_STORAGE_KEY);
      if (res && res.code === 0 && res.data && Array.isArray(res.data.value)) {
        savedBuilds.value = res.data.value;
        return;
      }
      // 兼容直接从 localStorage 迁移老数据
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          savedBuilds.value = parsed;
          storage.local.set(SAVE_STORAGE_KEY, parsed);
          localStorage.removeItem(SAVE_STORAGE_KEY);
          return;
        }
      }
      savedBuilds.value = [];
    } catch {
      savedBuilds.value = [];
    }
  }

  function _persistSavedBuilds() {
    storage.local.set(SAVE_STORAGE_KEY, savedBuilds.value);
  }

  function saveBuild(name: string): boolean {
    if (!name.trim()) return false;
    const code = generateShareCode();
    const now = Date.now();

    // 同名方案则更新
    const existing = savedBuilds.value.find(b => b.name === name.trim());
    if (existing) {
      existing.code = code;
      existing.season = selectedSeasonId.value;
      existing.updatedAt = now;
    } else {
      savedBuilds.value.unshift({
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        season: selectedSeasonId.value,
        code,
        createdAt: now,
        updatedAt: now
      });
    }
    _persistSavedBuilds();
    notify(t('mastery.saveDialog.saveSuccess', { name: name.trim() }), 'success');
    return true;
  }

  function deleteBuild(id: string) {
    savedBuilds.value = savedBuilds.value.filter(b => b.id !== id);
    _persistSavedBuilds();
  }

  function loadBuild(build: MasterySavedBuild) {
    loadFromShareCode(build.code);
  }

  // 初始化时加载
  _loadSavedBuilds();

  return {
    // 基础状态
    route,
    router,
    appStore,
    isDebug,
    mobile,
    t,
    te,
    locale,

    // 提示
    snackbarShow,
    snackbarText,
    snackbarColor,
    notify,

    // 缩放限制
    svgScaleExtent,
    scaleExtent,
    transform,

    // 赛季
    selectedSeasonId,
    seasonOptions,
    activeTree,
    maxPoints,

    // 节点与点数
    localNodes,
    selectedNodeIds,
    selectedSeasonalPerks,
    selectedNode,
    regularPointsSpent,
    activeSeasonalPerks,
    aggregatedEffects,
    filteredAggregatedEffects,
    effectsFilter,
    expandedEffectIds,
    isAllEffectsExpanded,

    // 交互状态
    isLeftPanelOpen,
    panelExpanded,
    showShareDialog,
    searchSelected,
    searchItems,
    locateTargetNode,

    // 方法
    getSkillName,
    getSkillDesc,
    getNodeIconUrl,
    isNodeActive,
    isNodeAvailable,
    getNodeState,
    getNodeStateColor,
    getNodeStateText,
    getCategoryColor,
    toggleNodeActivation,
    toggleSeasonalPerk,
    resetPoints,
    selectNode,
    locateNodeById,
    toggleEffectExpand,
    toggleAllEffectsExpanded,
    toggleAllEffectsExpand: toggleAllEffectsExpanded,
    generateShareCode,
    getShareUrl,
    copyShareUrl,
    loadFromShareCode,
    initFromUrlParams,

    // 保存精通配置
    savedBuilds,
    showSaveDialog,
    saveBuild,
    deleteBuild,
    loadBuild,
  };
}
