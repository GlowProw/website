<script setup lang="ts">

import Footer from "@/components/Footer.vue";
import Noise from "@/components/Noise.vue";
import {ref} from "vue";
import ShinyText from "@/components/ShinyText.vue";
import Header from "@/components/Header.vue";

let notFound = ref(true)
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
          <div class="text-center">
            <h1 class="text-lg-h1 text-h2 text-md-h2">
              <ShinyText text="Not Found" class-name="text-amber"></ShinyText>
            </h1>
            <p class="opacity-50 mt-3">船长 你迷失在深海...</p>
          </div>
        </v-container>
      </template>
    </v-card>
    <Footer></Footer>
  </v-app>
</template>

<style scoped>

</style>
