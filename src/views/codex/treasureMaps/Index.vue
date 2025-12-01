<script setup lang="ts">

import {useI18n} from "vue-i18n";
import CodexViewData from "@/components/CodexViewData.vue";
import TreasureMapImageSimilarity from "@/components/TreasureMapImageSimilarity.vue";
import {nextTick, onMounted, Ref, ref} from "vue";
import {useRoute} from "vue-router";

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
    <CodexViewData :load-data-type="['treasureMaps']">
      <template v-slot:action>
        <TreasureMapImageSimilarity ref="treasureMapImageSimilarity">
          <v-icon class="cursor-pointer">mdi-image-search-outline</v-icon>
        </TreasureMapImageSimilarity>
      </template>
    </CodexViewData>
  </v-container>
</template>

<style scoped lang="less">
</style>
