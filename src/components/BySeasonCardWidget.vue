<script setup lang="ts">
import {ref} from "vue";
import {Cosmetic, Item, MapLocation, Material, Ship, TreasureMap, Ultimate} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {useDisplay} from "vuetify/framework";
import SeasonViewWidget from "@/components/SeasonViewWidget.vue";

const {t} = useI18n(),
    {mobile} = useDisplay(),
    {season: readSeason} = useI18nReadName(),
    props = defineProps<{ data: Item | Ship | Material | Cosmetic | Ultimate | MapLocation | TreasureMap | unknown }>()

const getSeasonData = (data: any) => data?.bySeason || data?.firstAppearingSeason
const getSeasonId = (data: any) => data?.bySeason?.id || 'release'

defineOptions({ name: 'BySeasonCardWidget' })
</script>

<template>
  <v-card class="by-season-card mb-4 bg-transparent" :class="{'by-season-n-top': !mobile}">
    <v-card-text class="pa-0 h-100">
      <SeasonViewWidget :data="getSeasonData(data)"></SeasonViewWidget>
    </v-card-text>

    <v-card class="by-season-footer-context mt-n2" tile :to="`/codex/items?season=${getSeasonId(data)}`">
      <v-row class="px-5" align="center">
        <v-col cols="auto">
          <p class="text-no-wrap font-weight-bold">{{ t('codex.item.bySeason.prepend') }}</p>
        </v-col>
        <v-col>
          <v-text-field hide-details variant="solo" elevation="0" density="compact" readonly tile
                        class="h-100 bg-transparent" :value="readSeason(getSeasonId(data)).fullName() || 'none'"></v-text-field>
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
}

.by-season-content {
  transform: scale(1.2) translateY(-10%)
}
</style>
