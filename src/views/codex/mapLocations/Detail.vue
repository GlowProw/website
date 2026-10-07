<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {computed, onMounted} from "vue";
import {MapLocations} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";
import {useAuthStore} from "~/stores/userAccountStore";
import TimeView from "@/components/TimeView.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {getAppUrl, storage} from "@/assets/sripts/index";
import MapLocationName from "@/components/snbWidget/mapLocationName.vue";
import MapLocationIconWidget from "@/components/snbWidget/mapLocationIconWidget.vue";
import MapLocationAvailableTreasureMapWidget from "@/components/snbWidget/mapLocationAvailableTreasureMapWidget.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import MapLocationAvailableNpcWidget from "@/components/snbWidget/mapLocationAvailableNpcWidget.vue";
import ByMapWidget from "@/components/ByMapWidget.vue";
import ByWorldEventWidget from "@/components/ByWorldEventWidget.vue";
import ByBluePrintWidget from "@/components/ByBluePrintWidget.vue";
import ByEventWidget from "@/components/ByEventWidget.vue";
import ByObtainableWidget from "@/components/ByObtainableWidget.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import {useHead} from "@unhead/vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ShareWidget from "@/components/ShareWidget.vue";
import VerticalScrollList from "@/components/VerticalScrollList.vue";
import {useAppStore} from "~/stores/appStore";

const {t, te, messages} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    appStore = useAppStore(),
    authStore = useAuthStore(),
    mapLocations = MapLocations,
    i18nReadName = useI18nReadName();

const
    id = computed(() => (route.params.id as string) || ''),
    mapLocationDetailData = computed(() => {
      if (!id.value) return {};
      let loc = mapLocations[id.value];
      if (!loc) {
        loc = Object.values(mapLocations).find((l: any) => l?.id === id.value || l?.category === id.value);
      }
      if (!loc) {
        loc = {
          id: id.value,
          category: id.value,
        };
      }
      return loc;
    }),

    locationDescription = computed(() => {
      if (!mapLocationDetailData.value) return '';
      const desc = i18nReadName.mapLocation(mapLocationDetailData.value.id, mapLocationDetailData.value.category).description();
      if (desc && desc !== mapLocationDetailData.value.id) return desc;
      return '';
    }),

    isOutpostOrDen = computed(() => {
      return ['outpost', 'den'].includes(mapLocationDetailData.value?.category);
    }),

    headTitle = computed(() => {
      if (!id.value) return t(route.meta?.title as string || 'codex.mapLocation.title');
      const headData = i18nReadName.mapLocation(id.value);
      const headName = headData.name();
      return headName ? `${headName} - ${t(route.meta?.title as string || 'codex.mapLocation.title')}` : t(route.meta?.title as string || 'codex.mapLocation.title');
    }),

    headDescription = computed(() => {
      if (!id.value) return '';
      const headData = i18nReadName.mapLocation(id.value);
      return (headData.description() as string) || '';
    });

useHead({
  title: headTitle,
  titleTemplate: `%s | ${t('name')}`,
  meta: computed(() => {
    if (!id.value) return [];
    const headData = i18nReadName.mapLocation(id.value);
    const headName = headData.name();
    const desc = headData.description() || '';

    return [
      {name: 'description', content: desc},
      {
        name: 'keywords', content: t(route.meta?.keywords as string || '', {
          keywords: Object.keys(messages.value).map(lang => {
            return headData.keysName.map((key: any) => i18nReadName.getValue(messages.value[lang], key)).filter((i: any) => i != null)
          }).concat([id.value]) + `,${t('home.meta.keywords')}`
        })
      },
      {property: 'og:type', content: 'website'},
      {property: 'og:title', content: `${headName} | ${t('name')}`},
      {property: 'og:description', content: desc},
      {property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : getAppUrl(route.fullPath || route.path)},
      {property: 'og:site_name', content: t('name')},
      {name: 'twitter:card', content: 'summary'},
      {name: 'twitter:title', content: `${headName} | ${t('name')}`},
      {name: 'twitter:description', content: desc},
    ];
  })
})

onMounted(() => {
  if (typeof window !== 'undefined' && id.value) {
    onCodexHistory()
  }
})

const onCodexHistory = () => {
  const {id} = route.params;

  let name = 'codex.history'

  const d = storage.session.get(name)

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id as string]: {
      id,
      category: 'mapLocation',
      time: new Date().getTime()
    }
  })
}
</script>

