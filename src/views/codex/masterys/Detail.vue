<script lang="ts" setup>
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref, type Ref, watch} from "vue";
import {Mastery, Masterys} from "glow-prow-data";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import MasteryIconWidget from "@/components/snbWidget/masteryIconWidget.vue";
import MasteryName from "@/components/snbWidget/masteryName.vue";
import MasteryDescription from "@/components/snbWidget/masteryDescription.vue";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import ShareWidget from "@/components/ShareWidget.vue";
import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import VerticalScrollList from "@/components/VerticalScrollList.vue";

import {storage, storageCollect} from "@/assets/sripts";
import {useAuthStore} from "~/stores/userAccountStore";
import {useAppStore} from "~/stores/appStore";
import {useHead} from "@unhead/vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

const
    {t, messages} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    appStore = useAppStore(),
    authStore = useAuthStore(),
    i18nReadName = useI18nReadName(),
    cdnStore = useCDNAssetsServiceStore();

let masteryDetailData: Ref<Mastery | null> = ref(null),
    isCollect = ref(false),

    getCollectStatus = computed(() => {
      if (!masteryDetailData.value && !masteryDetailData.value.id) return false;
      isCollect.value = !isCollect.value;
      return !!storageCollect.get(masteryDetailData.value.id, 'mastery').data;
    }),

    seasonTitle = computed(() => {
      const sId = masteryDetailData.value?.season || (masteryDetailData.value as any)?.bySeason?.id;
      if (!sId) return '';
      const key = `snb.seasons.${sId}`;
      return t(key).replace(/^Y\d+S\d+\s*-\s*/, '');
    }),

    // meta
    head: Ref<any> = ref({
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

// 查找专精节点：优先匹配 id，其次兜底匹配 key
function findMasteryNode(idOrKey: string): Mastery | null {
  if (!idOrKey) return null;
  // id 匹配
  for (const tree of Object.values(Masterys)) {
    if (tree && (tree as any).nodes) {
      for (const node of Object.values((tree as any).nodes) as Mastery[]) {
        if (node.id === idOrKey || (node as any).skill === idOrKey) {
          return node;
        }
      }
    }
  }
  // key 匹配
  for (const tree of Object.values(Masterys)) {
    if (tree && (tree as any).nodes) {
      if ((tree as any).nodes[idOrKey]) {
        return (tree as any).nodes[idOrKey];
      }
      for (const node of Object.values((tree as any).nodes) as Mastery[]) {
        if (node.key === idOrKey) {
          return node;
        }
      }
    }
  }
  return null;
}

// 前置节点解析（转换为对应节点实体）
const requisiteNodes = computed(() => {
  if (!masteryDetailData.value?.requisite?.length) return [];
  return masteryDetailData.value.requisite
    .map(reqKey => findMasteryNode(reqKey))
    .filter((n): n is Mastery => n !== null);
});

// 后续依赖节点解析
const dependentNodes = computed(() => {
  if (!masteryDetailData.value) return [];
  const currentKey = masteryDetailData.value.key;
  const currentId = masteryDetailData.value.id;
  const result: Mastery[] = [];
  const seen = new Set<string>();

  for (const tree of Object.values(Masterys)) {
    if (tree && (tree as any).nodes) {
      for (const node of Object.values((tree as any).nodes) as Mastery[]) {
        if (node.requisite && (node.requisite.includes(currentKey) || node.requisite.includes(currentId))) {
          if (!seen.has(node.id)) {
            seen.add(node.id);
            result.push(node);
          }
        }
      }
    }
  }
  return result;
});

watch(() => route.path, () => {
  onReady();
});

onMounted(() => {
  onReady();
});

const onReady = () => {
  const {id} = route.params;

  if (!id) {
    router.push('/codex/masterys');
    return;
  }

  const rawId = Array.isArray(id) ? id[0] : id;
  const node = findMasteryNode(rawId);

  if (!node) {
    setInterval(() => router.push({name: 'NotFound'}), 1000);
    return;
  }

  // 严格使用 masterys.json 里的 id 非 key，若用户通过 key 访问则自动规范化为 id
  if (rawId !== node.id) {
    router.replace(`/codex/mastery/${node.id}`);
  }

  masteryDetailData.value = node;

  const headData = i18nReadName.mastery(node.id),
      headName = headData.name() as string,
      headDescription = headData.description() as string;

  head.value.titleTemplate = `${headName} - ${head.value.titleTemplate}`;

  const imageUrl = cdnStore.currentService.url({
    id: node.id,
    category: 'mastery'
  });

  head.value.meta = [
    {name: 'description', content: headDescription},
    {
      name: 'keywords', content: t(route.meta.keywords as string || 'codex.mastery.meta.keywords', {
        keywords: Object.keys(messages.value).map(lang => {
          return headData.keysName.map((key: any) => i18nReadName.getValue(messages.value[lang], key)).filter((i: any) => i != null);
        }).concat([node.id, node.category, node.role]) + `,${t('home.meta.keywords')}`
      })
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: `${headName} | ${t('name')}`},
    {property: 'og:description', content: headDescription},
    {property: 'og:image', content: imageUrl},
    {property: 'og:url', content: window.location.href},
    {property: 'og:site_name', content: t('name')},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: `${headName} | ${t('name')}`},
    {name: 'twitter:description', content: headDescription},
    {name: 'twitter:image', content: imageUrl}
  ];

  onCodexHistory();
};

const onCodexHistory = () => {
  if (!masteryDetailData.value?.id) return;
  const id = masteryDetailData.value.id;

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

/**
 * 收藏专精
 */
const onStarMastery = (data: Mastery) => {
  isCollect.value = !isCollect.value;

  if (isCollect.value)
    return storageCollect.delete(data.id, 'mastery');

  storageCollect.updata(
      {collectTime: new Date().getTime()},
      'mastery',
      data.id
  );
};
</script>

<template>
  <v-breadcrumbs>
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex">{{ t('codex.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex/masterys">{{ t('codex.masterys.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('codex.mastery.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <div v-if="masteryDetailData && masteryDetailData.id" class="item-detail">
    <div class="item-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col cols="8">
            <h1 class="text-amber text-h2 singe-line">
              <MasteryName :id="masteryDetailData.id"></MasteryName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ masteryDetailData.id || 'none' }}
            </p>

            <div class="mt-5 d-flex ga-2">
              <v-chip class="badge-flavor text-center tag-badge text-black">
                {{ t(`codex.mastery.roles.${masteryDetailData.role}`) || masteryDetailData.role }}
              </v-chip>
              <v-chip class="badge-flavor text-center tag-badge text-black">
                {{ t(`codex.mastery.categorys.${masteryDetailData.category}`) || masteryDetailData.category }}
              </v-chip>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn :class="getCollectStatus ? 'text-amber' : ''" border variant="text" @click="onStarMastery(masteryDetailData)">
                <v-icon :icon="`mdi-${getCollectStatus ? 'star' : 'star-outline'}`"></v-icon>
              </v-btn>

              <v-btn v-if="authStore.isLogin" border>
                <LikeWidget :isShowCount="true"
                            :targetId="masteryDetailData.id"
                            targetType="mastery">
                  <template v-slot:activate>
                    <v-icon icon="mdi-thumb-up"></v-icon>
                  </template>
                  <template v-slot:unActivate>
                    <v-icon icon="mdi-thumb-up-outline"></v-icon>
                  </template>
                </LikeWidget>
              </v-btn>

              <v-btn border
                     :to="`/mastery?season=${masteryDetailData.season || masteryDetailData.bySeason?.id || 'crimsonWaters'}&locate=${masteryDetailData.id}`"
                     v-tooltip:bottom="t('codex.mastery.openInTree')"
                     :title="t('codex.mastery.openInTree')">
                <v-icon icon="mdi-transit-connection-variant"></v-icon>
              </v-btn>

              <ShareWidget :target-id="masteryDetailData.id" type="mastery"/>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div class="background-flavor">
      <v-container>
        <v-row>
          <v-col cols="12" lg="8" md="8" order="2" order-sm="1" sm="12">
            <v-row>
              <div>
                <ItemSlotBase :id="masteryDetailData.id" size="130px">
                  <MasteryIconWidget :id="masteryDetailData.id" :isOpenDetail="false" :isShowOpenDetail="false" size="110px"></MasteryIconWidget>
                </ItemSlotBase>
              </div>
              <v-col>
                <p class="text-pre-wrap mb-4">
                  <MasteryDescription :id="masteryDetailData.id"></MasteryDescription>
                </p>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row>
              <v-col cols="12" lg="6" sm="12" xl="6">
                <template v-if="appStore.isDebug">
                  {{ masteryDetailData }}
                </template>
                <template v-if="masteryDetailData.id">
                  <v-text-field :value="masteryDetailData.id" density="compact"
                                hide-details
                                readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="masteryDetailData.key && masteryDetailData.key !== masteryDetailData.id">
                  <v-text-field :value="masteryDetailData.key" density="compact"
                                hide-details
                                readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">Key</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="masteryDetailData.role">
                  <v-text-field :value="t(`codex.mastery.roles.${masteryDetailData.role}`) || masteryDetailData.role" density="compact"
                                hide-details
                                readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('mastery.card.role') || '节点类型' }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="masteryDetailData.category">
                  <v-text-field :value="t(`codex.mastery.categorys.${masteryDetailData.category}`) || masteryDetailData.category" density="compact"
                                hide-details
                                readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('mastery.card.category') || '分类' }}</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
              <v-col cols="12" lg="6" sm="12" xl="6">
                <template v-if="masteryDetailData.cost !== undefined">
                  <v-text-field :value="masteryDetailData.cost" density="compact"
                                hide-details
                                readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ masteryDetailData.role === 'seasonalPerk' ? (t('mastery.card.perkCost') || '激活门槛') : (t('mastery.card.pointCost') || '点数消耗') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="masteryDetailData.group">
                  <v-text-field :value="masteryDetailData.group" density="compact"
                                hide-details
                                readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('mastery.card.group') || '分组' }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="masteryDetailData.ring !== undefined && masteryDetailData.ring > 0">
                  <v-text-field :value="masteryDetailData.ring" density="compact"
                                hide-details
                                readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('mastery.card.ring') || '环层级' }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="masteryDetailData.direction">
                  <v-text-field :value="masteryDetailData.direction" density="compact"
                                hide-details
                                readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('mastery.card.direction') || '方向' }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="masteryDetailData.position">
                  <v-text-field :value="`X: ${masteryDetailData.position.x}, Y: ${masteryDetailData.position.y}`" density="compact"
                                hide-details
                                readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('mastery.card.coordinates') || '坐标' }}</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
            </v-row>

            <!-- 前置需求节点 -->
            <template v-if="requisiteNodes.length > 0">
              <v-divider class="mt-8 mb-4">{{ t('mastery.debug.requisites') || '前置技能要求' }}</v-divider>
              <v-row>
                <v-col v-for="req in requisiteNodes" :key="req.id" cols="12" sm="6">
                  <v-card border class="pa-2 d-flex align-center" :to="`/codex/mastery/${req.id}`">
                    <ItemSlotBase size="40px" class="mr-3">
                      <MasteryIconWidget :id="req.id" :isOpenDetail="false" :isShowOpenDetail="false" size="36px" />
                    </ItemSlotBase>
                    <div class="overflow-hidden">
                      <p class="font-weight-bold text-amber singe-line mb-0">
                        <MasteryName :id="req.id" />
                      </p>
                      <p class="text-caption text-grey singe-line mb-0 font-monospace">{{ req.id }}</p>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </template>

            <!-- 后续依赖节点 -->
            <template v-if="dependentNodes.length > 0">
              <v-divider class="mt-8 mb-4">{{ t('mastery.card.dependentNodes') || '后续解锁节点' }}</v-divider>
              <v-row>
                <v-col v-for="dep in dependentNodes" :key="dep.id" cols="12" sm="6">
                  <v-card border class="pa-2 d-flex align-center" :to="`/codex/mastery/${dep.id}`">
                    <ItemSlotBase size="40px" class="mr-3">
                      <MasteryIconWidget :id="dep.id" :isOpenDetail="false" :isShowOpenDetail="false" size="36px" />
                    </ItemSlotBase>
                    <div class="overflow-hidden">
                      <p class="font-weight-bold text-amber singe-line mb-0">
                        <MasteryName :id="dep.id" />
                      </p>
                      <p class="text-caption text-grey singe-line mb-0 font-monospace">{{ dep.id }}</p>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </template>

            <!-- 评论区 -->
            <template v-if="masteryDetailData.id">
              <v-divider class="mt-8 mb-4">{{ t('comment.title') }}</v-divider>
              <CommentWidget :id="masteryDetailData.id" placeholder="" type="mastery"></CommentWidget>
            </template>
          </v-col>

          <v-col cols="12" lg="4" md="4" order="1" order-sm="2" sm="12">
            <BySeasonWidget :data="masteryDetailData"></BySeasonWidget>

            <AffixContainerView :offsetTop="80">
              <VerticalScrollList :force-draggable="false" :is-indicator="false" height="calc(100vh - 120px)">
                <template v-if="masteryDetailData.season || masteryDetailData.bySeason?.id">
                  <v-text-field
                      :value="seasonTitle"
                      density="compact"
                      hide-details
                      readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('mastery.card.season') || '所属赛季' }}</p>
                    </template>
                  </v-text-field>
                </template>

                <template v-if="masteryDetailData.category">
                  <v-text-field
                      :value="t(`codex.mastery.categorys.${masteryDetailData.category}`) || masteryDetailData.category"
                      density="compact"
                      hide-details
                      readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('mastery.card.category') || '分类' }}</p>
                    </template>
                  </v-text-field>
                </template>

                <template v-if="masteryDetailData.role">
                  <v-text-field
                      :value="t(`codex.mastery.roles.${masteryDetailData.role}`) || masteryDetailData.role"
                      density="compact"
                      hide-details
                      readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('mastery.card.role') || '节点类型' }}</p>
                    </template>
                  </v-text-field>
                </template>

                <template v-if="masteryDetailData.cost !== undefined">
                  <v-text-field
                      :value="masteryDetailData.cost"
                      density="compact"
                      hide-details
                      readonly variant="underlined">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ masteryDetailData.role === 'seasonalPerk' ? (t('mastery.card.perkCost') || '门槛') : (t('mastery.card.pointCost') || '消耗') }}</p>
                    </template>
                  </v-text-field>
                </template>

                <v-text-field v-if="masteryDetailData.dateAdded"
                              density="compact"
                              hide-details
                              readonly variant="underlined">
                  <template v-slot:prepend-inner>
                    <TimeView :time="masteryDetailData.dateAdded" class="singe-line">
                      <Time :time="masteryDetailData.dateAdded"></Time>
                    </TimeView>
                  </template>
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">{{ t('codex.ship.dateAdded') }}</p>
                  </template>
                </v-text-field>

                <v-text-field v-if="masteryDetailData.lastUpdated"
                              density="compact"
                              hide-details
                              readonly variant="underlined">
                  <template v-slot:prepend-inner>
                    <TimeView :time="masteryDetailData.lastUpdated" class="singe-line">
                      <Time :time="masteryDetailData.lastUpdated"></Time>
                    </TimeView>
                  </template>
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">{{ t('codex.ship.lastUpdated') }}</p>
                  </template>
                </v-text-field>

                <v-btn
                    block
                    color="amber"
                    variant="tonal"
                    class="mt-6"
                    prepend-icon="mdi-transit-connection-variant"
                    :to="`/mastery?season=${masteryDetailData.season || masteryDetailData.bySeason?.id || 'crimsonWaters'}&locate=${masteryDetailData.id}`">
                  {{ t('codex.mastery.openInTree') || '在专精树中查看' }}
                </v-btn>
              </VerticalScrollList>
            </AffixContainerView>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<style lang="less" scoped>
.item-detail {
  .item-detail-header {
    background-color: #000;
    position: relative;
    padding-bottom: 40px;
    min-height: 320px;

    &:before {
      content: "";
      position: absolute;
      z-index: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 0;
      padding: 10% 0 0;
      background: url(@/assets/images/portal-banner-background.png) 50% 0 no-repeat;
      background-size: cover;
    }
  }
}
</style>
