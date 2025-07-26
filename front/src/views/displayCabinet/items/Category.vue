<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import {Items} from "../../../../../../glow-prow-data/src/entity/Items.ts";
import {computed, onMounted, ref} from "vue";
import ItemSlotBase from "../../../components/snbWidget/ItemSlotBase.vue";
import EmptyView from "../../../components/EmptyView.vue";
import ItemIconWidget from "../../../components/snbWidget/itemIconWidget.vue";

const items: Items = Items,
    {t} = useI18n(),
    route = useRoute()

let itemsData: any = ref([]),
    itemsFilter = ref({
      keyValue: '',
      inputWidgetKeyValue: '',
      page: 1,
      limit: 50
    });

onMounted(() => {
  itemsData.value = items;
})

/**
 * 处理数据
 */
const onProcessedData = computed(() => {
  let originalData = Object.values(itemsData.value),
      resultData = []

  resultData = originalData
      .filter(i => i.type == route.params.name)

  console.log(resultData)
  return resultData;
});

</script>

<template>
  <v-breadcrumbs class="pt-5">
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
    <h1 class="mb-5">分类: {{ t(`displayCabinet.type.${route.params.name}`) || route.params.name }}</h1>

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