<template>
  <v-breadcrumbs>
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex">{{ t('codex.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex/mapLocations">{{ t('codex.mapLocations.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('codex.mapLocation.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <div class="cosmetic-detail">
    <div class="cosmetic-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col cols="8">
            <h1 class="text-amber text-h2 singe-line">
              <MapLocationName :id="mapLocationDetailData.id || mapLocationDetailData.category || (route.params.id as string)"></MapLocationName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ mapLocationDetailData.id || (route.params.id as string) || 'none' }}
            </p>

            <div class="mt-5 d-flex ga-2" v-if="mapLocationDetailData.category">
              <v-chip class="badge-flavor text-center tag-badge text-black">
                {{ t(`map.types.${mapLocationDetailData.category}.name`) || t(`codex.types.${mapLocationDetailData.category}`) || mapLocationDetailData.category }}
              </v-chip>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn v-if="authStore.isLogin">
                <LikeWidget targetType="mapLocation"
                            :isShowCount="true"
                            :targetId="mapLocationDetailData.id || (route.params.id as string)">
                  <template v-slot:activate>
                    <v-icon icon="mdi-thumb-up"></v-icon>
                  </template>
                  <template v-slot:unActivate>
                    <v-icon icon="mdi-thumb-up-outline"></v-icon>
                  </template>
                </LikeWidget>
              </v-btn>

              <ShareWidget type="mapLocation" :target-id="mapLocationDetailData.id || (route.params.id as string)"/>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div class="background-flavor">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="8" lg="8" order="2" order-sm="1">
            <v-row>
              <div>
                <ItemSlotBase size="130px">
                  <MapLocationIconWidget :id="mapLocationDetailData.id || (route.params.id as string)" :isOpenDetail="false" :isShowOpenDetail="false"></MapLocationIconWidget>
                </ItemSlotBase>
              </div>
              <v-col>
                <template v-if="locationDescription">
                  <div class="mx-5 mb-3 pb-2">
                    {{ locationDescription }}
                  </div>
                </template>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row class="mb-5">
              <v-col cols="12" sm="12" lg="6" xl="6">
                <template v-if="appStore.isDebug">
                  {{ mapLocationDetailData }}
                </template>
                <template v-if="mapLocationDetailData.id">
                  <v-text-field :value="mapLocationDetailData.id" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
              <v-col cols="12" sm="12" lg="12" xl="12" v-if="isOutpostOrDen">
                <v-divider>{{ t('map.treasureMapAvailable') }}</v-divider>
                <MapLocationAvailableTreasureMapWidget :id="mapLocationDetailData.id"></MapLocationAvailableTreasureMapWidget>
              </v-col>
              <v-col cols="12" sm="12" lg="12" xl="12" v-if="isOutpostOrDen">
                <v-divider>{{ t('map.npcAvailable') }}</v-divider>
                <MapLocationAvailableNpcWidget :id="mapLocationDetailData.id" :category="mapLocationDetailData.category"></MapLocationAvailableNpcWidget>
              </v-col>
            </v-row>

            <template v-if="mapLocationDetailData.id">
              <v-divider>{{ t('comment.title') }}</v-divider>
              <CommentWidget :id="mapLocationDetailData.id" type="treasureMap" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget :data="mapLocationDetailData" v-if="mapLocationDetailData.bySeason"></BySeasonWidget>

            <AffixContainerView :offsetTop="80">
              <VerticalScrollList :force-draggable="false" :is-indicator="false" height="calc(100vh - 120px)">

                <template v-if="mapLocationDetailData.id || mapLocationDetailData.latitude">
                  <ByMapWidget
                      :draggable="false"
                      :zoomable="false"
                      :target-key="mapLocationDetailData.id"
                      :target-x="mapLocationDetailData.longitude"
                      :target-y="mapLocationDetailData.latitude">
                    {{ t('codex.item.byMap') }}
                  </ByMapWidget>
                </template>

                <template v-if="mapLocationDetailData.blueprint">
                  <ByBluePrintWidget :data="mapLocationDetailData"></ByBluePrintWidget>
                </template>
                <template v-if="mapLocationDetailData.event">
                  <ByEventWidget :data="mapLocationDetailData"></ByEventWidget>
                </template>
                <template v-if="mapLocationDetailData.worldEvent">
                  <ByWorldEventWidget :data="mapLocationDetailData"></ByWorldEventWidget>
                </template>
                <template v-if="mapLocationDetailData.obtainable">
                  <ByObtainableWidget :data="mapLocationDetailData" byType="item">
                    {{ t('codex.item.obtainable') }}
                  </ByObtainableWidget>
                </template>
                <template v-if="mapLocationDetailData.faction">
                  <v-text-field
                      :value="t(`snb.factions.${mapLocationDetailData.faction.id}.name`)"
                      readonly
                      hide-details
                      variant="underlined" density="compact">
                    <template v-slot:prepend-inner>
                      <ItemSlotBase size="25px" class="d-flex justify-center align-center mb-2" :is-auto-padding="false" :is-auto-margin="false" :padding="0" :margin="0">
                        <FactionIconWidget :name="mapLocationDetailData.faction.id"
                                           size="25px"></FactionIconWidget>
                      </ItemSlotBase>
                    </template>
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('codex.item.faction') }}</p>
                    </template>
                  </v-text-field>
                </template>

                <v-text-field readonly
                              hide-details
                              v-if="mapLocationDetailData.dateAdded"
                              variant="underlined" density="compact">
                  <template v-slot:prepend-inner>
                    <TimeView :time="mapLocationDetailData.dateAdded" class="singe-line">
                    </TimeView>
                  </template>
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">{{ t('codex.ship.dateAdded') }}</p>
                  </template>
                </v-text-field>
                <v-text-field readonly
                              hide-details
                              v-if="mapLocationDetailData.lastUpdated"
                              variant="underlined" density="compact">
                  <template v-slot:prepend-inner>
                    <TimeView :time="mapLocationDetailData.lastUpdated" class="singe-line">
                    </TimeView>
                  </template>
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">{{ t('codex.ship.lastUpdated') }}</p>
                  </template>
                </v-text-field>
              </VerticalScrollList>
            </AffixContainerView>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<style scoped lang="less">
.cosmetic-detail {
  .cosmetic-detail-header {
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

    .cosmetic-detail-header-img {
      position: absolute;
      right: 20px;
      bottom: -120px;
      width: 300px;
      min-height: 300px;
    }
  }

  .raw-list {
    list-style-type: none !important;
  }
}
</style>
