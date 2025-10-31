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
  <v-container class="pa-5">
    <v-row class="mods-list ga-4">
      <template v-for="(i, index) in mods" :key="index">
        <v-card width="99" class="bg-transparent">
          <ItemSlotBase size="99px">
            <ModIconWidget :id="i.id"></ModIconWidget>
          </ItemSlotBase>
          <div class="mt-1 w-100 singe-line text-center">
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
