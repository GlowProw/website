<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {computed, onMounted, Ref, ref, watch} from "vue";
import {TreasureMap, TreasureMaps} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";
import {useAuthStore} from "~/stores/userAccountStore";
import {rarity, storage} from "@/assets/sripts/index";

import Time from "@/components/Time.vue";
import TimeView from "@/components/TimeView.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import TreasureMapName from "@/components/snbWidget/treasureMapName.vue";
import ByObtainableWidget from "@/components/ByObtainableWidget.vue";
import ImageMagnifyingGlass from "@/components/ImageMagnifyingGlass.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";
import TreasureMapSameArea from "@/components/snbWidget/treasureMapSameArea.vue";
import ItemContentWidget from "@/components/snbWidget/itemContentWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import {useHead} from "@unhead/vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ShareWidget from "@/components/ShareWidget.vue";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

const {t, tm, te, messages} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    i18nReadName = useI18nReadName(),
    authStore = useAuthStore(),
    cdnStore = useCDNAssetsServiceStore(),
    maps = TreasureMaps,

    // meta
    head: Ref<any> = ref({
      title: t(route.meta.title as string),
      titleTemplate: `%s | ${t('name')}`,
      meta: [
        {name: 'description', content: ''},
        {name: 'keywords', content: t(route.meta.keywords as string)},
        {property: 'og:type', content: 'website'},
        {property: 'og:title', content: `%s | ${t('name')}`},
        {property: 'og:description', content: ''},
        {property: 'og:site_name', content: t('name')},
      ]
    })

let mapDetailData: Ref<any> = ref({}),
    rarityColorConfig = rarity.color,
    isTreasureMapDescription = computed(() => te(`snb.treasureMaps.${mapDetailData.value.id}.description`)),
    isTreasureMapTypeDescription = computed(() => te(`codex.treasureMap.descriptions.${mapDetailData.value.category}`))

useHead(head)

watch(() => route.params, (value) => {
  if (value)
    getData()
})


