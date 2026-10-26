<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {computed, onMounted, ref, Ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useAuthStore} from "~/stores/userAccountStore";
import {useNoticeStore} from "~/stores/noticeStore";
import {useHead} from "@unhead/vue";
import {useRankingDesignedApi} from "@/assets/sripts/api/ranking_designed_service";
import {handleApiError} from "@/assets/sripts/error_handler";
import {getAppUrl} from "@/assets/sripts/index";
import {useBrowseApi} from "@/assets/sripts/api/browse_service";

import LikeWidget from "@/components/LikeWidget.vue";
import Textarea from "@/components/textarea/index.vue";
import Loading from "@/components/Loading.vue";
import Silk from "@/components/Silk.vue";
import AssemblyTagChip from "@/components/AssemblyTagChip.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import RankingSettingPanel from "@/components/RankingSettingPanel.vue";
import TimeView from "@/components/TimeView.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import AccountCardWidget from "@/components/AccountCardWidget.vue";
import RankingDesignedMainSubjectView from "@/components/RankingDesignedMainSubjectView.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notice = useNoticeStore();
const {t} = useI18n();
const rankingApi = useRankingDesignedApi();
const browseApi = useBrowseApi();

// 浏览相关状态（与配装一致）
const browseCount = ref<{ total: number; today: number }>({total: 0, today: 0});

const rankingMainSubjectView = ref<any>(null);
const loading = ref(false);
const cloneLoading = ref(false);

const detailData: Ref<any> = ref({
  cloningUuid: "",
  uuid: "",
  userId: null,
  name: "",
  tags: [] as string[],
  description: "",
  data: null,
  attr: {
    useVersion: "1.0.0",
    language: "zh_CN",
    isComment: true,
    isLike: true,
    isAllowClone: true,
    isShowItemName: false,
    isAnonymous: false,
  },
  visibility: "publicly",
  views: 0,
  likes: 0,
  createdTime: null,
  updatedTime: null,
  authorUsername: "",
  authorAlternativeName: "",
  authorAvatar: null,
  isOwner: false,
});

const isOwner = computed(() => {
  if (detailData.value?.isOwner) return true;
  const currentUid = authStore.user?.userId ? String(authStore.user.userId) : "";
  const itemUid = detailData.value?.userId ? String(detailData.value.userId) : "";
  return Boolean(currentUid && itemUid && currentUid === itemUid);
});

// 页面元信息 (meta)
const head: Ref<any> = ref({
  title: t(route.meta.title as string) || "天梯详情",
  titleTemplate: `%s | ${t("name")}`,
  meta: [
    {name: "keywords", content: t(route.meta.keywords as string || "")},
    {property: "og:type", content: "website"},
    {property: "og:title", content: `%s | ${t("name")}`},
    {property: "og:description", content: ""},
    {property: "og:site_name", content: t("name")},
    {
      property: "og:url",
      content:
          typeof window !== "undefined"
              ? window.location.href
              : getAppUrl(route.fullPath || route.path),
    },
    {name: "twitter:card", content: "summary"},
    {name: "twitter:title", content: `%s | ${t("name")}`},
    {name: "twitter:description", content: ""},
  ],
});

useHead(head);

/**
 * 监听路由变化，重新获取详情
 */
watch(
    () => route.params.uuid || route.params.id,
    (newUuid) => {
      if (newUuid) {
        getRankingDetail();
      }
    }
);

/**
 * 安全解码 URI 字符串
 */
const safeDecodeURI = (str: string): string => {
  if (!str) return "";
  try {
    return decodeURIComponent(str);
  } catch {
    try {
      return decodeURI(str);
    } catch {
      return str;
    }
  }
};

/**
 * 获取天梯详情
 */
