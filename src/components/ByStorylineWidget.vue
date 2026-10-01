<script lang="ts">
export default {name: 'ByStorylineWidget'}
</script>

<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {Quests, Questlog} from "glow-prow-data";
import QuestName from "@/components/snbWidget/questName.vue";
import ZoomableCanvas from "@/components/ZoomableCanvas.vue";
import {useDisplay} from "vuetify/framework";

const props = defineProps<{
  data: Questlog
}>();

const {t} = useI18n(),
    {mobile} = useDisplay(),
    allQuestsMap = Quests as Record<string, Questlog>;

// 当前分类
const categoryKey = computed(() => props.data?.category || '');

// 当前分类下的所有任务列表
const categoryQuests = computed(() => {
  if (!categoryKey.value) return [];
  return Object.values(allQuestsMap).filter(q => q.category === categoryKey.value);
});

// 分支折叠状态字典
const collapsedBranches = ref<Record<string, boolean>>({});
const collapsedArcs = ref<Record<string, boolean>>({});

// 流程图节点与分支数据结构
export interface FlowBranch {
  branchKey: string;
  branchIndex: number;
  branchTotal: number;
  quests: string[];
  targetMerge: string | null;
  containsActive: boolean;
}

export interface FlowStep {
  type: 'single' | 'fork' | 'merge';
  questId?: string;
  parents?: string[];
  children?: string[];
  forkFrom?: string;
  branches?: FlowBranch[];
  containsActive?: boolean;
}

export interface StoryArc {
  arcId: string;
  arcIndex: number;
  arcTotal: number;
  totalQuests: number;
  containsActive: boolean;
  steps: FlowStep[];
}

