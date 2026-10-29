<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useDisplay, useGoTo} from "vuetify/framework";
import {useNoticeStore} from "~/stores/noticeStore";
import {useAppStore} from "~/stores/appStore";
import {StorageIntermediateTransferSaveType} from "@/assets/sripts/storage_assembly";
import {storageIntermediateTransfer} from "@/assets/sripts/index";
import {useRankingDesignedApi} from "@/assets/sripts/api/ranking_designed_service";
import {handleApiError} from "@/assets/sripts/error_handler";
import Silk from "@/components/Silk.vue";
import Textarea from "@/components/textarea/index.vue";
import RankingDesignedView from "@/components/RankingDesignedView.vue";
import RankingDesignedItemsDataProcessing from "@/assets/sripts/ranking_designed_items_data_processing";
import {cancelAndBack} from "@/assets/sripts/navigation";

import {v6 as uuidv6} from "uuid";
import EmptyView from "@/components/EmptyView.vue";
import RankingSettingWidget from "@/components/RankingSettingWidget.vue";

const {t, locale} = useI18n();
const route = useRoute();
const router = useRouter();
const notice = useNoticeStore();
const appStore = useAppStore();
const goto = useGoTo();
const {mobile} = useDisplay();
const rankingApi = useRankingDesignedApi();
const rankingProcessing = new RankingDesignedItemsDataProcessing();

const workshopHeight = 650;
const rankingDesignedView = ref<any>(null);
const isWorkshopFillScreen = ref(false);
const detailData = ref<any>({});
const submitLoading = ref(false);
const dataLoading = ref(false);

// 草稿系统状态
const draftModel = ref(false);
const draftList = ref<any[]>([]);
const draftNewSaveModel = ref(false);
const newDraftName = ref("");
const draftSaveLoading = ref(false);
const draftSaveQuickArchivingLoading = ref(false);

// 推荐标签库
const recommendedTags = computed(() => [
  {value: "PVP", label: t("rankingDesignedItems.tags.pvp")},
  {value: "PVE", label: t("rankingDesignedItems.tags.pve")},
  {value: "武器", label: t("rankingDesignedItems.tags.weapon")},
  {value: "防具", label: t("rankingDesignedItems.tags.armor")},
  {value: "家具", label: t("rankingDesignedItems.tags.furniture")},
  {value: "赛季热门", label: t("rankingDesignedItems.tags.seasonHot")},
  {value: "新手推荐", label: t("rankingDesignedItems.tags.beginner")},
  {value: "毕业装", label: t("rankingDesignedItems.tags.endgame")},
  {value: "大招搭配", label: t("rankingDesignedItems.tags.combo")},
]);

// 发布表单信息（与工坊完全融合）
const publishData = ref<any>({
  uuid: "",
  name: "",
  description: "",
  tags: [] as string[],
  ranking: {
    visibility: "publicly",
    tags: [] as string[],
    data: [] as any[],
    attr: {
      useVersion: RankingDesignedItemsDataProcessing.nowVersion,
      language: locale.value,
      isComment: true,
      isLike: true,
      isAllowClone: true,
      isShowItemName: true,
      isAnonymous: false,
    },
  },
});

const formRules = {
  name: [
    (v: string) => !!(v && v.trim()) || t("rankingDesignedItems.publish.nameRequired"),
    (v: string) => !v || v.length <= 140 || t("rankingDesignedItems.publish.nameLength"),
  ],
};

const isEditModel = computed(() => {
  return Boolean(route.params.uid) || route.name === "EditRankingDesignedItems" || route.name === "RankingDesignedItemsWorkshopEdit";
});

// 发布检查
const isPushDisabled = computed(() => {
  return !publishData.value?.name || publishData.value.name.trim() === "";
});

/**
 * 监听天梯属性变更，实时同步至画布
 */
watch(() => publishData.value.ranking?.attr, (newVal) => {
  if (rankingDesignedView.value && typeof rankingDesignedView.value.setSetting === "function") {
    rankingDesignedView.value.setSetting(newVal || {});
  }
}, {deep: true});

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
 * 打开草稿面板
 */
const onOpenDraftPanel = () => {
  draftModel.value = true;
  getDraftListData();
};

/**
 * 读取草稿数据列表
 */
const getDraftListData = () => {
  const d = storageIntermediateTransfer.gets({
    saveType: StorageIntermediateTransferSaveType.Draft,
    category: "ranking",
  });
  if (d.code === 0) {
    draftList.value = d.data || [];
  }
};

/**
 * 快速暂存草稿
 */
