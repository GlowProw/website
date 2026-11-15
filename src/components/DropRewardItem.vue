<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TimeBasedDrop } from '@/assets/types/Drop';
import { matchDropReward } from '@/assets/sripts/drop_reward_matcher';

import Loading from '@/components/Loading.vue';
import ItemSlotBase from '@/components/snbWidget/ItemSlotBase.vue';
import ItemSlotCard from '@/components/snbWidget/ItemSlotCard.vue';

// 道具图标组件
import ItemIconWidget from '@/components/snbWidget/itemIconWidget.vue';
import CosmeticIconWidget from '@/components/snbWidget/cosmeticIconWidget.vue';
import MaterialIconWidget from '@/components/snbWidget/materialIconWidget.vue';
import CommoditieIconWidget from '@/components/snbWidget/commoditieIconWidget.vue';
import ModIconWidget from '@/components/snbWidget/modIconWidget.vue';
import ShipIconWidget from '@/components/snbWidget/shipIconWidget.vue';
import UltimateIconWidget from '@/components/snbWidget/ultimateIconWidget.vue';
import SetIconWidget from '@/components/snbWidget/setIconWidget.vue';
import MapLocationIconWidget from '@/components/snbWidget/mapLocationIconWidget.vue';
import MasteryIconWidget from '@/components/snbWidget/masteryIconWidget.vue';
import EnemiesIconWidget from '@/components/snbWidget/enemiesIconWidget.vue';

// 道具名称组件
import ItemName from '@/components/snbWidget/itemName.vue';
import CosmeticName from '@/components/snbWidget/cosmeticName.vue';
import MaterialName from '@/components/snbWidget/materialName.vue';
import CommoditieName from '@/components/snbWidget/commoditieName.vue';
import ModName from '@/components/snbWidget/modName.vue';
import ShipName from '@/components/snbWidget/shipName.vue';
import UltimateName from '@/components/snbWidget/ultimateName.vue';
import SetName from '@/components/snbWidget/setName.vue';
import MapLocationName from '@/components/snbWidget/mapLocationName.vue';
import MasteryName from '@/components/snbWidget/masteryName.vue';
import EnemiesName from '@/components/snbWidget/enemiesName.vue';

const props = withDefaults(
  defineProps<{
    drop: TimeBasedDrop;
    index?: number;
    bannerImage?: string;
  }>(),
  {
    index: 0,
    bannerImage: '',
  }
);

const emit = defineEmits<{
  (e: 'preview', imgUrl?: string, title?: string, index?: number): void;
}>();

const { t, messages } = useI18n();

// 检索匹配的游戏实体
const matched = computed(() => {
  return matchDropReward(props.drop, messages.value);
});

// 回退模式展示的名称
const fallbackTitle = computed(() => props.drop.benefits?.[0]?.name || props.drop.name || '');

// 回退模式展示的图片
const fallbackImage = computed(() => props.drop.benefits?.[0]?.imageAssetURL || props.bannerImage || '/favicon.ico');

/**
 * 格式化所需时长文案
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

/**
 * 处理卡片点击预览事件
 */
const onCardClick = () => {
  emit('preview', fallbackImage.value, fallbackTitle.value, props.index);
};

defineOptions({
  name: 'DropRewardItem',
});
</script>

