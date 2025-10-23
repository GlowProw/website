<script setup lang="ts">

import {useI18n} from "vue-i18n";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {Modifications} from "glow-prow-data";
import ModName from "@/components/snbWidget/modName.vue";

const {t} = useI18n(),
    mods = Modifications
</script>

<template>
  <v-breadcrumbs >
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.modifications.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container class="mb-10 pa-10">
    <v-row class="mods-list ga-4">
      <template v-for="(i, index) in mods" :key="index">
        <v-card variant="text" width="99">
          <ItemSlotBase size="99px">
            <ModIconWidget :id="i.id"></ModIconWidget>
          </ItemSlotBase>
          <div class="d-flex justify-center mx-auto mt-1 w-100 singe-line">
            <ModName :id="i.id" :grade="i.grade" class="text-center"></ModName>
          </div>
        </v-card>
      </template>
    </v-row>
  </v-container>
</template>

<style scoped lang="less">
.mods-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(99px, 1fr));
}
</style>
