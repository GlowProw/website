<script setup lang="ts">
import {onMounted, onUnmounted, ref} from "vue";
import {appFuns, getCurrentSeason, time} from "@/assets/sripts";
import {Season} from "glow-prow-data/src/entity/Seasons";
import {useI18n} from "vue-i18n";
import BlogWidget from "@/components/BlogWidget.vue";
import AppVersionWidget from "@/components/AppVersionWidget.vue";
import NewSeasonShowItem from "@/components/NewSeasonShowItem.vue";
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import DonorsWidget from "@/components/DonorsWidget.vue";
import Loading from "@/components/Loading.vue";
import QQBotBannerWidget from "@/components/QQBotBannerWidget.vue";
import QQBotShowcaseWidget from "@/components/QQBotShowcaseWidget.vue";
import Banner from "@/components/Banner.vue";

const {t} = useI18n()

// 当前赛季
const currentlySeason = ref<Season | null>(getCurrentSeason() as Season | null)

const seasonContainerRef = ref<HTMLElement | null>(null)
const isSeasonItemLoaded = ref(false)
let seasonObserver: IntersectionObserver | null = null

onMounted(() => {
  if (!currentlySeason.value) {
    currentlySeason.value = getCurrentSeason()
  }

  // 懒加载 NewSeasonShowItem 进入视口 10px 内仅加载一次
  if (seasonContainerRef.value && !isSeasonItemLoaded.value) {
    seasonObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          isSeasonItemLoaded.value = true
          seasonObserver?.disconnect()
          seasonObserver = null
          break
        }
      }
    }, {
      rootMargin: '10px',
      threshold: 0
    })
    seasonObserver.observe(seasonContainerRef.value)
  } else {
    isSeasonItemLoaded.value = true
  }
})

onUnmounted(() => {
  if (seasonObserver) {
    seasonObserver.disconnect()
    seasonObserver = null
  }
})
</script>

