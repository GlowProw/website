<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHead } from '@unhead/vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import Silk from '@/components/Silk.vue';
import DropWidget from '@/components/DropWidget.vue';
import { apis } from '@/assets/sripts';
import AffixBoxHasTitleView from "@/components/AffixBoxHasTitleView.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";

const { t } = useI18n();
const dropApi = apis.dropApi();

// SEO Meta
useHead({
  title: `${t('drop.title')} | ${t('name')}`,
  meta: [
    {
      name: 'description',
      content: t('drop.meta.description'),
    },
    {
      name: 'keywords',
      content: t('drop.meta.keywords'),
    },
  ],
});

// 数据状态
const currentLoading = ref(true);
const historyLoading = ref(true);
const refreshing = ref(false);

const activeCampaigns = ref<any[]>([]);
const activeStreams = ref<any[]>([]);
const historyList = ref<any[]>([]);
const historyTotal = ref(0);
const historyPage = ref(1);
const historyPageSize = ref(10);
const historyStatus = ref('all');
const historyKeyword = ref('');

// 统计数据
const totalCampaignsCount = computed(() => {
  return historyTotal.value || activeCampaigns.value.length;
});

const totalRewardsCount = computed(() => {
  return historyList.value.reduce((acc, cur) => acc + (cur.totalDrops || cur.drops?.length || 0), 0);
});

// 获取当前正在生效的掉宝
const fetchCurrentDrops = async (isRefresh = false) => {
  if (isRefresh) refreshing.value = true;
  else currentLoading.value = true;

  try {
    const res = await dropApi.getCurrent(isRefresh);
    const payload = res?.data?.data || res?.data || res;
    if (payload) {
      activeStreams.value = payload.activeStreams || [];
      const rawCampaigns = payload.campaigns || [];
      // 若战役内未关联主播，但当前有开播主播，则补充兜底关联主播
      activeCampaigns.value = rawCampaigns.map((c: any) => ({
        ...c,
        channels: (c.channels && c.channels.length > 0) ? c.channels : activeStreams.value,
      }));
    }
  } catch (err) {
    console.error('获取当前掉宝失败:', err);
  } finally {
    currentLoading.value = false;
    refreshing.value = false;
  }
};

// 获取掉宝历史记录
const fetchHistoryDrops = async () => {
  historyLoading.value = true;
  try {
    const res = await dropApi.getHistory({
      page: historyPage.value,
      pageSize: historyPageSize.value,
      status: historyStatus.value,
      keyword: historyKeyword.value.trim() || undefined,
    });

    const payload = res?.data?.data || res?.data || res;
    if (payload) {
      historyList.value = payload.list || [];
      historyTotal.value = payload.total || 0;
    }
  } catch (err) {
    console.error('获取掉宝历史失败:', err);
  } finally {
    historyLoading.value = false;
  }
};

const handleRefresh = async () => {
  await Promise.all([fetchCurrentDrops(true), fetchHistoryDrops()]);
};

// 监听筛选变化
watch([historyPage, historyStatus], () => {
  fetchHistoryDrops();
});

let searchDebounceTimer: any = null;
watch(historyKeyword, () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    historyPage.value = 1;
    fetchHistoryDrops();
  }, 400);
});

onMounted(() => {
  fetchCurrentDrops();
  fetchHistoryDrops();
});
</script>

