<script setup lang="ts">

import {useI18n} from "vue-i18n";
import {onMounted, Ref, ref, watch} from "vue";
import {Materials, Modification} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";
import {useAuthStore} from "~/stores/userAccountStore";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import BySeasonWidget from "@/components/bySeasonWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import MaterialDescription from "@/components/snbWidget/materialDescription.vue";
import {rarity} from "@/assets/sripts/index";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import ItemMaterials from "@/components/snbWidget/itemMaterials.vue";

const {t} = useI18n(),
    router = useRouter(),
    route = useRoute(),
    authStore = useAuthStore(),
    materials = Materials,
    rarityColorConfig = rarity.color

let materialDetailData: Ref<Modification> = ref({})

watch(() => route, (value) => {
  if (value) {
    const {id} = route.params
    materialDetailData.value = materials[id]
  }
}, {deep: true})

onMounted(() => {
  const {id} = route.params

  if (id)
    materialDetailData.value = materials[id]
})
</script>

<template>
  <v-breadcrumbs>
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet/materials">{{ t('displayCabinet.materials.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.material.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <div class="cosmetic-detail">
    <div class="cosmetic-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col cols="8">
            <h1 class="text-amber text-h2 singe-line">
              <MaterialName :id="materialDetailData.id" :isRarity="false"></MaterialName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ materialDetailData.id || 'none' }}
            </p>

            <div class="mt-5 d-flex ga-2">
              <v-chip class="badge-flavor text-center tag-badge text-black" v-if="materialDetailData.effectType">
                {{ materialDetailData.effectType }}
              </v-chip>
              <v-chip class="badge-flavor text-center tag-badge text-black" v-if="materialDetailData.damageType">
                {{ materialDetailData.damageType }}
              </v-chip>
              <v-chip class="badge-flavor text-center tag-badge text-black" v-if="materialDetailData.category">
                {{ t(`displayCabinet.type.${materialDetailData.category}`) }}
              </v-chip>
              <v-chip class="badge-flavor text-center tag-badge text-black"
                      v-if="materialDetailData.rarity">
                <v-badge dot inline :color="rarityColorConfig[materialDetailData.rarity]" class="mr-1"></v-badge>
                {{ t(`displayCabinet.rarity.${materialDetailData.rarity}`) }}
              </v-chip>
            </div>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <div class="d-flex ga-2">
              <v-btn v-if="authStore.isLogin">
                <LikeWidget targetType="material"
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
                  <MaterialIconWidget
                      size="110"
                      :id="materialDetailData.id" :isClickOpenDetail="false" :isShowOpenDetail="false"></MaterialIconWidget>
                </ItemSlotBase>
              </div>
              <v-col>
                <MaterialDescription :id="materialDetailData.id"></MaterialDescription>
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
              <v-col cols="12">
                <ItemMaterials :data="materialDetailData">
                  <v-divider>{{ t('displayCabinet.item.materialsTitle') }}</v-divider>
                </ItemMaterials>
              </v-col>
            </v-row>

            <template v-if="materialDetailData.id">
              <v-divider>评论</v-divider>
              <CommentWidget :id="materialDetailData.id" type="material" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <BySeasonWidget
                :data="materialDetailData.firstAppearingSeason"></BySeasonWidget>
            <template v-if="materialDetailData.faction">
              <v-text-field
                  :value="t(`snb.factions.${materialDetailData.faction.id}.name`)"
                  readonly
                  hide-details
                  variant="underlined" density="compact">
                <template v-slot:prepend-inner>
                  <ItemSlotBase size="25px" class="d-flex justify-center align-center mb-2" :padding="0">
                    <FactionIconWidget :name="materialDetailData.faction.id"
                                       size="25px"></FactionIconWidget>
                  </ItemSlotBase>
                </template>
                <template v-slot:append-inner>
                  <p class="text-no-wrap">{{ t('displayCabinet.item.faction') }}</p>
                </template>
              </v-text-field>
            </template>
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
