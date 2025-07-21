<script setup lang="ts">
import {onMounted, type Ref, ref} from "vue";
import {api, http} from "../../assets/sripts";
import {Seasons} from "glow-prow-data";
import {Season} from "glow-prow-data/src/entity/Seasons";
import {useI18n} from "vue-i18n";

const {t} = useI18n()

let data = ref({
      teamCount: 0
    }),
    seasons: [] = Seasons,
    // 当前赛季
    currentlySeason: Ref<Season> = ref(null)

onMounted(() => {
  getHomeData();
  getCurrentSeason()
})

/**
 * 取得首页数据
 */
const getHomeData = async () => {
  const result = await http.get(api['teamup_statistics'], {})

  if (result.error == 1)
    Error(result.message)

  data.value.teamCount = result.data.data
}

/**
 * 获取当前赛季
 * @returns {Season | null} 当前赛季，如果不在任何赛季范围内则返回 null
 */
const getCurrentSeason = (): Season | null => {
  const currentDate = new Date();
  const currentTime = currentDate.getTime();

  for (const seasonId in seasons) {
    const season = seasons[seasonId];
    const startDate = new Date(season.startDate).getTime();
    const endDate = new Date(season.endDate).getTime();

    if (currentTime >= startDate && currentTime <= endDate) {
      currentlySeason.value = season;
      return season;
    }
  }

  return null;
}
</script>

<template>
  <div>
    <div class="portal-banner">
      <div class="portal-banner-looping-video">
        <video autoplay playsinline
               muted loop type="video/mp4"
               src="http://cdn.hommk.com/pcgame/ubi2015/img/gamezone/sb/full/skullandbones-year2-loop.mp4"></video>
      </div>

      <v-container class="portal-banner-top">
        <div class="title">
          <h1 class="btn-flavor pl-10 pr-10 pt-3 pb-3">{{ t(`snb.calendar.${currentlySeason?.id}.name`) }}</h1>
          <p class="ma-auto mt-4 font-weight-light opacity-80">{{ t(`snb.calendar.${currentlySeason?.id}.description`) }}</p>
        </div>
      </v-container>

      <div class="portal-season-left-tip opacity-30" v-if="currentlySeason && currentlySeason.alternativeName">
        本赛季 {{ currentlySeason.alternativeName.toUpperCase() }}
        <v-divider vertical/>
        {{ t(`snb.calendar.${currentlySeason?.id}.name`) }}
      </div>
    </div>

    <v-container>
      <v-row>
        <v-col cols="12" sm="12" md="6" lg="3">
          <v-card
              class="background-flavor"
              to="/team"
              :subtitle="`目前${data?.teamCount || 0}寻求组队`"
              text="发布或寻找与你计划相同船长出航，面对真正敌人"
              title="组队寻求"
              variant="text"
          ></v-card>
        </v-col>
        <v-col cols="12" sm="12" md="6" lg="3">
          <v-card
              class="background-flavor"
              to="/calendar"
              text="查看本赛季活动信息"
              title="日历"
              variant="text">
          </v-card>
        </v-col>
        <v-col cols="12" sm="12" md="6" lg="3">
          <v-card
              class="background-flavor"
              disabled
              text="所有地图物品清单"
              title="地图"
              variant="text"
          ></v-card>
        </v-col>
        <v-col cols="12" sm="12" md="6" lg="3">
          <v-card
              class="background-flavor"
              to="/display-cabinet"
              text="陈列物品信息, 检查它们如何获得"
              title="展示馆"
              variant="text"
          ></v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped lang="less">
.portal-banner {
  min-height: 500px;
  overflow: hidden;
  position: relative;

  .portal-banner-looping-video {

    &:after {
      content: "";
      position: absolute;
      width: 120%;
      height: 100%;
      background: #000;
      opacity: .5;
    }

    video {
      position: absolute;
      animation: all .25s;
      z-index: 0;
      opacity: 1;
      left: 50%;
      top: 50%;
      width: 100%;
      height: auto;
      transform: translate(-50%, -50%);
      min-width: 100%;
      min-height: 100%;
      pointer-events: visible;
    }
  }

  &:before {
    content: "";
    position: absolute;
    z-index: 1;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0;
    padding: 10% 0 0;
    background: url(../../assets/images/portal-banner-background.png) 50% 0 no-repeat;
    background-size: cover;
  }

  .portal-banner-top {
    position: relative;
    padding-top: 150px;

    .title {
      bottom: -100%;
      text-align: center;
      max-width: 43%;
      margin: 0 auto;
    }
  }

  .portal-season-left-tip {
    position: absolute;
    top: 100px;
    left: 20px;
    writing-mode: vertical-rl;
    display: flex;
    flex-flow: row wrap;
    column-gap: 4px;
    font-weight: 400;
    margin-bottom: 20px;

    &:after {
      bottom: 0;
      content: "";
      margin: 0 5px;
      border-bottom: 1px solid #fff;
    }
  }
}

@media screen and (max-width: 980px) {
  .portal-banner {
    .portal-banner-looping-video {
      video {
        opacity: .7;
        width: auto;
        height: 100% !important;
      }
    }

    .title {
      margin-bottom: 50px;
      max-width: 80% !important;
    }
  }
}
</style>
