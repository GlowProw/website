<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {onMounted, Ref, ref, watch} from "vue";
import {Cosmetics, Modification} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";
import {useAuthStore} from "~/stores/userAccountStore";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import BySeasonWidget from "@/components/bySeasonWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {rarity} from "@/assets/sripts/index";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import CosmeticDescription from "@/components/snbWidget/cosmeticDescription.vue";
import Time from "@/components/Time.vue";
import TimeView from "@/components/TimeView.vue";
import ObtainableWidget from "@/components/ObtainableWidget.vue";

const {t} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    authStore = useAuthStore(),
    cosmetics = Cosmetics,
    rarityColorConfig = rarity.color

let materialDetailData: Ref<Modification> = ref({})

watch(() => route, (value) => {
  if (value) {
    const {id} = route.params
    materialDetailData.value = cosmetics[id]
  }
}, {deep: true})

onMounted(() => {
  const {id} = route.params

  if (id)
    materialDetailData.value = cosmetics[id]
})
</script>

<template>
  <v-breadcrumbs>
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet/cosmetics">{{ t('displayCabinet.cosmetics.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.cosmetic.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <div class="cosmetic-detail">
    <div class="cosmetic-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col cols="8">
            <h1 class="text-amber text-h2 singe-line">
              <CosmeticName :id="materialDetailData.id" :isRarity="false"></CosmeticName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ materialDetailData.id || 'none' }}
            </p>

            <div class="mt-5 d-flex ga-2">
              <v-chip class="badge-flavor text-center tag-badge text-black" v-if="materialDetailData.type">
                {{ t(`displayCabinet.type.${materialDetailData.type}`) }}
              </v-chip>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn v-if="authStore.isLogin">
                <LikeWidget targetType="cosmetic"
                            :isShowCount="true"
                            :targetId="materialDetailData.id">
                  <template v-slot:activate>
                    <v-icon icon="mdi-thumb-up"></v-icon>
                  </template>
                  <template v-slot:unActivate>
                    <v-icon icon="mdi-thumb-up-outline"></v-icon>
                  </template>
                </LikeWidget>
              </v-btn>

              <v-btn>{{ t('displayCabinet.share.title') }}</v-btn>
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
                <ItemSlotBase size="130px" class="d-flex justify-center align-center">
                  <CosmeticIconWidget
                      size="110"
                      :id="materialDetailData.id" :isClickOpenDetail="false" :isShowOpenDetail="false"></CosmeticIconWidget>
                </ItemSlotBase>
              </div>
              <v-col>
                <CosmeticDescription :id="materialDetailData.id"></CosmeticDescription>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row class="mb-5">
              <v-col cols="12" sm="12" lg="6" xl="6">
                <template v-if="route.query.debug">
                  {{ materialDetailData }}
                </template>
                <template v-if="materialDetailData.id">
                  <v-text-field :value="materialDetailData.id" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
            </v-row>

            <template v-if="materialDetailData.id">
              <v-divider>评论</v-divider>
              <CommentWidget :id="materialDetailData.id" type="cosmetic" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget
                :data="materialDetailData.firstAppearingSeason"></BySeasonWidget>

            <template v-if="materialDetailData.obtainable">
              <ObtainableWidget :data="materialDetailData" byType="cosmetic"></ObtainableWidget>
            </template>

            <v-row no-gutters align="center" class="mt-2">
              <v-col cols="auto">
                <v-icon icon="mdi-calendar-range" class="mr-3"></v-icon>
              </v-col>
              <v-col>
                <TimeView class="mt-1" :time="materialDetailData.dateAdded">
                  <Time :time="materialDetailData.dateAdded"/>
                </TimeView>
              </v-col>
              <v-col cols="auto">
                <p class="text-no-wrap">{{ t('displayCabinet.item.dateAdded') }}</p>
              </v-col>
            </v-row>

            <v-row no-gutters align="center" class="mt-2">
              <v-col cols="auto">
                <v-icon icon="mdi-calendar-range" class="mr-3"></v-icon>
              </v-col>
              <v-col>
                <TimeView class="mt-1" :time="materialDetailData.lastUpdated">
                  <Time :time="materialDetailData.lastUpdated"/>
                </TimeView>
              </v-col>
              <v-col cols="auto">
                <p class="text-no-wrap">{{ t('displayCabinet.item.lastUpdated') }}</p>
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
}
</style>
