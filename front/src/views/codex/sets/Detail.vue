<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref, type Ref, watch} from "vue";

import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";

import {useI18nUtils} from "@/assets/sripts/i18n_util";
import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue"
import {rarity, storage} from "@/assets/sripts";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {useAuthStore} from "~/stores/userAccountStore";
import {useHead} from "@unhead/vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import ObtainableWidget from "@/components/ObtainableWidget.vue";
import WorldEventWidget from "@/components/WorldEventWidget.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";
import {Sets} from "glow-prow-data";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";
import SetIconWidget from "@/components/snbWidget/setIconWidget.vue";
import SetAvailableWidget from "@/components/snbWidget/setAvailableWidget.vue";

const
    {t, messages} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    authStore = useAuthStore(),
    {asString, sanitizeString} = useI18nUtils(),
    i18nReadName = useI18nReadName(),

    // 数据
    sets: Sets = Sets

let setDetailData: Ref<Commoditie | null> = ref(null),

    bluePrint = computed(() => {
      let bluePrints = setDetailData.value?.blueprint;

      if (!bluePrints)
        return null;

      if (bluePrints)
        return t(`snb.sets.${bluePrints}`)

      return Object.values(bluePrints[0]).map(i => t(`snb.sets.${i}`))
    }),

    rarityColorConfig = rarity.color,

    // meta
    head = ref({
      title: t(route.meta.title),
      titleTemplate: `%s | ${t('name')}`,
      meta: [
        {name: 'keywords', content: t(route.meta.keywords)},
        {name: 'og:title', content: `%s | ${t('name')}`},
      ]
    })

useHead(head)

watch(() => route.path, (value) => {
  onReady()
})

onMounted(() => {
  onReady()
})

const onReady = () => {
  const {id} = route.params;

  if (!id) {
    router.push('/')
    return;
  }

  if (!sets[id]) {
    setInterval(() => router.push({name: 'NotFound'}), 1000)
    return;
  }

  setDetailData.value = sets[id];

  head.value.titleTemplate = `${i18nReadName.item(id).name()} - ${head.value.titleTemplate}`
  head.value.meta = [
    {
      name: 'keywords', content: t(route.meta.keywords, {
        keywords: Object.keys(messages.value).map(lang => {
          return i18nReadName.item(id).keys.map(key => i18nReadName.getValue(messages.value[lang], key)).filter(i => i != null)
        }).concat([id])
      })
    },
    {name: 'og:title', content: `${t(route.meta.title)} | ${t('name')}`},
  ]

  onCodexHistory();
}

const onCodexHistory = () => {
  const {id} = route.params;

  let name = 'codex.history'

  const d = storage.session.get(name)

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id]: {
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
              <CommoditieName :data="setDetailData"></CommoditieName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ setDetailData.id || 'none' }}
            </p>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn v-if="authStore.isLogin">
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

              <v-btn>{{ t('codex.share.title') }}</v-btn>
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
                <template v-if="route.query.debug">
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
              <v-divider>评论</v-divider>
              <CommentWidget :id="setDetailData.id" type="set" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget :data="setDetailData"></BySeasonWidget>

            <template v-if="bluePrint">
              <p class="text-no-wrap font-weight-bold mb-2 mt-2">{{ t('codex.item.bluePrint') }}</p>
              <v-chip class="d-inline-flex mb-1">
                {{ t(bluePrint) }}
              </v-chip>
            </template>
            <template v-if="setDetailData.worldEvent">
              <WorldEventWidget :data="setDetailData"></WorldEventWidget>
            </template>
            <template v-if="setDetailData.obtainable">
              <ObtainableWidget :data="setDetailData" byType="item"></ObtainableWidget>
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
                      {{ t(`codex.rarity.${setDetailData.rarity}`) || 'none' }}
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
                <TimeView class="mt-1" :time="setDetailData.dateAdded">
                  <Time :time="setDetailData.dateAdded"/>
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
                <TimeView class="mt-1" :time="setDetailData.lastUpdated">
                  <Time :time="setDetailData.lastUpdated"/>
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
