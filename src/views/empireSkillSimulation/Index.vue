<template>
  <v-app>
    <Header></Header>
    <View :skills="EmpireSkills"></View>
    <Footer></Footer>
  </v-app>
</template>

<script setup lang="ts">
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";
import View from "./View.vue";

import {EmpireSkills} from "glow-prow-data/src/entity/EmpireSkills";
</script>
