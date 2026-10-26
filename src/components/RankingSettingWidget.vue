<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useRankingDesignedApi } from "@/assets/sripts/api/ranking_designed_service";
import { useNoticeStore } from "~/stores/noticeStore";
import { handleApiError } from "@/assets/sripts/error_handler";
import RankingDesignedItemsDataProcessing from "@/assets/sripts/ranking_designed_items_data_processing";

const { t, messages } = useI18n();
const router = useRouter();
const notice = useNoticeStore();
const rankingApi = useRankingDesignedApi();

const props = withDefaults(defineProps<{
  modelValue: any;
  isShowDelete?: boolean;
}>(), {
  isShowDelete: true,
});

const emit = defineEmits(["update:modelValue"]);

// 标签页选中标识
const tabValue = ref("common");

// 删除状态与弹窗
const delRankingLoading = ref(false);
const deleteDialog = ref(false);

// 可用语言集合
const languages = computed(() => Object.keys(messages.value));

// 可见性选项配置
const visibilityOptions = computed(() => [
  { label: t("rankingDesignedItems.publish.visibilityPublic"), value: "publicly" },
  { label: t("rankingDesignedItems.publish.visibilityPrivate"), value: "private" },
  { label: t("rankingDesignedItems.publish.visibilityUnlisted"), value: "unlisted" },
]);

// 确保内部属性对象初始化完毕
const initAttr = () => {
  if (!props.modelValue) return;

  if (props.modelValue.ranking) {
    if (!props.modelValue.ranking.visibility) {
      props.modelValue.ranking.visibility = "publicly";
    }
    if (!props.modelValue.ranking.attr) {
      props.modelValue.ranking.attr = {};
    }
    const attr = props.modelValue.ranking.attr;
    if (attr.isLike === undefined) attr.isLike = true;
    if (attr.isComment === undefined) attr.isComment = true;
    if (attr.isAllowClone === undefined) attr.isAllowClone = true;
    if (attr.isShowItemName === undefined) attr.isShowItemName = false;
    if (attr.isAnonymous === undefined) attr.isAnonymous = false;
    if (!attr.useVersion) attr.useVersion = RankingDesignedItemsDataProcessing.nowVersion;
  } else {
    if (!props.modelValue.visibility) {
      props.modelValue.visibility = "publicly";
    }
    if (!props.modelValue.attr) {
      props.modelValue.attr = {};
    }
    const attr = props.modelValue.attr;
    if (attr.isLike === undefined) attr.isLike = true;
    if (attr.isComment === undefined) attr.isComment = true;
    if (attr.isAllowClone === undefined) attr.isAllowClone = true;
    if (attr.isShowItemName === undefined) attr.isShowItemName = false;
    if (attr.isAnonymous === undefined) attr.isAnonymous = false;
    if (!attr.useVersion) attr.useVersion = RankingDesignedItemsDataProcessing.nowVersion;
  }
};

initAttr();

watch(() => props.modelValue, () => {
  initAttr();
}, { deep: true });

// 计算可见性代理绑定
const visibilityProxy = computed({
  get: () => {
    return props.modelValue?.ranking?.visibility || props.modelValue?.visibility || "publicly";
  },
  set: (val: string) => {
    if (props.modelValue?.ranking) {
      props.modelValue.ranking.visibility = val;
    } else if (props.modelValue) {
      props.modelValue.visibility = val;
    }
    emit("update:modelValue", props.modelValue);
  },
});

// 计算属性对象代理绑定
const targetAttr = computed(() => {
  return props.modelValue?.ranking?.attr || props.modelValue?.attr || {};
});

/**
 * 删除天梯榜单
 */
const onDeleteRanking = async () => {
  const uuid = props.modelValue?.uuid;
  if (!uuid) return;

  try {
    delRankingLoading.value = true;
    const res = await rankingApi.deleteRanking(uuid);
    if (res.data) {
      notice.success(t("basic.tips.deleted") || "删除成功");
      deleteDialog.value = false;
      await router.push("/ranking-designed-items/browse");
    }
  } catch (e) {
    handleApiError(e, notice, t, { component: "RankingSettingWidget" });
  } finally {
    delRankingLoading.value = false;
  }
};

defineOptions({
  name: "RankingSettingWidget",
});
</script>

