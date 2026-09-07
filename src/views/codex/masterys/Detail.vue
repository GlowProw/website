<script setup lang="ts">
import {computed, onMounted, type Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Masterys} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {storage} from "@/assets/sripts";
import MasteryIconWidget from "@/components/snbWidget/masteryIconWidget.vue";
import MasteryName from "@/components/snbWidget/masteryName.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {useAuthStore} from "~/stores/userAccountStore";
import {useAppStore} from "~/stores/appStore";
import {useHead} from "@unhead/vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ShareWidget from "@/components/ShareWidget.vue";
import type {Mastery} from "glow-prow-data";

const {t, messages} = useI18n(),
    i18nReadName = useI18nReadName(),
    router = useRouter(),
    route = useRoute(),
    authStore = useAuthStore(),
    appStore = useAppStore();

const masteryDetailPageData = ref({
  loading: false,
});

const masteryDetailData: Ref<Mastery | null> = ref(null);

const head: Ref<any> = ref({
  title: t(route.meta.title as string || 'codex.mastery.title'),
  titleTemplate: `%s | ${t('name')}`,
  meta: [
    {name: 'description', content: ''},
    {name: 'keywords', content: t(route.meta.keywords as string || 'codex.mastery.meta.keywords')},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: `%s | ${t('name')}`},
    {property: 'og:description', content: ''},
    {property: 'og:site_name', content: t('name')},
  ]
});

useHead(head);

// 查找节点并识别所属赛季
function findMasteryNode(id: string): Mastery | null {
  for (const tree of Object.values(Masterys)) {
    if (tree && (tree as any).nodes) {
      if ((tree as any).nodes[id]) {
        return (tree as any).nodes[id];
      }
      const found = (Object.values((tree as any).nodes) as Mastery[]).find(n => n.key === id || n.id === id);
      if (found) return found;
    }
  }
  return null;
}

// 寻找以此节点为前置的后续依赖节点
const dependentNodes = computed(() => {
  if (!masteryDetailData.value) return [];
  const currentKey = masteryDetailData.value.key || masteryDetailData.value.id;
  const currentId = masteryDetailData.value.id;
  const result: Mastery[] = [];
  for (const tree of Object.values(Masterys)) {
    if (tree && (tree as any).nodes) {
      for (const node of Object.values((tree as any).nodes) as Mastery[]) {
        if (node.requisite && (node.requisite.includes(currentKey) || node.requisite.includes(currentId))) {
          result.push(node);
        }
      }
    }
  }
  return result;
});

const nodeCategory = computed(() => masteryDetailData.value?.category || 'default');

const headerBgClass = computed(() => {
  switch (nodeCategory.value) {
    case 'defensive': return 'bg-gradient-defensive';
    case 'offensive': return 'bg-gradient-offensive';
    case 'impetus': return 'bg-gradient-impetus';
    default: return 'bg-gradient-default';
  }
});

const onCodexHistory = (id: string) => {
  let name = 'codex.history';
  const d = storage.session.get(name);
  storage.session.set(name, {
    ...d?.data?.value || {},
    [id]: {
      id,
      category: 'mastery',
      time: new Date().getTime()
    }
  });
};

onMounted(() => {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

  if (!id) {
    router.push('/codex/masterys');
    return;
  }

  const node = findMasteryNode(id as string);
  if (!node) {
    router.push('/codex/masterys');
    return;
  }

  masteryDetailPageData.value.loading = true;
  masteryDetailData.value = node;

  const headData = i18nReadName.mastery(id as string),
      headName = headData.name(),
      headDescription = headData.description();

  head.value.titleTemplate = `${headName} - ${head.value.titleTemplate}`;

  head.value.meta = [
    {name: 'description', content: headDescription},
    {
      name: 'keywords', content: t(route.meta.keywords as string || 'codex.mastery.meta.keywords', {
        keywords: [headName, node.category, node.role, node.season, id as string].join(',')
      })
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: `${headName} | ${t('name')}`},
    {property: 'og:description', content: headDescription},
    {property: 'og:url', content: window.location.href},
    {property: 'og:site_name', content: t('name')},
  ];

  onCodexHistory(id as string);
  masteryDetailPageData.value.loading = false;
});
</script>

