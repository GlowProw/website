<script setup lang="ts">
import {ref} from "vue";
import {Cosmetic, Item, MapLocation, Material, Ship, TreasureMap, Ultimate} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import SeasonViewWidget from "@/components/SeasonViewWidget.vue";

const {t} = useI18n(),
    {mobile} = useDisplay(),
    props = defineProps<{ data: Item | Ship | Material | Cosmetic | Ultimate | MapLocation | TreasureMap | unknown }>()

let images = ref({})

</script>

<template>
  <v-card class="by-season-card mb-4 bg-transparent" :class="{'by-season-n-top': !mobile}">
    <template v-slot:image>
      <SeasonViewWidget :data="data?.bySeason || data?.firstAppearingSeason"></SeasonViewWidget>
    </template>
    <v-card class="by-season-footer-context" tile :to="`/codex/item/season/${data?.bySeason?.id || 'release'}`">
      <v-row class="px-5" align="center">
        <v-col cols="auto">
          <p class="text-no-wrap font-weight-bold">{{ t('codex.item.bySeason.prepend') }}</p>
        </v-col>
        <v-col>
          <v-text-field hide-details variant="solo" elevation="0" density="compact" readonly tile
                        class="h-100 bg-transparent" :value="t(`snb.seasons.${data?.bySeason?.id || 'release'}`) || 'none'"></v-text-field>
        </v-col>
        <v-col cols="auto">
          <p class="text-no-wrap">{{ t('codex.item.bySeason.append') }}</p>
        </v-col>
      </v-row>
    </v-card>
  </v-card>
</template>

<style scoped lang="less">
.by-season-card {
}

.by-season-footer-context {
  margin-top: 150px;
}

.by-season-content {
  transform: scale(1.2) translateY(-10%)
}

.by-season-n-top {
  margin-top: -200px;
}
</style>
