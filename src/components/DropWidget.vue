<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify';
import type { DropCampaignData, TimeBasedDrop, StreamerChannel } from '@/assets/types';
import { useMediaViewerStore, type MediaViewerItem } from '~/stores/mediaViewerStore';

import CountdownWidget from '@/components/CountdownWidget.vue';
import DropRewardItem from '@/components/DropRewardItem.vue';

const props = withDefaults(
    defineProps<{
      campaign: DropCampaignData;
      isActiveCard?: boolean;
    }>(),
    {
      isActiveCard: false,
    }
);

const { t } = useI18n();
const { mobile } = useDisplay();
const mediaViewerStore = useMediaViewerStore();

// 规范化字段访问
const detailsLink = computed(() => props.campaign.detailsUrl || props.campaign.detailsURL || '');
const bannerImage = computed(() => props.campaign.imageUrl || props.campaign.imageURL || '');
const dropList = computed<TimeBasedDrop[]>(() => props.campaign.drops || props.campaign.timeBasedDrops || []);
const streamerList = computed<StreamerChannel[]>(() => props.campaign.channels || []);

/**
 * 状态计算
 */
const campaignStatus = computed(() => {
  if (props.campaign.status) return props.campaign.status;

  const now = new Date();
  const start = props.campaign.startAt ? new Date(props.campaign.startAt) : null;
  const end = new Date(props.campaign.endAt);

  if (start && now < start) return 'upcoming';
  if (now <= end) return 'active';

  return 'ended';
});

/**
 * 格式化时间范围
 */
const formattedDateRange = computed(() => {
  const formatTime = (dStr?: string) => {
    if (!dStr) return '';
    const d = new Date(dStr);

    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d
        .getDate()
        .toString()
        .padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
  };

  const s = formatTime(props.campaign.startAt);
  const e = formatTime(props.campaign.endAt);

  if (s && e) return `${s} ~ ${e}`;
  if (e) return `截至 ${e}`;

  return '';
});

/**
 * 当奖励道具少于 6 个时，计算占位卡片所需跨越的栅格列数（一行 6 个，每格占 2 列）
 */
const remainingCols = computed(() => {
  const count = dropList.value.length;
  if (count >= 6) return 0;
  return (6 - count) * 2;
});

/**
 * 格式化所需观看时长文案
 *
 * @param minutes 所需观看时长（分钟）
 */
const formatMinutes = (minutes?: number) => {
  if (!minutes) return t('drop.duration.instant', '即时获得');
  if (minutes < 60) return t('drop.duration.watchMinutes', { minutes });

  const hours = minutes / 60;
  if (Number.isInteger(hours)) {
    return t('drop.duration.watchHours', { hours });
  }

  return t('drop.duration.watchHoursMinutes', { hours: hours.toFixed(1), minutes });
};

// 当前活动全部奖励媒体画廊列表
const mediaItems = computed<MediaViewerItem[]>(() => {
  return dropList.value
    .map((drop, idx): MediaViewerItem | null => {
      const src = drop.benefits?.[0]?.imageAssetURL || bannerImage.value;
      const title = drop.benefits?.[0]?.name || drop.name || `${props.campaign.name} #${idx + 1}`;
      if (!src) return null;
      return {
        src,
        type: 'image',
        title,
        description: drop.requiredMinutesWatched
          ? formatMinutes(drop.requiredMinutesWatched)
          : undefined,
      };
    })
    .filter((item): item is MediaViewerItem => Boolean(item && item.src));
});

/**
 * 阅览掉落奖品媒体大图（使用全局 MediaViewer 查看器）
 *
 * @param imgUrl 备选图片地址
 * @param title 奖品标题
 * @param index 奖品序号索引
 */
const openPreview = (imgUrl?: string, title?: string, index: number = 0) => {
  if (mediaItems.value.length > 0) {
    const targetIdx = index >= 0 && index < mediaItems.value.length ? index : 0;
    mediaViewerStore.open(mediaItems.value, targetIdx);
    return;
  }

  if (!imgUrl) return;
  mediaViewerStore.open([
    {
      src: imgUrl,
      type: 'image',
      title: title || props.campaign.name,
    },
  ]);
};

defineOptions({
  name: 'DropWidget',
});
</script>

