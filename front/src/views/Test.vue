<script setup lang="ts">
import {ref} from "vue";
import LongPressButton from "@/components/snbWidget/btnWidget.vue";

let value = ref('')
</script>

<template>
  <v-container class="mt-10">
    <div style="width: 1200px">
      <LongPressButton :duration="3000">
        11
      </LongPressButton>

      <LongPressButton :duration="3000" keyboard-shortcut="e">
        11
      </LongPressButton>
    </div>
  </v-container>
</template>

<style scoped lang="less">

</style>
