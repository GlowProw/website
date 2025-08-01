<script setup lang="ts">
import {onMounted, type Ref, ref} from "vue";
import {api, http, time} from "@/assets/sripts";
import {Seasons} from "glow-prow-data";
import {Season} from "glow-prow-data/src/entity/Seasons";
import {useI18n} from "vue-i18n";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import Silk from "@/components/Silk.vue";

const {t} = useI18n()

let data = ref({
      teamCount: 0
    }),
    seasons: Seasons = Seasons,
    // 当前赛季
    currentlySeason: Ref<Season> = ref(null),
    portalNavs = ref([
      {
        title: '组队寻求',
        description: "发布或寻找与你计划相同船长出航，面对真正敌人",
        to: '/team'
      },
      {
        title: '日历',
        description: '查看本赛季活动信息',
        to: '/calendar'
      },
      {
        title: '地图',
        description: '所有地图物品清单',
        to: '/maps'
      },
      {
        title: '展示馆',
        description: '陈列物品信息, 检查它们如何获得',
        to: '/display-cabinet'
      },
      {
        title: '船只配装厂',
        description: '设计你船，让它到达性能极限，分享给好友',
        to: '/assembly'
      },
      {
        title: '海盗签名(开发中)',
        description: '生成海盗签名图片，分享到社区网站上',
        to: ''
      }
    ])

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
    <v-card class="portal-banner">
      <template v-slot:image>
        <Silk
            :speed="1.8"
            :scale=".7"
            :color="'#1c1c1c'"
            :noise-intensity="0.1"
            :rotation="0"
            class="portal-banner-backMark w-100 h-100 bg-black"
        />

        <div class="portal-banner-looping-video w-100 opacity-60">
          <video autoplay playsinline
                 class="card-enlargement-flavor"
                 muted loop type="video/mp4"
                 src="http://cdn.hommk.com/pcgame/ubi2015/img/gamezone/sb/full/skullandbones-year2-loop.mp4"></video>
        </div>
      </template>

      <v-container class="portal-banner-top">
      </v-container>

      <div class="portal-season-left-tip" v-if="currentlySeason && currentlySeason.id">
        <div class="opacity-30">
          <b class="mb-2">本赛季 {{ `${currentlySeason.alternativeName}`.toUpperCase()}}</b> 剩余 {{ time.calcRemainingDays(currentlySeason.endDate) }} 天
          <v-divider thickness="3" vertical/>
          {{ t(`snb.calendar.${currentlySeason?.id}.name`) }}
        </div>
      </div>
    </v-card>

    <div class="portal-body pl-3 pr-3 pt-2 pb-2 pt-md-3 pb-md-3 pt-lg-10 pb-lg-10">
      <v-container>
        <v-row>
          <v-col cols="12" md="8" lg="8" order="2" order-lg="1">
            <v-row>
              <v-col cols="12" sm="6" md="4" lg="4"
                     v-for="(i,index) in portalNavs" :key="index">
                <v-row>
                  <v-col cols="auto">
                    <ItemSlotBase size="60px" class="d-flex justify-center align-center">
                      <v-icon icon="mdi-help"></v-icon>
                    </ItemSlotBase>
                  </v-col>
                  <v-col>
                    <router-link :to="i.to">
                      <u class="text-h6 font-weight-bold mb-2 text-amber">{{ i.title }}</u>
                    </router-link>
                    <p class="opacity-50">{{ i.description }}</p>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-col>
          <v-col order="1" order-lg="2">
            <div class="title">
              <h1 class="btn-flavor pl-10 pr-10 pt-3 pb-3">{{ t(`snb.calendar.${currentlySeason?.id}.name`) }}</h1>
              <p class="ma-auto mt-4 font-weight-light opacity-80">{{ t(`snb.calendar.${currentlySeason?.id}.description`) }}</p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<style scoped lang="less">
.portal-banner {
  min-height: 700px;
  position: relative;
  overflow: hidden;

  .portal-banner-backMark {
    position: absolute;
    z-index: 0;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

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
      transform: scale(1.05) translate(-48%, calc(-50% + 0px));
      min-width: 110%;
      min-height: 100%;
      pointer-events: visible;
    }
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
    top: 0;
    left: 0;
    padding-top: calc(80px + 3vh);
    padding-left: 3vh;
    padding-right: 3vh;
    height: 100%;

    > div {
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
      }
    }
  }
}

.portal-body {
  background: #131313;
  position: relative;
  overflow: hidden;
  margin-top: -50px;
  border-radius: 20px 20px 10px 10px;
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
