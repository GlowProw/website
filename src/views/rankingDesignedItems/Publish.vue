<script lang="ts" setup>
import { useRoute, useRouter } from "vue-router";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { storageIntermediateTransfer } from "@/assets/sripts";
import { StorageIntermediateTransferSaveType } from "@/assets/sripts/storage_assembly";
import { handleApiError } from "@/assets/sripts/error_handler";
import { useNoticeStore } from "~/stores/noticeStore";
import { useAppStore } from "~/stores/appStore";
import { useRankingDesignedApi } from "@/assets/sripts/api/ranking_designed_service";
import { useGoTo } from "vuetify/framework";
import Textarea from "@/components/textarea/index.vue";
import Silk from "@/components/Silk.vue";
import RankingDesignedItemsDataProcessing from "@/assets/sripts/ranking_designed_items_data_processing";
import RankingDesignedMainSubjectView from "@/components/RankingDesignedMainSubjectView.vue";

const route = useRoute();
const router = useRouter();
const notice = useNoticeStore();
const appStore = useAppStore();
const rankingApi = useRankingDesignedApi();
const { t, locale } = useI18n();
const goto = useGoTo();

// 推荐标签库
const recommendedTags = ref([
  "PVP", "PVE", "武器", "防具", "家具", "赛季热门", "新手推荐", "毕业装", "大招搭配"
]);

// 发布信息
const publishData = ref<any>({
  uuid: "",
  name: "",
  description: "",
  tags: [],
  ranking: {
    visibility: "publicly",
    tags: [],
    data: [],
    attr: {
      useVersion: RankingDesignedItemsDataProcessing.nowVersion,
      language: locale.value,
      isComment: true,
      isLike: true,
    },
  },
});

const dataLoading = ref(false);
const publishLoading = ref(false);
const rankingDesignedMainSubjectView = ref<any>(null);

const formRules = {
  name: [
    (v: string) => !!v || t("basic.assembly.publish.nameRequired"),
    (v: string) => !v || v.length <= 140 || t("basic.rules.assembly.nameLength"),
  ],
};

// 发布前检查：标题为空不可发布
const isPush = computed(() => {
  return !publishData.value?.name || publishData.value.name.trim() === "";
});

// 是否处于编辑模式
const isEditModel = computed(() => {
  return Boolean(route.params.uid && (route.name === "EditRankingDesignedItems" || route.path.includes("/edit/")));
});

/**
 * 切换追加推荐标签
 *
 * @param tag 目标标签文本
 */
const toggleTag = (tag: string) => {
  if (!Array.isArray(publishData.value.tags)) {
    publishData.value.tags = [];
  }
  const idx = publishData.value.tags.indexOf(tag);
  if (idx > -1) {
    publishData.value.tags.splice(idx, 1);
  } else {
    publishData.value.tags.push(tag);
  }
};

/**
 * 设置天梯视图数据
 */
const onSetRankingData = () => {
  const refObj = rankingDesignedMainSubjectView.value?.refs?.rankingDesignedRef || rankingDesignedMainSubjectView.value;
  if (refObj && typeof refObj.onLoad === "function") {
    refObj.onLoad(publishData.value.ranking.data);
  }
};

/**
 * 加载已有或草稿数据
 */
const onLoadData = async () => {
  dataLoading.value = true;
  const { uid } = route.params;

  if (!uid) {
    dataLoading.value = false;
    return;
  }

  try {
    // 优先读取本地草稿
    const localDraft: any = storageIntermediateTransfer.get(uid as string, {
      saveType: StorageIntermediateTransferSaveType.Data,
      category: "ranking",
    });

    let rankingData = localDraft.code === 0 ? localDraft.data : null;

    if (!rankingData) {
      // 本地无草稿时从后端拉取
      const res = await rankingApi.getRankingItem(uid as string);
      if (res.data) {
        const item = res.data.data || res.data;
        rankingData = {
          uuid: item.uuid,
          name: item.name,
          description: item.description,
          tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === "string" ? JSON.parse(item.tags) : []),
          ranking: typeof item.data === "string" ? JSON.parse(item.data) : item.data,
          visibility: item.visibility || "publicly",
        };
      }
    }

    if (rankingData) {
      publishData.value.uuid = rankingData.uuid || "";
      publishData.value.name = rankingData.name || "";
      publishData.value.description = rankingData.description || "";
      publishData.value.tags = Array.isArray(rankingData.tags) ? rankingData.tags : [];
      publishData.value.ranking.data = rankingData.ranking || rankingData.data || [];
      if (rankingData.visibility) {
        publishData.value.ranking.visibility = rankingData.visibility;
      }

      onSetRankingData();
      await goto("#info", { duration: 2000, offset: -120 });
    }
  } catch (e: any) {
    handleApiError(e, notice, t, { component: "RankingDesignedPublish" });
  } finally {
    dataLoading.value = false;
  }
};

