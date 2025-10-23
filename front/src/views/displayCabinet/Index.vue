<script setup lang="ts">
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Sidebar from "@/views/displayCabinet/Sidebar.vue";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import {computed} from "vue";
import {useRoute} from "vue-router";

const {t} = useI18n(),
    {mobile} = useDisplay(),
    route = useRoute()

let isDetailPage = computed(() => [
  'ShipDetail',
  'ItemDetail',
  'cosmeticDetail',
  'UltimateDetail',
  'ModDetail',
  'MaterialDetail'
].includes(route.name))
</script>

<template>
  <v-app id="display-cabinet" class="background-flavor">
    <Header></Header>
    <v-main class="background-img-flavor">
      <v-container class="py-0" :class="{'ma-0': isDetailPage}" :style="isDetailPage ? 'max-width:100% !important': ''" :min-width="mobile ? '100%' : ''">
        <v-row no-gutters>
          <v-col cols="12" order-sm="1" order-lg="1" lg="2" v-if="!isDetailPage">
            <v-breadcrumbs>
              <v-container class="pa-0">
                <v-breadcrumbs-item>
                  <v-img src="@/assets/images/display-cabinet-icon.bmp" width="26" height="26" class="mr-2" style="border-radius: 50%"></v-img>
                  {{ t('displayCabinet.sidebar') }}
                </v-breadcrumbs-item>
              </v-container>
            </v-breadcrumbs>
            <v-divider class="mb-3"></v-divider>

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
