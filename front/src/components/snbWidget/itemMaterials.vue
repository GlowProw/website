<script setup lang="ts">

import MaterialName from "@/components/snbWidget/materialName.vue";
import FactionIconWidget from "@/components/snbWidget/factionIconWidget.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import EmptyView from "@/components/EmptyView.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {Item, Materials, Ship} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import {nextTick, onMounted, type Ref, ref, UnwrapRef, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import HtmlLink from "@/components/HtmlLink.vue";
import MaterialNameRarity from "@/components/snbWidget/materialNameRarity.vue";

const props = defineProps<{ data: Item | Ship }>(),
    {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    materials: Materials = Materials

let itemDetailData: Ref<Item | null> = ref(null),
    // 后期处理所需物品 对应计算 原材料
    itemRawMaterials: Ref<UnwrapRef<any[]>, UnwrapRef<any[]> | any[]> = ref([]),
    isShowShipRawList = ref(false)

watch(() => props.data, (value) => {
  if (value)
    itemDetailData.value = value
})

onMounted(() => {
  nextTick(() => {
    if (props.data) {
      itemDetailData.value = props.data;
      onStatisticsRawMaterial();
    }
  })
})

/**
 * 处理计算必要材料对应原材料
 */
const onStatisticsRawMaterial = () => {
  if (itemDetailData.value && itemDetailData.value.required)
    itemRawMaterials.value = Array.from(itemDetailData.value.required).reduce(
        (acc, [material, quantity]) => {
          if (materials[material.id]?.required) {
            Array.from(materials[material.id].required).forEach(([raw, rawQuantity]) => {
              acc[raw.id] = (acc[raw.id] || 0) + (rawQuantity as number) * quantity;
            })
          }
          return acc;
        },
        {} as Record<string, number>
    );
}
</script>

<template>
  <v-row v-if="itemDetailData">
    <v-col cols="12">
      <slot></slot>
    </v-col>

    <!-- 物品建造所需物品 S -->
    <v-col cols="12" sm="12" lg="6" xl="6">
      <p class="mt-4 mb-2"><b>{{ t('codex.item.required') }}</b></p>
      <template v-if="itemDetailData.required && Array.from(itemDetailData.required).length > 0">
        <div v-for="([i, value], rIndex) in itemDetailData.required"
             :key="rIndex">
          <v-text-field
              :value="value"
              readonly
              hide-details
              variant="underlined"
              density="compact">
            <template v-slot:append>
              <div class="text-right">
                <p class="text-no-wrap">
                  <HtmlLink :is-icon="false" :is-iframe-show="false" :href="`/codex/material/${i.id}`" target="_blank">
                    <MaterialNameRarity :id="i.id">
                      <MaterialName :id="i.id"></MaterialName>
                    </MaterialNameRarity>
                    <v-icon size="14">mdi-open-in-new</v-icon>
                  </HtmlLink>
                </p>
                <p class="text-no-wrap mt-n2 opacity-30" v-if="route.query.debug">{{ i.id }}</p>
              </div>
            </template>
            <template v-slot:prepend>
              <div class="d-flex ga-2">
                <ItemSlotBase size="25px" :padding="0">
                  <MaterialIconWidget :id="i.id" item-type="items" :padding="0" :margin="0"></MaterialIconWidget>
                </ItemSlotBase>
                <ItemSlotBase size="25px" :padding="0"
                              v-if="materials[i.id].faction">
                  <FactionIconWidget :name="materials[i.id].faction.id"
                                     size="25px"></FactionIconWidget>
                </ItemSlotBase>
              </div>
            </template>
          </v-text-field>
        </div>
      </template>
      <template v-else>
        <v-card border variant="text">
          <EmptyView></EmptyView>
        </v-card>
      </template>
    </v-col>
    <!-- 物品建造所需物品 E -->


    <!-- 所需物品原材料 S -->
    <v-col cols="12" sm="12" lg="6" xl="6">
      <v-row no-gutters class="mt-4 mb-2">
        <v-col>
          <p><b>{{ t('codex.item.rawMaterials') }}</b></p>
        </v-col>
        <v-spacer></v-spacer>
        <v-btn density="compact" icon @click="isShowShipRawList = !isShowShipRawList" v-if="Object.keys(itemRawMaterials).length > 0">
          <v-icon :icon="`mdi-menu-${isShowShipRawList ? 'down' : 'up'}`"></v-icon>
        </v-btn>
      </v-row>
      <template v-if="Object.entries(itemRawMaterials).length > 0">
        <div v-for="([key, value], rIndex) in Object.entries(itemRawMaterials)"
             :key="rIndex">
          <v-text-field
              :value="value"
              readonly
              hide-details
              variant="underlined"
              density="compact">
            <template v-slot:append>
              <div class="text-right">
                <p class="text-no-wrap">
                  <HtmlLink :is-icon="false" :is-iframe-show="false" :href="`/codex/material/${key}`" target="_blank">
                    <MaterialNameRarity :id="key">
                      <MaterialName :id="key"></MaterialName>
                    </MaterialNameRarity>
                    <v-icon size="12">mdi-open-in-new</v-icon>
                  </HtmlLink>
                </p>
                <p class="text-no-wrap mt-n2 opacity-30" v-if="route.query.debug">{{ key }}</p>
              </div>
            </template>
            <template v-slot:prepend>
              <div class="d-flex ga-2">
                <ItemSlotBase size="25px" :padding="0">
                  <MaterialIconWidget :id="key" :padding="0" :margin="0"></MaterialIconWidget>
                </ItemSlotBase>
                <ItemSlotBase size="25px" :padding="0"
                              v-if="materials[key].faction">
                  <FactionIconWidget :name="materials[key].faction.id"></FactionIconWidget>
                </ItemSlotBase>
              </div>
            </template>
          </v-text-field>

          <!-- 所需物品原材料 二级 S -->
          <ul class="ml-10 raw-list" v-if="!isShowShipRawList">
            <li v-for="([raw,rawValue],rawIndex) in materials[key].required" :key="rawIndex += rawValue" class="ml-10">
              <v-text-field
                  :value="value"
                  readonly
                  hide-details
                  variant="underlined"
                  density="compact">
                <template v-slot:append>
                  <div class="text-right">
                    <p class="text-no-wrap">
                      <HtmlLink :is-icon="false" :is-iframe-show="false" :href="router.resolve(`/codex/material/${raw.id}`).fullPath" target="_blank">
                        <MaterialNameRarity :id="raw.id">
                          <MaterialName :id="raw.id"></MaterialName>
                        </MaterialNameRarity>
                        <v-icon size="12">mdi-open-in-new</v-icon>
                      </HtmlLink>
                    </p>
                  </div>
                </template>
                <template v-slot:prepend>
                  <div class="d-flex ga-2">
                    <ItemSlotBase size="25px" :padding="0">
                      <MaterialIconWidget :id="raw.id" item-type="items" :padding="0" :margin="0"></MaterialIconWidget>
                    </ItemSlotBase>
                    <ItemSlotBase size="25px" :padding="0"
                                  v-if="materials[raw.id].faction">
                      <FactionIconWidget :name="materials[raw.id].faction.id"
                                         size="25px"></FactionIconWidget>
                    </ItemSlotBase>
                  </div>
                </template>
              </v-text-field>
            </li>
          </ul>
          <!-- 所需物品原材料 二级 E -->

        </div>
      </template>
      <template v-else>
        <v-card border variant="text">
          <EmptyView></EmptyView>
        </v-card>
      </template>
    </v-col>
    <!-- 所需物品原材料 E -->

  </v-row>
</template>

<style scoped lang="less">
.raw-list {
  list-style-type: none !important;
}
</style>