/**
 * 编辑保存已有榜单
 */
const onEdit = async () => {
  try {
    publishLoading.value = true;
    const targetUuid = publishData.value.uuid || route.params.uid;
    const payload = {
      name: publishData.value.name,
      description: publishData.value.description,
      tags: publishData.value.tags,
      data: publishData.value.ranking.data,
      attr: publishData.value.ranking.attr,
      visibility: publishData.value.ranking.visibility,
    };

    const res = await rankingApi.editRanking(targetUuid as string, payload);
    const d = res.data;

    if (targetUuid) {
      storageIntermediateTransfer.delete(targetUuid as string, {
        saveType: StorageIntermediateTransferSaveType.Data,
        category: "ranking",
      });
    }

    notice.success(t("basic.tips.updated") || "Updated successfully");
    await router.push(`/ranking-designed-items/browse/${targetUuid}/detail`);
  } catch (e: any) {
    handleApiError(e, notice, t, { component: "RankingDesignedPublish" });
  } finally {
    publishLoading.value = false;
  }
};

/**
 * 首次发布新建榜单
 */
const onPublish = async () => {
  try {
    publishLoading.value = true;
    const { uid } = route.params;
    const payload = {
      name: publishData.value.name,
      description: publishData.value.description,
      tags: publishData.value.tags,
      data: publishData.value.ranking.data,
      attr: publishData.value.ranking.attr,
      visibility: publishData.value.ranking.visibility,
    };

    const res = await rankingApi.publishRanking(payload);
    const responsePayload = res.data?.data || res.data;
    const publishedUuid = responsePayload?.uuid || responsePayload;

    if (publishedUuid) {
      if (uid) {
        storageIntermediateTransfer.delete(uid as string, {
          saveType: StorageIntermediateTransferSaveType.Data,
          category: "ranking",
        });
      }

      notice.success(t("basic.tips.published") || "Published successfully!");
      await router.push(`/ranking-designed-items/browse/${publishedUuid}/detail`);
    } else {
      notice.error(res.message || "Failed to publish ranking");
    }
  } catch (e: any) {
    handleApiError(e, notice, t, { component: "RankingDesignedPublish" });
  } finally {
    publishLoading.value = false;
  }
};
</script>

