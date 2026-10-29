<script setup lang="ts">
import {computed, onMounted} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useHead} from "@unhead/vue";
import {Enemies, Enemy, MapLocations} from "glow-prow-data";

import Banner from "@/components/Banner.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import EnemiesIconWidget from "@/components/snbWidget/enemiesIconWidget.vue";
import EnemiesName from "@/components/snbWidget/enemiesName.vue";
import EnemiesDescriptions from "@/components/snbWidget/enemiesDescriptions.vue";
import LootEntriesWidget from "@/components/snbWidget/lootEntriesWidget.vue";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import ByMapWidget from "@/components/ByMapWidget.vue";
import TimeView from "@/components/TimeView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import VerticalScrollList from "@/components/VerticalScrollList.vue";
import {useAuthStore} from "~/stores/userAccountStore";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {getAppUrl, storage} from "@/assets/sripts/index";

const {t} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    authStore = useAuthStore(),
    {enemy, season: readSeason} = useI18nReadName(),
    enemies: Record<string, Enemy> = Enemies;

const id = computed(() => {
  const paramId = route.params.id;
  return Array.isArray(paramId) ? paramId[0] : paramId;
});

const enemyDetailData = computed<Enemy | null>(() => {
  if (!id.value) return null;
  return enemies[id.value] || null;
});

const headName = computed(() => id.value ? enemy(id.value).name() : '');
const headDescription = computed(() => id.value ? enemy(id.value).description() : '');

/**
 * 世界等级：key 为世界编号，value 为该世界下的敌人等级
 */
const getWorldTierEntries = (tiers: Record<string, number> | undefined) =>
    Object.entries(tiers || {}).sort((a, b) => Number(a[0]) - Number(b[0]));

/**
 * 世界等级：根部有数据就优先使用，否则按航线分别列出
 * 每条记录带上航线编号，方便在右侧列表里区分属于哪条航线
 */
const worldTierEntries = computed(() => {
  const rootEntries = getWorldTierEntries(enemyDetailData.value?.worldTiers).reverse();

  if (rootEntries.length) {
    return rootEntries.map(entry => ({
      key: `root-${entry[0]}`,
      routeLabel: '',
      world: entry[0],
      level: entry[1]
    }));
  }

  return (enemyDetailData.value?.routes || []).flatMap((routeItem, index) => {
    const routeLabel = t('codex.enemy.route', {num: index + 1});
    return getWorldTierEntries(routeItem.worldTiers)
        .reverse()
        .map(entry => ({
          key: `${routeItem.id || index}-${entry[0]}`,
          routeLabel,
          world: entry[0],
          level: entry[1]
        }));
  });
});

/**
 * 掉落：根部有数据就优先使用，否则按航线分别列出各自的掉落
 */
const lootSections = computed(() => {
  const rootLoot = enemyDetailData.value?.possibleLoot || {};

  if (Object.keys(rootLoot).length) {
    return [{key: 'root', routeLabel: '', entries: rootLoot}];
  }

  return (enemyDetailData.value?.routes || [])
      .map((routeItem, index) => ({
        key: routeItem.id || `route-${index + 1}`,
        routeLabel: t('codex.enemy.route', {num: index + 1}),
        entries: routeItem.possibleLoot || {}
      }))
      .filter(section => Object.keys(section.entries).length);
});

/**
 * 出现坐标，坐标 key 对应地图点位详情
 */
const locationEntries = computed(() =>
    (enemyDetailData.value?.location || [])
        .filter(locationId => !!(MapLocations as any)[locationId])
        .map(locationId => (MapLocations as any)[locationId])
);

useHead(() => {
  const currentName = headName.value;
  const currentDesc = headDescription.value;

  return {
    title: currentName ? `${currentName} - ${t('codex.enemy.title')}` : t('codex.enemy.title'),
    titleTemplate: `%s | ${t('name')}`,
    meta: [
      {name: 'description', content: currentDesc},
      {
        name: 'keywords',
        content: t('codex.enemy.meta.keywords', {
          keywords: `${headName.value},${id.value || ''}`
        })
      },
      {property: 'og:type', content: 'website'},
      {property: 'og:title', content: `${currentName} | ${t('name')}`},
      {property: 'og:description', content: currentDesc},
      {property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : getAppUrl(route.fullPath || route.path)},
      {property: 'og:site_name', content: t('name')},
      {name: 'twitter:card', content: 'summary'},
      {name: 'twitter:title', content: `${currentName} | ${t('name')}`},
      {name: 'twitter:description', content: currentDesc},
    ]
  };
});

onMounted(() => {
  if (!id.value) {
    router.push('/');
    return;
  }
  if (!enemyDetailData.value) {
    router.push({name: 'NotFound'});
    return;
  }
  onCodexHistory();
});

const onCodexHistory = () => {
  if (typeof window === 'undefined' || !id.value) return;
  const name = 'codex.history';
  const d = storage.session.get(name);
  storage.session.set(name, {
    ...d?.data?.value || {},
    [id.value]: {
      id: id.value,
      category: 'enemy',
      time: new Date().getTime()
    }
  });
};
</script>

