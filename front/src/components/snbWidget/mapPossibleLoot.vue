<script setup lang="ts">

import MaterialIconWidget from "@/components/snbWidget/materialIconWidget.vue";
import MaterialName from "@/components/snbWidget/materialName.vue";
import ItemName from "@/components/snbWidget/itemName.vue";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import CommoditieName from "@/components/snbWidget/commoditieName.vue";
import ItemNameRarity from "@/components/snbWidget/itemNameRarity.vue";
import CommoditieIconWidget from "@/components/snbWidget/commoditieIconWidget.vue";
import MaterialNameRarity from "@/components/snbWidget/materialNameRarity.vue";
import ItemIconWidget from "@/components/snbWidget/itemIconWidget.vue";

const props = defineProps<{possibleLoot: [] | any}>()
</script>

<template>
  <v-row v-for="(i,index) in Object.entries(possibleLoot)" :key="index" align="center" no-gutters class="mb-1">
    <v-col cols="auto" class="mr-2">
      <ItemSlotBase :size="`30px`" :padding="1">
        <template v-if="i[1]['category'] == 'material'">
          <MaterialIconWidget :id="i[0]" :padding="0" :margin="0"></MaterialIconWidget>
        </template>
        <template v-if="i[1]['category'] == 'commoditie'">
          <CommoditieIconWidget :id="i[0]" :padding="0" :margin="0"></CommoditieIconWidget>
        </template>
        <template v-if="i[1]['category'] == 'item'">
          <ItemIconWidget :id="i[0]" :padding="0" :margin="0"></ItemIconWidget>
        </template>
      </ItemSlotBase>
    </v-col>
    <v-col cols="auto">
      <template v-if="i[1]['category'] == 'material'">
        <MaterialNameRarity :id="i[0]">
          <MaterialName :id="i[0]"></MaterialName>
        </MaterialNameRarity>
      </template>
      <template v-if="i[1]['category'] == 'commoditie'">
        <CommoditieName :id="i[0]"></CommoditieName>
      </template>
      <template v-if="i[1]['category'] == 'item'">
        <ItemNameRarity :id="i[0]">
          <ItemName :id="i[0]"></ItemName>
        </ItemNameRarity>
      </template>
    </v-col>
    <v-col class="text-right" :class="{'text-green': i[1]['lv'] == 3}">
      <v-icon>mdi-dice-5-outline</v-icon>
      <v-icon>mdi-{{ ['chevron-up', 'chevron-double-up', 'chevron-triple-up'][ Number.parseInt(i[1]['lv']) - 1 ] || 'chevron-up' }}</v-icon>
    </v-col>
  </v-row>
</template>

<style scoped lang="less">

</style>
