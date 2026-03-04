<script setup lang="ts">
import {ref} from "vue";
import {Cosmetic, Item, MapLocation, Material, Ship, TreasureMap, Ultimate} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify/framework";
import SeasonViewWidget from "@/components/SeasonViewWidget.vue";

const {t} = useI18n(),
    {mobile} = useDisplay(),
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

    <v-card class="by-season-footer-context" tile :to="`/codex/items?season=${getSeasonId(data)}`">
      <v-row no-gutters>
        <v-col cols="12">
          <v-chip class="w-100 pa-0 pl-2 pr-2 justify-center" label size="small" variant="text">
            <div class="singe-line font-weight-bold">{{ t('codex.season') }}</div>
          </v-chip>
          <v-text-field readonly hide-details variant="plain" density="compact"
                        class="h-100 bg-transparent" :value="t(`snb.seasons.${getSeasonId(data)}`) || 'none'"></v-text-field>
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
