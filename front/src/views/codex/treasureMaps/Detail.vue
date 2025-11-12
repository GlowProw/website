<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {onMounted, Ref, ref} from "vue";
import {TreasureMap, TreasureMaps} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";
import {useAuthStore} from "~/stores/userAccountStore";
import Time from "@/components/Time.vue";
import TimeView from "@/components/TimeView.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {storage} from "@/assets/sripts/index";
import TreasureMapIconWidget from "@/components/snbWidget/treasureMapIconWidget.vue";
import TreasureMapName from "@/components/snbWidget/treasureMapName.vue";
import ObtainableWidget from "@/components/ObtainableWidget.vue";

const {t} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    authStore = useAuthStore(),
    maps = TreasureMaps

let mapDetailData: Ref<TreasureMap> = ref({})

onMounted(() => {
  const {id} = route.params

  if (id)
    mapDetailData.value = maps[id]

  onCodexHistory()
})

const onCodexHistory = () => {
  const {id} = route.params;

  let name = 'codex.history'

  const d = storage.session.get(name)

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id]: {
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
              <TreasureMapName :id="mapDetailData.id"></TreasureMapName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ mapDetailData.id || 'none' }}
            </p>

            <div class="mt-5 d-flex ga-2">
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      v-if="mapDetailData.rarity">{{ t(`codex.types.${mapDetailData.type}`) }}
              </v-chip>
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      v-if="mapDetailData.rarity">{{ t(`codex.treasureMap.raritys.${mapDetailData.rarity}`) }}
              </v-chip>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn v-if="authStore.isLogin">
                <LikeWidget targetType="mod"
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
              <v-col>
                <ItemSlotBase size="130px">
                  <TreasureMapIconWidget :id="mapDetailData.id" :isClickOpenDetail="false" :isShowOpenDetail="false"></TreasureMapIconWidget>
                </ItemSlotBase>
              </v-col>
              <v-col cols="12">
                <TreasureMapIconWidget
                    class="w-100"
                    :padding="4"
                    :id="mapDetailData.id"
                    :is-open-detail="false"
                    :is-show-tooltip="false"
                    :is-show-open-detail="false"
                    :isClickOpenDetail="false"
                    :isShowOpenDetail="false"></TreasureMapIconWidget>
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
            </v-row>

            <template v-if="mapDetailData.id">
              <v-divider>评论</v-divider>
              <CommentWidget :id="mapDetailData.id" type="treasureMap" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget :data="mapDetailData"></BySeasonWidget>

            <ObtainableWidget :data="mapDetailData" byType="treasureMap"></ObtainableWidget>

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
