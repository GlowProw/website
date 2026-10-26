<template>
  <!-- 天梯卡片 S -->
  <v-card class="card-enlargement-mask-flavor pa-5" height="320">
    <v-row class="pt-2 px-1">
      <v-col>
        <router-link :to="`/ranking-designed-items/browse/${item.uuid}/detail`">
          <div :title="String(item.name || 'none')" class="text-amber text-h4 mb-1 font-weight-bold singe-line">
            {{ item.name || 'none' }}
          </div>
        </router-link>
        <v-row>
          <v-col cols="auto">
            <AccountCardWidget :id="item.userId">
              <div class="d-flex align-center">
                <v-card v-if="item.userAvatar && !item.attr?.isAnonymous" class="mr-1">
                  <UserAvatar size="20" :src="item.userAvatar"></UserAvatar>
                </v-card>
                <span class="u">{{ item.attr?.isAnonymous ? t('assembly.anonymous') : (item.username || t('assembly.anonymous')) }}</span>
              </div>
            </AccountCardWidget>
          </v-col>

          <v-spacer></v-spacer>

          <v-col cols="auto" class="d-flex ga-1">
            <v-chip density="compact" variant="text" :disabled="!!item.isLiked" v-if="showLikes">
              <v-icon color="red">{{ (item.likes || 0) <= 0 ? 'mdi-heart-outline' : 'mdi-heart' }}</v-icon>
              <span class="ml-1 text-red-accent-4">{{ item.likes || 0 }}</span>
            </v-chip>

            <v-divider vertical inset opacity=".5" thickness="1"></v-divider>

            <v-chip density="compact" variant="text">
              <v-icon color="blue-grey-lighten-3">{{ (item.browseCount || item.views || 0) <= 0 ? 'mdi-eye-outline' : 'mdi-eye' }}</v-icon>
              <span class="ml-1 text-blue-grey-lighten-3">{{ item.browseCount || item.views || 0 }}</span>
            </v-chip>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- 天梯阶梯预览 S -->
    <v-hover v-slot="{ isHovering, props: hoverProps }">
      <div v-bind="hoverProps" class="position-relative overflow-hidden rounded-lg my-2">
        <AssemblyTouring>
          <RankingDesignedView
              class="card-flavor mb-2"
              :readonly="true"
              ref="rankingViewRef">
          </RankingDesignedView>
        </AssemblyTouring>

        <router-link :to="`/ranking-designed-items/browse/${item.uuid}/detail`" target="_blank">
          <v-overlay scrim="#000" contained class="d-flex justify-center align-center" :model-value="!!isHovering">
            <v-icon icon="mdi-open-in-new" size="30"></v-icon>
          </v-overlay>
        </router-link>
      </div>
    </v-hover>
    <!-- 天梯阶梯预览 E -->

    <slot name="actions"></slot>
  </v-card>
  <!-- 天梯卡片 E -->
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import AccountCardWidget from "@/components/AccountCardWidget.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import RankingDesignedView from "@/components/RankingDesignedView.vue";
import AssemblyTouring from '@/components/AssemblyTouring.vue';

const props = withDefaults(defineProps<{
  item: any;
  showLikes?: boolean;
}>(), {
  showLikes: true,
});

const { t } = useI18n();

// 画布视图引用
const rankingViewRef = ref<any>(null);

/**
 * 载入天梯数据到画布视图
 */
const loadData = () => {
  if (rankingViewRef.value && props.item) {
    if (typeof rankingViewRef.value.setSetting === "function") {
      let rawAttr = props.item.ranking?.attr || props.item.attr || {};
      if (typeof rawAttr === "string") {
        try {
          rawAttr = JSON.parse(rawAttr);
        } catch {
          rawAttr = {};
        }
      }
      rankingViewRef.value.setSetting(rawAttr);
    }
    if (typeof rankingViewRef.value.onLoad === "function") {
      const raw = props.item.ranking || props.item.data || [];
      rankingViewRef.value.onLoad(raw);
    }
  }
};

onMounted(() => {
  nextTick(() => {
    requestAnimationFrame(() => {
      loadData();
    });
  });
});

watch(() => props.item, () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      loadData();
    });
  });
}, { deep: true });

defineExpose({
  rankingViewRef,
  loadData,
});

defineOptions({
  name: "RankingDesignedTempCard",
});
</script>