<template>
  <v-breadcrumbs density="compact" class="ma-0 pa-0 bg-black">
    <v-container>
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex">{{ t('codex.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex/enemies">{{ t('codex.enemies.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('codex.enemy.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider opacity=".01"></v-divider>
  <div class="enemy-detail" v-if="enemyDetailData && enemyDetailData.id">
    <Banner class="enemy-detail-header">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col cols="8">
            <h1 class="text-amber text-h2 singe-line">
              <EnemiesName :id="enemyDetailData.id"></EnemiesName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ enemyDetailData.id || 'none' }}
            </p>

            <div class="mt-5 d-flex flex-wrap ga-2">
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      v-if="enemyDetailData.type"
                      :to="`/codex/enemies?type=${enemyDetailData.type}`">
                {{ t(`map.types.${enemyDetailData.type}.name`) }}
              </v-chip>
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      v-if="enemyDetailData.category"
                      :to="`/codex/enemies?category=${enemyDetailData.category}`">
                {{ t(`codex.enemy.categorys.${enemyDetailData.category}`) }}
              </v-chip>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn v-if="authStore.isLogin" border>
                <LikeWidget :isShowCount="true"
                            :targetId="enemyDetailData.id"
                            targetType="enemy">
                  <template v-slot:activate>
                    <v-icon icon="mdi-thumb-up"></v-icon>
                  </template>
                  <template v-slot:unActivate>
                    <v-icon icon="mdi-thumb-up-outline"></v-icon>
                  </template>
                </LikeWidget>
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </Banner>
    <div class="background-flavor">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="8" lg="8" order="2" order-sm="1">
            <v-row>
              <div>
                <ItemSlotBase size="130px">
                  <EnemiesIconWidget :data="enemyDetailData" :isOpenDetail="false" :isShowOpenDetail="false"></EnemiesIconWidget>
                </ItemSlotBase>
              </div>
              <v-col>
                <!-- 敌人描述 -->
                <EnemiesDescriptions :id="enemyDetailData.id"></EnemiesDescriptions>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row class="mb-3">
              <v-col cols="12" sm="12" lg="6" xl="6">
                <v-text-field :value="enemyDetailData.id" readonly
                              hide-details
                              variant="underlined" density="compact">
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">ID</p>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12" sm="12" lg="6" xl="6">
                <template v-if="enemyDetailData.difficulty">
                  <v-text-field readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:default>
                      {{ enemyDetailData.difficulty.minimumPeople || 1 }}+
                      {{ String(enemyDetailData.difficulty.type).toUpperCase() }}
                    </template>
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('map.difficulty') }}</p>
                    </template>
                  </v-text-field>
                </template>

                <!-- 参与人数 -->
                <template v-if="enemyDetailData.participants">
                  <v-text-field
                      :value="enemyDetailData.participants"
                      readonly
                      hide-details
                      variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('codex.enemy.participants') }}</p>
                    </template>
                  </v-text-field>
                </template>

                <!-- 世界等级 -->
                <template v-if="worldTierEntries.length">
                  <v-text-field v-for="entry in worldTierEntries" :key="entry.key"
                                readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:default>
                      {{ t('map.worldTierValue', {num: entry.world}) }}
                      <span class="ml-2 font-weight-bold">{{ entry.level }}</span>
                    </template>
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">
                        {{ entry.routeLabel ? `${entry.routeLabel} · ` : '' }}{{ t('codex.enemy.worldTiers') }}
                      </p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
            </v-row>

            <!-- 召唤消耗 -->
            <template v-if="enemyDetailData.summonItem">
              <v-divider class="mt-6">{{ t('codex.enemy.summonItem') }}</v-divider>
              <LootEntriesWidget :entries="enemyDetailData.summonItem"
                                 is-always-show-quantity></LootEntriesWidget>
            </template>

            <!-- 掉落 -->
            <template v-for="section in lootSections" :key="section.key">
              <v-divider>
                {{ t('map.possibleLoot') }}{{ section.routeLabel ? ` · ${section.routeLabel}` : '' }}
              </v-divider>
              <LootEntriesWidget :entries="section.entries"></LootEntriesWidget>
            </template>

            <template v-if="enemyDetailData.id">
              <v-divider>{{ t('comment.title') }}</v-divider>
              <CommentWidget :id="enemyDetailData.id" placeholder="" type="enemy"></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget :data="enemyDetailData" v-if="enemyDetailData.bySeason"></BySeasonWidget>

            <AffixContainerView :offsetTop="80">
              <VerticalScrollList :force-draggable="false" :is-indicator="false" height="calc(100vh - 120px)">
                <v-text-field readonly
                              hide-details
                              v-if="enemyDetailData.bySeason"
                              variant="underlined" density="compact">
                  <template v-slot:prepend-inner>
                    <span class="singe-line">{{ readSeason(enemyDetailData.bySeason.id).fullName() }}</span>
                  </template>
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">{{ t('codex.item.bySeason.append') }}</p>
                  </template>
                </v-text-field>

                <template v-if="enemyDetailData.dateAdded">
                  <v-text-field
                      readonly
                      hide-details
                      variant="underlined" density="compact">
                    <template v-slot:prepend-inner>
                      <TimeView :time="enemyDetailData.dateAdded" class="singe-line"></TimeView>
                    </template>
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('codex.ship.dateAdded') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="enemyDetailData.lastUpdated">
                  <v-text-field readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:prepend-inner>
                      <TimeView :time="enemyDetailData.lastUpdated" class="singe-line"></TimeView>
                    </template>
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('codex.ship.lastUpdated') }}</p>
                    </template>
                  </v-text-field>
                </template>

                <!-- 出现位置 -->
                <template v-for="location in locationEntries" :key="location.id">
                  <ByMapWidget
                      :draggable="false"
                      :zoomable="false"
                      :initial-zoom="8"
                      :target-key="location.id"
                      open-in-map-view>
                    {{ t('codex.enemy.locations') }}
                  </ByMapWidget>
                </template>
              </VerticalScrollList>
            </AffixContainerView>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<style scoped lang="less">
.enemy-detail {
  .enemy-detail-header {
    background-color: #000;
    position: relative;
    padding-bottom: 40px;
    min-height: 320px;
  }
}
</style>
