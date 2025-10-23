<script lang="ts" setup>

import {useI18n} from "vue-i18n";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {Materials} from "glow-prow-data";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";

const {t} = useI18n(),
    materials = Materials
</script>

<template>
  <v-breadcrumbs>
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.materials.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container class="mb-10 pa-10">
    <v-row class="material-list ga-4">
      <template v-for="(i, index) in materials" :key="index">
        <v-card variant="text" width="99" class="bg-transparent">
          <ItemSlotBase size="99px" class="d-flex justify-center align-center">
            <MaterialIconWidget :id="i.id" size="60"></MaterialIconWidget>
          </ItemSlotBase>
          <div class="d-flex justify-center mx-auto mt-1 w-100 singe-line">
            <MaterialName :id="i.id" class="text-center"></MaterialName>
          </div>
        </v-card>
      </template>
    </v-row>
  </v-container>
</template>

<style lang="less" scoped>
.material-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(99px, 1fr));
}
</style>
