<script setup lang="ts">
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Ultimates} from "glow-prow-data/src/entity/Ultimates";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";

const ultimatesData = Ultimates,
    {t} = useI18n()

let ultimatesCardData = ref({
      images: {},
      model: {},
      panel: {}
    }),
    ultimatesFilter = ref({
      type: 'index',
      key: ''
    });

onMounted(() => {
  // onReady()
})

const ultimateImages = import.meta.glob('@glow-prow-assets/ultimates/*.*', {eager: true});

// const onReady = async () => {
//   console.log(ultimateImages)
//
//   for (let key in ultimatesData) {
//     const imageKey = `/node_modules/glow-prow-assets/ultimates/${key}.webp`;
//
//     ultimatesCardData.value.panel[key] = 0;
//     ultimatesCardData.value.model[key] = false;
//
//     if (ultimateImages[imageKey]) {
//       ultimatesCardData.value.images[key] = ultimateImages[imageKey].default;
//     } else {
//       ultimatesCardData.value.images[key] = '';
//     }
//   }
//
//   console.log(ultimatesCardData.value.images)
// }
</script>

<template>
  <v-breadcrumbs class="pt-5">
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.ships.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container class="mb-10">
    <v-row>
      <v-col cols="12" lg="5" xl="5">
        <h1 class="btn-flavor ultimates-title">终极技能</h1>
        <div class="w-75">
          <p>"技能。"</p>
        </div>
      </v-col>
      <v-col cols="12" lg="7" xl="7">
        <v-row class="ultimates-list ga-2">
          <ItemSlotBase size="150px" v-for="(i,index) in ultimatesData" :key="index">
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
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

</style>