const onQuickSaveDraft = () => {
  if (!rankingDesignedView.value) return;

  const currentRankingData = rankingDesignedView.value.onExport();
  const draftPayload = {
    ...publishData.value,
    id: "quickArchiving",
    name: publishData.value.name || t("rankingDesignedItems.workshop.quickArchiving"),
    ranking: currentRankingData,
    updateTime: new Date().toISOString(),
  };

  storageIntermediateTransfer.update(draftPayload, {
    uid: "quickArchiving",
    saveType: StorageIntermediateTransferSaveType.Draft,
    category: "ranking",
  });

  notice.success(t("rankingDesignedItems.workshop.quickSaveDraft") + " " + t("basic.tips.success"));
};

/**
 * 保存新命名草稿
 */
const onSaveNewDraft = () => {
  if (!newDraftName.value.trim()) {
    notice.warning(t("rankingDesignedItems.workshop.inputDraftName"));
    return;
  }
  if (!rankingDesignedView.value) return;

  draftSaveLoading.value = true;
  const uid = uuidv6();
  const currentRankingData = rankingDesignedView.value.onExport();

  const draftPayload = {
    ...publishData.value,
    id: uid,
    name: newDraftName.value.trim(),
    ranking: currentRankingData,
    updateTime: new Date().toISOString(),
  };

  storageIntermediateTransfer.update(draftPayload, {
    uid,
    saveType: StorageIntermediateTransferSaveType.Draft,
    category: "ranking",
  });

  draftSaveLoading.value = false;
  draftNewSaveModel.value = false;
  newDraftName.value = "";
  notice.success(t("basic.tips.success"));
};

/**
 * 使用/加载草稿
 */
const onUseDraft = (item: any) => {
  const tiers = item.ranking || item.data;
  if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
    notice.error(t("rankingDesignedItems.workshop.draftEmpty"));
    return;
  }

  if (item.name && item.id !== "quickArchiving") {
    publishData.value.name = item.name;
  }
  if (item.description !== undefined) {
    publishData.value.description = item.description;
  }
  if (Array.isArray(item.tags)) {
    publishData.value.tags = [...item.tags];
  }
  if (item.ranking?.visibility || item.visibility) {
    publishData.value.ranking.visibility = item.ranking?.visibility || item.visibility || "publicly";
  }

  nextTick(() => {
    if (rankingDesignedView.value) {
      rankingDesignedView.value.onLoad(tiers);
    }
  });

  draftModel.value = false;
  notice.success(t("rankingDesignedItems.workshop.draftLoadSuccess"));
};

/**
 * 删除草稿
 */
const onDeleteDraft = (id: string) => {
  storageIntermediateTransfer.delete(id, {
    saveType: StorageIntermediateTransferSaveType.Draft,
    category: "ranking",
  });
  getDraftListData();
};

/**
 * 加载已有数据或草稿（编辑模式）
 */
const loadExistingData = async () => {
  const uid = String(route.params.uid || "");
  if (!uid) return;

  dataLoading.value = true;
  try {
    // 优先读取本地暂存数据
    const localDraft = storageIntermediateTransfer.get(uid, {
      saveType: StorageIntermediateTransferSaveType.Data,
      category: "ranking",
    });

    if (localDraft.code === 0 && localDraft.data) {
      const d = localDraft.data;
      publishData.value.uuid = d.uuid || "";
      publishData.value.name = d.name || "";
      publishData.value.description = d.description || "";
      publishData.value.tags = Array.isArray(d.tags) ? d.tags : [];
      if (d.ranking?.visibility) {
        publishData.value.ranking.visibility = d.ranking.visibility;
      }
      if (d.ranking?.attr) {
        publishData.value.ranking.attr = {...publishData.value.ranking.attr, ...d.ranking.attr};
      }
      nextTick(() => {
        if (rankingDesignedView.value) {
          if (typeof rankingDesignedView.value.setSetting === "function") {
            rankingDesignedView.value.setSetting(publishData.value.ranking.attr || {});
          }
          if (d.ranking || d.data) {
            rankingDesignedView.value.onLoad(d.ranking || d.data);
          }
        }
      });
      return;
    }

    // 从后端拉取详情
    const res = await rankingApi.getRankingItem(uid);
    if (res.data) {
      const item = res.data.data || res.data;
      detailData.value = item;
      publishData.value.uuid = item.uuid;
      publishData.value.name = item.name || "";
      publishData.value.description = item.description || "";
      publishData.value.tags = Array.isArray(item.tags)
          ? item.tags
          : (typeof item.tags === "string" ? JSON.parse(item.tags) : []);
      publishData.value.ranking.visibility = item.visibility || "publicly";

      let parsedAttr = item.attr;
      if (typeof parsedAttr === "string") {
        try {
          parsedAttr = JSON.parse(parsedAttr);
        } catch {
          parsedAttr = {};
        }
      }
      if (parsedAttr && typeof parsedAttr === "object") {
        publishData.value.ranking.attr = {...publishData.value.ranking.attr, ...parsedAttr};
      }

      const tiers = typeof item.data === "string" ? JSON.parse(item.data) : item.data;
      nextTick(() => {
        if (rankingDesignedView.value) {
          if (typeof rankingDesignedView.value.setSetting === "function") {
            rankingDesignedView.value.setSetting(publishData.value.ranking.attr || {});
          }
          if (tiers) {
            rankingDesignedView.value.onLoad(tiers);
          }
        }
      });
    }
  } catch (err: any) {
    handleApiError(err, notice, t, {component: "RankingDesignedWorkshop"});
  } finally {
    dataLoading.value = false;
  }
};

