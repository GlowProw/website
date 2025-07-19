<script setup lang="ts">
import {onMounted, ref} from "vue";
import {api, http} from "../../assets/sripts";

let data = ref({
  teamCount: 0
})

onMounted(() => {
  getHomeData();
})

const getHomeData = async () => {
  const result = await http.get(api['teamup_statistics'], {})

  if (result.error == 1)
    Error(result.message)

  data.value.teamCount = result.data.data
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
          <h1>第2年2赛季:阵营</h1>
          <p>阵营争夺</p>
        </div>

        <v-row>
          <v-col>
            <v-card
                to="/team"
                :subtitle="`目前${data?.teamCount || 0}寻求组队`"
                text="发布或寻找与你计划相同船长出航，面对真正敌人"
                title="组队寻求"
                variant="text"
            ></v-card>
          </v-col>
          <v-col>
            <v-card
                disabled
                text="查看本赛季活动信息"
                title="活动日落"
                variant="text">
              <template v-slot:subtitle>
                <u><a>武装金币</a></u> + <u><a>船队</a></u> 订阅日历
              </template>
            </v-card>
          </v-col>
          <v-col>
            <v-card
                disabled
                text="所有地图物品清单"
                title="地图"
                variant="text"
            ></v-card>
          </v-col>
          <v-col>
            <v-card
                disabled
                text="陈列物品信息, 检查它们如何获得"
                title="展示馆"
                variant="text"
            ></v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <v-container>
<!--      1123123-->
    </v-container>
  </div>
</template>

<style scoped>
.portal-banner {
  min-height: 500px;
  overflow: hidden;
  position: relative;

  .portal-banner-looping-video {

    &:after {
      content: "";
      position: absolute;
      width: 100%;
      height: 100%;
      background: #000;
      opacity: .5;
    }

    video {
      position: absolute;
      z-index: 0;
      left: 50%;
      top: 50%;
      width: 100%;
      transform: translate(-50%, -50%);
      min-width: 100%;
      height: auto;
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
    overflow: hidden;
    min-height: 600px;
    display: flex;
    align-self: end;
    flex-direction: column;
    align-items: center;

    .title {
      flex: 1;
      z-index: 3;
      text-align: center;
      margin-top: 200px;
    }
  }
}
</style>
