<script setup lang="ts">
import {ref} from "vue";
import {Cosmetic, Item, MapLocation, Material, Ship, TreasureMap, Ultimate} from "glow-prow-data";
import {useI18n} from "vue-i18n";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import {useDisplay} from "vuetify/framework";
import SeasonViewWidget from "@/components/SeasonViewWidget.vue";
import TimeView from "./TimeView.vue";

const {t} = useI18n(),
    {mobile} = useDisplay(),
    {season: readSeason} = useI18nReadName(),
    props = defineProps<{ data: Item | Ship | Material | Cosmetic | Ultimate | MapLocation | TreasureMap | any }>()

const getSeasonData = (data: any) => data?.bySeason || data?.firstAppearingSeason
const getSeasonId = (data: any) => data?.bySeason?.id || 'release'

defineOptions({ 
  name: 'BySeasonCardWidget'
})
</script>

<template>
  <v-card class="by-season-card mb-4 bg-transparent border-lg" :class="{'by-season-n-top': !mobile}" rounded="xl">
    <v-card-text class="pa-0 h-100">
      <SeasonViewWidget :data="getSeasonData(data)" :is-flavor="false" class="d-flex"></SeasonViewWidget>
    </v-card-text>

    <v-card-text class="by-season-content-text by-season-by-text pt-3 pl-8 d-flex flex-column h-100">
      <div class="text-h4">
        {{  readSeason(getSeasonId(data)).name()  }}
      </div>
      <v-spacer></v-spacer>
      <div>
        <v-row>
          <v-col cols="auto" class="text-caption opacity-60" v-if="getSeasonData(data)?.startDate"><TimeView :time="getSeasonData(data)?.startDate" :format="'date'"></TimeView></v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto" class="text-caption opacity-60" v-if="getSeasonData(data)?.endDate"><TimeView :time="getSeasonData(data)?.endDate" :format="'date'"></TimeView></v-col>
        </v-row>
      </div>
    </v-card-text>

    <v-card-text class="by-season-right-season-info by-season-by-text">
      <div class="season-info-box">
        <p class="season-text border-l pl-4">{{ t('codex.item.bySeason.prepend') }} {{ t('codex.item.bySeason.append') }}</p>
        <p class="season-title pr-4">{{ readSeason(getSeasonId(data)).shortName() || 'none' }}</p>
      </div>
    </v-card-text>
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

.by-season-content-text{
  position: absolute;
  top: 0;
  left: 0;
}

.by-season-by-text {
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9), 0 0 12px rgba(0, 0, 0, 0.7);
}

.by-season-right-season-info {
  position: absolute;
  top: 10px;
  right: 0;
  padding-right: 3vh;
  padding-left: 3vh;
  z-index: 6;
  pointer-events: none;
  user-select: none;

  .season-info-box {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    display: inline-flex;
    flex-direction: column;
    gap: 5px;
    font-size: 16px;
    letter-spacing: 3px;

    .season-text {
      margin: 0;
      padding: 0;
      white-space: nowrap;
      line-height: 1.6;
    }

    .season-timer {
      opacity: 0.85;
      font-weight: 400;
    }

    .season-title {
      color: rgba(255, 255, 255, 0.95);
      font-weight: 500;
    }
  }
}

@media screen and (max-width: 980px) {
  .banner-right-season-info {
    padding-right: 2vh;
    padding-left: 2vh;

    .season-info-box {
      letter-spacing: 2px;
      gap: 6px;

      .season-title {
        letter-spacing: 2px;
      }

      .season-divider {
        height: 32px;
      }
    }
  }
}
</style>