// 解析当前分类的流程图结构 (DAG -> Arcs -> FlowSteps)
const storyArcs = computed<StoryArc[]>(() => {
  const quests = categoryQuests.value;
  if (!quests.length) return [];

  const questMap = new Map<string, Questlog>();
  const childrenMap = new Map<string, string[]>();
  const parentsMap = new Map<string, string[]>();

  quests.forEach(q => {
    questMap.set(q.id, q);
    childrenMap.set(q.id, []);
    parentsMap.set(q.id, []);
  });

  quests.forEach(q => {
    const rawIntro = q.introduction || [];
    const parents = rawIntro
        .map(item => typeof item === 'string' ? item : item.id)
        .filter(pId => questMap.has(pId));

    parentsMap.set(q.id, parents);
    parents.forEach(pId => {
      const list = childrenMap.get(pId) || [];
      if (!list.includes(q.id)) {
        list.push(q.id);
        childrenMap.set(pId, list);
      }
    });
  });

  const rootIds = quests.filter(q => (parentsMap.get(q.id)?.length || 0) === 0).map(q => q.id);
  if (rootIds.length === 0 && quests.length > 0) {
    rootIds.push(quests[0].id);
  }

  const visited = new Set<string>();
  const arcs: StoryArc[] = [];
  const activeId = props.data?.id;

  rootIds.forEach((rootId, rIdx) => {
    if (visited.has(rootId)) return;

    const arcSteps: FlowStep[] = [];
    let currentIds = [rootId];
    const arcQuestsSet = new Set<string>();

    while (currentIds.length > 0) {
      if (currentIds.length === 1) {
        const currId = currentIds[0];
        if (visited.has(currId)) break;
        visited.add(currId);
        arcQuestsSet.add(currId);

        const children = childrenMap.get(currId) || [];
        const parents = parentsMap.get(currId) || [];
        const isMerge = parents.length > 1;

        if (children.length <= 1) {
          arcSteps.push({
            type: isMerge ? 'merge' : 'single',
            questId: currId,
            parents,
            children,
            containsActive: currId === activeId
          });
          currentIds = children;
        } else {
          // 当前节点产生分叉 (Fork)
          arcSteps.push({
            type: isMerge ? 'merge' : 'single',
            questId: currId,
            parents,
            children,
            containsActive: currId === activeId
          });

          const branches: FlowBranch[] = [];
          const nextMergeCandidates = new Map<string, number>();

          for (let i = 0; i < children.length; i++) {
            const branchQuests: string[] = [];
            let bCurr: string | null = children[i];
            const branchKey = `${currId}_b${i + 1}`;

            while (bCurr) {
              if (visited.has(bCurr)) break;
              const pCount = (parentsMap.get(bCurr) || []).length;
              if (pCount > 1) {
                // 汇合目标节点
                nextMergeCandidates.set(bCurr, (nextMergeCandidates.get(bCurr) || 0) + 1);
                break;
              }

              visited.add(bCurr);
              arcQuestsSet.add(bCurr);
              branchQuests.push(bCurr);

              const bChildren = childrenMap.get(bCurr) || [];
              if (bChildren.length === 1) {
                bCurr = bChildren[0];
              } else {
                break;
              }
            }

            branches.push({
              branchKey,
              branchIndex: i + 1,
              branchTotal: children.length,
              quests: branchQuests,
              targetMerge: bCurr && (parentsMap.get(bCurr)?.length || 0) > 1 ? bCurr : null,
              containsActive: branchQuests.includes(activeId)
            });
          }

          arcSteps.push({
            type: 'fork',
            forkFrom: currId,
            branches,
            containsActive: branches.some(b => b.containsActive)
          });

          // 寻找共同汇合点
          let commonMerge: string | null = null;
          for (const [mId, count] of nextMergeCandidates.entries()) {
            if (count >= 2 || count === children.length) {
              commonMerge = mId;
              break;
            }
          }

          if (commonMerge) {
            currentIds = [commonMerge];
          } else {
            const remaining: string[] = [];
            for (const b of branches) {
              if (b.targetMerge && !visited.has(b.targetMerge)) {
                remaining.push(b.targetMerge);
              }
            }
            currentIds = remaining;
          }
        }
      } else {
        break;
      }
    }

    arcs.push({
      arcId: rootId,
      arcIndex: rIdx + 1,
      arcTotal: rootIds.length,
      totalQuests: arcQuestsSet.size,
      containsActive: arcQuestsSet.has(activeId),
      steps: arcSteps
    });
  });

  // 处理未归类独立孤立节点
  const unvisited = quests.filter(q => !visited.has(q.id));
  if (unvisited.length > 0) {
    arcs.push({
      arcId: 'other_branches',
      arcIndex: arcs.length + 1,
      arcTotal: arcs.length + 1,
      totalQuests: unvisited.length,
      containsActive: unvisited.some(q => q.id === activeId),
      steps: unvisited.map(q => ({
        type: 'single',
        questId: q.id,
        parents: parentsMap.get(q.id),
        children: childrenMap.get(q.id),
        containsActive: q.id === activeId
      }))
    });
  }

  return arcs;
});

// 检查是否有汇合分支
const hasMergeTarget = (step: FlowStep) => {
  return !!step.branches?.some(b => b.targetMerge != null);
};

// 自动展开包含当前活动任务的分支与故事线
watch(
    () => props.data?.id,
    () => {
      storyArcs.value.forEach(arc => {
        if (arc.containsActive) {
          collapsedArcs.value[arc.arcId] = false;
        }
        arc.steps.forEach(step => {
          if (step.type === 'fork' && step.branches) {
            step.branches.forEach(b => {
              if (b.containsActive) {
                collapsedBranches.value[b.branchKey] = false;
              }
            });
          }
        });
      });
    },
    {immediate: true}
);

// 切换分支折叠
const toggleBranch = (key: string) => {
  collapsedBranches.value[key] = !collapsedBranches.value[key];
};

// 切换故事线折叠
const toggleArc = (key: string) => {
  collapsedArcs.value[key] = !collapsedArcs.value[key];
};

// 全部展开 / 全部折叠
const isAllExpanded = computed(() => {
  let hasCollapsed = false;
  storyArcs.value.forEach(arc => {
    if (collapsedArcs.value[arc.arcId]) hasCollapsed = true;
    arc.steps.forEach(s => {
      if (s.type === 'fork' && s.branches) {
        s.branches.forEach(b => {
          if (collapsedBranches.value[b.branchKey]) hasCollapsed = true;
        });
      }
    });
  });
  return !hasCollapsed;
});

