<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import {Items} from "glow-prow-data/src/entity/Items.ts";
import {computed, onMounted, ref} from "vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import EmptyView from "@/components/EmptyView.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {number} from "@/assets/sripts/index";

const items: Items = Items,
    {t} = useI18n(),
    {asString} = useI18nUtils(),
    route = useRoute()

let itemsData: any = ref([])

onMounted(() => {
  itemsData.value = items;
})

/**
 * 处理数据
 */
const onProcessedData = computed(() => {
  let originalData = Object.values(itemsData.value),
      resultData = []

  switch (route.params.fun) {
    case 'category':
      resultData = originalData
          .filter(i => i.type == route.params.key)
      break;
    case 'season':
      resultData = originalData
          .filter(i => i.bySeason.id == route.params.key)
      break;
    case 'rarity':
      resultData = originalData
          .filter(i => i.rarity == route.params.key)
      break;
    case 'tier':
      resultData = originalData
          .filter(i => i.tier == route.params.key)
      break;
  }

  return resultData;
});

</script>

<template>
  <v-breadcrumbs >
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet">{{ t('displayCabinet.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/display-cabinet/items">{{ t('displayCabinet.items.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('displayCabinet.category.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>
  <v-container class="mt-10 mb-10">
    <h1 class="mb-5 text-amber">
      {{
        asString([
          `displayCabinet.type.${route.params.key}`,
          `snb.seasons.${route.params.key}`,
          `displayCabinet.rarity.${route.params.key}`,
          `displayCabinet.tier`,
        ], {
          variable: {
              num: number.intToRoman(route.params.key),
          }
        }) || route.params.key
      }}
    </h1>

    <v-row class="category-list">
      <div v-for="(i,index) in onProcessedData" :key="index">
        <template v-if="route.query.debug">
          {{ i.id }}
        </template>

        <ItemSlotBase size="99px">
          <ItemIconWidget :id="i.id"></ItemIconWidget>
        </ItemSlotBase>
      </div>

      <v-card border class="w-100" v-if="onProcessedData.length <= 0">
        <EmptyView></EmptyView>
      </v-card>
    </v-row>
  </v-container>
</template>

<style scoped lang="less">

</style>
