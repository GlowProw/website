<script setup lang="ts">
import {Items} from "@skullandbonestools/snbdata";
import ItemSlotWidget from "@/components/ItemSlotWiget.vue";

const items = Items
</script>

<template>
  <template v-for="(i, index) in items" :key="index">
    <ItemSlotWidget :data="i"></ItemSlotWidget>
  </template>
</template>

<style scoped>

</style>
