<script setup lang="ts">

import Silk from "@/components/Silk.vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n()
</script>

<template>
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
          <v-breadcrumbs-item to="/ranking-designed-items">{{ t('rankingDesignedItems.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('rankingDesignedItems.browse.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>

        <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
          <v-icon icon="mdi-account-heart" size="120"></v-icon>
          <v-icon icon="mdi-assistant" size="120"></v-icon>
          <v-icon icon="mdi-ship-wheel" size="120"></v-icon>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider></v-divider>
  <v-container>
    <v-row align="center">
      <v-col>

      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="auto">
        <v-btn to="/ranking-designed-items/workshop" class="bg-amber">{{ t('rankingDesignedItems.browse.newRanking') }}</v-btn>
<!--        <v-btn class="ml-2" @click="getBrowseList">-->
<!--          <v-icon icon="mdi-refresh" :class="[browseLoading ? 'spin-icon-load' : '']"></v-icon>-->
<!--        </v-btn>-->
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="less">

</style>
