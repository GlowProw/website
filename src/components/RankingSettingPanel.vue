<script setup lang="ts">
import { computed, ref, watch, Ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useNoticeStore } from "~/stores/noticeStore";
import { handleApiError } from "@/assets/sripts/error_handler";
import { useRankingDesignedApi } from "@/assets/sripts/api/ranking_designed_service";
import RankingDesignedItemsDataProcessing from "@/assets/sripts/ranking_designed_items_data_processing";
import Loading from "@/components/Loading.vue";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";

const { t, messages, locale } = useI18n();
const router = useRouter();
const notice = useNoticeStore();
const rankingApi = useRankingDesignedApi();

const props = defineProps<{ id: string; data?: any }>();
const emit = defineEmits(["change"]);

// 弹窗可见性与加载状态
const show = ref(false);
const getSettingLoading = ref(false);
const setSettingLoading = ref(false);
const delLoading = ref(false);
const deleteDialog = ref(false);
const tabValue = ref("conventional");

import languagesConfig from "@/config/languages";

// 可用语言列表
const languages = computed(() => {
  return languagesConfig.child.map((item) => ({
    label: item.label,
    value: item.value,
  }));
});

/**
 * 语言友好标签解析（兼容下划线和连字符格式）
 */
const getLanguageLabel = (val: string) => {
  if (!val) return "";
  const normalized = String(val).replace("_", "-").toLowerCase();
  const found = languagesConfig.child.find((item) => item.value.toLowerCase() === normalized);
  return found ? found.label : val;
};

// 可见性选项配置
const settingConfig = ref({
  visibilitys: [
    { label: t("rankingDesignedItems.publish.visibilityPublic"), value: "publicly" },
    { label: t("rankingDesignedItems.publish.visibilityPrivate"), value: "private" },
    { label: t("rankingDesignedItems.publish.visibilityUnlisted"), value: "unlisted" },
  ],
});

// 天梯设置表单数据模型
const settingData: Ref<{
  visibility: string;
  attr: {
    useVersion: string;
    language: string;
    isComment: boolean;
    isLike: boolean;
    isAllowClone: boolean;
    isShowItemName: boolean;
    isAnonymous: boolean;
    [key: string]: any;
  };
}> = ref({
  visibility: "publicly",
  attr: {
    useVersion: RankingDesignedItemsDataProcessing.nowVersion,
    language: locale.value,
    isComment: true,
    isLike: true,
    isAllowClone: true,
    isShowItemName: true,
    isAnonymous: false,
  },
});

watch(
  () => show.value,
  (val) => {
    if (val) {
      initSettingData();
    }
  }
);

/**
 * 初始化并同步天梯设置数据
 */
const initSettingData = async () => {
  if (props.data) {
    if (props.data.visibility) {
      settingData.value.visibility = props.data.visibility;
    }
    if (props.data.attr) {
      const parsedAttr =
        typeof props.data.attr === "string"
          ? JSON.parse(props.data.attr || "{}")
          : props.data.attr;
      settingData.value.attr = Object.assign(settingData.value.attr, parsedAttr);
    }
  }

  if (!props.id) return;
  try {
    getSettingLoading.value = true;
    const result = await rankingApi.getRankingAttr(props.id);
    const d = result.data?.data || result.data;
    if (d?.ranking) {
      if (d.ranking.visibility) {
        settingData.value.visibility = d.ranking.visibility;
      }
      if (d.ranking.attr) {
        settingData.value.attr = Object.assign(settingData.value.attr, d.ranking.attr);
      }
    }
  } catch (e) {
    handleApiError(e, notice, t, { component: "RankingSettingPanel" });
  } finally {
    getSettingLoading.value = false;
  }
};

/**
 * 保存天梯配置变更
 */
const saveRankingSetting = async () => {
  if (!props.id) return;

  try {
    setSettingLoading.value = true;
    const result = await rankingApi.editRankingAttr(props.id, {
      ranking: {
        visibility: settingData.value.visibility,
        attr: settingData.value.attr,
      },
    });
    const d = result.data;
    notice.success(t(`basic.tips.${d?.code || "success"}`) || t("basic.tips.success") || "保存成功");
  } catch (e) {
    handleApiError(e, notice, t, { component: "RankingSettingPanel" });
  } finally {
    emit("change");
    show.value = false;
    setSettingLoading.value = false;
  }
};

/**
 * 删除当前天梯榜单
 */
