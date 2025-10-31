<script setup lang="ts">
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Sidebar from "@/views/displayCabinet/Sidebar.vue";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {computed, onMounted} from "vue";
import {useRoute} from "vue-router";
import Silk from "@/components/Silk.vue";

const {t} = useI18n(),
    {mobile} = useDisplay(),
    route = useRoute()

let isDetailPage = computed(() => [
  'ShipDetail',
  'ItemDetail',
  'CosmeticDetail',
  'UltimateDetail',
  'ModDetail',
  'MaterialDetail',
  'TreasureMapDetail'
].includes(route.name))
</script>

<template>
  <v-app id="display-cabinet" class="">
    <Header></Header>
    <v-main class="">
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
            <v-container class="pa-2 mt-4 position-relative">
              <v-breadcrumbs>
                <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
                <v-breadcrumbs-divider></v-breadcrumbs-divider>
                <v-breadcrumbs-item>
                  <b class="text-amber">{{ t('displayCabinet.title') }}</b>
                </v-breadcrumbs-item>
              </v-breadcrumbs>

              <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
                <v-icon icon="mdi-book-open-blank-variant-outline" size="120"></v-icon>
              </div>
            </v-container>
          </template>
        </v-card>
        <v-divider></v-divider>
      </template>

      <v-container class="py-0" :class="{'ma-0': isDetailPage}" :style="isDetailPage ? 'max-width:100% !important': ''" :min-width="mobile ? '100%' : ''">
        <v-row>
          <v-col cols="12" order-sm="1" order-lg="1" lg="2" v-if="!isDetailPage">
            <Sidebar></Sidebar>
          </v-col>
          <v-col cols="12" order-sm="2" order-lg="2" :lg="isDetailPage ? 12 : 10">
            <router-view></router-view>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <Footer></Footer>
  </v-app>
</template>

<style scoped lang="less">

</style>