<template>
  <Banner>
    <v-card class="portal-banner overflow-hidden position-relative">
      <template v-slot:image>

        <div class="portal-banner-looping-video w-100 opacity-100">
          <video autoplay playsinline
                 muted loop type="video/mp4"
                 src="@/assets/videos/crimsonWaters.webm"></video>
        </div>
      </template>

      <div class="portal-banner-top"></div>

      <div class="portal-season-left-tip" v-if="currentlySeason && currentlySeason.id">
        <div class="opacity-60">
          <p>{{ t('portal.seasonTimer', {seasonName: (currentlySeason as any).alternativeName.toUpperCase(), day: time.calcRemainingDays(currentlySeason.endDate)}) }}</p>
          <v-divider thickness="3" vertical/>
          <p>{{ t(`snb.seasons.${currentlySeason?.id}`) }}</p>
        </div>
      </div>
    </v-card>
  </Banner>

  <div>
    <div class="portal-body overflow-hidden position-relative pl-3 pr-3 pt-10">
      <v-container>
        <v-row>
          <v-col cols="12" md="8" lg="8">
            <v-row justify="start" dense>
              <v-col cols="12" sm="6" md="4" lg="4"
                     :class="{'opacity-30': !i.to}"
                     v-for="(i,index) in appFuns.list" :key="index">
                <router-link :to="i.to">
                  <v-row dense class="py-2 h-100">
                    <v-col cols="auto">
                      <v-avatar tile size="45" class="d-flex align-start justify-start">
                        <v-icon :icon="i.icon" size="40"></v-icon>
                      </v-avatar>
                    </v-col>
                    <v-col>
                      <p class="u mb-1 text-amber">{{ t(i.title) }}</p>
                      <p class="font-weight-light opacity-60">{{ t(i.description) }}</p>
                    </v-col>
                  </v-row>
                </router-link>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" sm="4" md="4">
            <v-card variant="text"
                    class="title h-100 d-flex flex-column">
              <h1 class="text-h6 text-amber pb-2">{{ t('name') }}</h1>
              <p class="font-weight-light opacity-50 portrait-description">{{ t('portal.portraitDescription', {name: t('name')}) }}</p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <div class="portal-body bg-black mt-10 pl-3 pr-3 pt-10 pb-10">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="4" lg="4">
            <QQBotBannerWidget :is-show-detail="true" layout="vertical"/>
          </v-col>
          <v-col cols="12" md="8" lg="8">
            <QQBotShowcaseWidget/>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <div class="portal-body pt-5 pb-5">
      <v-container>
        <v-row>
          <v-col cols="12" md="4" lg="4">
            <AffixContainerView>
              <div class="d-flex flex-column justify-space-between">
                <h1 class="text-h6 text-amber pb-2">{{ t(`snb.seasons.${currentlySeason?.id}`) }}</h1>
                <p class="font-weight-light opacity-60">{{ t(`snb.calendar.${currentlySeason?.id}.description`) }}</p>
              </div>
            </AffixContainerView>
          </v-col>
          <v-col cols="12" md="8" lg="8">
            <div ref="seasonContainerRef" class="new-season-lazy-container position-relative">
              <template v-if="isSeasonItemLoaded">
                <NewSeasonShowItem></NewSeasonShowItem>
              </template>
              <template v-else>
                <v-card class="bg-black pa-6 text-center d-flex flex-column align-center justify-center rounded-lg" min-height="240">
                  <div class="d-flex align-center ga-2 mb-2">
                    <Loading size="99"></Loading>
                  </div>
                </v-card>
              </template>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- 捐助者 S -->
    <DonorsWidget v-if="false"></DonorsWidget>
    <!-- 捐助者 E -->

    <div class="portal-body bg-black pt-5 pb-5">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="4" lg="4">
            <AffixBoxHasTitleView>
              <p class="mb-2 opacity-60 text-caption" v-html="t('portal.appVersionContext')"></p>

              <AppVersionWidget></AppVersionWidget>

              <template v-slot:title>{{ t('portal.appVersionLog') }}</template>
            </AffixBoxHasTitleView>
          </v-col>
          <v-col cols="12" sm="12" md="8" lg="8">
            <AffixBoxHasTitleView>
              <BlogWidget></BlogWidget>

              <template v-slot:title>
                {{ t('portal.blogLog') }}

                <div class="mt-3">
                  <a href="https://help.glow-prow.top/blog" target="_blank">
                    {{ t('codex.more') }}
                  </a>
                </div>
              </template>
            </AffixBoxHasTitleView>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<style scoped lang="less">
.portrait-description {
  white-space: pre-line;
  line-height: 1.9;
}

.portal-banner {
  height: calc(100vh - 400px);
  min-height: 400px;
  max-height: 600px;
  position: relative;
  z-index: 5;
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
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;

    &:after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      background: #000;
      opacity: .2;
    }

    video {
      position: absolute;
      inset: 0;
      z-index: 0;
      width: 100%;
      height: 100%;
      // 任意屏幕比例下都铺满容器，超出部分按中心裁切
      object-fit: cover;
      object-position: center;
    }
  }

  .portal-banner-top {
    position: relative;
    padding-left: 30px;
    padding-top: 100px;
  }

  .portal-season-left-tip {
    position: absolute;
    top: 0;
    right: 0;
    padding-top: calc(80px + 3vh);
    padding-left: 3vh;
    padding-right: 3vh;
    height: auto;
    font-size: 18px;

    > div {
      writing-mode: vertical-rl;
      display: inline-flex;
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
  background: rbga(var(--v-theme-background));
  z-index: 10;
  border-radius: 20px 20px 10px 10px;
}

@media screen and (max-width: 980px) {
  .portal-banner {
    .title {
      margin-bottom: 50px;
      max-width: 80% !important;
    }
  }
}
</style>
