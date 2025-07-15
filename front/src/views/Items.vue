<script setup lang="ts">
import {Items, Ships} from "@skullandbonestools/snbdata";
import type {Item} from "@skullandbonestools/snbdata/dist/daos/items";
const items: Item = Items
import ItemSlotWidget from "../components/ItemSlotWiget.vue";
</script>

<template>
  <template v-for="(i, index) in items">
    <ItemSlotWidget :data="i"></ItemSlotWidget>

  </template>
</template>

<style scoped>

</style>