<template>
  <v-app id="drop-page" class="drop-page-root">
    <Header></Header>

    <v-main class="pb-16">
      <v-card height="200px">
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
          <v-container class="pa-2 mt-4 position-relative">
            <v-breadcrumbs>
              <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
              <v-breadcrumbs-divider></v-breadcrumbs-divider>
              <v-breadcrumbs-item><v-icon icon="mdi-twitch" color="#9146FF" size="18"></v-icon> {{ t('drop.heroTitle') }}</v-breadcrumbs-item>
            </v-breadcrumbs>

            <p class="ml-4 text-body-1 text-medium-emphasis w-50 mb-0">
              {{t('drop.heroSubtitle') }}
            </p>

            <div class="position-absolute top-0 right-0 opacity-10 pt-10 d-flex ga-2">
              <v-icon icon="mdi-twitch" size="120"></v-icon>
            </div>
          </v-container>
        </template>
      </v-card>
      <v-divider></v-divider>

      <div class="bg-black">
        <v-container>
          <v-row class="text-center" align="center">
            <v-col>
              <!-- 概览指标卡片 -->
              <v-row dense>
                <v-col cols="12" sm="4">
                  <div class="rounded-xl d-flex align-center">
                    <div>
                      <div class="text-caption text-medium-emphasis">
                        {{ t('drop.statActive') }}
                      </div>
                      <div class="text-h5 font-weight-bold text-white">
                        {{ activeCampaigns.length }} {{ t('drop.unitCampaign') }}
                      </div>
                    </div>
                  </div>
                </v-col>
                <v-divider vertical inset></v-divider>
                <v-col cols="12" sm="4">
                  <div class="rounded-xl d-flex align-center">
                    <div>
                      <div class="text-caption text-medium-emphasis">
                        {{ t('drop.statHistory') }}
                      </div>
                      <div class="text-h5 font-weight-bold text-white">
                        {{ historyTotal }} {{ t('drop.unitCampaign') }}
                      </div>
                    </div>
                  </div>
                </v-col>
                <v-divider vertical inset></v-divider>
                <v-col cols="12" sm="4">
                  <div class="rounded-xl d-flex align-center">
                    <div>
                      <div class="text-caption text-medium-emphasis">
                        {{ t('drop.statRewards') }}
                      </div>
                      <div class="text-h5 font-weight-bold text-white">
                        {{ totalRewardsCount }} {{ t('drop.unitItems') }}
                      </div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-col>
            <v-spacer></v-spacer>
            <v-col cols="auto">
              <div class="d-flex flex-column flex-sm-row align-center justify-space-between ga-4">
                <div class="d-flex flex-wrap align-center ga-3 mt-4 mt-sm-0">
                  <v-btn
                      variant="flat"
                      prepend-icon="mdi-refresh"
                      :loading="refreshing"
                      @click="handleRefresh"
                      class="font-weight-bold">
                    {{ t('drop.refresh') }}
                  </v-btn>

                  <v-btn
                      href="https://www.twitch.tv/drops/inventory"
                      target="_blank"
                      variant="tonal"
                      prepend-icon="mdi-briefcase-outline"
                      append-icon="mdi-open-in-new"
                      class="font-weight-bold"
                  >
                    {{ t('drop.myInventory', 'Twitch 掉宝背包') }}
                  </v-btn>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <v-container class="position-relative z-index-1 max-w-1280 pt-6 pt-sm-10">
        <AffixBoxHasTitleView class="drop-section mb-12">
          <div>
            <!-- 加载中骨架屏 -->
            <div v-if="currentLoading" class="d-flex flex-column ga-4">
              <v-skeleton-loader
                  type="article, actions"
                  class="rounded-xl border bg-transparent"
              ></v-skeleton-loader>
            </div>

            <!-- 当前有生效活动 -->
            <div v-else-if="activeCampaigns.length > 0" class="d-flex flex-column ga-6">
              <DropWidget
                  v-for="camp in activeCampaigns"
                  :key="camp.id"
                  :campaign="camp"
                  :is-active-card="true"
              />
            </div>

            <!-- 当前暂无活动空状态 -->
            <v-card
                v-else
                class="empty-card rounded-xl pa-8 pa-sm-12 text-center border"
                elevation="2">
              <div class="empty-icon-wrap mx-auto mb-4 rounded-circle d-flex align-center justify-center">
                <v-icon icon="mdi-broadcast-off" size="40" color="grey"></v-icon>
              </div>
              <h3 class="text-h6 font-weight-bold text-white mb-2">
                {{ t('drop.noActiveTitle', '当前暂无生效中的 Twitch 掉宝活动') }}
              </h3>
              <p class="text-body-2 text-medium-emphasis max-w-560 mx-auto mb-6">
                {{
                  t(
                      'drop.noActiveSubtitle',
                      '育碧通常会在新赛季上线、重大内容更新或周末特别活动期间开启 Twitch Drops 掉宝。您可以浏览下方过往掉宝档案，或关注机器人通知。'
                  )
                }}
              </p>
              <div class="d-flex justify-center ga-3">
                <v-btn
                    href="https://www.twitch.tv/directory/category/skull-and-bones"
                    target="_blank"
                    variant="tonal"
                    color="#9146FF"
                    prepend-icon="mdi-twitch"
                    append-icon="mdi-open-in-new"
                >
                  {{ t('drop.visitTwitchDirectory', '浏览 Twitch 碧海黑帆专区') }}
                </v-btn>
              </div>
            </v-card>
          </div>
          <template v-slot:title>
            {{ t('drop.currentSectionTitle') }}
          </template>
        </AffixBoxHasTitleView>

        <AffixBoxHasTitleView class="drop-section">
          <AffixContainerView>
            <v-card border class="px-5 py-2 section-title-wrap d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-4">
              <div class="d-flex align-center ga-3">
                <v-chip size="small" variant="outlined" color="amber" class="font-weight-bold">
                  {{ historyTotal }} {{ t('drop.records') }}
                </v-chip>
              </div>

              <!-- 筛选与搜索工具栏 -->
              <div class="d-flex flex-wrap align-center ga-3">
                <!-- 状态切换 -->
                <v-btn-toggle
                    v-model="historyStatus"
                    mandatory
                    density="comfortable"
                    color="amber"
                    variant="outlined"
                    rounded="lg"
                >
                  <v-btn value="all" size="small">{{ t('drop.filterAll', '全部') }}</v-btn>
                  <v-btn value="ended" size="small">{{ t('drop.filterEnded', '已结束') }}</v-btn>
                  <v-btn value="active" size="small">{{ t('drop.filterActive', '进行中') }}</v-btn>
                </v-btn-toggle>

                <!-- 搜索框 -->
                <v-text-field
                    v-model="historyKeyword"
                    density="compact"
                    variant="outlined"
                    placeholder="搜索活动名称..."
                    prepend-inner-icon="mdi-magnify"
                    hide-details
                    clearable
                    rounded="lg"
                    class="search-input"
                ></v-text-field>
              </div>
            </v-card>
          </AffixContainerView>


          <!-- 加载中状态 -->
          <div v-if="historyLoading" class="d-flex flex-column ga-4">
            <v-skeleton-loader
              v-for="i in 3"
              :key="i"
              type="article, actions"
              class="rounded-xl border bg-transparent"
            ></v-skeleton-loader>
          </div>

          <!-- 历史列表数据 -->
          <div v-else-if="historyList.length > 0" class="d-flex flex-column ga-6 mt-4">
            <DropWidget
              v-for="camp in historyList"
              :key="camp.id || camp.campaignId"
              :campaign="camp"
              :is-active-card="camp.status === 'active'"
            />

            <!-- 分页器 -->
            <div
              v-if="Math.ceil(historyTotal / historyPageSize) > 1"
              class="d-flex justify-center mt-8">
              <v-pagination
                v-model="historyPage"
                :length="Math.ceil(historyTotal / historyPageSize)"
                :total-visible="5"
                rounded="circle"
                color="amber"
              ></v-pagination>
            </div>
          </div>

          <!-- 历史列表空状态 -->
          <v-card v-else class="empty-card rounded-xl pa-8 text-center border">
            <v-icon icon="mdi-file-search-outline" size="48" color="grey" class="mb-3"></v-icon>
            <div class="text-h6 font-weight-bold text-white mb-1">
              {{ t('drop.noHistoryFound', '未找到匹配的掉宝历史记录') }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ t('drop.tryClearFilter', '请尝试调整搜索关键词或状态筛选') }}
            </div>
          </v-card>

          <template v-slot:title>
            {{ t('drop.historySectionTitle') }}
          </template>
        </AffixBoxHasTitleView>
      </v-container>
    </v-main>

    <Footer></Footer>
  </v-app>
</template>

<style scoped lang="less">
</style>