/**
 * 提交发布或更新（工坊与发布一体化融合）
 */
const onSubmit = async () => {
  if (!rankingDesignedView.value) return;

  if (!publishData.value.name || !publishData.value.name.trim()) {
    notice.error(t("rankingDesignedItems.publish.nameRequired"));
    await goto("#info", {duration: 1000, offset: -120});
    return;
  }

  const currentRankingData = rankingDesignedView.value.onExport();

  // 经过数据处理器验证检查
  const verifyResult = rankingProcessing.verify(currentRankingData);
  if (!verifyResult.valid) {
    const errorItem = verifyResult.verify.find(v => v.required);
    notice.error(t(errorItem?.message || "rankingDesignedItems.verify.itemsAllEmpty"));
    return;
  }

  submitLoading.value = true;
  try {
    const payload = {
      name: publishData.value.name.trim(),
      description: publishData.value.description,
      tags: publishData.value.tags,
      data: currentRankingData,
      attr: publishData.value.ranking.attr,
      visibility: publishData.value.ranking.visibility,
    };

    if (isEditModel.value) {
      const targetUuid = publishData.value.uuid || route.params.uid;
      const res = await rankingApi.editRanking(targetUuid as string, payload);

      if (targetUuid) {
        storageIntermediateTransfer.delete(targetUuid as string, {
          saveType: StorageIntermediateTransferSaveType.Data,
          category: "ranking",
        });
      }

      notice.success(t("rankingDesignedItems.updated"));
      await router.push(`/ranking-designed-items/browse/${targetUuid}/detail`);
    } else {
      const res = await rankingApi.publishRanking(payload);
      const resData = res.data?.data || res.data;
      const newUuid = resData?.uuid || resData;

      const existingUid = String(route.params.uid || "");
      if (existingUid) {
        storageIntermediateTransfer.delete(existingUid, {
          saveType: StorageIntermediateTransferSaveType.Data,
          category: "ranking",
        });
      }

      notice.success(t("rankingDesignedItems.published"));
      if (newUuid) {
        await router.push(`/ranking-designed-items/browse/${newUuid}/detail`);
      } else {
        await router.push("/ranking-designed-items/browse");
      }
    }
  } catch (e: any) {
    handleApiError(e, notice, t, {component: "RankingDesignedWorkshop"});
  } finally {
    submitLoading.value = false;
  }
};

onMounted(() => {
  if (isEditModel.value) {
    loadExistingData();
  }
});
</script>

