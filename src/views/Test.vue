<script setup lang="ts">
import {ref} from "vue";
import LongPressButton from "@/components/snbWidget/btnWidget.vue";
import WheelWidget from "@/components/wheelShowWidget.vue";
import WarehouseShowWidget from "@/components/WarehouseShowWidget.vue";
import TreasureMapImageSimilarity from "@/components/TreasureMapImageSimilarity.vue";
import TreasureMapImageSimilarityNew from "@/components/TreasureMapImageSimilarity.vue";

let value = ref('')
</script>

<template>
  <v-container class="mt-10">
    <TreasureMapImageSimilarityNew></TreasureMapImageSimilarityNew>
  </v-container>
</template>

<style scoped lang="less">

</style>
