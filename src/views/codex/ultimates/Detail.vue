<script setup lang="ts">

import {onMounted, type Ref, ref} from "vue";
import {useI18n} from "vue-i18n";
import {Ultimates} from "glow-prow-data";
import {useRoute, useRouter} from "vue-router";
import ItemSlotBase from "@/components/snbWidget/ItemSlotBase.vue";
import {storage} from "@/assets/sripts";
import UltimateIconWidget from "@/components/snbWidget/ultimateIconWidget.vue";
import CommentWidget from "@/components/CommentWidget.vue";
import LikeWidget from "@/components/LikeWidget.vue";
import {useAuthStore} from "~/stores/userAccountStore";
import {useHead} from "@unhead/vue";
import {useI18nReadName} from "@/assets/sripts/i18n_read_name";
import ShareWidget from "@/components/ShareWidget.vue";
import UltimateName from "@/components/snbWidget/ultimateName.vue";
import AffixContainerView from "@/components/AffixContainerView.vue";
import BySeasonWidget from "@/components/BySeasonCardWidget.vue";
import UltimateDescription from "@/components/snbWidget/ultimateDescription.vue";

import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

const
    {t, messages} = useI18n(),
    i18nReadName = useI18nReadName(),
    router = useRouter(),
    route = useRoute(),
    authStore = useAuthStore(),
    cdnStore = useCDNAssetsServiceStore()

let
    ultimateDetailPageData: Ref<{ img: string, loading: boolean }> = ref({
      loading: false,
      img: ''
    }),
    ultimateDetailData: Ref<any> = ref(Ultimates['hunter']),

    // meta
    head: Ref<any> = ref({
      title: t(route.meta.title as string),
      titleTemplate: `%s | ${t('name')}`,
      meta: [
        {name: 'description', content: ''},
        {name: 'keywords', content: t(route.meta.keywords as string)},
        {property: 'og:type', content: 'website'},
        {property: 'og:title', content: `%s | ${t('name')}`},
        {property: 'og:description', content: ''},
        {property: 'og:site_name', content: t('name')},
      ]
    })

useHead(head)

onMounted(() => {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

  if (!id) {
    router.push('/')
    return;
  }

  ultimateDetailPageData.value.loading = true;

  const headData = i18nReadName.ultimate(id as string),
      headName = headData.name(),
      headDescription = headData.description()

  head.value.titleTemplate = `${headName} - ${head.value.titleTemplate}`

  const imageUrl = cdnStore.currentService.url({
    id: id as string,
    category: 'ultimates'
  });

  head.value.meta = [
    {name: 'description', content: headDescription},
    {
      name: 'keywords', content: t(route.meta.keywords as string, {
        keywords: Object.keys(messages.value).map(lang => {
          return headData.keysName.map((key: any) => i18nReadName.getValue(messages.value[lang], key)).filter((i: any) => i != null)
        }).concat([id as string]) + `,${t('home.meta.keywords')}`
      })
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: `${headName} | ${t('name')}`},
    {property: 'og:description', content: headDescription},
    {property: 'og:image', content: imageUrl},
    {property: 'og:url', content: window.location.href},
    {property: 'og:site_name', content: t('name')},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: `${headName} | ${t('name')}`},
    {name: 'twitter:description', content: headDescription},
    {name: 'twitter:image', content: imageUrl}
  ]

  onUltimateHistory(id)
  onCodexHistory(id)

  ultimateDetailPageData.value.loading = false;
})

const onCodexHistory = (id: string) => {
  let name = 'codex.history'

  const d = storage.session.get(name)

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id]: {
      id,
      category: 'ultimate',
      time: new Date().getTime()
    }
  })
}

const onUltimateHistory = (id: string) => {
  let name = 'codex.history'

  const d = storage.session.get(name)

  storage.session.set(name, {
    ...d?.data?.value || {},
    [id]: {
      id,
      type: 'ultimate',
      time: new Date().getTime()
    }
  })
}
</script>

