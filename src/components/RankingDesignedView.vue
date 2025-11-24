<script setup lang="ts">
import {Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";

import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";
import CosmeticIconWidget from "@/components/snbWidget/cosmeticIconWidget.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";
import CosmeticName from "@/components/snbWidget/cosmeticName.vue";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import ModIconWidget from "@/components/snbWidget/modIconWidget.vue";
import ModName from "@/components/snbWidget/modName.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";
import ItemView from "@/components/ItemView.vue";
import RankingRightClickMenu from "@/components/RankingRightClickMenu.vue";
import RankingDesignedItemsDataProcessing from "@/assets/sripts/ranking_designed_items_data_processing";
import {RankingAttr} from "@/assets/types/Ranking";


const
    props = withDefaults(defineProps<{ readonly: boolean }>(), {readonly: false}),
    {t} = useI18n(),
    route = useRoute(),
    router = useRouter(),
    rankingDesignedItemsDataProcessing = new RankingDesignedItemsDataProcessing()

let rankingData = ref([
      {
        label: "S",
        attr: {
          color: "#fe7f7e"
        },
        content: []
      },
      {
        label: "A",
        attr: {
          color: "#ffbe81"
        },
        content: []
      },
      {
        label: "B",
        attr: {
          color: "#ffff82"
        },
        content: []
      },
      {
        label: "C",
        attr: {
          color: "#ffff83"
        },
        content: []
      },
      {
        label: "D",
        attr: {
          color: "#7fff82"
        },
        content: []
      },
      {
        label: "F",
        attr: {
          color: "#7fff81"
        },
        content: []
      }
    ]),

    itemWidget = ref<InstanceType<typeof ItemView> | null>(null),
    isOpenItem = ref(false),
    itemInsertIndex = ref(0),
    itemCategory = ref(null),

    // 排行属性
    attr: Ref<RankingAttr> = ref({
      useVersion: RankingDesignedItemsDataProcessing.nowVersion
    })

/**
 * 展开选择器面包
 * @param tags 类型
 * @param index 排序卡槽下标
 * @param category 类型，如物品/装饰品/材料/配装...
 */
const openInsertDataPanel = (tags = [], index, category) => {
  console.log(tags, category)

  if (itemWidget.value) {
    itemInsertIndex.value = index
    itemCategory.value = category
    isOpenItem.value = false

    itemWidget.value.openPanel(tags, category)
  }
}

/**
 * 回调插入数据
 * @param id 数据id
 */
const onInsertData = (id: string) => {
  isOpenItem.value = false
  rankingData.value[itemInsertIndex.value].content.push({
    category: itemCategory.value,
    id,
  })
}

/**
 * 设置轮盘属性
 * @param attrData
 */
const setSetting = (attrData) => {
  return {onLoad}
}

/**
 * 加载数据
 * @param attrData
 */
const onLoad = (data) => {
  const d = rankingDesignedItemsDataProcessing.import(data, attr.value.useVersion);
  if (!d || JSON.stringify(d) === '{}')
    return;

  rankingData.value = {
    ...rankingData.value,
    ...d
  };
}

const onExport = () => {
  return rankingData.value
}

defineExpose({
  setSetting,
  onLoad,
  onExport,
})
</script>

<template>
  <v-card border class="bg-shades-black">
    <div v-for="(i, index) in rankingData" :key="index" class="item-row">
      <v-row no-gutters>
        <v-col
            cols="auto"
            class="px-1 py-10"
            :style="`background-color:color-mix(in srgb, hsl(from ${i.attr.color} h s l) 10%, #000)`">
          <!--            <v-text-field v-model="i.label"-->
          <!--                          counter="1"-->
          <!--                          width="50"-->
          <!--                          variant="plain"></v-text-field>-->
          <v-card width="80" class="text-h4 bg-transparent text-center">
            {{ i.label }}
          </v-card>
        </v-col>
        <v-divider vertical></v-divider>
        <v-col class="pl-3">
          <v-row no-gutters>
            <v-col v-for="(j, jIndex) in i.content" :key="jIndex" cols="auto" class="my-3 ml-3">
              <template v-if="j.category == 'item'">
                <v-card elevation="0" class="bg-transparent" width="90">
                  <ItemSlotBase size="90px">
                    <ItemIconWidget :id="j.id" :is-open-detail="false"></ItemIconWidget>
                  </ItemSlotBase>
                  <div class="text-center mt-1">
                    <ItemNameRarity :id="j.id">
                      <ItemName :id="j.id"></ItemName>
                    </ItemNameRarity>
                  </div>
                </v-card>
              </template>
              <template v-else-if="j.category == 'material'">
                <ItemSlotBase size="90px">
                  <MaterialIconWidget :id="j.id" :is-open-detail="false"></MaterialIconWidget>
                </ItemSlotBase>
                <div class="text-center mt-1">
                  <MaterialName :id="j.id"></MaterialName>
                </div>
              </template>
              <template v-else-if="j.category == 'cosmetic'">
                <ItemSlotBase size="90px">
                  <CosmeticIconWidget :id="j.id" :is-open-detail="false"></CosmeticIconWidget>
                </ItemSlotBase>
                <div class="text-center mt-1">
                  <CosmeticName :id="j.id"></CosmeticName>
                </div>
              </template>
              <template v-else-if="j.category == 'ultimate'">
                <ItemSlotBase size="90px">
                  <UltimateIconWidget :id="j.id" :is-open-detail="false"></UltimateIconWidget>
                </ItemSlotBase>
                <div class="text-center mt-1">
                  <UltimateName :id="j.id"></UltimateName>
                </div>
              </template>
              <template v-else-if="j.category == 'modification'">
                <ItemSlotBase size="90px">
                  <ModIconWidget :id="j.id" :is-open-detail="false"></ModIconWidget>
                </ItemSlotBase>
                <div class="text-center mt-1">
                  <ModName :id="j.id" :grade="j.grade"></ModName>
                </div>
              </template>
            </v-col>
            <v-col v-if="!readonly">
              <div class="item-add">
                <RankingRightClickMenu @clickMenuItem="(data) => openInsertDataPanel(data.tags, index,data.category)">
                  <v-card width="90px" height="90px" class="ma-3 d-flex justify-center align-center">
                    <v-icon size="35">mdi-plus</v-icon>
                  </v-card>
                </RankingRightClickMenu>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-divider></v-divider>
    </div>
  </v-card>

  <ItemView ref="itemWidget"
            @finish="(id) => onInsertData(id)"
            @close="() => isOpenItem = false"/>
</template>

<style scoped lang="less">

</style>
