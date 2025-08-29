<script setup lang="ts">
import {ref} from "vue";
import LongPressButton from "@/components/snbWidget/btnWidget.vue";
import WheelWidget from "@/components/wheelShowWidget.vue";
import WarehouseShowWidget from "@/components/WarehouseShowWidget.vue";

let value = ref('')
</script>

<template>
  <v-container class="mt-10">
    <WarehouseShowWidget></WarehouseShowWidget>
  </v-container>
</template>

<style scoped lang="less">

</style>
