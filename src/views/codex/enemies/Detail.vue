<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useHead} from "@unhead/vue";
import {Enemies, Enemy, MapLocations} from "glow-prow-data";

import Banner from "@/components/Banner.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import EnemiesIconWidget from "@/components/snbWidget/enemiesIconWidget.vue";
import EnemiesName from "@/components/snbWidget/enemiesName.vue";
import EnemiesDescription from "@/components/snbWidget/enemiesDescription.vue";
import LootEntriesWidget from "@/components/snbWidget/lootEntriesWidget.vue";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import ByMapWidget from "@/components/ByMapWidget.vue";
import TimeView from "@/components/TimeView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import VerticalScrollList from "@/components/VerticalScrollList.vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {getAppUrl, storage} from "@/assets/sripts/index";

const {t} = useI18n(),
    router = useRouter(),
    route = useRoute(),
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
 * 航线（船队专有），每条航线固定两个航行状态，等级与掉落挂在航线上
 */
const routes = computed(() => (enemyDetailData.value?.routes || []).filter(Boolean));

const activeRouteIndex = ref(0);
const activeVariantId = ref('');

const activeRoute = computed(() => routes.value[activeRouteIndex.value] || null);
const activeRouteVariants = computed(() => (activeRoute.value?.variants || []).filter(Boolean));

/**
 * 当前航线的世界等级，没有则回退到敌人的根等级
 */
const activeRouteWorldTierEntries = computed(() =>
    getWorldTierEntries(activeRoute.value?.worldTiers || enemyDetailData.value?.worldTiers)
);
const activeRouteWorldTierEntriesDesc = computed(() => [...activeRouteWorldTierEntries.value].reverse());

/**
 * 当前航线的掉落，没有则回退到敌人的根掉落
 */
const activeRouteLoot = computed(() => activeRoute.value?.possibleLoot || enemyDetailData.value?.possibleLoot);

/**
 * 切换航线时，默认展示该航线的第一个航行状态
 */
const selectRoute = (index: number) => {
  activeRouteIndex.value = index;
  activeVariantId.value = (routes.value[index]?.variants || [])[0]?.id || '';
};

watch(() => id.value, () => {
  activeRouteIndex.value = 0;
  activeVariantId.value = (routes.value[0]?.variants || [])[0]?.id || '';
}, {immediate: true});

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
                <EnemiesDescription :id="enemyDetailData.id" :variant-id="activeVariantId"></EnemiesDescription>

                <!-- 航线与航行状态：切换后上方的描述会跟着变 -->
                <div class="d-flex flex-wrap ga-2 mt-4" v-if="routes.length">
                  <v-chip v-for="(routeItem, index) in routes" :key="routeItem.id"
                          size="small" color="amber"
                          :variant="index === activeRouteIndex ? 'flat' : 'tonal'"
                          @click="selectRoute(index)">
                    {{ t('codex.enemy.route', {num: index + 1}) }}
                  </v-chip>
                  <v-chip v-for="variant in activeRouteVariants" :key="variant.id"
                          size="small" color="amber"
                          :variant="variant.id === activeVariantId ? 'flat' : 'tonal'"
                          @click="activeVariantId = variant.id">
                    {{ enemy(enemyDetailData.id).variantName(variant.id) }}
                  </v-chip>
                </div>
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

                <!-- 世界等级（船队取当前航线的等级） -->
                <template v-if="activeRouteWorldTierEntriesDesc.length">
                  <template v-for="entry in activeRouteWorldTierEntriesDesc" :key="entry[0]">
                    <v-text-field readonly
                                  hide-details
                                  variant="underlined" density="compact">
                      <template v-slot:default>
                        {{ t('map.worldTierValue', {num: entry[0]}) }}
                        <span class="ml-2 font-weight-bold">{{ entry[1] }}</span>
                      </template>
                      <template v-slot:append-inner>
                        <p class="text-no-wrap">{{ t('codex.enemy.worldTiers') }}</p>
                      </template>
                    </v-text-field>
                  </template>
                </template>
              </v-col>
            </v-row>

            <!-- 召唤消耗 -->
            <template v-if="enemyDetailData.summonItem">
              <v-divider class="mt-6">{{ t('codex.enemy.summonItem') }}</v-divider>
              <LootEntriesWidget :entries="enemyDetailData.summonItem"
                                 is-always-show-quantity></LootEntriesWidget>
            </template>

            <!-- 掉落（船队取当前航线的掉落） -->
            <template v-if="activeRouteLoot">
              <v-divider class="mt-6">{{ t('map.possibleLoot') }}</v-divider>
              <LootEntriesWidget :entries="activeRouteLoot"></LootEntriesWidget>
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
                      :initial-zoom="1"
                      :target-key="location.id"
                      :target-x="location.longitude"
                      :target-y="location.latitude">
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
