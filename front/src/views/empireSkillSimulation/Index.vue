<template>
  <v-app>
    <Header></Header>
    <v-main class="background-img-flavor">
<!--      <ZoomableCanvas style="height: 100vh">-->
<!--      </ZoomableCanvas>-->
      <View :skills="EmpireSkills"></View>
    </v-main>
    <Footer></Footer>
  </v-app>
</template>

<script setup lang="ts">
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";
import View from "./view.vue";
import {ref} from "vue";
import {EmpireSkills} from "glow-prow-data/src/entity/EmpireSkills";
import ZoomableCanvas from "@/components/ZoomableCanvas.vue";

let data = ref({})
</script>
