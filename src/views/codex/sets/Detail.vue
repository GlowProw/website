<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref, type Ref, watch} from "vue";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

import {useI18nUtils} from "@/assets/sripts/i18n_util";
import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue"
import {rarity, storage, getAppUrl} from "@/assets/sripts";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {useAuthStore} from "~/stores/userAccountStore";
import {useHead} from "@unhead/vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ShareWidget from "@/components/ShareWidget.vue";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import ByObtainableWidget from "@/components/ByObtainableWidget.vue";
import ByWorldEventWidget from "@/components/ByWorldEventWidget.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";
import {Sets} from "glow-prow-data";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";
import SetIconWidget from "@/components/snbWidget/setIconWidget.vue";
import SetAvailableWidget from "@/components/snbWidget/setAvailableWidget.vue";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";
import VerticalScrollList from "@/components/VerticalScrollList.vue";
import {useAppStore} from "~/stores/appStore";
import SetName from "@/components/snbWidget/setName.vue";

const
    {t, messages} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    appStore = useAppStore(),
    authStore = useAuthStore(),
    {asString, sanitizeString} = useI18nUtils(),
    i18nReadName = useI18nReadName(),
    cdnStore = useCDNAssetsServiceStore(),

    // 数据
    sets: any = Sets

const
    id = computed(() => (route.params.id as string) || ''),
    setDetailData = computed(() => (id.value ? sets[id.value] : null)),

    bluePrint = computed(() => {
      let bluePrints = setDetailData.value?.blueprint;

      if (!bluePrints)
        return null;

      if (bluePrints)
        return t(`snb.sets.${bluePrints}`)

      return Object.values(bluePrints[0]).map(i => t(`snb.sets.${i}`))
    }),

    rarityColorConfig = rarity.color,

    headTitle = computed(() => {
      if (!id.value || !sets[id.value]) return t(route.meta?.title as string || 'codex.set.title');
      const headData = i18nReadName.set(id.value);
      const headName = headData.name();
      return headName ? `${headName} - ${t(route.meta?.title as string || 'codex.set.title')}` : t(route.meta?.title as string || 'codex.set.title');
    }),

    headDescription = computed(() => {
      if (!id.value || !sets[id.value]) return '';
      const headData = i18nReadName.set(id.value);
      return (headData.description() as string) || '';
    });

useHead({
  title: headTitle,
  titleTemplate: `%s | ${t('name')}`,
  meta: computed(() => {
    if (!id.value || !sets[id.value]) return [];
    const headData = i18nReadName.set(id.value);
    const headName = headData.name();
    const desc = headData.description() || '';
    const imageUrl = cdnStore.currentService.image.url({
      id: id.value,
      category: 'sets'
    });

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
      {property: 'og:image', content: imageUrl},
      {property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : getAppUrl(route.fullPath || route.path)},
      {property: 'og:site_name', content: t('name')},
      {name: 'twitter:card', content: 'summary_large_image'},
      {name: 'twitter:title', content: `${headName} | ${t('name')}`},
      {name: 'twitter:description', content: desc},
      {name: 'twitter:image', content: imageUrl}
    ];
  })
})

