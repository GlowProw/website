<script setup lang="ts">
import {useI18n} from "vue-i18n";
import CodexViewData from "@/components/CodexViewData.vue";
import {onMounted} from "vue";
import {useRoute, useRouter} from "vue-router";

const {t} = useI18n(),
    route = useRoute(),
    router = useRouter();

onMounted(() => {
  const {comparison} = route.query;
  if (comparison) {
    router.replace('/codex/treasureMaps/comparison');
  }
});
</script>

<template>
  <v-container class="pa-5">
    <CodexViewData :load-data-type="['treasureMap']">
      <template v-slot:action>
        <div class="d-flex ga-1">
          <v-btn variant="text" icon to="/map" target="_blank">
            <v-icon class="cursor-pointer">mdi-map-outline</v-icon>
          </v-btn>
          <v-btn variant="text" icon to="/codex/treasureMaps/comparison">
            <v-icon class="cursor-pointer">mdi-image-search-outline</v-icon>
          </v-btn>
        </div>
      </template>
    </CodexViewData>
  </v-container>
</template>

<style scoped lang="less">
</style>
