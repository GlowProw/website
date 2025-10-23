<script setup lang="ts">
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {useI18n} from "vue-i18n";
import {Ultimates} from "glow-prow-data/src/entity/Ultimates";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";

const ultimatesData = Ultimates,
    {t} = useI18n()
</script>

<template>
  <v-breadcrumbs >
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.ultimates.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container class="mb-10 pa-10">
    <v-row>
      <v-col cols="12" lg="12" xl="12">
        <v-row class="ultimates-list ga-4">
          <ItemSlotBase size="99px" v-for="(i,index) in ultimatesData" :key="index">
            <UltimateIconWidget :id="i.id" class="pa-2"></UltimateIconWidget>
          </ItemSlotBase>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.ultimates-title {
  padding: 25px 40px;
  margin-bottom: 20px;
  font-size: 3rem;
}

.ultimates-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(99px, 1fr));
}

</style>
