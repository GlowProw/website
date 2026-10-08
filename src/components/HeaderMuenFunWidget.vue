<script setup lang="ts">
import {ref} from "vue";
import {appFuns, appNavs} from "@/assets/sripts/index";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import VerticalScrollList from "@/components/VerticalScrollList.vue";

const {t} = useI18n()

let model = ref(true)
</script>

<template>
  <v-btn icon="mdi-apps" @click="model = !model"></v-btn>

  <v-dialog z-index="800"
            class="app-fun-menu position-fixed"
            noClickAnimation
            transition
            v-model="model">
    <v-main>
      <v-row class="pt-3">
        <v-col cols="12" sm="6" lg="4">
          <VerticalScrollList>
            <v-list-item link :to="nav.to" :href="nav.href" target="_blank"
                         @click="model = !model"
                         v-for="(nav, navIndex) in appFuns.list" :key="navIndex">
              {{ t(nav.title) }}
              <template v-slot:prepend>
                <ItemSlotBase size="60px" class="mr-2 d-flex align-center justify-center">
                  <v-icon :icon="nav.icon" size="40"></v-icon>
                </ItemSlotBase>
              </template>
            </v-list-item>
          </VerticalScrollList>
        </v-col>
        <v-col cols="12" sm="6" lg="4">
          1
        </v-col>
      </v-row>
    </v-main>
  </v-dialog>
</template>

<style scoped lang="less">
.app-fun-menu {
  background: linear-gradient(rgba(0, 0, 0, 0.47), rgba(0, 0, 0, 0.47)),
  hsl(from var(--main-color) h s l / .1);
  background-blend-mode: multiply;
  backdrop-filter: blur(100px)
}
</style>
