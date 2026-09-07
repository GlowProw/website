import { computed, nextTick, ref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify/framework';
import LZString from 'lz-string';
import { useAppStore } from '~/stores/appStore';
import { useAssetsStore } from '~/stores/assetsStore';
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

  // 资源图标映射
  const { serializationMap } = useAssetsStore();
  // @ts-ignore
  const masteryImages = import.meta.glob('@glow-prow-assets/mastery/*.webp', { eager: true });
  // @ts-ignore
  const infoImages = import.meta.glob('@glow-prow-assets/mastery/information/*.webp', { eager: true });
  const masteryMap = serializationMap(masteryImages);
  const infoMap = serializationMap(infoImages);

  function getNodeIconUrl(skill: string): string {
    if (!skill) return '';
    const raw = masteryMap[skill] || infoMap[skill];
    if (typeof raw === 'object' && raw?.default) return raw.default;
    if (typeof raw === 'string') return raw;
    return '';
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

  // 赛季状态
  const selectedSeasonId = ref<string>('shatteredSeas');
  const seasonOptions = computed(() => [
    { id: 'shatteredSeas', title: t('mastery.season.shatteredSeas'), maxPoints: 80 },
    { id: 'crimsonWaters', title: t('mastery.season.crimsonWaters'), maxPoints: 90 }
  ]);

  // 树数据
  const allMasterys = computed(() => props.masterys || Masterys);
  const activeTree = computed<SeasonMasteryTree>(() => {
    return allMasterys.value[selectedSeasonId.value] || allMasterys.value['shatteredSeas'];
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
      skill: n.skill,
      category: n.category,
      title: `${getSkillName(n.skill, n.id)} (${n.id})`
    }));
  });

  // 视口变换矩阵
  const transform = ref({ k: 1, x: 0, y: 0 });

  // 初始加载节点
  watch(() => activeTree.value, (tree) => {
    if (!tree) return;
    const map: Record<string, Mastery> = {};
    for (const [k, v] of Object.entries(tree.nodes)) {
      map[k] = { ...v, position: { ...v.position } };
    }
    localNodes.value = map;
  }, { immediate: true });

  // 节点名称与描述解析 (支持 snb.masterys 和节点对象 fallback)
  function getSkillName(skillKey: string, nodeId?: string): string {
    if (!skillKey && !nodeId) return '-';
    if (skillKey) {
      const key = `snb.masterys.${skillKey}.name`;
      if (te(key)) return t(key);
    }
    if (nodeId) {
      const key = `snb.masterys.${nodeId}.name`;
      if (te(key)) return t(key);
      if (localNodes.value[nodeId]?.name) return localNodes.value[nodeId].name;
      if (localNodes.value[nodeId]?.label) return localNodes.value[nodeId].label;
    }
    return skillKey;
  }

  function getSkillDesc(skillKey: string, nodeId?: string): string {
    if (!skillKey && !nodeId) return '';
    if (skillKey) {
      const key = `snb.masterys.${skillKey}.description`;
      if (te(key)) return t(key);
    }
    if (nodeId) {
      const key = `snb.masterys.${nodeId}.description`;
      if (te(key)) return t(key);
      if (localNodes.value[nodeId]?.description) return localNodes.value[nodeId].description;
    }
    return '';
  }

  // 节点状态判断
  function isNodeActive(id: string): boolean {
    const node = localNodes.value[id];
    if (!node) return false;
    if (node.role === 'seasonalPerk') {
      const tier = node.group || String(node.cost);
      return regularPointsSpent.value >= node.cost && selectedSeasonalPerks.value[tier] === id;
    }
    return selectedNodeIds.value.has(id);
  }

  function isNodeAvailable(id: string): boolean {
    const node = localNodes.value[id];
    if (!node) return false;
    if (node.role === 'seasonalPerk') {
      return regularPointsSpent.value >= node.cost;
    }
    // 根节点：第 1 环关键节点或无前置节点为树起点
    if (!node.requisite || node.requisite.length === 0 || (node.role === 'keyBuff' && node.ring === 1)) {
      return true;
    }
    // 至少一个前置节点已激活
    return node.requisite.some(reqId => selectedNodeIds.value.has(reqId));
  }

  function getNodeState(id: string): 'active' | 'available' | 'locked' {
    if (isNodeActive(id)) return 'active';
    if (isNodeAvailable(id)) return 'available';
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
    for (const id of selectedNodeIds.value) {
      const node = localNodes.value[id];
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
    for (const [tier, perkId] of Object.entries(next)) {
      const perkNode = localNodes.value[perkId];
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
      .filter(n => n.role === 'seasonalPerk' && isNodeActive(n.id))
      .sort((a, b) => a.cost - b.cost);
  });

  // 聚合属性统计
  const aggregatedEffects = computed<AggregatedEffect[]>(() => {
    if (!activeTree.value || !activeTree.value.skills || !activeTree.value.effects) return [];
    const skillsDef = activeTree.value.skills;
    const effectsDef = activeTree.value.effects;

    // 统计每种 effect 的总加成与来源 (包括普通节点和已选择激活的赛季特长)
    const effectMap = new Map<string, {
      id: string;
      values: Record<string, number>;
      contributors: Map<string, EffectContributor>;
    }>();

    const activePerkIds = Object.values(selectedSeasonalPerks.value).filter(id => isNodeActive(id));
    const allActiveIds = [...selectedNodeIds.value, ...activePerkIds];

    for (const id of allActiveIds) {
      const node = localNodes.value[id];
      if (!node || !node.skill) continue;
      const skillObj = skillsDef[node.skill];
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

        if (!record.contributors.has(node.skill)) {
          record.contributors.set(node.skill, {
            skillKey: node.skill,
            skillName: getSkillName(node.skill),
            skillCategory: node.category,
            buffCount: 0,
            values: {},
            contributionText: ''
          });
        }
        const c = record.contributors.get(node.skill)!;
        c.buffCount += 1;

        for (const [pk, pv] of Object.entries(eff)) {
          if (pk !== 'id' && typeof pv === 'number') {
            record.values[pk] = (record.values[pk] || 0) + pv;
            c.values[pk] = (c.values[pk] || 0) + pv;
          }
        }
      }
    }

    // 渲染文本
    const result: AggregatedEffect[] = [];
    for (const [eid, rec] of effectMap.entries()) {
      const eDef = effectsDef[eid];
      let template = '';
      if (eDef && eDef.description && eDef.description.length > 0) {
        template = (Array.isArray(eDef.description) ? eDef.description.flat() : [eDef.description]).join(' ');
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

      result.push({
        id: eid,
        name: getSkillName(eid),
        renderedDescription: renderedDesc,
        contributors: contributorsList
      });
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  });

  // 过滤聚合属性
  const effectsFilter = ref('');
  const expandedEffectIds = ref<Set<string>>(new Set());
  const isAllEffectsExpanded = ref(false);

  const filteredAggregatedEffects = computed(() => {
    if (!effectsFilter.value) return aggregatedEffects.value;
    const kw = effectsFilter.value.toLowerCase();
    return aggregatedEffects.value.filter(e => e.name.toLowerCase().includes(kw));
  });

  function toggleEffectExpand(id: string) {
    const next = new Set(expandedEffectIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedEffectIds.value = next;
  }

  function toggleAllEffectsExpanded() {
    if (isAllEffectsExpanded.value) {
      expandedEffectIds.value.clear();
      isAllEffectsExpanded.value = false;
    } else {
      expandedEffectIds.value = new Set(aggregatedEffects.value.map(e => e.id));
      isAllEffectsExpanded.value = true;
    }
  }

  // 点数操作：特长选择与常规节点加退点
  function toggleSeasonalPerk(id: string) {
    const node = localNodes.value[id];
    if (!node || node.role !== 'seasonalPerk') return;
    if (regularPointsSpent.value < node.cost) {
      notify(t('mastery.card.perkPointsRequired', { spent: regularPointsSpent.value, cost: node.cost }), 'warning');
      return;
    }
    const tier = node.group || String(node.cost);
    if (selectedSeasonalPerks.value[tier] === id) {
      const next = { ...selectedSeasonalPerks.value };
      delete next[tier];
      selectedSeasonalPerks.value = next;
      notify(`${t('mastery.card.deselectThisPerk')}: ${getSkillName(node.skill, node.id)}`, 'info');
    } else {
      selectedSeasonalPerks.value = {
        ...selectedSeasonalPerks.value,
        [tier]: id
      };
      notify(`${t('mastery.card.selectThisPerk')}: ${getSkillName(node.skill, node.id)}`, 'success');
    }
  }

  function toggleNodeActivation(id: string) {
    const node = localNodes.value[id];
    if (!node) return;
    if (node.role === 'seasonalPerk') {
      toggleSeasonalPerk(id);
      return;
    }

    const next = new Set(selectedNodeIds.value);
    if (next.has(id)) {
      // 检查撤回时是否有下游节点依赖此节点
      const activeChildren = Object.values(localNodes.value).filter(n =>
        n.id !== id &&
        next.has(n.id) &&
        n.requisite && n.requisite.includes(id)
      );

      const orphaned = activeChildren.some(child => {
        const otherActiveParents = child.requisite.filter(pId => pId !== id && next.has(pId));
        return otherActiveParents.length === 0 && !(child.role === 'keyBuff' && child.ring === 1);
      });

      if (orphaned) {
        notify('无法撤回：后续已激活的节点依赖此升级，请先撤回下游节点。', 'warning');
        return;
      }

      next.delete(id);
      selectedNodeIds.value = next;
      notify(`${t('mastery.card.refundPoint')}: ${getSkillName(node.skill, node.id)}`, 'info');
    } else {
      // 加点
      if (!isNodeAvailable(id)) {
        notify('前置条件不足：请先激活至少一个相连的前置节点。', 'warning');
        return;
      }
      if (regularPointsSpent.value >= maxPoints.value) {
        notify(`已达到当前赛季最大专精点数 (${maxPoints.value} 点)。`, 'warning');
        return;
      }
      next.add(id);
      selectedNodeIds.value = next;
      notify(`${t('mastery.card.investPoint')}: ${getSkillName(node.skill, node.id)}`, 'success');
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
    const node = localNodes.value[nodeId];
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
        if (parsed.s && (parsed.s === 'shatteredSeas' || parsed.s === 'crimsonWaters')) {
          selectedSeasonId.value = parsed.s;
        }
        nextTick(() => {
          selectedNodeIds.value = new Set(parsed.n);
          if (parsed.sp && Array.isArray(parsed.sp)) {
            const spMap: Record<string, string> = {};
            for (const spId of parsed.sp) {
              const spNode = localNodes.value[spId];
              if (spNode) {
                const tier = spNode.group || String(spNode.cost);
                spMap[tier] = spId;
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
    if (qSeason && qSeason !== 'undefined' && (qSeason === 'shatteredSeas' || qSeason === 'crimsonWaters')) {
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
    generateShareCode,
    getShareUrl,
    copyShareUrl,
    loadFromShareCode,
    initFromUrlParams
  };
}
