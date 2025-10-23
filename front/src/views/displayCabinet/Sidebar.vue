<script setup lang="ts">

import {useI18n} from "vue-i18n";

const {t} = useI18n()
</script>

<template>
  <v-list nav class="bg-transparent">
    <v-list-item to="/display-cabinet/ships">
      {{ t('displayCabinet.ships.title') }}
    </v-list-item>
    <v-list-item to="/display-cabinet/ultimates">
      {{ t('displayCabinet.ultimates.title') }}
    </v-list-item>
    <v-list-item to="/display-cabinet/mods">
      {{ t('displayCabinet.modifications.title') }}
    </v-list-item>
    <v-list-item to="/display-cabinet/items">
      {{ t('displayCabinet.items.title') }}
    </v-list-item>
    <v-list-item to="/display-cabinet/cosmetics">
      {{ t('displayCabinet.cosmetics.title') }}
    </v-list-item>
    <v-list-item to="/display-cabinet/materials">
      {{ t('displayCabinet.materials.title') }}
    </v-list-item>
  </v-list>
</template>

<style scoped lang="less">

</style>