<template>
  <v-breadcrumbs>
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/codex/">{{ t('codex.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex/masterys">{{ t('codex.masterys.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('codex.mastery.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>

  <div class="mastery-detail" v-if="masteryDetailData && !masteryDetailPageData.loading">
    <!-- 头部区域带分类渐变效果 -->
    <div class="mastery-detail-header pa-6" :class="headerBgClass">
      <v-container class="position-relative">
        <v-row align="center">
          <v-col>
            <div class="d-flex align-center gap-2 mb-2">
              <v-chip size="small" variant="flat" color="black" class="font-weight-bold">
                {{ nodeCategory.toUpperCase() }}
              </v-chip>
              <v-chip size="small" variant="outlined" v-if="masteryDetailData.season">
                {{ masteryDetailData.season }}
              </v-chip>
              <v-chip size="small" color="amber" variant="tonal" v-if="masteryDetailData.role">
                {{ masteryDetailData.role }}
              </v-chip>
            </div>

            <h1 class="text-amber text-h3 font-weight-bold">
              <MasteryName :id="masteryDetailData.id" />
            </h1>
            <p class="mt-2 mb-0 text-caption text-grey font-monospace">
              <v-icon icon="mdi-identifier" size="small"/>
              {{ masteryDetailData.id }}
            </p>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto" class="d-flex align-center gap-2">
            <v-btn
                variant="outlined"
                color="amber"
                prepend-icon="mdi-transit-connection-variant"
                :to="`/mastery?season=${masteryDetailData.season || masteryDetailData.bySeason?.id || 'shatteredSeas'}&locate=${masteryDetailData.id}`"
            >
              在专精树中查看
            </v-btn>
            <v-btn class="mr-2">
              <LikeWidget v-if="authStore.isLogin"
                          targetType="mastery"
                          :isShowCount="true"
                          :targetId="masteryDetailData.id">
                <template v-slot:activate>
                  <v-icon icon="mdi-thumb-up"></v-icon>
                </template>
                <template v-slot:unActivate>
                  <v-icon icon="mdi-thumb-up-outline"></v-icon>
                </template>
              </LikeWidget>
            </v-btn>
            <ShareWidget type="mastery" :target-id="masteryDetailData.id" />
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- 内容区域 -->
    <div class="background-flavor py-6">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="8" lg="8" order="2" order-sm="1">
            <v-row class="mb-6" align="center">
              <v-col cols="auto">
                <ItemSlotBase size="100px" class="mr-3">
                  <MasteryIconWidget
                      :id="masteryDetailData.id"
                      :name="masteryDetailData.id"
                      :category="masteryDetailData.category"
                      :role="masteryDetailData.role"
                      :with-background="true"
                      :isOpenDetail="false"
                      :isShowOpenDetail="false"
                      :isShowTooltip="false"
                      size="90px"
                  />
                </ItemSlotBase>
              </v-col>
              <v-col>
                <h3 class="text-amber text-subtitle-1 mb-2">专精效果描述</h3>
                <div class="text-pre-wrap text-body-2 opacity-90">
                  {{ i18nReadName.mastery(masteryDetailData.id).description() || '暂无描述' }}
                </div>
                <div v-if="masteryDetailData.cost" class="mt-2 text-caption opacity-70">
                  <v-icon start size="14" color="amber">mdi-star-circle</v-icon>
                  {{ masteryDetailData.role === 'seasonalPerk' ? `激活门槛: 需累计投入 ${masteryDetailData.cost} 点` : `点数消耗: ${masteryDetailData.cost} 点` }}
                </div>
              </v-col>
            </v-row>

            <!-- 前置需求节点 (Requisites) -->
            <template v-if="masteryDetailData.requisite && masteryDetailData.requisite.length > 0">
              <v-divider class="my-6"></v-divider>
              <h3 class="text-amber text-subtitle-1 mb-3">前置技能要求 (Requisites)</h3>
              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item v-for="req in masteryDetailData.requisite" :key="req" class="px-0 mb-2">
                  <v-row no-gutters align="center">
                    <v-col cols="auto" class="mr-3">
                      <ItemSlotBase size="36px" :padding="2">
                        <MasteryIconWidget :id="req" :with-background="true" :isShowTooltip="true" :isOpenDetail="true" size="32px" />
                      </ItemSlotBase>
                    </v-col>
                    <v-col>
                      <router-link :to="`/codex/mastery/${req}`" class="text-amber text-decoration-none font-weight-bold">
                        <MasteryName :id="req" />
                      </router-link>
                      <span class="text-caption text-grey ml-2 font-monospace">{{ req }}</span>
                    </v-col>
                  </v-row>
                </v-list-item>
              </v-list>
            </template>

            <!-- 后续依赖节点 (Dependent Nodes) -->
            <template v-if="dependentNodes.length > 0">
              <v-divider class="my-6"></v-divider>
              <h3 class="text-amber text-subtitle-1 mb-3">后续解锁节点</h3>
              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item v-for="dep in dependentNodes" :key="dep.key || dep.id" class="px-0 mb-2">
                  <v-row no-gutters align="center">
                    <v-col cols="auto" class="mr-3">
                      <ItemSlotBase size="36px" :padding="2">
                        <MasteryIconWidget :id="dep.id" :name="dep.id" :category="dep.category" :role="dep.role" :with-background="true" :isShowTooltip="true" :isOpenDetail="true" size="32px" />
                      </ItemSlotBase>
                    </v-col>
                    <v-col>
                      <router-link :to="`/codex/mastery/${dep.key || dep.id}`" class="text-amber text-decoration-none font-weight-bold">
                        <MasteryName :id="dep.id" />
                      </router-link>
                      <span class="text-caption text-grey ml-2 font-monospace">{{ dep.key || dep.id }}</span>
                    </v-col>
                  </v-row>
                </v-list-item>
              </v-list>
            </template>

            <!-- 开发者调试信息 (根据设置中的 isDebug 状态控制) -->
            <template v-if="appStore.isDebug">
              <v-divider class="my-6"></v-divider>
              <h3 class="text-error text-subtitle-1 mb-2">
                <v-icon start size="16">mdi-bug</v-icon>开发者原始数据 (Debug)
              </h3>
              <pre class="pa-3 bg-surface-darken-2 rounded text-caption overflow-auto">{{ masteryDetailData }}</pre>
            </template>

            <v-divider class="my-6"></v-divider>
            <!-- 评论区 -->
            <CommentWidget targetType="mastery" :targetId="masteryDetailData.id" />
          </v-col>

          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <v-card border class="pa-4 bg-surface-darken-1">
              <h3 class="text-subtitle-2 font-weight-bold mb-3">节点属性</h3>
              <div class="mb-2 d-flex justify-space-between text-caption">
                <span class="opacity-60">节点类型</span>
                <span>{{ masteryDetailData.role }}</span>
              </div>
              <div class="mb-2 d-flex justify-space-between text-caption">
                <span class="opacity-60">分类</span>
                <span>{{ masteryDetailData.category }}</span>
              </div>
              <div class="mb-2 d-flex justify-space-between text-caption">
                <span class="opacity-60">所属赛季</span>
                <span>{{ masteryDetailData.season }}</span>
              </div>
              <div class="mb-2 d-flex justify-space-between text-caption" v-if="masteryDetailData.position">
                <span class="opacity-60">坐标</span>
                <span class="font-monospace">X: {{ masteryDetailData.position.x }}, Y: {{ masteryDetailData.position.y }}</span>
              </div>
              <v-divider class="my-3"></v-divider>
              <v-btn
                  block
                  color="amber"
                  variant="tonal"
                  prepend-icon="mdi-transit-connection-variant"
                  :to="`/mastery?season=${masteryDetailData.season || masteryDetailData.bySeason?.id || 'shatteredSeas'}&locate=${masteryDetailData.id}`">
                前往专精模拟树
              </v-btn>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<style scoped lang="less">
</style>