<template>
  <!-- 设置组件 S -->
  <v-row no-gutters>
    <v-col cols="12" sm="3" md="2">
      <v-tabs
          class="pa-0 w-100"
          v-model="tabValue"
          direction="vertical">
        <v-tab
            :text="t('assembly.setting.general')"
            value="common"
            prepend-icon="mdi-tune-variant">
        </v-tab>
      </v-tabs>
    </v-col>
    <v-divider vertical></v-divider>
    <v-col cols="12" sm="9" md="10">
      <v-card elevation="0" class="overflow-y-auto pa-5" max-height="70vh">
        <v-tabs-window v-model="tabValue">
          <v-tabs-window-item value="common">
            <!-- 可见性设置 S -->
            <v-row align="center">
              <v-col cols="12" sm="6">
                <b>{{ t('assembly.setting.visibility') }}</b>
                <p class="text-caption text-medium-emphasis">
                  {{ t('assembly.setting.visibilityDescription') }}
                </p>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                    v-model="visibilityProxy"
                    :items="visibilityOptions"
                    item-title="label"
                    item-value="value"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.selectVisibility')"></v-select>
              </v-col>
            </v-row>
            <v-divider class="my-3"></v-divider>
            <!-- 可见性设置 E -->

            <!-- 语种设置 S -->
            <v-row align="center">
              <v-col cols="12" sm="6">
                <b>{{ t('assembly.setting.language') }}</b>
                <p class="text-caption text-medium-emphasis">
                  {{ t('assembly.setting.languageDescription') }}
                </p>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                    v-model="targetAttr.language"
                    :items="languages"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.selectLanguage')"></v-select>
              </v-col>
            </v-row>
            <v-divider class="my-3"></v-divider>
            <!-- 语种设置 E -->

            <!-- 匿名发布 S -->
            <v-row align="center">
              <v-col cols="12" sm="6">
                <b>{{ t('assembly.setting.anonymous') }}</b>
                <p class="text-caption text-medium-emphasis">
                  {{ t('assembly.setting.anonymousDescription') }}
                </p>
              </v-col>
              <v-col cols="12" sm="6">
                <v-checkbox
                    v-model="targetAttr.isAnonymous"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"></v-checkbox>
              </v-col>
            </v-row>
            <v-divider class="my-3"></v-divider>
            <!-- 匿名发布 E -->

            <!-- 展示物品名称 S -->
            <v-row align="center">
              <v-col cols="12" sm="6">
                <b>{{ t('assembly.setting.showItemName') }}</b>
                <p class="text-caption text-medium-emphasis">
                  {{ t('assembly.setting.showItemNameDescription') }}
                </p>
              </v-col>
              <v-col cols="12" sm="6">
                <v-checkbox
                    v-model="targetAttr.isShowItemName"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"></v-checkbox>
              </v-col>
            </v-row>
            <v-divider class="my-3"></v-divider>
            <!-- 展示物品名称 E -->

            <!-- 点赞配置 S -->
            <v-row align="center">
              <v-col cols="12" sm="6">
                <b>{{ t('assembly.setting.likes') }}</b>
                <p class="text-caption text-medium-emphasis">
                  {{ t('assembly.setting.likesDescription') }}
                </p>
              </v-col>
              <v-col cols="12" sm="6">
                <v-checkbox
                    v-model="targetAttr.isLike"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"></v-checkbox>
              </v-col>
            </v-row>
            <v-divider class="my-3"></v-divider>
            <!-- 点赞配置 E -->

            <!-- 评论配置 S -->
            <v-row align="center">
              <v-col cols="12" sm="6">
                <b>{{ t('assembly.setting.comments') }}</b>
                <p class="text-caption text-medium-emphasis">
                  {{ t('assembly.setting.commentsDescription') }}
                </p>
              </v-col>
              <v-col cols="12" sm="6">
                <v-checkbox
                    v-model="targetAttr.isComment"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"></v-checkbox>
              </v-col>
            </v-row>
            <v-divider class="my-3"></v-divider>
            <!-- 评论配置 E -->

            <!-- 克隆权限 S -->
            <v-row align="center">
              <v-col cols="12" sm="6">
                <b>{{ t('assembly.setting.allowClone') }}</b>
                <p class="text-caption text-medium-emphasis">
                  {{ t('assembly.setting.allowCloneDescription') }}
                </p>
              </v-col>
              <v-col cols="12" sm="6">
                <v-checkbox
                    v-model="targetAttr.isAllowClone"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.enable')"></v-checkbox>
              </v-col>
            </v-row>
            <v-divider class="my-3"></v-divider>
            <!-- 克隆权限 E -->

            <!-- 渲染版本 S -->
            <v-row align="center">
              <v-col cols="12" sm="6">
                <b>{{ t('assembly.setting.rendererVersion') }}</b>
                <p class="text-caption text-medium-emphasis">
                  {{ t('assembly.setting.rendererVersionDescription') }}
                </p>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                    v-model="targetAttr.useVersion"
                    :items="RankingDesignedItemsDataProcessing.versions"
                    density="compact"
                    hide-details
                    :label="t('assembly.setting.version')"></v-select>
              </v-col>
            </v-row>
            <!-- 渲染版本 E -->

            <!-- 删除选项 S -->
            <template v-if="props.isShowDelete && props.modelValue?.uuid">
              <v-divider class="my-3"></v-divider>
              <v-row align="center">
                <v-col cols="12" sm="6">
                  <b>{{ t('basic.button.delete') }}</b>
                  <p class="text-caption text-medium-emphasis">
                    {{ t('assembly.setting.deleteDescription') }}
                  </p>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-btn
                      color="red"
                      variant="flat"
                      @click="deleteDialog = true">
                    {{ t('basic.button.delete') }}
                  </v-btn>
                </v-col>
              </v-row>
            </template>
            <!-- 删除选项 E -->
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-col>
  </v-row>
  <!-- 设置组件 E -->

  <!-- 删除确认弹窗 S -->
  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">
        {{ t('assembly.setting.deleteConfirmation') || '确认删除？' }}
      </v-card-title>
      <v-card-text>
        {{ t('assembly.setting.deleteWarning') || '此操作不可逆，将永久删除该榜单及其所有相关数据。' }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="deleteDialog = false">
          {{ t('basic.button.cancel') }}
        </v-btn>
        <v-btn
            color="red"
            variant="flat"
            :loading="delRankingLoading"
            @click="onDeleteRanking">
          {{ t('basic.button.delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- 删除确认弹窗 E -->
</template>

<style scoped lang="less">
</style>