onMounted(() => {
  if (typeof window !== 'undefined' && id.value) {
    if (!sets[id.value]) {
      router.push({name: 'NotFound'});
      return;
    }
    onCodexHistory();
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
      category: 'set',
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
      <v-breadcrumbs-item to="/codex/sets">{{ t('codex.sets.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('codex.set.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <div class="set-detail" v-if="setDetailData && setDetailData.id">
    <div class="set-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col cols="8">
            <h1 class="text-amber text-h2 singe-line">
              <SetName :id="setDetailData.id"></SetName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ setDetailData.id || 'none' }}
            </p>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn v-if="authStore.isLogin" border>
                <LikeWidget targetType="set"
                            :isShowCount="true"
                            :targetId="setDetailData.id">
                  <template v-slot:activate>
                    <v-icon icon="mdi-thumb-up"></v-icon>
                  </template>
                  <template v-slot:unActivate>
                    <v-icon icon="mdi-thumb-up-outline"></v-icon>
                  </template>
                </LikeWidget>
              </v-btn>

              <ShareWidget type="set" :target-id="setDetailData.id" />
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
                  <SetIconWidget :id="setDetailData.id" :isOpenDetail="false" :isShowOpenDetail="false"></SetIconWidget>
                </ItemSlotBase>
              </div>
              <v-col cols="12">
                <SetAvailableWidget :id="setDetailData.id">
                  <v-divider>{{ t('codex.set.setAvailableTitle') }}</v-divider>
                </SetAvailableWidget>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row>
              <v-col cols="12" sm="12" lg="6" xl="6">
                <template v-if="appStore.isDebug">
                  {{ setDetailData }}
                </template>
                <template v-if="setDetailData.id">
                  <v-text-field :value="setDetailData.id" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="setDetailData.tier">
                  <v-text-field :value="setDetailData.tier" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('codex.item.tier') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="setDetailData.weight">
                  <v-text-field :value="setDetailData.weight" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('codex.item.weight') }}</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
            </v-row>

            <template v-if="setDetailData.id">
              <v-divider>{{ t('comment.title') }}</v-divider>
              <CommentWidget :id="setDetailData.id" type="set" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget :data="setDetailData"></BySeasonWidget>

            <AffixContainerView :offsetTop="80">
              <VerticalScrollList :force-draggable="false" :is-indicator="false" height="calc(100vh - 120px)">

                <div class="mt-5 d-flex ga-2" v-if="bluePrint">
                  <v-chip class="badge-flavor text-center tag-badge text-black" v-if="typeof bluePrint == 'string'">
                    {{ t(bluePrint) }}
                  </v-chip>
                  <template v-else>
                    <v-chip class="badge-flavor text-center tag-badge text-black" v-for="(i, index) in bluePrint" :key="index">
                      {{ i }}
                    </v-chip>
                  </template>
                </div>
                <template v-if="setDetailData.worldEvent">
                  <ByWorldEventWidget :data="setDetailData"></ByWorldEventWidget>
                </template>
                <template v-if="setDetailData.obtainable">
                  <ByObtainableWidget :data="setDetailData" byType="item">
                    {{ t('codex.item.obtainable') }}
                  </ByObtainableWidget>
                </template>
                <template v-if="setDetailData.faction">
                  <v-text-field
                      :value="t(`snb.factions.${setDetailData.faction.id}.name`)"
                      readonly
                      hide-details
                      variant="underlined" density="compact">
                    <template v-slot:prepend-inner>
                      <ItemSlotBase size="25px" class="d-flex justify-center align-center mb-2" :padding="0">
                        <FactionIconWidget :name="setDetailData.faction.id"
                                           size="25px"></FactionIconWidget>
                      </ItemSlotBase>
                    </template>
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('codex.item.faction') }}</p>
                    </template>
                  </v-text-field>
                </template>
                <template v-if="setDetailData.rarity">
                  <v-text-field readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:prepend>
                      <v-badge dot inline :color="rarityColorConfig[setDetailData.rarity]" class="ma-1 pt-0"></v-badge>
                    </template>
                    <template v-slot:prepend-inner>
                      <ItemNameRarity :id="setDetailData.id">
                        <router-link :to="`/codex/item/rarity/${setDetailData.rarity}`" class="text-no-wrap">
                          {{ t(`codex.raritys.${setDetailData.rarity}`) || 'none' }}
                        </router-link>
                      </ItemNameRarity>
                    </template>
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">{{ t('codex.item.rarity') }}</p>
                    </template>
                  </v-text-field>
                </template>

                <v-text-field readonly
                              hide-details
                              v-if="setDetailData.dateAdded"
                              variant="underlined" density="compact">
                  <template v-slot:prepend-inner>
                    <TimeView :time="setDetailData.dateAdded" class="singe-line">
                    </TimeView>
                  </template>
                  <template v-slot:append-inner>
                    <p class="text-no-wrap">{{ t('codex.ship.dateAdded') }}</p>
                  </template>
                </v-text-field>
                <v-text-field readonly
                              hide-details
                              v-if="setDetailData.lastUpdated"
                              variant="underlined" density="compact">
                  <template v-slot:prepend-inner>
                    <TimeView :time="setDetailData.lastUpdated" class="singe-line">
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
.set-detail {
  .set-detail-header {
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
}
</style>
