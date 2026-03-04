<script setup lang="ts">
import {ref} from "vue";
import {appFuns} from "@/assets/sripts/index";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";

const {t} = useI18n(),
    {mobile} = useDisplay()

let show = ref(false)
</script>

<template>
  <v-tooltip v-model="show" location="bottom center"
             content-class="pa-0"
             interactive
             open-on-click>
    <template v-slot:activator="{props}">
      <v-btn icon v-bind="props" density="comfortable" class="mr-3">
        <v-icon icon="mdi-apps"></v-icon>
      </v-btn>
    </template>
    <v-card class="pt-10 pb-10 pl-4 pr-4" :width="mobile ? '100%' : 450" max-width="520" border>
      <v-row justify="center" no-gutters>
        <v-col cols="4"
               v-for="(i, index) in appFuns.list" :key="index"
               :class="{'opacity-40':!i.to }"
               class="text-center mb-5 pl-2 pr-2">
          <router-link :to="i.to" @click="show = false">
            <ItemSlotBase size="70px" class="d-flex justify-center align-center ma-auto mb-2">
              <v-icon :icon="i.icon" size="30"></v-icon>
            </ItemSlotBase>

            <div class="font-weight-bold mb-2 text-amber singe-line w-100">{{ t(i.title) }}</div>
          </router-link>
        </v-col>
      </v-row>
    </v-card>
  </v-tooltip>
</template>

<style scoped lang="less">

</style>