<template>
  <!-- 顶部 Header 卡片 (遵循配装厂 Silk 布局排版) -->
  <v-card height="250px">
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
          <v-breadcrumbs-item to="/ranking-designed-items">{{ t('rankingDesignedItems.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('rankingDesignedItems.workshop.title') }}</v-breadcrumbs-item>
        </v-container>
      </v-breadcrumbs>

      <v-container class="pa-5">
        <v-row no-gutters align="start">
          <v-col>
            <h1 class="text-amber">
              {{ isEditModel ? t('basic.button.edit') : t('basic.button.create') }}
            </h1>
            <p class="opacity-60 mt-2">
              <template v-if="!isEditModel">
                {{ t('rankingDesignedItems.workshop.createTitle') }}
              </template>
              <template v-else>
                {{ t('rankingDesignedItems.workshop.editTitle') }}: <u><b>{{ publishData.name || detailData.name || '...' }}</b></u>
              </template>
            </p>
          </v-col>
          <v-col cols="auto" class="d-flex ga-2">
            <!-- 草稿管理按钮组 -->
            <v-btn-group v-if="!isEditModel" class="mr-2">
              <v-btn
                  size="large"
                  variant="tonal"
                  prepend-icon="mdi-content-save-outline"
                  :loading="draftSaveQuickArchivingLoading"
                  @click="onQuickSaveDraft">
                {{ t('rankingDesignedItems.workshop.quickSaveDraft') }}
              </v-btn>
              <v-menu location="bottom right">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" size="large" variant="tonal">
                    <v-icon icon="mdi-dots-vertical"/>
                  </v-btn>
                </template>
                <v-list min-width="200">
                  <v-list-item @click="draftNewSaveModel = true">
                    <template v-slot:prepend>
                      <v-icon icon="mdi-content-save-plus-outline" size="small"></v-icon>
                    </template>
                    <v-list-item-title>{{ t('rankingDesignedItems.workshop.saveAsDraft') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="onOpenDraftPanel">
                    <template v-slot:prepend>
                      <v-icon icon="mdi-folder-open-outline" size="small"></v-icon>
                    </template>
                    <v-list-item-title>{{ t('rankingDesignedItems.workshop.loadDraft') }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-btn-group>

            <!-- 发布/保存按钮 (融合为一键发布) -->
            <v-btn
                color="amber"
                size="large"
                class="text-black font-weight-bold"
                :loading="submitLoading"
                :disabled="isPushDisabled"
                @click="onSubmit">
              {{ isEditModel ? t('basic.button.save') : t('basic.button.commit') }}
            </v-btn>

            <v-btn v-if="isEditModel" size="large" variant="tonal" @click="cancelAndBack(router, route)">
              {{ t('basic.button.cancel') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </v-card>
  <v-divider opacity=".06"></v-divider>

  <!-- 画布 S -->
  <div class="card-enlargement-mask-flavor mt-n2 mx-n16 py-5">
    <v-container>
      <RankingDesignedView ref="rankingDesignedView" :readonly="false"></RankingDesignedView>
    </v-container>
  </div>
  <!-- 画布 E -->

  <!-- 发布与设置信息表单 (原独立发布页融合进工坊) S -->
  <v-container class="mt-4 mb-16" id="info">
    <v-form>
      <v-row>
        <!-- 左侧基础信息 (8 列) -->
        <v-col cols="12" lg="8" sm="12">
          <v-row>
            <v-col cols="12">
              <v-text-field
                  v-model="publishData.name"
                  :rules="formRules.name"
                  :label="t('rankingDesignedItems.publish.name')"
                  size="l-large"
                  hide-details="auto"
                  maxlength="140"
                  :placeholder="t('rankingDesignedItems.publish.namePlaceholder')"
                  variant="underlined">
              </v-text-field>
            </v-col>

            <v-col cols="12">
              <div class="mt-4 mb-3 font-weight-bold">{{ t('rankingDesignedItems.publish.description') }}</div>
              <v-card :color="`hsl(from var(--main-color) h s calc(l * 0.05))`" border class="pl-3 pr-3">
                <Textarea
                    v-model="publishData.description"
                    :maxlength="10000"
                    class="mt-3 mb-2"
                    :placeholder="t('rankingDesignedItems.publish.descriptionPlaceholder')">
                </Textarea>
                <template v-if="appStore.isDebug">
                  {{ publishData.description }}
                </template>
              </v-card>
            </v-col>

            <v-col cols="12">
              <v-divider class="my-4">{{ t('rankingDesignedItems.publish.extra') }}</v-divider>
              <RankingSettingWidget v-model="publishData" :is-show-delete="false"></RankingSettingWidget>
            </v-col>
          </v-row>
        </v-col>

        <!-- 右侧标签与辅助设置 (4 列) -->
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
                :label="t('rankingDesignedItems.publish.tags')"
                multiple
                :placeholder="t('rankingDesignedItems.publish.tagsPlaceholder')"
                variant="underlined">
              <template v-slot:prepend>
                <v-icon>mdi-tag-multiple</v-icon>
              </template>
              <template v-slot:chip="{ item }">
                <v-chip color="var(--main-color)" size="small" label>
                  {{ item.raw ?? item }}
                </v-chip>
              </template>
            </v-combobox>
          </div>

          <!-- 推荐快捷标签胶囊 -->
          <div class="d-flex flex-wrap ga-2 gap-2">
            <v-chip
                v-for="item in recommendedTags"
                :key="item.value"
                size="small"
                :color="publishData.tags?.includes(item.value) ? 'amber' : 'default'"
                :variant="publishData.tags?.includes(item.value) ? 'flat' : 'tonal'"
                class="cursor-pointer"
                @click="toggleTag(item.value)">
              {{ item.label }}
            </v-chip>
          </div>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
  <!-- 发布与设置信息表单 E -->

  <!-- 悬浮吸底提交栏 (无论滚动到何处均可直接发布) S -->
  <v-card variant="text" tile class="position-fixed left-0 bottom-0 w-100 bg-black" style="z-index: 5">
    <v-divider></v-divider>
    <v-container class="py-4">
      <v-row align="center" no-gutters>
        <span class="text-caption text-medium-emphasis d-none d-sm-inline">
          {{ isEditModel ? t('rankingDesignedItems.workshop.bottomTipEdit') : t('rankingDesignedItems.workshop.bottomTipCreate') }}
        </span>
        <v-spacer></v-spacer>
        <v-col cols="auto" class="d-flex ga-2">
          <v-btn
              color="amber"
              :loading="submitLoading"
              :disabled="isPushDisabled"
              @click="onSubmit">
            {{ isEditModel ? t('basic.button.save') : t('basic.button.commit') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
  <!-- 悬浮吸底提交栏 E -->

  <!-- 另存为新草稿弹窗 S -->
  <v-dialog v-model="draftNewSaveModel" max-width="520">
    <v-card border class="bg-grey-darken-4 pa-2">
      <v-card-title class="py-8 border rounded-lg text-center bg-black mb-4">
        <v-icon size="64" class="mb-2 text-amber">mdi-content-save-plus-outline</v-icon>
        <p class="text-h6 font-weight-bold">{{ t('rankingDesignedItems.workshop.saveAsDraft') }}</p>
      </v-card-title>
      <v-card-text>
        <v-text-field
            v-model="newDraftName"
            :label="t('rankingDesignedItems.workshop.inputDraftName')"
            variant="outlined"
            density="comfortable"
            maxlength="140"
            autofocus
            hide-details="auto"
            @keyup.enter="onSaveNewDraft"
        ></v-text-field>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer></v-spacer>
        <v-btn variant="tonal" @click="draftNewSaveModel = false">
          {{ t('basic.button.cancel') }}
        </v-btn>
        <v-btn
            color="amber"
            variant="flat"
            class="text-black font-weight-bold px-6"
            :loading="draftSaveLoading"
            @click="onSaveNewDraft">
          {{ t('basic.button.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- 另存为新草稿弹窗 E -->

  <!-- 草稿箱列表弹窗 S -->
  <v-dialog v-model="draftModel" max-width="640">
    <v-card border class="bg-grey-darken-4 pa-2">
      <v-card-title class="py-8 border rounded-lg text-center bg-black mb-4">
        <v-icon size="64" class="mb-2 text-amber">mdi-folder-open-outline</v-icon>
        <p class="text-h6 font-weight-bold">{{ t('rankingDesignedItems.workshop.draft') }}</p>
      </v-card-title>
      <v-card-text>
        <v-list v-if="draftList.length > 0" bg-color="transparent" class="px-0">
          <v-list-item
              v-for="(item, index) in draftList"
              :key="index"
              border
              rounded="lg"
              class="mb-2 px-3 py-2 bg-grey-darken-4">
            <template v-slot:prepend>
              <v-avatar color="amber" variant="tonal" size="36" rounded="lg">
                <v-icon :icon="item.id === 'quickArchiving' ? 'mdi-clock-fast' : 'mdi-file-document-outline'" size="18"></v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-bold">
              {{ item.id === 'quickArchiving' ? t('rankingDesignedItems.workshop.quickArchiving') : (item.name || t('rankingDesignedItems.workshop.untitledDraft')) }}
            </v-list-item-title>
            <v-list-item-subtitle class="opacity-60 text-caption mt-1">
              <span v-if="item.updateTime">{{ new Date(item.updateTime).toLocaleString() }} · </span>
              <span>{{ t('rankingDesignedItems.browse.layers', {count: (item.ranking || item.data)?.length || 0}) }}</span>
            </v-list-item-subtitle>
            <template v-slot:append>
              <div class="d-flex ga-2">
                <v-btn
                    variant="flat"
                    color="amber"
                    size="small"
                    class="text-black font-weight-bold"
                    @click="onUseDraft(item)">
                  {{ t('basic.button.use') }}
                </v-btn>
                <v-btn
                    variant="tonal"
                    color="error"
                    size="small"
                    icon="mdi-delete"
                    @click="onDeleteDraft(item.id)"
                ></v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
        <EmptyView v-else></EmptyView>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer></v-spacer>
        <v-btn variant="tonal" color="amber" @click="draftModel = false">
          {{ t('basic.button.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- 草稿箱列表弹窗 E -->
</template>

<style scoped lang="less">
</style>