onMounted(() => {
  const {id} = route.params;

  getData()

  const headData = i18nReadName.treasureMap(id as string),
      headName = headData.name(mapDetailData.value.category),
      headDescription = headData.description()

  head.value.titleTemplate = `${headName} - ${head.value.titleTemplate}`

  const imageUrl = cdnStore.currentService.url({
    id: id as string,
    category: 'treasureMaps'
  }, 'glow-prow');

  head.value.meta = [
    {name: 'description', content: headDescription},
    {
      name: 'keywords', content: t(route.meta.keywords as string, {
        keywords: Object.keys(messages.value).map(lang => {
          return headData.keysName.map((key: any) => i18nReadName.getValue(messages.value[lang], key)).filter((i: any) => i != null)
        }).concat([id as string]) + `,${t('home.meta.keywords')}`
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
  ]

  onCodexHistory()
})

const getData = () => {
  const {id} = route.params

  if (id)
    mapDetailData.value = maps[id as string]
}

const onCodexHistory = () => {
  const {id} = route.params;

  let name = 'codex.history'

  const d = storage.session.get(name)

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id as string]: {
      id,
      category: 'treasureMap',
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
      <v-breadcrumbs-item to="/codex/treasureMaps">{{ t('codex.treasureMaps.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('codex.treasureMap.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <div class="cosmetic-detail">
    <div class="cosmetic-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col cols="8">
            <h1 class="text-amber text-h2 singe-line">
              <TreasureMapName :data="mapDetailData"></TreasureMapName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ mapDetailData.id || 'none' }}
            </p>

            <div class="mt-5 d-flex ga-2">
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      v-if="mapDetailData.type">{{ t(`codex.types.${mapDetailData.type}`) }}
              </v-chip>
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      v-if="mapDetailData.category">{{ t(`codex.treasureMap.categorys.${mapDetailData.category}`) }}
              </v-chip>
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      v-if="mapDetailData.rarity">{{ t(`codex.raritys.${mapDetailData.rarity}`) }}
              </v-chip>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn v-if="authStore.isLogin">
                <LikeWidget targetType="treasureMap"
                            :isShowCount="true"
                            :targetId="mapDetailData.id">
                  <template v-slot:activate>
                    <v-icon icon="mdi-thumb-up"></v-icon>
                  </template>
                  <template v-slot:unActivate>
                    <v-icon icon="mdi-thumb-up-outline"></v-icon>
                  </template>
                </LikeWidget>
              </v-btn>

              <ShareWidget type="treasureMap" :target-id="mapDetailData.id" />
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
              <v-col cols="auto">
                <ItemSlotBase size="130px">
                  <TreasureMapIconWidget :id="mapDetailData.id" :isOpenDetail="false" :isShowOpenDetail="false"></TreasureMapIconWidget>
                </ItemSlotBase>
              </v-col>
              <v-col>
                <template v-if="isTreasureMapDescription">
                  <p>{{ t(`snb.treasureMaps.${mapDetailData.id}.description`) }}</p>
                </template>
                <template v-if="isTreasureMapTypeDescription">
                  <p class="mt-3">{{ t(`codex.treasureMap.descriptions.${mapDetailData.category}`) }}</p>
                </template>
              </v-col>
              <v-col cols="12">
                <ImageMagnifyingGlass
                    :scale="1.3"
                    position="top-right">
                  <TreasureMapIconWidget
                      class="w-100"
                      :padding="4"
                      :id="mapDetailData.id"
                      :is-show-tooltip="false"
                      :is-open-detail="false"
                      :is-show-open-detail="false"></TreasureMapIconWidget>
                </ImageMagnifyingGlass>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row class="mb-5">
              <v-col cols="12" sm="12" lg="6" xl="6">
                <template v-if="route.query.debug">
                  {{ mapDetailData }}
                </template>
                <template v-if="mapDetailData.id">
                  <v-text-field :value="mapDetailData.id" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
              <v-col cols="12">
                <v-divider>{{ t('codex.treasureMap.treasureMapSameArea') }}</v-divider>
                <TreasureMapSameArea :data="mapDetailData"></TreasureMapSameArea>
              </v-col>
            </v-row>

            <template v-if="mapDetailData.id">
              <v-divider>{{ t('comment.title') }}</v-divider>
              <CommentWidget :id="mapDetailData.id" type="treasureMap" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget :data="mapDetailData"></BySeasonWidget>

            <ByObtainableWidget :data="mapDetailData" byType="treasureMap">
              {{ t('codex.item.obtainable') }}
            </ByObtainableWidget>

            <template v-if="mapDetailData.rarity">
              <v-text-field readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:prepend>
                  <v-badge dot inline :color="rarityColorConfig[mapDetailData.rarity]" class="ma-1 pt-0"></v-badge>
                </template>
                <template v-slot:prepend-inner>
                  <ItemNameRarity :id="mapDetailData.id">
                    <router-link :to="`/codex/item/rarity/${mapDetailData.rarity}`" class="text-no-wrap">
                      {{ t(`codex.raritys.${mapDetailData.rarity}`) || 'none' }}
                    </router-link>
                  </ItemNameRarity>
                </template>
                <template v-slot:append-inner>
                  <p class="text-no-wrap">{{ t('codex.item.rarity') }}</p>
                </template>
              </v-text-field>
            </template>

            <v-row no-gutters align="center" class="mt-2">
              <v-col cols="auto">
                <v-icon icon="mdi-calendar-range" class="mr-3"></v-icon>
              </v-col>
              <v-col>
                <TimeView class="mt-1" :time="mapDetailData.dateAdded">
                  <Time :time="mapDetailData.dateAdded"/>
                </TimeView>
              </v-col>
              <v-col cols="auto">
                <p class="text-no-wrap">{{ t('codex.item.dateAdded') }}</p>
              </v-col>
            </v-row>

            <v-row no-gutters align="center" class="mt-2">
              <v-col cols="auto">
                <v-icon icon="mdi-calendar-range" class="mr-3"></v-icon>
              </v-col>
              <v-col>
                <TimeView class="mt-1" :time="mapDetailData.lastUpdated">
                  <Time :time="mapDetailData.lastUpdated"/>
                </TimeView>
              </v-col>
              <v-col cols="auto">
                <p class="text-no-wrap">{{ t('codex.item.lastUpdated') }}</p>
              </v-col>
            </v-row>
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