const toggleAll = () => {
  const target = isAllExpanded.value;
  storyArcs.value.forEach(arc => {
    collapsedArcs.value[arc.arcId] = target;
    arc.steps.forEach(s => {
      if (s.type === 'fork' && s.branches) {
        s.branches.forEach(b => {
          collapsedBranches.value[b.branchKey] = target;
        });
      }
    });
  });
};

// 统计总任务数与总分支数
const totalQuestsCount = computed(() => categoryQuests.value.length);
const totalBranchesCount = computed(() => {
  let count = 0;
  storyArcs.value.forEach(arc => {
    arc.steps.forEach(s => {
      if (s.type === 'fork' && s.branches) {
        count += s.branches.length;
      }
    });
  });
  return count;
});
</script>

<template>
  <div class="by-storyline-widget mb-4" v-if="categoryKey">
    <!-- 顶栏分类与动作 -->
    <v-row align="center" class="mb-1">
      <v-col>
        <p class="text-no-wrap font-weight-bold mb-0">
          {{ t('quest.category') }}
        </p>
      </v-col>
    </v-row>

    <!-- 统计指标与展开/折叠控制 -->
    <v-row class="text-caption text-grey mb-1 align-center">
      <v-col cols="auto">
        <v-btn
            class="text-caption px-2"
            variant="text"
            size="x-small"
            prepend-icon="mdi-format-list-bulleted"
            :to="`/quest?category=${categoryKey}`">
          {{ t('quest.viewCategoryQuests') }}
        </v-btn>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="auto">
        <v-btn
           class="text-caption px-2"
            variant="text"
            size="x-small"
            @click="toggleAll">
          <v-icon size="14" :icon="isAllExpanded ? 'mdi-arrow-collapse-vertical' : 'mdi-arrow-expand-vertical'" class="mr-1"/>
          {{ isAllExpanded ? t('quest.collapseAll') : t('quest.expandAll') }}
        </v-btn>
      </v-col>
      <v-col cols="auto" class="text-caption opacity-70 font-mono">
        {{ totalQuestsCount }} {{ t('quest.missions') || '幕' }}
        <template v-if="totalBranchesCount > 0">
          · {{ totalBranchesCount }} {{ t('quest.parallelBranches') }}
        </template>
      </v-col>
    </v-row>

    <!-- 流程图主容器 -->
    <v-card class="bg-black card-enlargement-mask-flavor">
      <ZoomableCanvas
          ref="zoomableAreaRef"
          style="height: 520px"
          :canvas-width="1100"
          :min-scale=".3"
          :max-scale="1.5"
          :default-scale=".7">
        <div class="flowchart-inner-wrapper">
          <!-- 故事线渲染 (支持多故事线) -->
          <div class="flowchart-container">
            <div
                v-for="(arc, arcIdx) in storyArcs"
                :key="arc.arcId"
                class="story-arc-section mb-3">
              <!-- 多故事线时的子标题与折叠开关 -->
              <div
                  v-if="storyArcs.length > 1"
                  class="arc-header d-flex justify-space-between align-center pa-2 mb-2 rounded bg-grey-darken-4 cursor-pointer"
                  @click="toggleArc(arc.arcId)">
                <div class="d-flex align-center">
                  <v-icon
                      size="16"
                      :icon="collapsedArcs[arc.arcId] ? 'mdi-chevron-right' : 'mdi-chevron-down'"
                      class="mr-1 text-amber"/>
                  <span class="text-caption font-weight-bold">
                    {{ t('quest.arc') }} {{ arc.arcIndex }}
                  </span>
                  <v-chip
                      v-if="arc.containsActive"
                      size="x-small"
                      color="amber"
                      variant="flat"
                      class="ml-2 px-1 text-black font-weight-bold"
                      style="height: 16px; font-size: 10px;">
                    {{ t('quest.currentQuest') }}
                  </v-chip>
                </div>
                <span class="text-caption text-grey font-mono">{{ arc.totalQuests }} 幕</span>
              </div>

              <!-- 故事线步骤流 (Flow Steps) -->
              <div v-show="!collapsedArcs[arc.arcId]" class="arc-steps-wrapper">
                <template v-for="(step, sIdx) in arc.steps" :key="sIdx">
                  <!-- 1. 单一阶段节点 (Single Node) -->
                  <template v-if="step.type === 'single' && step.questId">
                    <div class="flow-step-block">
                      <!-- 流程连接线 (非首个节点) -->
                      <div class="flow-spine" v-if="sIdx > 0">
                        <span class="flow-arrow"></span>
                      </div>

                      <!-- 统一任务节点卡片 -->
                      <v-card
                          draggable="false"
                          :to="`/quest/${step.questId}?scrollTop=false`"
                          :class="[
                            'flow-task-card mx-auto align-center py-4 px-5 cursor-pointer',
                            step.questId === props.data.id ? 'active-node' : 'inactive-node',
                            step.questId === props.data.id ? 'bg-amber' : ''
                          ]"
                          variant="flat">
                        <v-row align="center">
                          <v-col>
                            <!-- 任务标题 -->
                            <div class="node-text flex-grow-1 overflow-hidden">
                              <p class="font-weight-medium singe-line mb-0">
                                <QuestName :id="step.questId"/>
                              </p>
                            </div>
                          </v-col>
                          <v-col cols="auto">
                            <!-- 活动状态角标 -->
                            <div v-if="step.questId === props.data.id" class="node-active-tag ml-1">
                              <v-chip size="small" color="black" variant="flat" class="px-1 text-amber font-weight-bold">
                                {{ t('quest.currentQuest') }}
                              </v-chip>
                            </div>
                          </v-col>
                        </v-row>
                      </v-card>
                    </div>
                  </template>

                  <!-- 2. 并行分支分叉 (Parallel Fork Block) -->
                  <template v-else-if="step.type === 'fork' && step.branches">
                    <div class="flow-fork-tree my-1">
                      <!-- 上方流程连线 -->
                      <div class="flow-spine">
                        <span class="flow-arrow"></span>
                      </div>

                      <!-- 顶部连续分叉引线 (Junction Top) -->
                      <div class="fork-junction-top" :class="`branches-${step.branches.length}`">
                        <div class="fork-arm-left" v-if="step.branches.length >= 2"></div>
                        <div class="fork-arm-center" v-if="step.branches.length === 3"></div>
                        <div class="fork-arm-right" v-if="step.branches.length >= 2"></div>
                      </div>

                      <!-- 平行分支网格容器 (弹性拉伸，高度对齐) -->
                      <div class="fork-columns-container">
                        <div
                            v-for="(branch, bIdx) in step.branches"
                            :key="branch.branchKey"
                            class="fork-branch-col"
                            :style="{ width: `${100 / step.branches.length}%` }">
                          <!-- 分支切换标签 (支持折叠) -->
                          <div
                              class="branch-header-pill text-center cursor-pointer"
                              @click="toggleBranch(branch.branchKey)">
                            <v-chip
                                size="small"
                                :color="branch.containsActive ? 'amber' : 'grey-lighten-1'"
                                :variant="branch.containsActive ? 'tonal' : 'outlined'"
                                class="font-mono px-3">
                              <v-icon
                                  size="14"
                                  :icon="collapsedBranches[branch.branchKey] ? 'mdi-chevron-right' : 'mdi-chevron-down'"
                                  class="mr-1"/>
                              {{ t('quest.branchLane') }} {{ branch.branchIndex }}/{{ branch.branchTotal }}
                              <span class="opacity-60 ml-1">({{ branch.quests.length }} 幕)</span>
                            </v-chip>
                          </div>

                          <!-- 分支内任务序列 (折叠控制) -->
                          <div v-show="!collapsedBranches[branch.branchKey]" class="branch-quests-flow mt-3">
                            <template v-for="(bQuestId, bQIdx) in branch.quests" :key="bQuestId">
                              <!-- 统一流程连线 -->
                              <div class="flow-spine" v-if="bQIdx > 0">
                                <span class="flow-arrow"></span>
                              </div>

                              <!-- 统一任务节点卡片 (与主干完全一致) -->
                              <v-card
                                  draggable="false"
                                  :to="`/quest/${bQuestId}?scrollTop=false`"
                                  :class="[
                                    'flow-task-card mx-auto align-center py-4 px-5 cursor-pointer',
                                    bQuestId === props.data.id ? 'active-node' : 'inactive-node',
                                    bQuestId === props.data.id ? 'bg-amber' : ''
                                  ]"
                                  variant="flat">
                                <v-row align="center">
                                  <v-col>
                                    <div class="node-text flex-grow-1 overflow-hidden">
                                      <p class="font-weight-medium singe-line mb-0">
                                        <QuestName :id="bQuestId"/>
                                      </p>
                                    </div>
                                  </v-col>
                                  <v-col cols="auto">
                                    <div v-if="bQuestId === props.data.id" class="node-active-tag ml-1">
                                      <v-chip size="small" color="black" variant="flat" class="px-1 text-amber font-weight-bold">
                                        {{ t('quest.currentQuest') }}
                                      </v-chip>
                                    </div>
                                  </v-col>
                                </v-row>
                              </v-card>
                            </template>

                            <!-- 分支底部垂直到汇聚横杆的连线 (自动纵向填补短分支的高度差) -->
                            <div
                                class="branch-bottom-extend"
                                v-if="hasMergeTarget(step)">
                              <span class="flow-arrow"></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- 底部连续汇合引线 (Junction Bottom) -->
                      <div class="fork-junction-bottom" :class="`branches-${step.branches.length}`" v-if="hasMergeTarget(step)">
                        <div class="merge-arm-left" v-if="step.branches.length >= 2"></div>
                        <div class="merge-arm-center" v-if="step.branches.length === 3"></div>
                        <div class="merge-arm-right" v-if="step.branches.length >= 2"></div>
                      </div>
                    </div>
                  </template>

                  <!-- 3. 汇聚节点 (Merge Join Block) -->
                  <template v-else-if="step.type === 'merge' && step.questId">
                    <div class="flow-step-block flow-merge-block">
                      <!-- 流程连接线 -->
                      <div class="flow-spine">
                        <span class="flow-arrow"></span>
                      </div>

                      <!-- 统一任务节点卡片 -->
                      <v-card
                          draggable="false"
                          :to="`/quest/${step.questId}?scrollTop=false`"
                          :class="[
                            'flow-task-card mx-auto align-center py-4 px-5 cursor-pointer',
                            step.questId === props.data.id ? 'active-node' : 'inactive-node',
                            step.questId === props.data.id ? 'bg-amber' : ''
                          ]"
                          variant="flat">
                        <v-row align="center">
                          <v-col>
                            <div class="node-text flex-grow-1 overflow-hidden">
                              <p class="font-weight-medium singe-line mb-0">
                                <QuestName :id="step.questId"/>
                              </p>
                            </div>
                          </v-col>
                          <v-col cols="auto">
                            <div v-if="step.questId === props.data.id" class="node-active-tag ml-1">
                              <v-chip size="small" color="black" variant="flat" class="px-1 text-amber font-weight-bold">
                                {{ t('quest.currentQuest') }}
                              </v-chip>
                            </div>
                          </v-col>
                        </v-row>
                      </v-card>
                    </div>
                  </template>
                </template>
              </div>
            </div>
          </div>
        </div>
      </ZoomableCanvas>
    </v-card>
  </div>