const delRanking = async () => {
  if (!props.id) return;
  try {
    delLoading.value = true;
    const result = await rankingApi.deleteRanking(props.id);
    if (result.data) {
      notice.success(t("basic.tips.deleted") || "删除成功");
      deleteDialog.value = false;
      show.value = false;
      router.push("/ranking-designed-items/browse");
    }
  } catch (e) {
    handleApiError(e, notice, t, { component: "RankingSettingPanel" });
  } finally {
    delLoading.value = false;
  }
};

/**
 * 打开设置弹窗并初始化数据
 */
const open = () => {
  show.value = true;
  initSettingData();
};

/**
 * 关闭设置弹窗
 */
const close = () => {
  show.value = false;
};

defineExpose({
  open,
  close,
  show,
});

defineOptions({
  name: "RankingSettingPanel",
});
</script>

<template>
  <span @click="show = !show">
    <slot></slot>
  </span>

  <!-- 设置面板弹窗 S -->
  <v-dialog v-model="show" max-width="800">
    <v-card border class="position-relative">
      <v-card-title class="pa-5">
        <div class="text-h5 font-weight-bold text-amber">
          {{ t("assembly.setting.title") }}
        </div>
      </v-card-title>

      <v-overlay
          :model-value="getSettingLoading"
          contained
          disabled
          class="align-center justify-center">
        <Loading size="30"></Loading>
      </v-overlay>

      <v-divider></v-divider>
      <div class="d-flex flex-row">
        <v-tabs
            class="v-col-3 pa-0"
            v-model="tabValue"
            direction="vertical">
          <v-tab
              prepend-icon="mdi-cog"
              :text="t('assembly.setting.tagCommon')"
              value="conventional"></v-tab>
          <v-tab
              prepend-icon="mdi-database"
              :text="t('assembly.setting.tagData')"
              value="data"
              v-if="props?.data?.data"></v-tab>
        </v-tabs>

        <v-divider vertical></v-divider>

        <v-card class="overflow-auto v-col-9 flex-1 w-100" elevation="0">
          <v-tabs-window v-model="tabValue">
            <v-tabs-window-item value="conventional">
              <div class="pa-4">
                <!-- 可见性 -->
                <v-row align="center">
                  <v-col cols="12" sm="6">
                    <b>{{ t("assembly.setting.visibility") }}</b>
                    <p class="text-caption text-medium-emphasis">
                      {{ t("assembly.setting.visibilityDescription") }}
                    </p>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select
                        density="compact"
                        hide-details
                        item-title="label"
                        item-value="value"
                        v-model="settingData.visibility"
                        :items="settingConfig.visibilitys"
                        :label="t('assembly.setting.selectVisibility')"></v-select>
                  </v-col>
                </v-row>
                <v-divider class="my-3"></v-divider>

                <!-- 语种 -->
                <v-row align="center">
                  <v-col cols="12" sm="6">
                    <b>{{ t('rankingDesignedItems.setting.language') || t('basic.language') || '语种' }}</b>
                    <p class="text-caption text-medium-emphasis">
                      {{ t('rankingDesignedItems.setting.languageDescription') || t("assembly.setting.languageDescription") }}
                    </p>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select
                        density="compact"
                        hide-details
                        item-title="label"
                        item-value="value"
                        v-model="settingData.attr.language"
                        :items="languages"
                        :label="t('assembly.setting.selectLanguage')">
                      <template v-slot:selection="{ item }">
                        {{ getLanguageLabel(item.value || settingData.attr.language) }}
                      </template>
                    </v-select>
                  </v-col>
                </v-row>
                <v-divider class="my-3"></v-divider>

                <!-- 是否展示物品名称 -->
                <v-row align="center">
                  <v-col cols="12" sm="6">
                    <b>{{ t("assembly.setting.showItemName") }}</b>
                    <p class="text-caption text-medium-emphasis">
                      {{ t("assembly.setting.showItemNameDescription") }}
                    </p>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-checkbox
                        v-model="settingData.attr.isShowItemName"
                        density="compact"
                        hide-details
                        :label="t('assembly.setting.enable')"></v-checkbox>
                  </v-col>
                </v-row>
                <v-divider class="my-3"></v-divider>

                <!-- 点赞 -->
                <v-row align="center">
                  <v-col cols="12" sm="6">
                    <b>{{ t("assembly.setting.likes") }}</b>
                    <p class="text-caption text-medium-emphasis">
                      {{ t("assembly.setting.likesDescription") }}
                    </p>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-checkbox
                        v-model="settingData.attr.isLike"
                        density="compact"
                        hide-details
                        :label="t('assembly.setting.enable')"></v-checkbox>
                  </v-col>
                </v-row>
                <v-divider class="my-3"></v-divider>

                <!-- 评论 -->
                <v-row align="center">
                  <v-col cols="12" sm="6">
                    <b>{{ t("assembly.setting.comments") }}</b>
                    <p class="text-caption text-medium-emphasis">
                      {{ t("assembly.setting.commentsDescription") }}
                    </p>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-checkbox
                        v-model="settingData.attr.isComment"
                        density="compact"
                        hide-details
                        :label="t('assembly.setting.enable')"></v-checkbox>
                  </v-col>
                </v-row>
                <v-divider class="my-3"></v-divider>

                <!-- 允许克隆 -->
                <v-row align="center">
                  <v-col cols="12" sm="6">
                    <b>{{ t("assembly.setting.allowClone") }}</b>
                    <p class="text-caption text-medium-emphasis">
                      {{ t("assembly.setting.allowCloneDescription") }}
                    </p>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-checkbox
                        v-model="settingData.attr.isAllowClone"
                        density="compact"
                        hide-details
                        :label="t('assembly.setting.enable')"></v-checkbox>
                  </v-col>
                </v-row>
                <v-divider class="my-3"></v-divider>

                <!-- 是否匿名 -->
                <v-row align="center">
                  <v-col cols="12" sm="6">
                    <b>{{ t("assembly.setting.anonymous") }}</b>
                    <p class="text-caption text-medium-emphasis">
                      {{ t("assembly.setting.anonymousDescription") }}
                    </p>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-checkbox
                        v-model="settingData.attr.isAnonymous"
                        density="compact"
                        hide-details
                        :label="t('assembly.setting.enable')"></v-checkbox>
                  </v-col>
                </v-row>
                <v-divider class="my-3"></v-divider>

                <!-- 渲染器版本 -->
                <v-row align="center">
                  <v-col cols="12" sm="6">
                    <b>{{ t("assembly.setting.rendererVersion") }}</b>
                    <p class="text-caption text-medium-emphasis">
                      {{ t("assembly.setting.rendererVersionDescription") }}
                    </p>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select
                        density="compact"
                        hide-details
                        :items="RankingDesignedItemsDataProcessing.versions"
                        v-model="settingData.attr.useVersion"
                        :label="t('assembly.setting.version')"></v-select>
                  </v-col>
                </v-row>
                <v-divider class="my-3"></v-divider>

                <!-- 删除天梯 -->
                <v-row align="center">
                  <v-col cols="12" sm="6">
                    <b>{{ t("basic.button.delete") }}</b>
                    <p class="text-caption text-medium-emphasis">
                      {{ t("assembly.setting.deleteDescription") }}
                    </p>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-btn
                        color="red"
                        variant="flat"
                        @click="deleteDialog = true">
                      {{ t("basic.button.delete") }}
                    </v-btn>
                  </v-col>
                </v-row>
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="data">
              <div class="w-100 pa-2">
                <v-card
                    elevation="0"
                    min-height="200"
                    max-height="60vh"
                    class="pa-2 overflow-auto">
                  <VueJsonPretty
                      theme="dark"
                      showLine
                      showIcon
                      showDoubleQuotes
                      v-if="props.data?.data"
                      :data="typeof props.data.data === 'string' ? JSON.parse(props.data.data) : props.data.data" />
                </v-card>
              </div>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </div>

      <v-divider></v-divider>
      <v-card-actions class="pa-5">
        <v-spacer></v-spacer>
        <v-btn @click="show = false">{{ t("basic.button.cancel") }}</v-btn>
        <v-btn
            :loading="setSettingLoading"
            @click="saveRankingSetting"
            class="bg-amber text-black">
          {{ t("basic.button.submit") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- 设置面板弹窗 E -->

  <!-- 确认删除弹窗 S -->
  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">
        {{ t("assembly.setting.deleteConfirmation") || "确认删除？" }}
      </v-card-title>
      <v-card-text>
        {{ t("assembly.setting.deleteWarning") || "此操作不可逆，将永久删除天梯榜单及其所有相关数据。" }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="deleteDialog = false">
          {{ t("basic.button.cancel") }}
        </v-btn>
        <v-btn
            color="red"
            variant="flat"
            :loading="delLoading"
            @click="delRanking">
          {{ t("basic.button.delete") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- 确认删除弹窗 E -->
</template>

<style scoped lang="less">
</style>
