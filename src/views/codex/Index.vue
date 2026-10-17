<script setup lang="ts">
import Footer from "@/components/Footer.vue";
import Header from "@/components/Header.vue";
import CodexSidebar from "@/views/codex/CodexSidebar.vue";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {computed} from "vue";
import {useRoute} from "vue-router";
import Silk from "@/components/Silk.vue";
import AdsWidget from "@/components/ads/google/index.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const {t} = useI18n(),
    {mobile} = useDisplay(),
    route = useRoute()

let isDetailPage = computed(() => [
  'ShipDetail',
  'ItemDetail',
  'CommoditieDetail',
  'CosmeticDetail',
  'SetDetail',
  'UltimateDetail',
  'ModDetail',
  'MaterialDetail',
  'TreasureMapDetail',
  'MapLocationDetail',
  'NpcDetail',
  'EmpireSkillDetail',
  'MasteryDetail',
  'QuestDetail'
].includes(route.name as string))
</script>

<template>
  <v-app id="codex">
    <Header></Header>
    <v-main>
      <template v-if="!isDetailPage">
        <v-card height="200px">
          <template v-slot:image>
            <Silk
                :speed="3"
                :scale=".7"
                :color="'#1c1c1c'"
                :noise-intensity="0.1"
                :rotation="-.6"
                class="bg-black">
            </Silk>
          </template>
          <template v-slot:default>
            <v-breadcrumbs density="compact" class="ma-0 pa-0">
              <v-container>
                <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
                <v-breadcrumbs-divider></v-breadcrumbs-divider>
                <v-breadcrumbs-item to="/codex">
                  <b class="text-amber">{{ t('codex.title') }}</b>
                </v-breadcrumbs-item>
              </v-container>
            </v-breadcrumbs>
            <v-divider opacity=".01"></v-divider>

            <v-container class="position-relative">
              <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
                <v-icon icon="mdi-book-open-blank-variant-outline" size="120"></v-icon>
              </div>
            </v-container>
          </template>
        </v-card>
        <v-divider opacity=".06"></v-divider>
      </template>

      <v-container class="pa-0" :class="{'ma-0': isDetailPage}" :style="isDetailPage ? 'max-width:100% !important': ''" :min-width="mobile ? '100%' : ''">
        <v-row>
          <v-col cols="12" order-sm="1" order-lg="1" lg="3" class="pa-0" v-if="!isDetailPage">
            <AffixContainerView :offsetTop="55">
              <CodexSidebar></CodexSidebar>
            </AffixContainerView>
          </v-col>
          <v-col cols="12" order-sm="2" order-lg="2" :lg="isDetailPage ? 12 : 9" class="pa-0">
            <AdsWidget id="codex-up" class="pa-0 mx-auto v-container"></AdsWidget>

            <router-view></router-view>

            <AdsWidget id="codex-down" class="pa-0 mx-auto v-container"></AdsWidget>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <Footer></Footer>
  </v-app>
</template>

<style scoped lang="less">

</style>
