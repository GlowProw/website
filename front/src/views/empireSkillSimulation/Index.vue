<template>
  <v-app>
    <Header></Header>
    <v-main class="">
      <div class="overlapping-circles">
        <div class="overlapping-pattern">
          <View :skills="EmpireSkills"></View>
        </div>
      </div>
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

let data = ref({})
</script>

<style>
.overlapping-pattern {
  --offset-x: 0px;
  --offset-y: 0px;
  --size: 100px;
  --color: rgba(255, 255, 255, 0.05);

  background-image: linear-gradient(to right,
  transparent calc(var(--size) + 0px),
  var(--color) calc(var(--size) + 1px),
  var(--color) calc(var(--size) + 2px),
  transparent calc(var(--size) + 3px)),
  linear-gradient(to bottom,
      transparent calc(var(--size) + 0px),
      var(--color) calc(var(--size) + 1px),
      var(--color) calc(var(--size) + 2px),
      transparent calc(var(--size) + 3px));

  background-size: 236px 236px;
  background-repeat: repeat;
  background-position: var(--offset-x) var(--offset-y);
}

.overlapping-circles {
  --offset-x: 0px;
  --offset-y: 0px;
  --size: 212px;
  --color: rgba(255, 216, 2, 0.1);

  background-image: radial-gradient(circle at calc(50%) calc(50%),
  transparent calc(var(--size) + 0px),
  var(--color) calc(var(--size) + 1px),
  transparent calc(var(--size) + 3px));

  background-size: calc(var(--size) + 210px) calc(var(--size) + 210px);
  background-repeat: repeat;
  background-position: var(--offset-x) var(--offset-y);
}
</style>
