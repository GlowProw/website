<script setup lang="ts">

import {useI18n} from "vue-i18n";
import CodexViewData from "@/components/CodexViewData.vue";
import TreasureMapImageSimilarity from "@/components/TreasureMapImageSimilarity.vue";
import {nextTick, onMounted, Ref, ref} from "vue";
import {useRoute} from "vue-router";
import ImageMagnifyingGlass from "@/components/ImageMagnifyingGlass.vue";

const {t} = useI18n(),
    route = useRoute()

let treasureMapImageSimilarity: Ref<TreasureMapImageSimilarity> = ref(null)

onMounted(() => {
  nextTick(() => {
    const {comparison} = route.query
    if (comparison)
      treasureMapImageSimilarity.value.openModel()
  })
})
</script>

<template>
  <v-container class="pa-5">
    <CodexViewData :load-data-type="['treasureMap']">
      <template v-slot:action>
        <div class="d-flex ga-1">
          <v-btn variant="text" icon to="/map" target="_blank">
            <v-icon class="cursor-pointer">mdi-map-outline</v-icon>
          </v-btn>
          <TreasureMapImageSimilarity ref="treasureMapImageSimilarity">
            <v-btn variant="text" icon>
              <v-icon class="cursor-pointer">mdi-image-search-outline</v-icon>
            </v-btn>
          </TreasureMapImageSimilarity>
        </div>
      </template>
    </CodexViewData>
  </v-container>
</template>

<style scoped lang="less">
</style>