<template>
  <v-card
      variant="text"
      class="drop-widget transition-swing"
      :class="{
        'drop-widget--active': campaignStatus === 'active',
        'drop-widget--ended': campaignStatus === 'ended',
      }"
      elevation="0">
    <!-- 奖励道具列表 S -->
    <v-card-text class="px-2 px-sm-2">
      <v-row>
        <v-col cols="12" lg="3">
          <div class="drop-header-cover position-relative overflow-hidden ">
            <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
              <!-- 状态标签 -->
              <div class="d-flex align-center ga-2">
                <v-chip
                    v-if="campaignStatus === 'active'"
                    color="success"
                    variant="flat"
                    size="small"
                    class="font-weight-bold px-3 pulse-chip">
                  <v-icon start icon="mdi-broadcast" size="14" class="mr-1"></v-icon>
                  {{ t('drop.active') }}
                </v-chip>

                <v-chip
                    v-else-if="campaignStatus === 'upcoming'"
                    color="amber-darken-1"
                    variant="flat"
                    size="small"
                    class="font-weight-bold px-3">
                  <v-icon start icon="mdi-clock-outline" size="14" class="mr-1"></v-icon>
                  {{ t('drop.upcoming') }}
                </v-chip>

                <v-chip
                    v-else
                    color="grey-darken-2"
                    variant="flat"
                    size="small"
                    class="font-weight-bold px-3">
                  <v-icon start icon="mdi-check-circle-outline" size="14" class="mr-1"></v-icon>
                  {{ t('drop.ended') }}
                </v-chip>
              </div>

              <!-- 通用倒计时组件 -->
              <CountdownWidget
                  :target="campaign.endAt"
                  :start-at="campaign.startAt"
                  :status="campaignStatus"
                  class-name="text-caption font-weight-medium text-emerald-glow ml-1" />
            </div>

            <!-- 活动主标题与周期 -->
            <h2 class="text-h6 text-sm-h6 font-weight-bold text-white mb-2 line-clamp-2">
              <span class="u">{{ campaign.name }}</span>

              <!-- 官方详情链接 -->
              <v-btn
                  v-if="detailsLink && !isActiveCard"
                  :href="detailsLink"
                  target="_blank"
                  variant="tonal"
                  size="small"
                  density="comfortable"
                  class="text-caption text-none"
                  icon="mdi-open-in-new">
              </v-btn>
            </h2>

            <div class="d-flex align-center justify-space-between mb-4">
              <div class="text-subtitle-1 font-weight-bold text-amber d-flex align-center">
                {{ t('drop.rewards') }}
                <v-chip size="x-small" color="amber" variant="outlined" class="ml-2 font-weight-bold">
                  {{ dropList.length }} {{ t('drop.items') }}
                </v-chip>
              </div>
            </div>

            <div class="d-flex align-center text-caption text-medium-emphasis ga-2">
              <v-icon icon="mdi-calendar-range" size="16"></v-icon>
              <span>{{ formattedDateRange }}</span>
            </div>
          </div>
        </v-col>
        <v-col cols="12" lg="9">
          <!-- 奖励道具卡片网格 -->
          <v-row density="compact">
            <v-col
                v-for="(drop, dIdx) in dropList"
                :key="drop.id || dIdx"
                cols="12"
                sm="6"
                md="2"
                lg="2">
              <DropRewardItem
                  :drop="drop"
                  :index="dIdx"
                  :banner-image="bannerImage"
                  @preview="openPreview" />
            </v-col>

            <!-- 占位虚线边框卡片（当少于 6 个时填满本行剩余列；大于等于 6 个时不显示） -->
            <v-col
                v-if="remainingCols > 0 && !mobile"
                cols="12"
                :sm="dropList.length % 2 === 1 ? 6 : 12"
                :md="remainingCols"
                :lg="remainingCols">
              <v-card
                  variant="text"
                  class="reward-placeholder-card d-flex flex-column align-center justify-center rounded-lg pa-4 h-100 text-center">
                <v-icon icon="mdi-dots-horizontal" size="26" class="text-disabled mb-1 opacity-50"></v-icon>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>
    <!-- 奖励道具列表 E -->
  </v-card>
</template>

<style scoped lang="less">
.reward-placeholder-card {
  border: 1px dashed rgba(255, 255, 255, 0.1) !important;
  min-height: 140px;
}
</style>
