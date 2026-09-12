<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from 'vue-i18n';

interface DropBenefit {
  id: string;
  name: string;
  imageAssetURL?: string;
}

interface TimeBasedDrop {
  id: string;
  name: string;
  requiredMinutesWatched?: number;
  startAt?: string;
  endAt?: string;
  benefits?: DropBenefit[];
}

interface StreamerChannel {
  id: string;
  login: string;
  displayName: string;
  title?: string;
  viewersCount?: number;
  profileImageURL?: string;
}

interface DropCampaignData {
  id?: string | number;
  campaignId?: string;
  name: string;
  gameId?: string;
  gameName?: string;
  detailsUrl?: string;
  detailsURL?: string;
  imageUrl?: string;
  imageURL?: string;
  startAt?: string;
  endAt: string;
  status?: string;
  drops?: TimeBasedDrop[];
  timeBasedDrops?: TimeBasedDrop[];
  channels?: StreamerChannel[];
  totalDrops?: number;
  maxWatchMinutes?: number;
}

const props = withDefaults(
    defineProps<{
      campaign: DropCampaignData;
      isActiveCard?: boolean;
    }>(),
    {
      isActiveCard: false,
    }
);

const {t} = useI18n();

// 预览大图弹窗
const previewDialog = ref(false);
const previewImage = ref('');
const previewTitle = ref('');

const openPreview = (imgUrl?: string, title?: string) => {
  if (!imgUrl) return;
  previewImage.value = imgUrl;
  previewTitle.value = title || '';
  previewDialog.value = true;
};

// 规范化字段访问
const detailsLink = computed(() => props.campaign.detailsUrl || props.campaign.detailsURL || '');
const bannerImage = computed(() => props.campaign.imageUrl || props.campaign.imageURL || '');
const dropList = computed<TimeBasedDrop[]>(() => props.campaign.drops || props.campaign.timeBasedDrops || []);
const streamerList = computed<StreamerChannel[]>(() => props.campaign.channels || []);

// 状态计算
const campaignStatus = computed(() => {
  if (props.campaign.status) return props.campaign.status;
  const now = new Date();
  const start = props.campaign.startAt ? new Date(props.campaign.startAt) : null;
  const end = new Date(props.campaign.endAt);
  if (start && now < start) return 'upcoming';
  if (now <= end) return 'active';
  return 'ended';
});

// 格式化时间范围
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

// 剩余时间倒计时文本
const remainingTimeText = computed(() => {
  if (campaignStatus.value !== 'active') return '';
  const now = Date.now();
  const end = new Date(props.campaign.endAt).getTime();
  const diffMs = end - now;
  if (diffMs <= 0) return '即将截止';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `剩余 ${days} 天 ${hours} 小时`;
  if (hours > 0) return `剩余 ${hours} 小时 ${minutes} 分钟`;
  return `剩余 ${minutes} 分钟`;
});

// 格式化所需时长
const formatMinutes = (minutes?: number) => {
  if (!minutes) return '即时获得';
  if (minutes < 60) return `观看 ${minutes} 分钟`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `观看 ${hours} 小时` : `观看 ${hours.toFixed(1)} 小时 (${minutes}分钟)`;
};
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
    <!-- 奖励道具列表 -->
    <v-card-text class="pa-4 pa-sm-6">
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
                  {{ t('drop.active', '进行中') }}
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

              <p v-if="remainingTimeText"
                 class="text-caption font-weight-medium text-emerald-glow ml-1">
                {{ remainingTimeText }}
              </p>
            </div>

            <!-- 活动主标题与周期 -->
            <h2 class="text-h6 text-sm-h5 font-weight-bold text-white mb-2 line-clamp-2">
              {{ campaign.name }}
              <!-- 官方详情链接 -->
              <v-btn
                  v-if="detailsLink"
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
          <v-row dense>
            <v-col
                v-for="(drop, dIdx) in dropList"
                :key="drop.id || dIdx"
                cols="12"
                sm="3"
                md="3"
                lg="3">
              <v-card
                  class="reward-card d-flex flex-column rounded-lg pa-3 h-100 position-relative"
                  @click="
              openPreview(
                drop.benefits?.[0]?.imageAssetURL || bannerImage,
                drop.benefits?.[0]?.name || drop.name
              )
            ">
                <!-- 奖励图片容器 -->
                <div class="reward-img-wrap rounded-lg mb-3 d-flex align-center justify-center overflow-hidden">
                  <v-img
                      :src="drop.benefits?.[0]?.imageAssetURL || bannerImage || '/favicon.ico'"
                      :alt="drop.benefits?.[0]?.name || drop.name"
                      aspect-ratio="1"
                      class="reward-img"
                      cover>
                    <template v-slot:placeholder>
                      <div class="d-flex align-center justify-center fill-height bg-grey-darken-4">
                        <v-icon icon="mdi-gift-outline" size="28" color="grey"></v-icon>
                      </div>
                    </template>
                  </v-img>
                </div>

                <!-- 奖励信息 -->
                <div class="d-flex flex-column flex-grow-1 justify-space-between">
                  <div class="font-weight-bold text-body-2 text-white line-clamp-2 mb-2">
                    {{ drop.benefits?.[0]?.name || drop.name }}
                  </div>

                  <div class="d-flex align-center justify-space-between mt-auto">
                    <v-chip size="x-small" variant="flat" class="font-weight-medium">
                      <v-icon icon="mdi-clock-outline" start size="12"></v-icon>
                      {{ formatMinutes(drop.requiredMinutesWatched) }}
                    </v-chip>

                    <span class="text-caption text-disabled">#{{ dIdx + 1 }}</span>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- 弹窗放大预览大图 -->
    <v-dialog v-model="previewDialog" max-width="500">
      <v-card class="rounded-xl border pa-4 bg-grey-darken-4 text-center">
        <v-card-title class="text-h6 font-weight-bold text-white pb-3">
          {{ previewTitle }}
        </v-card-title>
        <div class="d-flex justify-center mb-4">
          <v-img
              :src="previewImage"
              max-height="360"
              class="rounded-lg border"
              contain
          ></v-img>
        </div>
        <v-card-actions class="justify-center pt-0">
          <v-btn variant="tonal" @click="previewDialog = false">
            {{ t('common.close', '关闭') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped lang="less">
</style>
