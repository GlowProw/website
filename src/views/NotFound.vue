<script setup lang="ts">

import Footer from "@/components/Footer.vue";
import Noise from "@/components/Noise.vue";
import ShinyText from "@/components/ShinyText.vue";
import Header from "@/components/Header.vue";
import {useI18n} from "vue-i18n";

let {t} = useI18n()
</script>

<template>
  <v-app>
    <Header></Header>
    <v-card>
      <template v-slot:image>
        <Noise
            class="opacity-60"
            :pattern-size="50"
            :pattern-scale-x="1"
            :pattern-scale-y="1"
            :pattern-alpha="20">
        </Noise>
      </template>
      <template v-slot:default>
        <v-container height="calc(100vh - 100px)" class="d-flex justify-center align-center">
          <div class="text-center text-no-wrap pointer-events-none">
            <div class="opacity-10">
              <v-icon size="380" class="text-amber">mdi-ship-wheel</v-icon>
            </div>
            <h1 class="text-lg-h1 text-h2 text-md-h2 empty-page-text">
              <ShinyText :text="t('empty.title')" class-name="text-amber"></ShinyText>
            </h1>
            <p class="opacity-50 mt-3">{{ t('empty.description') }}</p>
          </div>
        </v-container>
      </template>
    </v-card>
    <Footer></Footer>
  </v-app>
</template>

<style scoped>
.empty-page-text {
  margin-top: -120px;
}
</style>