<template>
  <div class="reward-card d-flex flex-column rounded-lg px-3 h-100 position-relative" @click="onCardClick">
    <!-- 检索成功渲染匹配条目 S -->
    <template v-if="matched">
      <!-- 图标槽位容器 S -->
      <div class="reward-img-wrap reward-slot-wrap rounded-lg mb-3 d-flex align-center justify-center overflow-hidden">
        <ItemSlotBase
            :id="matched.id"
            :collect-type="matched.type"
            :collect-id="matched.id"
            :is-auto-size="false"
            size="100%"
            :padding="0"
            class="w-100 h-100 d-flex align-center justify-center">
          <CosmeticIconWidget v-if="matched.type === 'cosmetic'" :id="matched.id" />
          <ItemIconWidget v-else-if="matched.type === 'item'" :id="matched.id" />
          <MaterialIconWidget v-else-if="matched.type === 'material'" :id="matched.id" />
          <CommoditieIconWidget v-else-if="matched.type === 'commodity'" :id="matched.id" />
          <ModIconWidget v-else-if="matched.type === 'modification'" :id="matched.id" />
          <ShipIconWidget v-else-if="matched.type === 'ship'" :id="matched.id" />
          <UltimateIconWidget v-else-if="matched.type === 'ultimate'" :id="matched.id" />
          <SetIconWidget v-else-if="matched.type === 'set'" :id="matched.id" />
          <MapLocationIconWidget v-else-if="matched.type === 'mapLocation'" :id="matched.id" />
          <MasteryIconWidget v-else-if="matched.type === 'mastery'" :id="matched.id" />
          <EnemiesIconWidget v-else-if="matched.type === 'enemy'" :id="matched.id" />
        </ItemSlotBase>
      </div>
      <!-- 图标槽位容器 E -->

      <!-- 奖励信息 S -->
      <div class="d-flex flex-column flex-grow-1 justify-space-between">
        <div class="u font-weight-bold text-body-2 text-white line-clamp-2 mb-2">
          <CosmeticName v-if="matched.type === 'cosmetic'" :id="matched.id" />
          <ItemName v-else-if="matched.type === 'item'" :id="matched.id" />
          <MaterialName v-else-if="matched.type === 'material'" :id="matched.id" />
          <CommoditieName v-else-if="matched.type === 'commodity'" :id="matched.id" />
          <ModName v-else-if="matched.type === 'modification'" :id="matched.id" />
          <ShipName v-else-if="matched.type === 'ship'" :id="matched.id" />
          <UltimateName v-else-if="matched.type === 'ultimate'" :id="matched.id" />
          <SetName v-else-if="matched.type === 'set'" :id="matched.id" />
          <MapLocationName v-else-if="matched.type === 'mapLocation'" :id="matched.id" />
          <MasteryName v-else-if="matched.type === 'mastery'" :id="matched.id" />
          <EnemiesName v-else-if="matched.type === 'enemy'" :id="matched.id" />
        </div>

        <div class="d-flex align-center justify-space-between mt-auto">
          <v-chip size="x-small" variant="tonal" class="font-weight-medium">
            <v-icon icon="mdi-clock-outline" start size="12" class="mr-1"></v-icon>
            {{ formatMinutes(drop.requiredMinutesWatched) }}
          </v-chip>

          <span class="text-caption text-disabled">#{{ (index ?? 0) + 1 }}</span>
        </div>
      </div>
      <!-- 奖励信息 E -->
    </template>
    <!-- 检索成功渲染匹配条目 E -->

    <!-- 未匹配时回退使用原始数据 S -->
    <template v-else>
      <!-- 回退图片容器 S -->
      <div class="reward-img-wrap img-wrap rounded-lg mb-3 d-flex align-center justify-center overflow-hidden">
        <ItemSlotBase
          :is-auto-size="false"
          size="100%"
          :padding="0"
          class="w-100 h-100 d-flex align-center justify-center">
          <ItemSlotCard
              :padding="0"
              :margin="0"
              :is-auto-padding="false"
              :is-auto-margin="false"
              class="w-100 h-100">
            <v-img
                :src="fallbackImage"
                :alt="fallbackTitle"
                width="100%"
                height="100%"
                aspect-ratio="1"
                class="reward-img w-100 h-100"
                cover>
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height bg-grey-darken-4">
                  <Loading size="28" />
                </div>
              </template>
              <template v-slot:error>
                <div class="d-flex align-center justify-center fill-height bg-grey-darken-4">
                  <v-icon icon="mdi-gift-outline" size="28" color="grey" />
                </div>
              </template>
            </v-img>
          </ItemSlotCard>
        </ItemSlotBase>
      </div>
      <!-- 回退图片容器 E -->

      <!-- 回退名称与时长 S -->
      <div class="d-flex flex-column flex-grow-1 justify-space-between">
        <p class="u font-weight-bold text-body-2 text-white line-clamp-2 mb-2">
          {{ fallbackTitle }}
        </p>

        <div class="d-flex align-center justify-space-between mt-auto">
          <v-chip size="x-small" variant="tonal" class="font-weight-medium">
            <v-icon icon="mdi-clock-outline" start size="12" class="mr-1"></v-icon>
            {{ formatMinutes(drop.requiredMinutesWatched) }}
          </v-chip>

          <span class="text-caption text-disabled">#{{ (index ?? 0) + 1 }}</span>
        </div>
      </div>
      <!-- 回退名称与时长 E -->
    </template>
    <!-- 未匹配时回退使用原始数据 E -->
  </div>
</template>

<style scoped lang="less">
.reward-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.reward-img-wrap {
  width: 100%;
  aspect-ratio: 1;

  :deep(.item-base-slot) {
    width: 100% !important;
    height: 100% !important;
    min-width: 100% !important;
    min-height: 100% !important;
  }

  :deep(.item-slot-card) {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
  }

  :deep(.reward-img) {
    width: 100% !important;
    height: 100% !important;
  }
}

.reward-slot-wrap {
  :deep(.item-base-slot) {
    width: 100% !important;
    height: 100% !important;
    min-width: 100% !important;
    min-height: 100% !important;
  }
}
</style>