<template>
  <v-breadcrumbs>
    <v-container class="pa-0">
      <v-breadcrumbs-item to="/">{{ t('portal.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex">{{ t('codex.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item to="/codex/ultimates">{{ t('codex.ultimates.title') }}</v-breadcrumbs-item>
      <v-breadcrumbs-divider></v-breadcrumbs-divider>
      <v-breadcrumbs-item>{{ t('codex.ultimate.title') }}</v-breadcrumbs-item>
    </v-container>
  </v-breadcrumbs>
  <v-divider></v-divider>

  <div class="ultimates-detail" v-if="ultimateDetailData.id && !ultimateDetailPageData.loading">
    <div class="ultimates-detail-header background-dot-grid">
      <v-container class="position-relative">
        <v-row class="mt-5">
          <v-col>
            <h1 class="text-amber text-h2">
              <UltimateName :id="ultimateDetailData.id"></UltimateName>
            </h1>
            <p class="mt-2 mb-3">
              <v-icon icon="mdi-identifier"/>
              {{ ultimateDetailData.id || 'none' }}
            </p>

            <v-chip class="badge-flavor text-center tag-badge text-black" v-if="ultimateDetailData.rarity">{{ t(`codex.raritys.${ultimateDetailData.rarity}`) }}</v-chip>
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto">
            <v-btn>
              <LikeWidget v-if="authStore.isLogin"
                          targetType="ultimate"
                          :isShowCount="true"
                          :targetId="ultimateDetailData.id">
                <template v-slot:activate>
                  <v-icon icon="mdi-thumb-up"></v-icon>
                </template>
                <template v-slot:unActivate>
                  <v-icon icon="mdi-thumb-up-outline"></v-icon>
                </template>
              </LikeWidget>
            </v-btn>
            <ShareWidget type="ultimate" :target-id="ultimateDetailData.id" />
          </v-col>
        </v-row>

        <!--        <v-img :src="ultimateDetailPageData.img"-->
        <!--               inline-->
        <!--               class="ultimates-detail-header-img pointer-events-none"></v-img>-->
      </v-container>
    </div>
    <div class="background-flavor">
      <v-container>
        <v-row>
          <v-col cols="12" sm="12" md="8" lg="8" order="2" order-sm="1">

            <v-row>
              <ItemSlotBase size="150px" class="mr-3">
                <UltimateIconWidget :id="ultimateDetailData.id" class="pa-2"
                                    :is-click-open-detail="false"
                                    :isShowOpenDetail="false"
                                    :isShowDescription="false"></UltimateIconWidget>
              </ItemSlotBase>
              <v-col>
                <p class="text-pre-wrap mb-4">
                  <UltimateDescription :id="ultimateDetailData.id"></UltimateDescription>
                </p>
              </v-col>
            </v-row>
            <v-divider class="mt-10 mb-6"></v-divider>

            <v-row>
              <v-col cols="12" sm="12" lg="6" xl="6">
                <template v-if="ultimateDetailData.id">
                  <v-text-field :value="ultimateDetailData.id" readonly
                                hide-details
                                variant="underlined" density="compact">
                    <template v-slot:append-inner>
                      <p class="text-no-wrap">ID</p>
                    </template>
                  </v-text-field>
                </template>
              </v-col>
            </v-row>

            <template v-if="ultimateDetailData.id">
              <v-divider>{{ t('comment.title') }}</v-divider>
              <CommentWidget :id="ultimateDetailData.id" type="ultimate" placeholder=""></CommentWidget>
            </template>
          </v-col>
          <v-col cols="12" sm="12" md="4" lg="4" order="1" order-sm="2">
            <AffixContainerView :offsetTop="80">
              <BySeasonWidget
                  :data="ultimateDetailData"></BySeasonWidget>

              <v-text-field :value="ultimateDetailData.chargeRequired" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">获取所需积分</p>
                </template>
              </v-text-field>

              <v-text-field :value="ultimateDetailData.dateAdded" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">添加日期</p>
                </template>
              </v-text-field>
              <v-text-field :value="ultimateDetailData.lastUpdated" readonly
                            hide-details
                            variant="underlined" density="compact">
                <template v-slot:append-inner>
                  <p class="text-no-wrap">更新日期</p>
                </template>
              </v-text-field>
            </AffixContainerView>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>

</template>

<style scoped lang="less">
.ultimates-detail {
  .ultimates-detail-header {
    background-color: #000;
    position: relative;
    padding-bottom: 40px;
    min-height: 320px;

    &:before {
      content: "";
      position: absolute;
      z-index: 0;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 0;
      padding: 10% 0 0;
      background: url(@/assets/images/portal-banner-background.png) 50% 0 no-repeat;
      background-size: cover;
    }

    .ultimates-detail-header-img {
      position: absolute;
      z-index: -1;
      right: 20px;
      bottom: -120px;
      width: 300px;
      min-height: 300px;
    }
  }

  .raw-list {
    list-style-type: none !important;
  }
}
</style>