const getRankingDetail = async (force: boolean = false) => {
  const uuid = String(route.params.uuid || route.params.id || "");
  if (!uuid) return;

  try {
    loading.value = true;
    const result = await rankingApi.getRankingItem(uuid);
    const d = result.data?.data || result.data;

    if (!d) {
      notice.error(t("basic.tips.notFound") || "Ranking not found");
      router.push("/ranking-designed-items/browse");
      return;
    }

    // 解析 tags
    let parsedTags = d.tags;
    if (typeof parsedTags === "string") {
      try {
        parsedTags = JSON.parse(parsedTags);
      } catch {
        parsedTags = [];
      }
    }

    // 解析 attr
    let parsedAttr = d.attr;
    if (typeof parsedAttr === "string") {
      try {
        parsedAttr = JSON.parse(parsedAttr);
      } catch {
        parsedAttr = {};
      }
    }

    detailData.value = {
      ...d,
      tags: Array.isArray(parsedTags) ? parsedTags : [],
      attr: Object.assign(
          {
            useVersion: "1.0.0",
            language: "zh_CN",
            isComment: true,
            isLike: true,
            isAllowClone: true,
            isShowItemName: false,
            isAnonymous: false,
          },
          parsedAttr
      ),
      description: safeDecodeURI(
          d.description || t("rankingDesignedItems.detail.noDescription")
      ),
    };

    const currentUid = authStore.user?.userId ? String(authStore.user.userId) : "";
    const itemUid = detailData.value.userId ? String(detailData.value.userId) : "";
    detailData.value.isOwner = Boolean(
        d.isOwner || (currentUid && itemUid && currentUid === itemUid)
    );

    // 拉取浏览统计（后端已在 /item 路由自动去重记录浏览，前端异步拉取数量展示）
    try {
      browseCount.value = await browseApi.getBrowseCount("rankingDesigned", <string>uuid);
    } catch {
      /* 静默 */
    }

    // 设置新页面标题
    const pageTitle = detailData.value.name
        ? `${detailData.value.name} - ${t(route.meta.title as string || "rankingDesignedItems.title")}`
        : t(route.meta.title as string || "rankingDesignedItems.title");
    head.value.title = pageTitle;
    head.value.meta = [
      {
        name: "description",
        content: detailData.value.description || t("apps.meta.description"),
      },
      {
        name: "keywords",
        content: t(route.meta.keywords as string || "rankingDesignedItems.keywords"),
      },
      {property: "og:type", content: "article"},
      {property: "og:title", content: `${pageTitle} | ${t("name")}`},
      {
        property: "og:description",
        content: detailData.value.description || t("apps.meta.description"),
      },
      {property: "og:site_name", content: t("name")},
      {
        property: "og:url",
        content:
            typeof window !== "undefined"
                ? window.location.href
                : getAppUrl(route.fullPath || route.path),
      },
      {name: "twitter:card", content: "summary_large_image"},
      {name: "twitter:title", content: `${pageTitle} | ${t("name")}`},
      {
        name: "twitter:description",
        content: detailData.value.description || t("apps.meta.description"),
      },
    ];

    applyRankingData();
  } catch (e) {
    handleApiError(e, notice, t, {component: "RankingDesignedDetail"});
  } finally {
    loading.value = false;
  }
};

/**
 * 载入天梯数据到画布视图
 */
const applyRankingData = () => {
  if (!rankingMainSubjectView.value || !detailData.value?.data) return;
  const view =
      rankingMainSubjectView.value.refs?.rankingDesignedRef ||
      rankingMainSubjectView.value;
  if (view && typeof view.onLoad === "function") {
    const rawData =
        typeof detailData.value.data === "string"
            ? JSON.parse(detailData.value.data)
            : detailData.value.data;
    view.onLoad(rawData);
  }
};

const onRankingMainViewReady = () => {
  applyRankingData();
};

/**
 * 克隆天梯
 */
const onCloneRanking = async () => {
  if (!authStore.isLogin) {
    notice.info(t("account.loginTips") || "请先登录");
    return;
  }
  try {
    cloneLoading.value = true;
    // 携带克隆来源并跳转工坊
    notice.success(t("basic.tips.cloneSuccess") || "已载入副本");
    await router.push({
      path: "/ranking-designed-items/workshop",
      query: {clone: detailData.value.uuid},
    });
  } catch (e) {
    handleApiError(e, notice, t, {component: "RankingDesignedDetail"});
  } finally {
    cloneLoading.value = false;
  }
};

