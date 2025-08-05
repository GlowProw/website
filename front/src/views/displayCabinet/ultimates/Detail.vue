<script setup lang="ts">

import {computed, onMounted, type Ref, ref, type UnwrapRef} from "vue";
import {useI18n} from "vue-i18n";
import {Materials, Ultimates} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {storage} from "@/assets/sripts";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import {Ultimate} from "glow-prow-data/src/entity/Ultimates";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {useAuthStore} from "~/stores";

const ultimateImages = import.meta.glob('@glow-prow-assets/ships/*.*', {eager: true});

const
    {t} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    authStore = useAuthStore(),

    // 船只数据
    ultimatesData = Ultimates,
    materials: Materials = Materials,
    // 后期处理所需物品 对应计算 原材料
    shipRawMaterials: Ref<UnwrapRef<any[]>, UnwrapRef<any[]> | any[]> = ref([])

let
    ultimateDetailPageData: Ref<{ id: string, img: string, loading: boolean }> = ref({
      id: 'dhow',
      img: '',
      loading: false
    }),
    ultimateDetailData: Ref<Ultimate> = ref(ultimatesData['hunter'] as Ultimate),
    isShowShipRawList = ref(false),

    // 蓝图
    bluePrint = computed(() => ultimateDetailData.value.blueprint ? t(`snb.locations.${ultimateDetailData.value?.blueprint}`) : null);

onMounted(() => {
  const {id} = route.params;

  if (!id) {
    router.push('/')
    return;
  }

  ultimateDetailPageData.value.loading = true;

  const imageKey = `/node_modules/glow-prow-assets/ultimates/${id}.webp`;

  ultimateDetailData.value = ultimatesData[id];
  ultimateDetailPageData.value.id = id as string;

  if (ultimateImages[imageKey]) {
    ultimateDetailPageData.value.img = ultimateImages[imageKey].default;
  } else {
    ultimateDetailPageData.value.img = "";
  }

  onUltimateHistory()

  ultimateDetailPageData.value.loading = false;
})

const onUltimateHistory = () => {
  const {id} = route.params;

  let name = 'displayCabinet.history'

  const d = storage.session.get(name)

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id]: {
      id,
      type: 'ultimate',
      time: new Date().getTime()
    }
  })
}
</script>

<template>
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet/ultimates">{{ t('displayCabinet.ultimates.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.ultimate.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>

  <div class="ultimates-detail" v-if="ultimateDetailPageData.id && !ultimateDetailPageData.loading">
    <div class="ultimates-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col>
            <h1 class="text-amber text-h2">{{ t(`snb.ultimates.${ultimateDetailPageData.id}.name`) }}</h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ ultimateDetailPageData.id || 'none' }}
            </p>

            <v-chip class="badge-flavor text-center tag-badge text-black" v-if="ultimateDetailData.rarity">{{ t(`displayCabinet.rarity.${ultimateDetailData.rarity}`) }}</v-chip>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-btn>
              <LikeWidget v-if="authStore.isLogin"
                          targetType="ultimate"
                          :isShowCount="true"
                          :targetId="ultimateDetailPageData.id">
                <template v-slot:activate>
                  <v-icon icon="mdi-thumb-up"></v-icon>
                </template>
                <template v-slot:unActivate>
                  <v-icon icon="mdi-thumb-up-outline"></v-icon>
                </template>
              </LikeWidget>
            </v-btn>
          </v-col>
        </v-row>

        <!--        <v-img :src="ultimateDetailPageData.img"-->
        <!--               inline-->
        <!--               class="ultimates-detail-header-img pointer-events-none"></v-img>-->
      </v-container>
    </div>
    <div class="background-flavor">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="8" lg="8" order="2" order-sm="1">

            <v-row>
              <ItemSlotBase size="150px" class="mr-3">
                <UltimateIconWidget :id="ultimateDetailPageData.id" class="pa-2"
                                    :is-click-open-detail="false"
                                    :isShowOpenDetail="false"
                                    :isShowDescription="false"></UltimateIconWidget>
              </ItemSlotBase>
              <v-col>
                <p class="text-pre-wrap mb-4">
                  {{ t(`snb.ultimates.${ultimateDetailPageData.id}.description`) }}
                </p>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row>
              <v-col cols="12" sm="12" lg="6" xl="6">
                <template v-if="ultimateDetailData.id">
                  <v-text-field :value="ultimateDetailData.id" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
            </v-row>

            <template v-if="ultimateDetailData.id">
              <v-divider>评论</v-divider>
              <CommentWidget :id="ultimateDetailData.id" type="ultimate" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <v-card class="mb-4 pl-3" v-if="ultimateDetailData.bySeason">
              <v-text-field :value="t(`snb.seasons.${ultimateDetailData.bySeason.id}`) || 'none'" readonly
                            hide-details
                            tile
                            variant="solo-filled">
                <template v-slot:prepend>
                  <p class="text-no-wrap">出自</p>
                </template>
                <template v-slot:append-inner>
                  <p class="text-no-wrap">赛季</p>
                </template>
              </v-text-field>
            </v-card>

            <v-text-field :value="ultimateDetailData.chargeRequired" readonly
                          hide-details
                          variant="underlined" density="compact">
              <template v-slot:append-inner>
                <p class="text-no-wrap">获取所需积分</p>
              </template>
            </v-text-field>

            <v-text-field :value="ultimateDetailData.dateAdded" readonly
                          hide-details
                          variant="underlined" density="compact">
              <template v-slot:append-inner>
                <p class="text-no-wrap">添加日期</p>
              </template>
            </v-text-field>
            <v-text-field :value="ultimateDetailData.lastUpdated" readonly
                          hide-details
                          variant="underlined" density="compact">
              <template v-slot:append-inner>
                <p class="text-no-wrap">更新日期</p>
              </template>
            </v-text-field>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>

</template>

<style scoped lang="less">
.ultimates-detail {
  .ultimates-detail-header {
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

    .ultimates-detail-header-img {
      position: absolute;
      z-index: -1;
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
