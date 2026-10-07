<script setup lang="ts">

import {useRoute, useRouter} from "vue-router";
import {onMounted, Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useAuthStore} from "~/stores/userAccountStore";
import {useI18nUtils} from "@/assets/sripts/i18n_util";
import {useHead} from "@unhead/vue";
import {useNoticeStore} from "~/stores/noticeStore";

import LikeWidget from "@/components/LikeWidget.vue";
import Textarea from "@/components/textarea/index.vue";
import Loading from "@/components/Loading.vue";
import Silk from "@/components/Silk.vue";
import AssemblyTagsWidget from "@/components/AssemblyTagsWidget.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import AssemblySettingPanel from "@/components/AssemblySettingPanel.vue";
import TimeView from "@/components/TimeView.vue";
import Time from "@/components/Time.vue";
import UserAvatar from "@/components/UserAvatar.vue";
import AssemblyMainSubjectView from "@/components/AssemblyMainSubjectView.vue";
import AssemblyTagChip from "@/components/AssemblyTagChip.vue";
import {apis, getAppUrl} from "@/assets/sripts/index";
import type {AssemblyListParams, EditAssemblyData, PublishAssemblyData} from '@/assets/types/Assembly';
import {ApiError} from "@/assets/types/Api";
import AdsWidget from "@/components/ads/google/index.vue";
import AccountCardWidget from "@/components/AccountCardWidget.vue";
import AssemblyCompareDialog from "@/components/AssemblyCompareDialog.vue";
import {handleApiError} from "@/assets/sripts/error_handler";
import {useBrowseApi} from "@/assets/sripts/api/browse_service";

const route = useRoute(),
    router = useRouter(),
    authStore = useAuthStore(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    {asString} = useI18nUtils()

const browseApi = useBrowseApi()

// 浏览相关状态
const browseCount = ref<{ total: number; today: number }>({ total: 0, today: 0 })
const visitors = ref<Array<{
    identity: string; isUser: boolean; userId?: string;
    username?: string | null; anonMasked?: string; browseTime: number;
}>>([])
const visitorsPanelOpen = ref(false)
const loadingVisitors = ref(false)

let detailData: Ref<any> = ref({
      cloningUuid: '',
      uuid: '',
      userId: null,
      name: '',
      tags: [],
      description: '',
      username: '',
      assembly: {},
      wheel: {},
      warehouse: {},
      mastery: {},
      createdTime: Date.now(),
      updatedTime: Date.now(),
      userAvatar: null,
      isVisibility: false,
      isPassword: false,
      isOwner: false,
    }),
    assemblyMainSubjectView: Ref<any> = ref(null),
    assemblyLoading = ref(false),
    password = ref(''),

    // 页面元信息 (meta)
    head: Ref<any> = ref({
      title: t(route.meta.title as string),
      titleTemplate: `%s | ${t('name')}`,
      meta: [
        {name: 'keywords', content: t(route.meta.keywords as string)},
        {property: 'og:type', content: 'website'},
        {property: 'og:title', content: `%s | ${t('name')}`},
        {property: 'og:description', content: ''},
        {property: 'og:site_name', content: t('name')},
        {property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : getAppUrl(route.fullPath || route.path)},
        {name: 'twitter:card', content: 'summary'},
        {name: 'twitter:title', content: `%s | ${t('name')}`},
        {name: 'twitter:description', content: ''},
      ]
    })

useHead(head)

/** 监听路由变化，重新获取配装详情 */
watch(() => route, () => {
  getAssemblyDetail()
})

/** 页面挂载：拉取配装详情并设置 SEO 页面元信息 */
onMounted(async () => {
  await getAssemblyDetail()

  // 设置新页面标题
  const pageTitle = detailData.value.name ? `${detailData.value.name} - ${t(route.meta.title as string)}` : t(route.meta.title as string);
  head.value.title = pageTitle;
  head.value.titleTemplate = `%s | ${t('name')}`;
  head.value.meta = [
    {name: 'description', content: detailData.value.description || t('apps.meta.description')},
    {name: 'keywords', content: t(route.meta.keywords as string || 'assembly.meta.keywords')},
    {property: 'og:type', content: 'article'},
    {property: 'og:title', content: `${pageTitle} | ${t('name')}`},
    {property: 'og:description', content: detailData.value.description || t('apps.meta.description')},
    {property: 'og:site_name', content: t('name')},
    {property: 'og:url', content: typeof window !== 'undefined' ? window.location.href : getAppUrl(route.fullPath || route.path)},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: `${pageTitle} | ${t('name')}`},
    {name: 'twitter:description', content: detailData.value.description || t('apps.meta.description')}
  ]
})

