<script setup lang="ts">

import {useRoute, useRouter} from "vue-router";
import {onMounted, Ref, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useHttpToken} from "@/assets/sripts/http_util";
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
import {apis} from "@/assets/sripts/index";
import {ApiError} from "@/assets/types/Api";
import AdsWidget from "@/components/ads/google/index.vue";
import AccountCardWidget from "@/components/AccountCardWidget.vue";

const route = useRoute(),
    router = useRouter(),
    http = useHttpToken(),
    authStore = useAuthStore(),
    notice = useNoticeStore(),
    {t} = useI18n(),
    {asString} = useI18nUtils()

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

    // meta
    head: Ref<any> = ref({
      title: t(route.meta.title as string),
      titleTemplate: `%s | ${t('name')}`,
      meta: [
        {name: 'keywords', content: t(route.meta.keywords as string)},
        {property: 'og:type', content: 'website'},
        {property: 'og:title', content: `%s | ${t('name')}`},
        {property: 'og:description', content: ''},
        {property: 'og:site_name', content: t('name')},
        {property: 'og:url', content: window.location.href},
        {name: 'twitter:card', content: 'summary'},
        {name: 'twitter:title', content: `%s | ${t('name')}`},
        {name: 'twitter:description', content: ''},
      ]
    })

useHead(head)

watch(() => route, () => {
  getAssemblyDetail()
})

onMounted(async () => {
  await getAssemblyDetail()

  // set new title
  const title = `${detailData.value.name} - ${t(route.meta.title as string)} | ${t('name')}`;
  head.value.titleTemplate = title
  head.value.meta = [
    {name: 'keywords', content: t(route.meta.keywords as string)},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: detailData.value.description},
    {property: 'og:site_name', content: t('name')},
    {property: 'og:url', content: window.location.href},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: detailData.value.description}
  ]
})

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
    detailData.value.description = decodeURI(detailData.value?.description || '这个人很懒什么,对此配装什么都没说')
  } catch (e) {
    if (e instanceof ApiError) {
      notice.error(t(`basic.tips.${e.code}`, {
        context: e.code
      }))
    }
    console.error(e)
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
        isFullName: d.assembly.attr.isFullName
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
}

/**
 * 直访，无密码重输
 */
const onPenPassword = () => {
  router.push({name: route.name, query: {...route.query, 'password': password.value}})

  getAssemblyDetail()
}

/**
 * 转化标签i18n
 * @param data
 */
const getTagTitle = (data: any) => {
  return asString([
    `${data}`,
    `assembly.tags.teamFormationMethods.${data.toString().split('_')[1]}`,
    `assembly.tags.modes.${data.toString().split('_')[0]}`,
    `assembly.tags.damageTypes.${data.toString().split('_')[1]}`,
    `assembly.tags.difficultyOfAcquisitions.${data.toString().split('_')[1]}`,
    `codex.ships.archetypes.${data.toString().split('_')[1]}.name`,
    `snb.seasons.${data.toString().split('_')[1]}`,
  ], {
    backRawKey: true
  })
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

                <div class="d-flex ga-2">
                  <v-chip-group>
                    <v-chip density="compact" v-if="detailData.isOwner">
                      {{ t('assembly.owner') }}
                    </v-chip>
                    <v-chip density="compact" v-if="detailData.isPassword">
                      {{ t('assembly.hasPassword') }}
                    </v-chip>
                    <v-chip :to="`/assembly/browse/${detailData.cloningUuid}/detail`" target="_blank" density="compact" v-if="detailData.cloningUuid">
                      {{ t('assembly.byCloningUuid') }}: {{ detailData.cloningUuid }}
                    </v-chip>
                  </v-chip-group>
                </div>
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
          </div>
        </div>
      </v-container>
    </template>
  </v-card>

  <!-- Assembly Preview S -->
  <AssemblyMainSubjectView
      ref="assemblyMainSubjectView"
      v-if="detailData.isVisibility"
      v-model="detailData"
      @ready="onAssemblyMainViewReady"
      :perfect-display="true"
      :assembly-background="detailData.assembly.attr && detailData.assembly.attr.backgroundPresentation"></AssemblyMainSubjectView>
  <!-- Assembly Preview E -->

  <v-container v-if="detailData.isVisibility">
    <AdsWidget id="assembly-detail-up"></AdsWidget>

    <div class="mt-2">
      <v-row>
        <v-col cols="12" sm="12" lg="8" xl="8">
          <div class="ga-2 mb-6" v-if="detailData.tags">
            <v-chip class="mr-2 mb-2 pt-1 pb-1 pl-5 pr-5" v-for="(i, index) in detailData.tags" :key="index">
              {{getTagTitle(i)}}
            </v-chip>
          </div>

          <Textarea class="mt-5 mb-2"
                    :readonly="true"
                    :toolbar="['emote', 'item', 'ship', 'mod', 'ultimate']"
                    v-model="detailData.description"
                    placeholder="输入描述描述"></Textarea>

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
                <Time :time="detailData.createdTime"></Time>
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
                <Time :time="detailData.updatedTime"></Time>
              </TimeView>
            </v-col>
          </v-row>

          <AssemblyTagsWidget
              v-model="detailData.tags"
              class="mt-4"
              :readonly="true"></AssemblyTagsWidget>
        </v-col>
      </v-row>
    </div>
  </v-container>

  <v-container v-if="!detailData.isPassword && !detailData.isVisibility && !detailData.assembly">
    <AdsWidget class="my-5" id="none"></AdsWidget>

    <v-card variant="text" class="pa-10 text-center">
      <v-icon icon="mdi-alert-circle-outline" class="text-amber" size="120"></v-icon>
      <h1 class="mt-10">抱歉,此配装不存在或不公开</h1>
      <p>未能找到
        <v-chip density="compact">{{ route.params.uuid }}</v-chip>
        ，它可能为私有或不存在
      </p>
    </v-card>
  </v-container>
  <v-container v-else-if="detailData.isPassword">
    <v-card variant="text" class="pa-10 text-center">
      <v-icon icon="mdi-alert-circle-outline" class="text-amber" size="120"></v-icon>
      <h1 class="mt-10">抱歉此配装，需要密码</h1>
      <p>你可以输入密码来解密</p>

      <div class="mt-8">
        <v-text-field placeholder="******" class="ma-auto" v-model="password" max-width="400">
          <template v-slot:append-inner>
            <v-btn @click="onPenPassword">确定</v-btn>
          </template>
        </v-text-field>
      </div>
    </v-card>
  </v-container>
</template>

<style scoped lang="less">

</style>