<template>
  <!-- 顶部面包屑与标题区 (严格遵循配装厂 Silk 布局排版) -->
  <v-card height="250px">
    <template v-slot:image>
      <Silk
          :color="'#1c1c1c'"
          :noise-intensity="0.1"
          :rotation="-.6"
          :scale=".7"
          :speed="3"
          class="bg-black">
      </Silk>
    </template>
    <template v-slot:default>
      <v-container class="pa-2 position-relative">
        <v-breadcrumbs>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/ranking-designed-items">{{ t('rankingDesignedItems.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/ranking-designed-items/workshop">{{ t('rankingDesignedItems.workshop.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ isEditModel ? t('basic.button.edit') : t('basic.assembly.publish.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>

        <v-container class="pa-7">
          <v-row align="start" no-gutters>
            <v-col>
              <h1 class="text-amber">{{ t('basic.assembly.publish.preview') }}</h1>
              <p class="opacity-80 mt-5">{{ t('basic.assembly.publish.subtitle') }}</p>
            </v-col>
            <v-col cols="auto">
              <v-btn v-if="isEditModel" variant="elevated" @click="router.go(-1)">
                {{ t('basic.button.prev') }}
              </v-btn>
              <v-btn
                  :color="`var(--main-color)`"
                  :disabled="isPush"
                  :loading="publishLoading"
                  class="ml-2"
                  variant="elevated"
                  @click="() => isEditModel ? onEdit() : onPublish()">
                {{ isEditModel ? t('basic.button.save') : t('basic.button.commit') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-container>
    </template>
  </v-card>
  <v-divider opacity=".06"></v-divider>

  <!-- 工坊分享预览 开始 -->
  <RankingDesignedMainSubjectView
      ref="rankingDesignedMainSubjectView"
      :readonly="true"
      @ready="onLoadData">
  </RankingDesignedMainSubjectView>
  <!-- 工坊分享预览 结束 -->

  <!-- 悬浮吸底提交条 S -->
  <v-card variant="text" tile class="position-fixed left-0 bottom-0 w-100 bg-black" style="z-index: 5">
    <v-divider></v-divider>
    <v-container class="py-5">
      <v-row align="start" no-gutters>
        <v-spacer></v-spacer>
        <v-col cols="auto">
          <v-btn v-if="isEditModel" variant="elevated" @click="router.go(-1)">
            {{ t('basic.button.prev') }}
          </v-btn>
          <v-btn
              :color="`var(--main-color)`"
              :disabled="isPush"
              :loading="publishLoading"
              class="ml-2"
              variant="elevated"
              @click="() => isEditModel ? onEdit() : onPublish()">
            {{ isEditModel ? t('basic.button.save') : t('basic.button.commit') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
  <!-- 悬浮吸底提交条 E -->

  <!-- 表单信息录入区 -->
  <v-container>
    <v-form class="mb-10" id="info">
      <v-row>
        <v-col cols="12" lg="8" sm="12">
          <v-row>
            <v-col cols="12">
              <v-text-field
                  v-model="publishData.name"
                  :rules="formRules.name"
                  :label="t('basic.assembly.publish.name')"
                  size="l-large"
                  hide-details
                  maxlength="140"
                  :placeholder="t('basic.assembly.publish.namePlaceholder')"
                  variant="underlined">
              </v-text-field>
            </v-col>
            <v-col cols="12">
              <div class="mt-4 mb-3 font-weight-bold">{{ t('basic.assembly.publish.description') }}</div>

              <v-card :color="`hsl(from var(--main-color) h s calc(l * 0.05))`" border class="pl-3 pr-3">
                <Textarea
                    v-model="publishData.description"
                    :maxlength="10000"
                    class="mt-3 mb-2"
                    :placeholder="t('basic.assembly.publish.descriptionPlaceholder')">
                </Textarea>
                <template v-if="appStore.isDebug">
                  {{ publishData.description }}
                </template>
              </v-card>
            </v-col>
            <v-col cols="12">
              <v-divider class="my-4">{{ t('basic.assembly.publish.extra') }}</v-divider>

              <!-- 额外设置（可见性单选与互动权限） -->
              <v-card border class="pa-4 bg-transparent mt-3">
                <div class="text-subtitle-2 font-weight-bold mb-3">
                  <v-icon icon="mdi-eye-outline" size="18" class="mr-1"></v-icon>
                  {{ t('rankingDesignedItems.publish.visibility') || '可见性' }}
                </div>
                <v-radio-group v-model="publishData.ranking.visibility" inline density="compact" hide-details>
                  <v-radio value="publicly" :label="t('rankingDesignedItems.publish.visibilityPublic') || '公开 (广场展示)'"></v-radio>
                  <v-radio value="unlisted" :label="t('rankingDesignedItems.publish.visibilityUnlisted') || '仅链接可见'"></v-radio>
                  <v-radio value="private" :label="t('rankingDesignedItems.publish.visibilityPrivate') || '仅自己可见'"></v-radio>
                </v-radio-group>
              </v-card>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12" lg="4" sm="12">
          <!-- 标签多选输入框 -->
          <div class="mb-5">
            <v-combobox
                v-model="publishData.tags"
                :counter="100"
                :hide-no-data="true"
                hide-details
                hide-selected
                :details="false"
                chips
                clearable
                item-title="label"
                item-value="value"
                :label="t('basic.assembly.publish.tags')"
                multiple
                :placeholder="t('basic.assembly.publish.tagsPlaceholder')"
                variant="underlined">
              <template v-slot:prepend>
                <v-icon>mdi-tag-multiple</v-icon>
              </template>
              <template v-slot:chip="{item}">
                <v-chip color="var(--main-color)" size="small" label>
                  {{ item.raw ?? item }}
                </v-chip>
              </template>
            </v-combobox>
          </div>

          <!-- 推荐快捷标签 -->
          <v-card border class="pa-4 bg-transparent">
            <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">
              <v-icon size="14" class="mr-1">mdi-fire</v-icon>
              {{ t('rankingDesignedItems.publish.recommendedTags') || '推荐标签' }}
            </div>
            <div class="d-flex flex-wrap ga-1">
              <v-chip
                  v-for="tag in recommendedTags"
                  :key="tag"
                  size="small"
                  :color="publishData.tags?.includes(tag) ? 'amber' : 'default'"
                  :variant="publishData.tags?.includes(tag) ? 'flat' : 'tonal'"
                  class="cursor-pointer"
                  @click="toggleTag(tag)">
                {{ tag }}
              </v-chip>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<style lang="less" scoped>
</style>
