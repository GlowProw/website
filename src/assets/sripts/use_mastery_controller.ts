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

export interface NodeRequirementItem {
  key: string;
  id: string;
  name: string;
  isActive: boolean;
  isRequisite: boolean;
  isConnectedActive: boolean;
}

export function useMasteryController(props: { masterys?: Record<string, SeasonMasteryTree> }) {
  const route = useRoute();
  const router = useRouter();
  const appStore = useAppStore();
  const { t, te, tm, locale } = useI18n();
  const { mobile } = useDisplay();

  function getI18nDesc(key: string): string {
    const content = tm(key);
    if (content) {
      if (Array.isArray(content)) {
        return content.join('\n');
      }
      if (typeof content === 'string') {
        return content;
      }
    }
    if (te(key)) {
      return t(key) as string;
    }
    return '';
  }

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
  const svgScaleExtent = ref<[number, number]>([0.4, 3.5]);
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

  // 树数据 (直接加载专精数据)
  const allMasterys = computed(() => props.masterys || Masterys);
  const activeTree = computed<SeasonMasteryTree>(() => {
    return allMasterys.value[selectedSeasonId.value] || allMasterys.value[defaultSeasonId] || allMasterys.value['crimsonWaters'] || allMasterys.value['shatteredSeas'];
  });
  // 最大节点点数直接从赛季配置中读取
  const maxPoints = computed(() => activeTree.value?.maxPoints || 80);

  // 动态根据数据源生成赛季选项及最大点数
  const seasonOptions = computed(() => {
    return Object.entries(allMasterys.value || {}).map(([sId, tree]) => ({
      id: sId,
      title: getSeasonTitle(sId),
      maxPoints: tree?.maxPoints || 0
    }));
  });

  // 本地可变节点字典 
  // 支持 debug
  const localNodes = ref<Record<string, Mastery>>({});

  // 选中的激活节点集合 (投入点数)
  const selectedNodeIds = ref<Set<string>>(new Set());

  // 满足点数门槛后用户手动选择激活的赛季特长 
  // 每个点数阶梯单选: group/cost -> nodeId
  const selectedSeasonalPerks = ref<Record<string, string>>({});

  // 当前选中供详情展示的节点
  const selectedNode = ref<Mastery | null>(null);

  // 界面状态 (使用 session 存储抽屉展开状态)
  const SESSION_OPEN_MODEL_KEY = 'mastery.openModel';
  const savedOpenModel = storage.session.get(SESSION_OPEN_MODEL_KEY)?.data?.value;
  const isLeftPanelOpen = ref(typeof savedOpenModel === 'boolean' ? savedOpenModel : !mobile.value);
  watch(isLeftPanelOpen, (val) => {
    storage.session.set(SESSION_OPEN_MODEL_KEY, val);
  });
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
      const desc = getI18nDesc(`snb.masterys.${skillName}.description`);
      if (desc) return desc;
    }
    const resolvedId = node?.id || skillKey;
    if (resolvedId) {
      const desc = getI18nDesc(`snb.masterys.${resolvedId}.description`);
      if (desc) return desc;
    }
    if (skillKey) {
      const desc = getI18nDesc(`snb.masterys.${skillKey}.description`);
      if (desc) return desc;
    }
    if (nodeKey) {
      const desc = getI18nDesc(`snb.masterys.${nodeKey}.description`);
      if (desc) return desc;
    }
    if (node?.description) return node.description;

    // 如果没有直接匹配到文本描述，尝试根据 node.effects 或 skillsDef[resolvedId].effects 动态渲染
    const effects = (node as any)?.effects || activeTree.value?.skills?.[resolvedId]?.effects;
    if (effects && Array.isArray(effects) && effects.length > 0) {
      const lines: string[] = [];
      for (const eff of effects) {
        const eid = eff.id;
        let template = getI18nDesc(`snb.masterys.${eid}.description`);
        if (!template) {
          const eDef = activeTree.value?.effects?.[eid];
          if (eDef?.description && eDef.description.length > 0) {
            template = (Array.isArray(eDef.description) ? eDef.description.flat() : [eDef.description]).join(' ');
          }
        }
        if (template) {
          let line = template;
          for (const [vk, vv] of Object.entries(eff)) {
            if (vk !== 'id') {
              line = line.replace(new RegExp(`{{\\s*${vk}\\s*}}`, 'g'), String(vv));
            }
          }
          lines.push(line);
        }
      }
      if (lines.length > 0) {
        return lines.join(' ');
      }
    }

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
    return selectedNodeIds.value.has(key) || (!!node.id && selectedNodeIds.value.has(node.id));
  }

  // 判断是否为起始根节点 (第 1 环关键节点或无前置节点)
  function isRootNode(node: Mastery): boolean {
    if (node.role === 'seasonalPerk') return false;
    return !node.requisite || node.requisite.length === 0 || (node.role === 'keyBuff' && node.ring === 1);
  }

  // 节点无向邻接关系拓扑表 (聚合 edges 与 requisite)
  const adjacencyMap = computed<Map<string, Set<string>>>(() => {
    const map = new Map<string, Set<string>>();
    for (const key of Object.keys(localNodes.value)) {
      map.set(key, new Set<string>());
    }
    if (activeTree.value?.edges) {
      for (const edge of activeTree.value.edges) {
        if (!edge.source || !edge.target) continue;
        const sNode = findNode(edge.source);
        const tNode = findNode(edge.target);
        const sKey = sNode?.key || edge.source;
        const tKey = tNode?.key || edge.target;
        if (!map.has(sKey)) map.set(sKey, new Set());
        if (!map.has(tKey)) map.set(tKey, new Set());
        map.get(sKey)!.add(tKey);
        map.get(tKey)!.add(sKey);
      }
    }
    for (const [key, node] of Object.entries(localNodes.value)) {
      const curKey = node.key || key;
      if (node.requisite) {
        for (const req of node.requisite) {
          const rNode = findNode(req);
          const reqKey = rNode?.key || req;
          if (!map.has(curKey)) map.set(curKey, new Set());
          if (!map.has(reqKey)) map.set(reqKey, new Set());
          map.get(curKey)!.add(reqKey);
          map.get(reqKey)!.add(curKey);
        }
      }
    }
    return map;
  });

  // 只要任意相连节点已激活，或者自身为树起点，即可点击投入点数
  function isNodeAvailable(keyOrId: string): boolean {
    const node = findNode(keyOrId);
    if (!node) return false;
    if (node.role === 'seasonalPerk') {
      return regularPointsSpent.value >= node.cost;
    }
    // 根节点天然可激活
    if (isRootNode(node)) {
      return true;
    }
    const nodeKey = node.key || keyOrId;
    const neighbors = adjacencyMap.value.get(nodeKey);
    if (neighbors) {
      for (const nKey of neighbors) {
        if (selectedNodeIds.value.has(nKey)) {
          return true;
        }
        const nNode = findNode(nKey);
        if (nNode && (selectedNodeIds.value.has(nNode.key) || (nNode.id && selectedNodeIds.value.has(nNode.id)))) {
          return true;
        }
      }
    }
    // requisite 补充检查
    if (node.requisite) {
      for (const reqKey of node.requisite) {
        if (selectedNodeIds.value.has(reqKey)) {
          return true;
        }
        const rNode = findNode(reqKey);
        if (rNode && (selectedNodeIds.value.has(rNode.key) || (rNode.id && selectedNodeIds.value.has(rNode.id)))) {
          return true;
        }
      }
    }
    return false;
  }

  // 撤回节点检查：确保撤回后剩余已激活节点依然连通到根起点
  function canDeactivateNode(keyOrId: string): { allowed: boolean; reason?: string } {
    const node = findNode(keyOrId);
    if (!node) return { allowed: true };
    const key = node.key || keyOrId;

    const remainingActive = new Set(selectedNodeIds.value);
    remainingActive.delete(key);
    if (node.id) remainingActive.delete(node.id);

    // 如果撤回后没有剩余已激活常规节点，直接允许
    if (remainingActive.size === 0) {
      return { allowed: true };
    }

    // 找出 remainingActive 中所有的根起点 (以标准 key 存储)
    const activeRoots: string[] = [];
    const remainingStandardKeys = new Set<string>();
    for (const activeItem of remainingActive) {
      const n = findNode(activeItem);
      if (n && n.role !== 'seasonalPerk') {
        const stdKey = n.key || activeItem;
        remainingStandardKeys.add(stdKey);
        if (isRootNode(n)) {
          activeRoots.push(stdKey);
        }
      }
    }

    // 如果剩余激活节点中没有任何根起点，说明撤回导致全部与起点失联
    if (activeRoots.length === 0) {
      return {
        allowed: false,
        reason: t('mastery.card.deactivateOrphanError') || '无法撤回：撤回此节点会导致剩余已激活节点失去与起点的连通。'
      };
    }

    // 从所有激活的根起点进行 BFS 遍历，只能访问 remainingStandardKeys 中的相连节点
    const visited = new Set<string>();
    const queue: string[] = [];
    for (const root of activeRoots) {
      if (!visited.has(root)) {
        visited.add(root);
        queue.push(root);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = adjacencyMap.value.get(current);
      if (!neighbors) continue;
      for (const neighbor of neighbors) {
        if (remainingStandardKeys.has(neighbor) && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    // 检查是否所有剩余激活常规节点都被访问连通
    if (visited.size === remainingStandardKeys.size) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: t('mastery.card.deactivateDependentError') || '无法撤回：后续已激活的节点依赖此路径连接，请先撤回下游节点。'
    };
  }

  // 获取节点的需求项列表：包括原本的 requisite 以及已激活的相连节点
  function getNodeRequirementItems(keyOrId: string): NodeRequirementItem[] {
    const node = findNode(keyOrId);
    if (!node) return [];
    const nodeKey = node.key || keyOrId;

    const items: NodeRequirementItem[] = [];
    const addedKeys = new Set<string>();

    // 1. 原有的 requisite 列表中的节点
    if (node.requisite && node.requisite.length > 0) {
      for (const reqKey of node.requisite) {
        const reqNode = findNode(reqKey);
        const resolvedKey = reqNode?.key || reqKey;
        const resolvedId = reqNode?.id || reqKey;
        const active = isNodeActive(resolvedKey) || isNodeActive(resolvedId);
        addedKeys.add(resolvedKey);
        addedKeys.add(resolvedId);
        items.push({
          key: resolvedKey,
          id: resolvedId,
          name: getSkillName(resolvedId, resolvedKey),
          isActive: active,
          isRequisite: true,
          isConnectedActive: false
        });
      }
    }

    // 2. 相连且已激活的邻居节点 (在 requisite 之外，但已激活)
    const neighbors = adjacencyMap.value.get(nodeKey);
    if (neighbors) {
      for (const nKey of neighbors) {
        const nNode = findNode(nKey);
        const resolvedKey = nNode?.key || nKey;
        const resolvedId = nNode?.id || nKey;
        if (addedKeys.has(resolvedKey) || addedKeys.has(resolvedId)) {
          continue;
        }
        const active = isNodeActive(resolvedKey) || isNodeActive(resolvedId);
        if (active) {
          addedKeys.add(resolvedKey);
          addedKeys.add(resolvedId);
          items.push({
            key: resolvedKey,
            id: resolvedId,
            name: getSkillName(resolvedId, resolvedKey),
            isActive: true,
            isRequisite: false,
            isConnectedActive: true
          });
        }
      }
    }

    return items;
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
    if (!activeTree.value || !activeTree.value.skills) return [];
    const skillsDef = activeTree.value.skills;
    const effectsDef = activeTree.value.effects || {};
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
      let template = getI18nDesc(`snb.masterys.${eid}.description`);
      const i18nNameKey = `snb.masterys.${eid}.name`;
      if (!template) {
        if (eDef && eDef.description && eDef.description.length > 0) {
          template = (Array.isArray(eDef.description) ? eDef.description.flat() : [eDef.description]).join(' ');
        } else if (te(i18nNameKey)) {
          template = t(i18nNameKey) as string;
        } else {
          template = getSkillName(eid);
        }
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

  // 寻找从源节点集合到目标节点的最短路径 (最少跳数)
  function findPathFromSources(targetKey: string, isSource: (k: string) => boolean): string[] | null {
    const targetNode = findNode(targetKey);
    const startKey = targetNode?.key || targetKey;
    if (!adjacencyMap.value.has(startKey)) return null;

    const queue: string[] = [startKey];
    const visited = new Map<string, string | null>(); // nodeKey -> nextNodeKeyOnPathToTarget
    visited.set(startKey, null);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (isSource(curr)) {
        // 重建正向路径：从源点 curr 到 startKey
        const path: string[] = [];
        let p: string | null = curr;
        while (p !== null) {
          path.push(p);
          p = visited.get(p) ?? null;
        }
        return path; // [curr, step1, step2, ..., startKey]
      }

      const neighbors = adjacencyMap.value.get(curr);
      if (neighbors) {
        for (const nbr of neighbors) {
          const nbrNode = findNode(nbr);
          if (nbrNode && nbrNode.role === 'seasonalPerk') continue;
          if (!visited.has(nbr)) {
            visited.set(nbr, curr);
            queue.push(nbr);
          }
        }
      }
    }
    return null;
  }

  // 寻找连线激活最短路径：优先从最近已激活节点连过来，若无相连节点则从最近根节点开始
  function findShortestActivationPath(targetKey: string): string[] | null {
    // 1. 如果已有激活节点，优先寻找从最近已激活节点连过来的路径
    if (selectedNodeIds.value.size > 0) {
      const pathFromActive = findPathFromSources(targetKey, (k) => {
        if (selectedNodeIds.value.has(k)) return true;
        const n = findNode(k);
        return !!(n && n.id && selectedNodeIds.value.has(n.id));
      });
      if (pathFromActive && pathFromActive.length > 0) {
        return pathFromActive;
      }
    }

    // 2. 如果没有相连的已激活节点，从最近的根节点连过来
    return findPathFromSources(targetKey, (k) => {
      const n = findNode(k);
      return !!(n && isRootNode(n));
    });
  }

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
    const isCurrentlyActive = next.has(key) || (!!node.id && next.has(node.id));
    if (isCurrentlyActive) {
      const check = canDeactivateNode(key);
      if (!check.allowed) {
        notify(check.reason || '无法撤回：后续已激活的节点依赖此路径连接，请先撤回下游节点。', 'warning');
        return;
      }

      next.delete(key);
      if (node.id) next.delete(node.id);
      selectedNodeIds.value = next;
    } else {
      // 加点：检查是否已达到最大点数上限
      if (regularPointsSpent.value >= maxPoints.value) {
        notify(`已达到当前赛季最大专精点数 (${maxPoints.value} 点)。`, 'warning');
        return;
      }

      // 如果当前节点本就可直接激活 (相邻已激活或本身为根节点)
      if (isNodeAvailable(key)) {
        next.add(key);
        selectedNodeIds.value = next;
        return;
      }

      // 未相连激活节点：寻找从最近激活节点（或根节点）连过来的最短路径一连激活过来
      const path = findShortestActivationPath(key);
      if (!path || path.length === 0) {
        notify('前置条件不足：无法找到到达该节点的有效连通路径。', 'warning');
        return;
      }

      let pointsRemaining = maxPoints.value - regularPointsSpent.value;
      const newlyActivated: string[] = [];
      let reachedTarget = false;

      for (const stepKey of path) {
        const isStepActive = next.has(stepKey) || (() => {
          const n = findNode(stepKey);
          return !!(n && n.id && next.has(n.id));
        })();

        if (isStepActive) continue;

        const stepNode = findNode(stepKey);
        const cost = stepNode?.cost || 1;
        if (pointsRemaining >= cost) {
          next.add(stepKey);
          newlyActivated.push(stepKey);
          pointsRemaining -= cost;
          if (stepKey === key || (stepNode && stepNode.id === key)) {
            reachedTarget = true;
          }
        } else {
          // 点数不够，在对应节点停下
          break;
        }
      }

      if (newlyActivated.length > 0) {
        selectedNodeIds.value = next;
        if (reachedTarget) {
          notify(`已沿最短路径连续激活 ${newlyActivated.length} 个节点。`, 'success');
        } else {
          const lastKey = newlyActivated[newlyActivated.length - 1];
          const lastNode = findNode(lastKey);
          const lastName = lastNode ? getSkillName(lastNode.id, lastNode.key) : lastKey;
          notify(`点数已用尽，已沿路径激活至最远节点：${lastName}。`, 'warning');
        }
      } else {
        notify('点数不足，无法沿路径激活该节点。', 'warning');
      }
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
      v: 1,
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
    canDeactivateNode,
    getNodeRequirementItems,
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
