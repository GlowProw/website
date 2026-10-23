<script setup lang="ts">
/**
 * 事态视图主入口
 * 采用一级分类选项卡与二级垂直选项卡联动的层级布局（对齐设置页设计规范）
 */
import {computed} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useDisplay} from "vuetify/framework";
import {useI18n} from "vue-i18n";
import {useTooltipFollow} from "@/assets/sripts/use_tooltip_follow";

import Silk from "@/components/Silk.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import VerticalScrollList from "@/components/VerticalScrollList.vue";

import type {StatisticsTabItem} from "@/assets/types/Statistics";

const route = useRoute(),
    router = useRouter(),
    {mobile} = useDisplay(),
    {t} = useI18n(),
    {tooltipPos, onMouseMove, onMouseEnter} = useTooltipFollow()

const statisticsTabs: StatisticsTabItem[] = [
  {
    name: 'statistics.season.title',
    value: 'StatisticsSeason',
    icon: 'mdi-trophy-outline'
  },
  {
    name: 'statistics.codex.title',
    value: 'StatisticsCodex',
    icon: 'mdi-bookshelf'
  },
  {
    name: 'statistics.signin.title',
    value: 'StatisticsSignin',
    icon: 'mdi-calendar-check-outline'
  },
]

/**
 * 当前激活的一级分类，统计栏目下仅有一级「统计」
 */
const primaryNavMenu = computed(() => 'StatisticsOverview')

/**
 * 依据当前路由计算激活的二级 Tab
 */
const tab = computed(() => {
  const currentName = (route.name as string) || ''
  const match = statisticsTabs.find(item => item.value === currentName)
  return match ? match.value : statisticsTabs[0].value
})

/**
 * 切换二级 Tab
 * @param targetRouteName 目标路由名
 */
const onTabChange = (targetRouteName: any) => {
  if (targetRouteName && targetRouteName !== route.name) {
    router.push({name: targetRouteName, params: {lang: route.params.lang}})
  }
}

defineOptions({
  name: 'StatisticsView'
})
</script>

<template>
  <v-card min-height="200px" class="d-flex flex-column justify-space-between">
    <template v-slot:image>
      <Silk
          :speed="3"
          :scale=".7"
          :color="'#1c1c1c'"
          :noise-intensity="0.1"
          :rotation="-.6"
          class="bg-black">
      </Silk>
    </template>
    <template v-slot:default>
      <v-breadcrumbs density="compact" class="ma-0 pa-0">
        <v-container>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('statistics.title') }}</v-breadcrumbs-item>
        </v-container>
      </v-breadcrumbs>
      <v-divider opacity=".01"></v-divider>

      <v-container class="pa-2 position-relative">
        <div class="position-absolute top-0 right-0 opacity-10 d-flex ga-2">
          <v-icon icon="mdi-chart-box-outline" size="200"></v-icon>
        </div>
      </v-container>

      <!-- 一级导航栏 S -->
      <v-container class="pa-0 px-2 mt-auto d-flex align-end">
        <v-row density="compact" align="end">
          <v-col cols="12">
            <v-tabs
                :model-value="primaryNavMenu"
                color="amber"
                stacked
                align-tabs="start"
                density="comfortable"
                class="primary-tabs statistics-tabs-primary">
              <v-tab value="StatisticsOverview"
                     class="font-weight-bold text-subtitle-1 px-8"
                     :class="{'v-tab--route-active': primaryNavMenu === 'StatisticsOverview'}"
                     :to="{ name: statisticsTabs[0].value, params: { lang: route.params.lang } }">
                {{ t('statistics.group') }}
              </v-tab>
            </v-tabs>
          </v-col>
        </v-row>
      </v-container>
      <!-- 一级导航栏 E -->
    </template>
  </v-card>
  <v-divider opacity=".06"></v-divider>

  <div class="statistics-root">
    <div class="statistics-page-root">
      <v-container>
        <div :class="{'d-flex flex-row': !mobile}">
          <div :class="{'mb-10 statistics-tabs-box-mobile': mobile, 'statistics-tabs-box-desktop': !mobile}">
            <AffixContainerView :scrollable="!mobile ? false : true">
              <VerticalScrollList
                  :disabled="mobile"
                  :is-indicator="false"
                  :show-controls="false"
                  :force-draggable="false"
                  :wheel-scroll="true"
                  height="100%">
                <!-- 二级导航栏 S -->
                <v-tabs
                    stacked
                    border
                    hide-slider
                    :show-arrows="false"
                    :model-value="tab"
                    class="w-100 secondary-tabs statistics-tabs-secondary"
                    density="default"
                    @update:model-value="onTabChange"
                    :fixed="mobile"
                    :direction="!mobile ? 'vertical' : 'horizontal'">
                  <template v-for="(i, index) in statisticsTabs" :key="index">
                    <v-tooltip content-class="pa-0" :target="[tooltipPos.x, tooltipPos.y]">
                      <template v-slot:default>
                        <v-card border class="py-3 px-10">
                          {{ t(i.name) }}
                        </v-card>
                      </template>
                      <template v-slot:activator="{props}">
                        <div :class="{'mb-2': !mobile, 'mr-5': mobile}">
                          <v-tab :value="i.value"
                                 selected-class="bg-amber"
                                 class="d-flex align-center justify-center"
                                 min-width="80"
                                 width="80"
                                 height="80"
                                 border
                                 @mousemove="onMouseMove"
                                 @mouseenter="onMouseEnter"
                                 v-bind="props"
                                 replace
                                 ripple
                                 slim>
                            <div>
                              <v-icon size="40">{{ i.icon }}</v-icon>
                            </div>
                          </v-tab>
                          <p class="mt-1 mb-3 text-center singe-line w-100 statistics-tab-item" :title="t(i.name)">
                            {{ t(i.name) }}
                          </p>
                        </div>
                      </template>
                    </v-tooltip>
                  </template>
                </v-tabs>
                <!-- 二级导航栏 E -->
              </VerticalScrollList>
            </AffixContainerView>
          </div>

          <div class="statistics-content flex-grow-1 flex-shrink-1 w-100 pl-lg-5">
            <router-view></router-view>
          </div>
        </div>
      </v-container>
    </div>
  </div>
</template>

<style scoped lang="less">
@import "@/assets/styles/tabs-nav.less";

.tabs-nav-control();

.statistics-root {
  .statistics-tabs-primary {
    border-bottom: none;
  }

  .statistics-page-root {
    .statistics-tabs-box-mobile {
      height: auto;

      .statistics-tab-item {
        max-width: 80px;
      }
    }

    .statistics-tabs-box-desktop {
      width: 80px;
      min-width: 80px;
      flex-shrink: 0;
    }

    .statistics-content {
      min-width: 0;
      width: 100%;
      min-height: 80vh;
    }
  }
}
</style>
