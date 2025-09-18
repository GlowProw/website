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
      <v-breadcrumbs-item>{{ t('displayCabinet.mobs.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container class="mb-10">
    <v-row>
      <div v-for="(i, index) in mods" :key="index" class="mx-2 py-2">
        <v-card variant="text" width="80">
          <ItemSlotBase size="80px">
            <ModIconWidget :id="i.id"></ModIconWidget>
          </ItemSlotBase>
          <div class="d-flex justify-center mx-auto mt-1 w-100 singe-line">
            <ModName :id="i.id" :grade="i.grade" class="text-center"></ModName>
          </div>
        </v-card>
      </div>
    </v-row>
  </v-container>
</template>

<style scoped lang="less">

</style>