</template>

<style scoped lang="less">
.by-storyline-widget {
  .flowchart-inner-wrapper {
    user-select: none;
  }

  .flowchart-container {
    position: relative;
    width: 100%;
  }

  .story-arc-section {
    position: relative;
    width: 100%;
  }

  .arc-header {
    border: 1px solid rgba(255, 255, 255, 0.06);
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.08) !important;
    }
  }

  /* 流程连线 */
  .flow-spine {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 40px;
    position: relative;

    &:before {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 2px;
      transform: translateX(-50%);
      background: #ffc107;
    }

    .flow-arrow {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ffc107;
      box-shadow: 0 0 8px #ffc107;
      z-index: 1;
    }
  }

  /* 统一卡片样式 */
  .flow-task-card {
    width: 100%;
    max-width: 460px;
    min-width: 260px;
    transition: all 0.2s ease;
    border-radius: 8px !important;
    user-select: none;
    -webkit-user-drag: none;

    &.active-node {
      box-shadow: 0 0 16px rgba(255, 193, 7, 0.45);
      border: 1px solid #ffeb3b !important;
    }

    &.inactive-node {
      background-color: #1a1a1a !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
    }
  }

  /* 分叉树容器与分支列 */
  .flow-fork-tree {
    position: relative;
    width: 100%;
  }

  /* 连续转角连线：分叉顶部与汇聚底部 */
  .fork-junction-top {
    position: relative;
    width: 100%;
    height: 24px;
    display: flex;

    &.branches-2 {
      .fork-arm-left {
        width: calc(25% + 1px);
        margin-left: 25%;
        height: 100%;
        border-top: 2px solid #ffc107;
        border-left: 2px solid #ffc107;
        border-top-left-radius: 12px;
        box-sizing: border-box;
      }

      .fork-arm-right {
        width: calc(25% + 1px);
        height: 100%;
        border-top: 2px solid #ffc107;
        border-right: 2px solid #ffc107;
        border-top-right-radius: 12px;
        box-sizing: border-box;
      }
    }

    &.branches-3 {
      .fork-arm-left {
        width: 33.333%;
        margin-left: 16.666%;
        height: 100%;
        border-top: 2px solid #ffc107;
        border-left: 2px solid #ffc107;
        border-top-left-radius: 12px;
        box-sizing: border-box;
      }

      .fork-arm-center {
        width: 0;
        height: 100%;
        border-left: 2px solid #ffc107;
        box-sizing: border-box;
      }

      .fork-arm-right {
        width: 33.333%;
        height: 100%;
        border-top: 2px solid #ffc107;
        border-right: 2px solid #ffc107;
        border-top-right-radius: 12px;
        box-sizing: border-box;
      }
    }
  }

  .fork-junction-bottom {
    position: relative;
    width: 100%;
    height: 24px;
    display: flex;

    &.branches-2 {
      .merge-arm-left {
        width: calc(25%);
        margin-left: calc(25% - 1px);
        height: 100%;
        border-bottom: 2px solid #ffc107;
        border-left: 2px solid #ffc107;
        border-bottom-left-radius: 12px;
        box-sizing: border-box;
      }

      .merge-arm-right {
        width: calc(25% + 2px);
        height: 100%;
        border-bottom: 2px solid #ffc107;
        border-right: 2px solid #ffc107;
        border-bottom-right-radius: 12px;
        box-sizing: border-box;
      }
    }

    &.branches-3 {
      .merge-arm-left {
        width: 33.333%;
        margin-left: 16.666%;
        height: 100%;
        border-bottom: 2px solid #ffc107;
        border-left: 2px solid #ffc107;
        border-bottom-left-radius: 12px;
        box-sizing: border-box;
      }

      .merge-arm-center {
        width: 0;
        height: 100%;
        border-left: 2px solid #ffc107;
        box-sizing: border-box;
      }

      .merge-arm-right {
        width: 33.333%;
        height: 100%;
        border-bottom: 2px solid #ffc107;
        border-right: 2px solid #ffc107;
        border-bottom-right-radius: 12px;
        box-sizing: border-box;
      }
    }
  }

  .fork-columns-container {
    display: flex;
    justify-content: center;
    align-items: stretch;
    position: relative;
    width: 100%;
  }

  .fork-branch-col {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 0 16px;
    box-sizing: border-box;
  }

  .branch-quests-flow {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .branch-bottom-extend {
    flex-grow: 1;
    min-height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

    &:before {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 2px;
      transform: translateX(-50%);
      background: #ffc107;
    }

    .flow-arrow {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ffc107;
      box-shadow: 0 0 8px #ffc107;
      z-index: 1;
    }
  }

  .branch-header-pill {
    transition: transform 0.2s ease;
  }
}
</style>
