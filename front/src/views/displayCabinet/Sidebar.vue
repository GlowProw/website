<script setup lang="ts">

import {useI18n} from "vue-i18n";

const {t} = useI18n()
</script>

<template>
  <v-list nav class="bg-transparent pa-0 my-4"
          active-class="bg-amber">
    <v-list-item to="/display-cabinet/ships" prepend-icon="mdi-format-list-bulleted-type">
      {{ t('displayCabinet.ships.title') }}
    </v-list-item>
    <v-list-item to="/display-cabinet/ultimates" prepend-icon="mdi-format-list-bulleted-type">
      {{ t('displayCabinet.ultimates.title') }}
    </v-list-item>
    <v-list-item to="/display-cabinet/mods" prepend-icon="mdi-format-list-bulleted-type">
      {{ t('displayCabinet.modifications.title') }}
    </v-list-item>
    <v-list-item to="/display-cabinet/items" prepend-icon="mdi-format-list-bulleted-type">
      {{ t('displayCabinet.items.title') }}
    </v-list-item>
    <v-list-item to="/display-cabinet/cosmetics" prepend-icon="mdi-format-list-bulleted-type">
      {{ t('displayCabinet.cosmetics.title') }}
    </v-list-item>
    <v-list-item to="/display-cabinet/materials" prepend-icon="mdi-format-list-bulleted-type">
      {{ t('displayCabinet.materials.title') }}
    </v-list-item>
    <v-divider class="my-2"></v-divider>
    <v-list-item to="/display-cabinet/treasureMaps" prepend-icon="mdi-format-list-bulleted-type">
      {{ t('displayCabinet.treasureMaps.title') }}
    </v-list-item>
    <v-list-item to="/display-cabinet/mapLocations" prepend-icon="mdi-format-list-bulleted-type">
      {{ t('displayCabinet.mapLocations.title') }}
    </v-list-item>
  </v-list>
</template>

<style scoped lang="less">

</style>