/**
 * 安全解码 URI 字符串
 */
const safeDecodeURI = (str: string): string => {
  if (!str) return '';
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
 * 获取配装详情
 */
const getAssemblyDetail = async (force: boolean = false) => {
  try {
    const {uuid} = route.params;
    const {password} = route.query;

    assemblyLoading.value = true;

    const result = await apis.assemblyApi().getAssemblyItem(<string>uuid, {
          password: <string>password,
          force
        }),
        d = result.data;

    detailData.value = d.data;
    detailData.value.description = safeDecodeURI(detailData.value?.description || '这个人很懒什么,对此配装什么都没说')

    // 拉取浏览统计（后端已在 /item 路由自动记录浏览，前端异步拉取数量展示）
    try {
        browseCount.value = await browseApi.getBrowseCount('assembly', <string>uuid);
    } catch { /* 静默 */ }
  } catch (e) {
    handleApiError(e, notice, t, { component: 'AssemblyDetail' })
  } finally {
    assemblyLoading.value = false
  }
}

/**
 * 当配装视图准备时装载数据
 */
const onAssemblyMainViewReady = () => {
  const d = detailData.value

  // 载入配装
  assemblyMainSubjectView.value.refs.assembly
      .setSetting({
        assemblyUseVersion: d.assembly.attr.assemblyUseVersion,
        isShowItemName: d.assembly.attr.isShowItemName,
        isFullName: d.assembly.attr.isFullName,
        isShowWeaponIconArray: d.assembly.attr?.isShowWeaponIconArray ?? false
      })
      .onLoad(d.assembly.data)
  // 载入轮盘
  assemblyMainSubjectView.value.refs.wheel
      .setSetting({
        wheelUseVersion: d.wheel.attr.wheelUseVersion,
      })
      .onLoad(d.wheel.data)
  // 载入船仓
  assemblyMainSubjectView.value.refs.warehouse
      .setSetting({
        warehouseUseVersion: d.warehouse.attr.warehouseUseVersion,
      })
      .onLoad(d.warehouse.data)
  // 载入精通
  assemblyMainSubjectView.value.refs.mastery
      ?.setSetting({
        masteryUseVersion: d.mastery?.attr?.masteryUseVersion,
      })
      ?.onLoad(d.mastery?.data)
}

/**
 * 拉取近期访客列表（展开访客面板时调用）
 */
const loadVisitors = async () => {
  if (loadingVisitors.value) return;
  loadingVisitors.value = true;
  try {
    visitors.value = await browseApi.getVisitors('assembly', <string>detailData.value.uuid, 20);
  } catch { /* silent */ }
  loadingVisitors.value = false;
};

/**
 * 切换访客面板（打开时懒加载一次）
 */
const toggleVisitorsPanel = () => {
  const next = !visitorsPanelOpen.value;
  visitorsPanelOpen.value = next;
  if (next && visitors.value.length === 0) {
    loadVisitors();
  }
}

/**
 * 直访，无密码重输
 */
const onPenPassword = () => {
  router.push({name: route.name, query: {...route.query, 'password': password.value}})

  getAssemblyDetail()
}

</script>

<template>
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
      <v-container class="pa-2 mt-4 position-relative">
        <v-breadcrumbs>
          <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item to="/assembly">{{ t('assembly.title') }}</v-breadcrumbs-item>
          <v-breadcrumbs-divider></v-breadcrumbs-divider>
          <v-breadcrumbs-item>{{ t('assembly.detail.title') }}</v-breadcrumbs-item>
        </v-breadcrumbs>
      </v-container>

      <v-container class="pt-5">
        <v-overlay
            :model-value="assemblyLoading"
            transition
            contained
            scrim
            class="align-center justify-center">
          <Loading size="120"></Loading>
        </v-overlay>

        <div v-show="!assemblyLoading">
          <div class="pl-2">
            <v-row no-gutters>
              <v-col>
                <h1 :title="detailData.name || ''" class="text-amber text-h4 singe-line">{{ detailData.name || '' }}</h1>
              </v-col>

              <v-spacer></v-spacer>

              <div class="ga-2 d-flex">
                <v-btn icon v-if="authStore.isLogin && detailData.isVisibility && detailData.assembly?.attr?.isLike">
                  <LikeWidget targetType="assembly"
                              :targetId="detailData.uuid"
                              :userId="authStore.user.userId">
                    <template v-slot:activate>
                      <v-btn variant="text" icon="mdi-thumb-up"></v-btn>
                    </template>
                    <template v-slot:unActivate>
                      <v-btn variant="text" icon="mdi-thumb-up-outline"></v-btn>
                    </template>
                  </LikeWidget>
                </v-btn>

                <v-btn variant="text" v-if="detailData.uuid" :to="`/assembly/browse/${detailData.uuid}/share`" icon="mdi-share-variant-outline"></v-btn>
                <AssemblyCompareDialog v-if="detailData.uuid" :base-assembly="detailData" :base-title="detailData.name">
                  <template #activator="{ props }">
                    <v-btn variant="text" v-bind="props" icon="mdi-scale-balance" :title="t('assembly.compare.title')"></v-btn>
                  </template>
                </AssemblyCompareDialog>
                <v-btn variant="text" v-if="detailData.uuid" @click="getAssemblyDetail(true)" icon="mdi-refresh"></v-btn>
              </div>

              <template v-if="detailData.isVisibility && authStore.isLogin && detailData.isOwner">
                <v-btn-group class="ml-2">
                  <v-menu location="bottom end">
                    <template v-slot:activator="{ props }">
                      <v-btn variant="flat" v-bind="props">
                        <v-icon icon="mdi-pencil" class="mr-2"></v-icon>
                        {{ t('assembly.editAssemblyBtn') }}
                        <v-icon icon="mdi-menu-down" class="ml-1"></v-icon>
                      </v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item link :to="`/assembly/edit/${detailData.uuid}`">
                        <v-list-item-title>{{ t('assembly.editInfoBtn') }}</v-list-item-title>
                      </v-list-item>
                      <v-list-item link :to="`/assembly/workshop/${detailData.uuid}/edit`">
                        <v-list-item-title>{{ t('assembly.editWorkshopBtn') }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                  <v-divider vertical></v-divider>
                  <AssemblySettingPanel :id="detailData.uuid"
                                        :data="detailData || {}"
                                        @change="getAssemblyDetail">
                    <v-btn variant="flat" class="h-100">
                      <v-icon icon="mdi-cog"></v-icon>
                    </v-btn>
                  </AssemblySettingPanel>
                </v-btn-group>
              </template>
            </v-row>

            <div class="d-flex ga-2">
              <v-chip-group column>
                <v-chip v-if="detailData.isOwner">
                  {{ t('assembly.owner') }}
                </v-chip>
                <v-chip v-if="detailData.isPassword">
                  {{ t('assembly.hasPassword') }}
                </v-chip>
                <v-chip>
                  <v-icon start icon="mdi-eye-outline"></v-icon>
                  {{ browseCount.total || 0 }}
                  <span v-if="browseCount.today" class="opacity-60 ml-1">+{{ browseCount.today }}</span>
                </v-chip>
                <v-chip :to="`/assembly/browse/${detailData.cloningUuid}/detail`" target="_blank" v-if="detailData.cloningUuid">
                  {{ t('assembly.byCloningUuid') }}: {{ detailData.cloningUuid }}
                </v-chip>

                <AssemblyTagChip
                    class="mr-2 mb-2 pt-1 pb-1 pl-5 pr-5"
                    v-for="(i, index) in detailData.tags"
                    :key="index"
                    :tag="i"/>
              </v-chip-group>
            </div>
          </div>
        </div>
      </v-container>
    </template>
  </v-card>

  <!-- 装配预览 S -->
  <AssemblyMainSubjectView
      ref="assemblyMainSubjectView"
      v-if="detailData.isVisibility"
      v-model="detailData"
      @ready="onAssemblyMainViewReady"
      :perfect-display="true"
      :assembly-background="detailData.assembly.attr && detailData.assembly.attr.backgroundPresentation"></AssemblyMainSubjectView>
  <!-- 装配预览 E -->

  <v-container v-if="detailData.isVisibility">
    <AdsWidget id="assembly-detail-up"></AdsWidget>

    <div class="mt-2">
      <v-row>
        <v-col cols="12" sm="12" lg="8" xl="8">
          <div class="ga-2 mb-6" v-if="detailData.tags">
            <AssemblyTagChip
                class="mr-2 mb-2 pt-1 pb-1 pl-5 pr-5"
                v-for="(i, index) in detailData.tags"
                :key="index"
                :tag="i"/>
          </div>

          <Textarea class="mt-5 mb-2"
                    :readonly="true"
                    :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                    v-model="detailData.description"
                    :placeholder="t('assembly.publish.descriptionPlaceholder')"></Textarea>

          <AdsWidget class="my-5" id="assembly-detail-content"></AdsWidget>

          <template v-if="detailData.assembly.attr.isComment">
            <v-divider>{{ t('comment.title') }}</v-divider>
            <CommentWidget :id="detailData.uuid" :placeholder="t('assembly.commentPlaceholder')"
                           type="assembly"></CommentWidget>
          </template>
        </v-col>
        <v-col cols="12" sm="12" lg="4" xl="4">
          <AccountCardWidget :id="detailData.userId">
            <v-card v-if="detailData.userAvatar" class="mr-1">
              <UserAvatar size="25" :src="detailData.userAvatar"></UserAvatar>
            </v-card>
            {{ detailData.username || t('assembly.anonymous') }}
          </AccountCardWidget>

          <v-row class="mt-5">
            <v-col>
              <v-icon icon="mdi-calendar-range"></v-icon>
              {{ t('assembly.browse.filter.createdTime') }}
            </v-col>
            <v-col cols="auto">
              <TimeView :time="detailData.createdTime" v-if="detailData.createdTime">
              </TimeView>
            </v-col>
          </v-row>

          <v-row class="mt-1">
            <v-col>
              <v-icon icon="mdi-calendar-range"></v-icon>
              {{ t('assembly.browse.filter.updatedTime') }}
            </v-col>
            <v-col cols="auto">
              <TimeView :time="detailData.updatedTime" v-if="detailData.updatedTime">
              </TimeView>
            </v-col>
          </v-row>

          <AssemblyTagsWidget
              v-model="detailData.tags"
              class="mt-4"
              :readonly="true"></AssemblyTagsWidget>

          <!-- 近期访客面板 -->
          <v-expansion-panels class="mt-4" variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon start icon="mdi-account-multiple-outline"></v-icon>
                {{ t('basic.visitor.recentVisitors') }}
                <v-chip class="ml-2" size="x-small" variant="tonal" color="primary">
                  {{ visitors.length || 0 }}
                </v-chip>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <template v-if="loadingVisitors">
                  <div class="text-center opacity-60 py-2">loading...</div>
                </template>
                <template v-else-if="visitors.length === 0">
                  <div class="text-center opacity-60 py-2">{{ t('basic.visitor.noVisitors') }}</div>
                </template>
                <template v-else>
                  <v-list density="compact">
                    <v-list-item
                        v-for="(v, idx) in visitors"
                        :key="v.identity + idx"
                        class="px-0"
                    >
                      <template v-slot:prepend>
                        <v-avatar size="32" class="mr-2">
                          <v-icon v-if="!v.isUser" icon="mdi-incognito"></v-icon>
                          <v-icon v-else icon="mdi-account-circle"></v-icon>
                        </v-avatar>
                      </template>
                      <v-list-item-title>
                        <span v-if="v.isUser">{{ v.username || 'User #' + v.userId }}</span>
                        <span v-else class="opacity-60">{{ t('basic.visitor.anonMasked') }} ({{ v.anonMasked }}…)</span>
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        <TimeView :time="v.browseTime"></TimeView>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </template>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>
    </div>
  </v-container>

  <v-container v-if="!detailData.isPassword && !detailData.isVisibility && !detailData.assembly">
    <AdsWidget class="my-5" id="none"></AdsWidget>

    <v-card variant="text" class="pa-10 text-center">
      <v-icon icon="mdi-alert-circle-outline" class="text-amber" size="120"></v-icon>
      <h1 class="mt-10">{{ t('assembly.detail.notFoundTitle') }}</h1>
      <p>{{ t('assembly.detail.notFoundDescPrefix') }}
        <v-chip density="compact">{{ route.params.uuid }}</v-chip>
        {{ t('assembly.detail.notFoundDescSuffix') }}
      </p>
    </v-card>
  </v-container>
  <v-container v-else-if="detailData.isPassword">
    <v-card variant="text" class="pa-10 text-center">
      <v-icon icon="mdi-alert-circle-outline" class="text-amber" size="120"></v-icon>
      <h1 class="mt-10">{{ t('assembly.detail.passwordRequiredTitle') }}</h1>
      <p>{{ t('assembly.detail.passwordRequiredDesc') }}</p>

      <div class="mt-8">
        <v-text-field placeholder="******" class="ma-auto" v-model="password" max-width="400">
          <template v-slot:append-inner>
            <v-btn @click="onPenPassword">{{ t('basic.button.submit') }}</v-btn>
          </template>
        </v-text-field>
      </div>
    </v-card>
  </v-container>
</template>

<style scoped lang="less">

</style>