/**
 * 复制分享链接
 */
const onCopyShare = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    notice.success(t("basic.tips.copySuccess") || "分享链接已复制");
  } catch {
    notice.error("Failed to copy link");
  }
};

onMounted(async () => {
  await getRankingDetail();
});
</script>

<template>
  <v-card height="250px">
    <template v-slot:image>
      <Silk
          :speed="3"
          :scale="0.7"
          :color="'#1c1c1c'"
          :noise-intensity="0.1"
          :rotation="-0.6"
          class="bg-black"
      >
      </Silk>
    </template>
    <template v-slot:default>
      <v-container class="pa-2 position-relative">
        <v-breadcrumbs>
          <v-breadcrumbs-item to="/">{{ t("portal.title") }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/ranking-designed-items">
            {{ t("rankingDesignedItems.title") }}
          </v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/ranking-designed-items/browse">
            {{ t("rankingDesignedItems.detail.title") }}
          </v-breadcrumbs-item>
        </v-breadcrumbs>
      </v-container>

      <v-container class="pt-5">
        <v-overlay
            :model-value="loading"
            transition
            contained
            scrim
            class="align-center justify-center">
          <Loading size="120"></Loading>
        </v-overlay>

        <div v-show="!loading">
          <div class="pl-2">
            <v-row no-gutters>
              <v-col>
                <h1
                    :title="detailData.name || ''"
                    class="text-amber text-h4 singe-line">
                  {{ detailData.name || "" }}
                </h1>
              </v-col>

              <v-spacer></v-spacer>

              <div class="ga-2 d-flex mr-1">
                <div
                    v-if="
                    authStore.isLogin &&
                    detailData.attr?.isLike !== false
                  ">
                  <LikeWidget
                      targetType="rankingDesigned"
                      :targetId="detailData.uuid"
                      :userId="authStore.user?.userId">
                    <template v-slot:activate>
                      <v-btn variant="text" icon="mdi-thumb-up"></v-btn>
                    </template>
                    <template v-slot:unActivate>
                      <v-btn variant="text" icon="mdi-thumb-up-outline"></v-btn>
                    </template>
                  </LikeWidget>
                </div>

                <v-btn
                    variant="text"
                    v-if="
                    authStore.isLogin &&
                    detailData.attr?.isAllowClone !== false
                  "
                    :loading="cloneLoading"
                    :title="t('assembly.clone')"
                    @click="onCloneRanking"
                    icon="mdi-content-copy"></v-btn>

                <v-btn
                    variant="text"
                    v-if="detailData.uuid"
                    @click="onCopyShare"
                    icon="mdi-share-variant-outline"></v-btn>

                <v-divider vertical inset></v-divider>

                <v-btn
                    variant="text"
                    v-if="detailData.uuid"
                    @click="getRankingDetail(true)"
                    icon="mdi-refresh"></v-btn>
              </div>

              <template v-if="authStore.isLogin && isOwner">
                <v-btn-group class="ml-2">
                  <v-btn variant="flat" :to="`/ranking-designed-items/workshop/${detailData.uuid}/edit`">
                    <v-icon icon="mdi-pencil" class="mr-2"></v-icon>
                    {{ t('rankingDesignedItems.detail.editBtn') }}
                  </v-btn>
                  <v-divider vertical></v-divider>
                  <RankingSettingPanel :id="detailData.uuid"
                                       :data="detailData || {}"
                                       @change="getRankingDetail">
                    <v-btn variant="flat" class="h-100">
                      <v-icon icon="mdi-cog"></v-icon>
                    </v-btn>
                  </RankingSettingPanel>
                </v-btn-group>
              </template>
            </v-row>

            <div class="d-flex ga-2">
              <v-chip-group column>
                <v-chip v-if="isOwner">
                  {{ t("assembly.owner") }}
                </v-chip>
                <v-chip>
                  <v-icon start icon="mdi-eye-outline"></v-icon>
                  {{ browseCount.total || detailData.views || 0 }}
                  <span v-if="browseCount.today" class="opacity-60 ml-1">+{{ browseCount.today }}</span>
                </v-chip>
                <v-chip
                    :to="`/ranking-designed-items/browse/${detailData.cloningUuid}/detail`"
                    target="_blank"
                    v-if="detailData.cloningUuid">
                  {{ t("assembly.byCloningUuid") }}: {{ detailData.cloningUuid }}
                </v-chip>

                <AssemblyTagChip
                    class="mr-2 mb-2 pt-1 pb-1 pl-5 pr-5"
                    v-for="(i, index) in detailData.tags"
                    :key="index"
                    :tag="i"
                />
              </v-chip-group>
            </div>
          </div>
        </div>
      </v-container>
    </template>
  </v-card>
  <v-divider opacity=".06"></v-divider>

  <!-- 天梯主体视图 S -->
  <div class="card-enlargement-mask-flavor mt-n2 mx-n16 py-5">
    <v-container>
      <RankingDesignedMainSubjectView
          ref="rankingMainSubjectView"
          :readonly="true"
          @ready="onRankingMainViewReady">
      </RankingDesignedMainSubjectView>
    </v-container>
  </div>
  <!-- 天梯主体视图 E -->

  <v-container>
    <div class="mt-2">
      <v-row>
        <v-col cols="12" sm="12" lg="8" xl="8">
          <div
              class="ga-2 mb-6"
              v-if="detailData.tags && detailData.tags.length > 0"
          >
            <AssemblyTagChip
                class="mr-2 mb-2 pt-1 pb-1 pl-5 pr-5"
                v-for="(i, index) in detailData.tags"
                :key="index"
                :tag="i"
            />
          </div>

          <Textarea
              class="mt-5 mb-2"
              :readonly="true"
              :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
              v-model="detailData.description"
              :placeholder="t('assembly.publish.descriptionPlaceholder')"
          ></Textarea>

          <template v-if="detailData.attr?.isComment !== false">
            <v-divider class="my-4">{{ t("comment.title") }}</v-divider>
            <CommentWidget
                :id="detailData.uuid"
                :placeholder="t('assembly.commentPlaceholder')"
                type="rankingDesigned"
            ></CommentWidget>
          </template>
        </v-col>

        <v-col cols="12" sm="12" lg="4" xl="4">
          <v-row align="center">
            <v-col>
              <v-icon icon="mdi-account"></v-icon>
              {{ t("assembly.browse.createdUser") }}
            </v-col>
            <v-col cols="auto">
              <AccountCardWidget :id="detailData.userId">
                <v-card v-if="detailData.authorAvatar" class="mr-1">
                  <UserAvatar size="25" :src="detailData.authorAvatar"></UserAvatar>
                </v-card>
                <p class="u text-amber">
                  {{
                    detailData.authorAlternativeName ||
                    detailData.authorUsername ||
                    t("assembly.anonymous")
                  }}
                </p>
              </AccountCardWidget>
            </v-col>
          </v-row>

          <v-row align="center">
            <v-col>
              <v-icon icon="mdi-calendar-range"></v-icon>
              {{ t("assembly.browse.filter.createdTime") }}
            </v-col>
            <v-col cols="auto">
              <TimeView
                  :time="detailData.createdTime"
                  v-if="detailData.createdTime"
              >
              </TimeView>
            </v-col>
          </v-row>

          <v-row align="center">
            <v-col>
              <v-icon icon="mdi-calendar-range"></v-icon>
              {{ t("assembly.browse.filter.updatedTime") }}
            </v-col>
            <v-col cols="auto">
              <TimeView
                  :time="detailData.updatedTime"
                  v-if="detailData.updatedTime"
              >
              </TimeView>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<style scoped lang="less">
.singe-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
