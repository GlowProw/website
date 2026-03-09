<template>
  <div class="map-footer">
    <v-row class="w-100 mb-1" align="end">
      <v-col class="text-caption opacity-50 ml-8">
        <v-icon size="12" class="mr-2">mdi-information-outline</v-icon>
        map tiles by
        <HtmlLink :is-icon="false" :is-iframe-show="false" href="https://mapgenie.io">mapgenie</HtmlLink>
      </v-col>
      <v-col cols="auto" class="d-flex align-center">
        <div class="text-caption opacity-50">
          <span>{{ hoveedCoordinate.longitude?.toFixed(6) }}</span>
          <v-divider vertical class="mx-1"></v-divider>
          <span>{{ hoveedCoordinate.latitude?.toFixed(6) }}</span>
        </div>
        <template v-if="isDebug">
          <v-divider vertical inset class="mx-5"></v-divider>
          <div class="text-caption opacity-50">
            <span>{{ clickedCoordinate.longitude?.toFixed(6) }}</span>
            <v-divider vertical class="mx-1"></v-divider>
            <span>{{ clickedCoordinate.latitude?.toFixed(6) }}</span>
          </div>
        </template>
        <v-icon size="12" class="ml-2">mdi-map-marker</v-icon>
      </v-col>
    </v-row>
    <!-- <v-row class="w-100 mb-1" align="end">
      <v-spacer></v-spacer>
      <v-col cols="auto">
        <AdsWidget class="my-5" id="none"></AdsWidget>
      </v-col>
      <v-spacer></v-spacer>
    </v-row> -->
  </div>
</template>

<script setup lang="ts">
import HtmlLink from "@/components/HtmlLink.vue";
import AdsWidget from "@/components/ads/google/index.vue";

defineProps<{
  hoveedCoordinate: { longitude: number; latitude: number };
  clickedCoordinate: { longitude: number; latitude: number };
  isDebug: boolean;
}>();

defineOptions({ name: 'MapFooter' });
</script>

<style scoped>
.map-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>
